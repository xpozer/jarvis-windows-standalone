import { RefObject, useEffect } from "react";
import { useUiStore } from "../state/uiStore";

type UseHotkeysArgs = {
  inputRef: RefObject<HTMLInputElement>;
};

export function useHotkeys({ inputRef }: UseHotkeysArgs) {
  const closeOverlay = useUiStore((state) => state.closeOverlay);
  const setInputFocused = useUiStore((state) => state.setInputFocused);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const key = event.key.toLowerCase();
      const commandFocus = (event.ctrlKey || event.metaKey) && key === "k";

      if (commandFocus) {
        event.preventDefault();
        inputRef.current?.focus();
        setInputFocused(true);
        return;
      }

      if (event.key === "Escape") {
        closeOverlay();
        inputRef.current?.blur();
        setInputFocused(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closeOverlay, inputRef, setInputFocused]);
}
