# backend/perception/screen/capturer.py
from __future__ import annotations

import hashlib
import time
from dataclasses import dataclass
from pathlib import Path
from uuid import uuid4

from .models import ScreenshotFrame


@dataclass(slots=True)
class ScreenCaptureConfig:
    interval_seconds: float = 2.0
    output_dir: Path = Path("tmp/screen-buffer")
    max_frames: int = 100
    max_buffer_mb: int = 100
    image_format: str = "webp"
    image_quality: int = 72
    diff_hash_size: tuple[int, int] = (32, 18)


class ScreenCapturer:
    def __init__(self, config: ScreenCaptureConfig | None = None) -> None:
        self.config = config or ScreenCaptureConfig()
        self._last_hash: str | None = None
        self._last_diff_hash: str | None = None

    def capture_once(self) -> ScreenshotFrame:
        self.config.output_dir.mkdir(parents=True, exist_ok=True)
        frame_id = uuid4().hex
        path = self.config.output_dir / f"{frame_id}.{self.config.image_format}"

        try:
            import mss
            from PIL import Image

            with mss.mss() as screen:
                monitor = screen.monitors[1]
                raw = screen.grab(monitor)
                image = Image.frombytes("RGB", raw.size, raw.rgb)
                diff_hash = self._diff_hash(image)
                changed = diff_hash != self._last_diff_hash
                self._last_diff_hash = diff_hash

                if not changed:
                    return ScreenshotFrame(
                        id=frame_id,
                        path=None,
                        width=image.width,
                        height=image.height,
                        image_hash=self._last_hash,
                        changed=False,
                    )

                image.save(path, self.config.image_format.upper(), quality=self.config.image_quality)
                image_hash = self._hash_file(path)
                self._last_hash = image_hash
                self._prune_buffer()
                return ScreenshotFrame(
                    id=frame_id,
                    path=path,
                    width=image.width,
                    height=image.height,
                    image_hash=image_hash,
                    changed=True,
                )
        except Exception:
            return ScreenshotFrame(id=frame_id, path=None, changed=False)

    def iter_frames(self):
        while True:
            yield self.capture_once()
            time.sleep(max(0.25, self.config.interval_seconds))

    def _diff_hash(self, image) -> str:
        small = image.convert("L").resize(self.config.diff_hash_size)
        return hashlib.sha256(small.tobytes()).hexdigest()

    def _hash_file(self, path: Path) -> str:
        digest = hashlib.sha256()
        with path.open("rb") as file:
            for chunk in iter(lambda: file.read(1024 * 1024), b""):
                digest.update(chunk)
        return digest.hexdigest()

    def _prune_buffer(self) -> None:
        files = sorted(
            self.config.output_dir.glob(f"*.{self.config.image_format}"),
            key=lambda item: item.stat().st_mtime,
            reverse=True,
        )

        for old_file in files[self.config.max_frames:]:
            self._unlink_quietly(old_file)

        self._prune_by_size()

    def _prune_by_size(self) -> None:
        max_bytes = max(1, self.config.max_buffer_mb) * 1024 * 1024
        files = sorted(
            self.config.output_dir.glob(f"*.{self.config.image_format}"),
            key=lambda item: item.stat().st_mtime,
            reverse=True,
        )
        total = sum(item.stat().st_size for item in files if item.exists())

        for old_file in reversed(files):
            if total <= max_bytes:
                break
            try:
                size = old_file.stat().st_size
            except OSError:
                size = 0
            self._unlink_quietly(old_file)
            total -= size

    def _unlink_quietly(self, path: Path) -> None:
        try:
            path.unlink()
        except OSError:
            pass
