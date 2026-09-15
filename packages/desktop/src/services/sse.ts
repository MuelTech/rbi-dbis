export interface SseMessageHandlers {
  onProgress?: (data: any) => void;
  onRecoveryKey?: (key: string) => void;
}

export interface SseParser {
  push(chunk: string): void;
  flush(): void;
  getResult(): any;
}

/**
 * Incremental parser for a Server-Sent Events stream.
 *
 * SSE messages are separated by a blank line ("\n\n"). This parser buffers
 * partial chunks so `event:` and `data:` lines survive across network chunks,
 * and captures the final `complete`/`error` message as the result.
 */
export function createSseParser(handlers: SseMessageHandlers = {}): SseParser {
  let buffer = "";
  let result: any = null;

  const handleMessage = (raw: string) => {
    let event = "message";
    const dataLines: string[] = [];

    for (const rawLine of raw.split("\n")) {
      const line = rawLine.endsWith("\r") ? rawLine.slice(0, -1) : rawLine;
      if (line.startsWith("event:")) {
        event = line.slice(6).trim();
      } else if (line.startsWith("data:")) {
        dataLines.push(line.slice(5).replace(/^ /, ""));
      }
    }

    if (dataLines.length === 0) return;

    let parsed: any;
    try {
      parsed = JSON.parse(dataLines.join("\n"));
    } catch {
      return;
    }

    if (event === "progress") {
      handlers.onProgress?.(parsed);
    } else if (event === "recovery-key") {
      if (typeof parsed?.recoveryKey === "string") {
        handlers.onRecoveryKey?.(parsed.recoveryKey);
      }
    } else if (event === "complete" || event === "error") {
      result = parsed;
    }
  };

  const drain = () => {
    let idx: number;
    while ((idx = buffer.indexOf("\n\n")) !== -1) {
      const raw = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);
      handleMessage(raw);
    }
  };

  return {
    push(chunk: string) {
      buffer += chunk;
      drain();
    },
    flush() {
      if (buffer.trim()) {
        handleMessage(buffer);
      }
      buffer = "";
    },
    getResult() {
      return result;
    },
  };
}
