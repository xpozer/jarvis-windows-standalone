import { useEffect, useRef } from "react";

type UseWebSocketOptions = {
  url: string;
  enabled?: boolean;
  onMessage: (payload: unknown) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (event: Event) => void;
};

export function useWebSocket({ url, enabled = true, onMessage, onOpen, onClose, onError }: UseWebSocketOptions) {
  const retryRef = useRef(1000);
  const timerRef = useRef<number | undefined>();
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!enabled) return undefined;
    let disposed = false;

    function connect() {
      if (disposed) return;
      const socket = new WebSocket(url);
      socketRef.current = socket;

      socket.onopen = () => {
        retryRef.current = 1000;
        onOpen?.();
      };

      socket.onmessage = (event) => {
        try {
          onMessage(JSON.parse(event.data));
        } catch {
          onMessage(event.data);
        }
      };

      socket.onerror = (event) => {
        onError?.(event);
      };

      socket.onclose = () => {
        socketRef.current = null;
        onClose?.();
        if (disposed) return;
        const wait = retryRef.current;
        retryRef.current = Math.min(16000, retryRef.current * 2);
        timerRef.current = window.setTimeout(connect, wait);
      };
    }

    connect();

    return () => {
      disposed = true;
      if (timerRef.current) window.clearTimeout(timerRef.current);
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [enabled, onClose, onError, onMessage, onOpen, url]);
}
