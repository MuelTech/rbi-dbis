import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api, setUnauthorizedHandler } from "./api";

beforeEach(() => {
  vi.stubGlobal("localStorage", { getItem: () => null });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  setUnauthorizedHandler(null);
});

function mockFetch(status: number, body: any = {}) {
  return vi.spyOn(globalThis, "fetch").mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as any);
}

describe("api unauthorized handling", () => {
  it("invokes the unauthorized handler on a 401", async () => {
    mockFetch(401, { error: "Session has been reset. Please log in again." });
    const handler = vi.fn();
    setUnauthorizedHandler(handler);

    await expect(api.get("/residents")).rejects.toThrow(
      "Session has been reset. Please log in again."
    );
    expect(handler).toHaveBeenCalledOnce();
  });

  it("does not invoke the handler for a failed login", async () => {
    mockFetch(401, { error: "Invalid username or password" });
    const handler = vi.fn();
    setUnauthorizedHandler(handler);

    await expect(api.post("/auth/login", {})).rejects.toThrow(
      "Invalid username or password"
    );
    expect(handler).not.toHaveBeenCalled();
  });

  it("returns parsed json on success", async () => {
    mockFetch(200, { ok: true });
    await expect(api.get("/health")).resolves.toEqual({ ok: true });
  });
});
