import type { WebSocketChannel } from "./types";

export type WebSocketClientOptions = {
  channel: WebSocketChannel;
  onMessage: (payload: unknown) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (event: Event) => void;
};

export class WebSocketClient {
  private socket: WebSocket | null = null;

  constructor(private readonly options: WebSocketClientOptions) {}

  connect() {
    if (this.socket) return;
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const url = `${protocol}://${window.location.host}${this.options.channel}`;
    this.socket = new WebSocket(url);
    this.socket.onopen = () => this.options.onOpen?.();
    this.socket.onclose = () => {
      this.socket = null;
      this.options.onClose?.();
    };
    this.socket.onerror = (event) => this.options.onError?.(event);
    this.socket.onmessage = (event) => {
      try {
        this.options.onMessage(JSON.parse(event.data));
      } catch {
        this.options.onMessage(event.data);
      }
    };
  }

  disconnect() {
    this.socket?.close();
    this.socket = null;
  }
}
