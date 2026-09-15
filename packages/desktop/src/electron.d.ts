export {};

declare global {
  interface Window {
    electronAPI?: {
      platform: string;
      send: (channel: string, data?: unknown) => void;
      on: (channel: string, callback: (...args: unknown[]) => void) => void;
      invoke: (channel: string, ...args: unknown[]) => Promise<any>;
    };
  }
}
