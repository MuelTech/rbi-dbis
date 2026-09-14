import { describe, expect, it } from "vitest";
import { createSseParser } from "./sse";

function collect(chunks: string[]) {
  const progress: any[] = [];
  const parser = createSseParser({ onProgress: (data) => progress.push(data) });
  chunks.forEach((chunk) => parser.push(chunk));
  parser.flush();
  return { result: parser.getResult(), progress };
}

const completeStream =
  'event: progress\ndata: {"step":"a","percent":50}\n\n' +
  'event: complete\ndata: {"version":2,"marker":"BACKUP"}\n\n';

describe("createSseParser", () => {
  it("captures the complete event from a single chunk", () => {
    const { result, progress } = collect([completeStream]);
    expect(result).toEqual({ version: 2, marker: "BACKUP" });
    expect(progress).toEqual([{ step: "a", percent: 50 }]);
  });

  it("captures the complete event when delivered line by line", () => {
    const lines = completeStream.match(/[^\n]*\n|[^\n]+$/g) ?? [];
    const { result, progress } = collect(lines);
    expect(result).toEqual({ version: 2, marker: "BACKUP" });
    expect(progress.length).toBe(1);
  });

  it("captures the complete event when a chunk splits a data line", () => {
    const idx = completeStream.indexOf('"marker"');
    const { result } = collect([
      completeStream.slice(0, idx),
      completeStream.slice(idx),
    ]);
    expect(result).toEqual({ version: 2, marker: "BACKUP" });
  });

  it("captures an error event as the result", () => {
    const { result } = collect(['event: error\ndata: {"error":"boom"}\n\n']);
    expect(result).toEqual({ error: "boom" });
  });

  it("returns null when the stream only has progress events", () => {
    const { result, progress } = collect([
      'event: progress\ndata: {"step":"x"}\n\n',
    ]);
    expect(result).toBeNull();
    expect(progress.length).toBe(1);
  });

  it("handles a final message with no trailing blank line on flush", () => {
    const { result } = collect(['event: complete\ndata: {"version":2}']);
    expect(result).toEqual({ version: 2 });
  });

  it("ignores data lines that are not valid JSON", () => {
    const { result } = collect(["event: complete\ndata: not-json\n\n"]);
    expect(result).toBeNull();
  });

  it("joins multiple data lines within one message", () => {
    const { result } = collect([
      'event: complete\ndata: {"a":1,\ndata: "b":2}\n\n',
    ]);
    expect(result).toEqual({ a: 1, b: 2 });
  });
});
