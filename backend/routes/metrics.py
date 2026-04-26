from __future__ import annotations

import os
import shutil
import subprocess
import time
from typing import Any

from fastapi import APIRouter

router = APIRouter()

_LAST_CPU_SAMPLE: tuple[float, float] | None = None
_LAST_NET_SAMPLE: tuple[float, int, int] | None = None


def _run_powershell(command: str, timeout: int = 3) -> str:
    try:
        completed = subprocess.run(
            ["powershell", "-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", command],
            capture_output=True,
            text=True,
            timeout=timeout,
        )
        if completed.returncode != 0:
            return ""
        return (completed.stdout or "").strip()
    except Exception:
        return ""


def _memory() -> dict[str, Any]:
    if os.name == "nt":
        out = _run_powershell(
            "$os=Get-CimInstance Win32_OperatingSystem; "
            "$total=[double]$os.TotalVisibleMemorySize*1024; "
            "$free=[double]$os.FreePhysicalMemory*1024; "
            "$used=$total-$free; "
            "Write-Output (($used/1GB).ToString('0.0')+','+($total/1GB).ToString('0.0')+','+(($used/$total)*100).ToString('0'))"
        )
        try:
            used_gb, total_gb, percent = [float(x.replace(',', '.')) for x in out.split(',')[:3]]
            return {"used_gb": used_gb, "total_gb": total_gb, "percent": percent}
        except Exception:
            pass
    try:
        total, used, free = shutil.disk_usage(os.path.expanduser("~"))
        return {"used_gb": None, "total_gb": None, "percent": None}
    except Exception:
        return {"used_gb": None, "total_gb": None, "percent": None}


def _cpu_percent() -> float | None:
    global _LAST_CPU_SAMPLE
    if os.name == "nt":
        out = _run_powershell("(Get-CimInstance Win32_Processor | Measure-Object -Property LoadPercentage -Average).Average", timeout=3)
        try:
            return round(float(out.replace(',', '.')), 1)
        except Exception:
            pass
    try:
        load1, _, _ = os.getloadavg()
        cores = max(1, os.cpu_count() or 1)
        return round(min(100.0, (load1 / cores) * 100), 1)
    except Exception:
        return None


def _temperature() -> float | None:
    if os.name != "nt":
        return None
    commands = [
        "Get-CimInstance -Namespace root/wmi -ClassName MSAcpi_ThermalZoneTemperature -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty CurrentTemperature",
        "Get-WmiObject MSAcpi_ThermalZoneTemperature -Namespace root/wmi -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty CurrentTemperature",
    ]
    for command in commands:
        out = _run_powershell(command, timeout=3)
        try:
            raw = float(out.splitlines()[0].replace(',', '.'))
            celsius = round((raw / 10.0) - 273.15, 1)
            if -20 <= celsius <= 130:
                return celsius
        except Exception:
            continue
    return None


def _network() -> dict[str, Any]:
    global _LAST_NET_SAMPLE
    now = time.time()
    rx = tx = None
    if os.name == "nt":
        out = _run_powershell(
            "$n=Get-CimInstance Win32_PerfRawData_Tcpip_NetworkInterface | "
            "Where-Object {$_.Name -notmatch 'Loopback|isatap|Teredo'} | "
            "Measure-Object -Property BytesReceivedPersec,BytesSentPersec -Sum; "
            "$rx=($n | Where-Object {$_.Property -eq 'BytesReceivedPersec'}).Sum; "
            "$tx=($n | Where-Object {$_.Property -eq 'BytesSentPersec'}).Sum; "
            "Write-Output (($rx -as [double]).ToString('0')+','+($tx -as [double]).ToString('0'))",
            timeout=3,
        )
        try:
            rx, tx = [int(float(x)) for x in out.split(',')[:2]]
        except Exception:
            rx = tx = None
    if rx is None or tx is None:
        return {"mbps": None, "label": "N/A"}
    if _LAST_NET_SAMPLE is None:
        _LAST_NET_SAMPLE = (now, rx, tx)
        return {"mbps": 0.0, "label": "0 Mb/s"}
    last_time, last_rx, last_tx = _LAST_NET_SAMPLE
    _LAST_NET_SAMPLE = (now, rx, tx)
    dt = max(0.25, now - last_time)
    bytes_per_second = max(0, (rx + tx) - (last_rx + last_tx)) / dt
    mbps = round((bytes_per_second * 8) / 1_000_000, 1)
    if mbps >= 1000:
        label = f"{round(mbps / 1000, 2)} Gb/s"
    else:
        label = f"{mbps} Mb/s"
    return {"mbps": mbps, "label": label}


def _level(value: float | None, warn: float, critical: float) -> str:
    if value is None:
        return "unknown"
    if value >= critical:
        return "critical"
    if value >= warn:
        return "warn"
    return "ok"


@router.get("/system/metrics")
def system_metrics() -> dict[str, Any]:
    cpu = _cpu_percent()
    memory = _memory()
    temp = _temperature()
    network = _network()
    memory_percent = memory.get("percent")
    overall = "ok"
    levels = {
        "cpu": _level(cpu, 80, 95),
        "memory": _level(memory_percent, 80, 95) if memory_percent is not None else "unknown",
        "temperature": _level(temp, 75, 90),
        "network": "ok" if network.get("mbps") is not None else "unknown",
    }
    if "critical" in levels.values():
        overall = "critical"
    elif "warn" in levels.values():
        overall = "warn"
    return {
        "status": overall,
        "timestamp": time.time(),
        "cpu": {"percent": cpu, "level": levels["cpu"]},
        "memory": {**memory, "level": levels["memory"]},
        "temperature": {"celsius": temp, "level": levels["temperature"]},
        "network": {**network, "level": levels["network"]},
    }
