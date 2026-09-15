import { describe, expect, it, vi } from "vitest";
import jwt, { type SignOptions } from "jsonwebtoken";
import { requireBackupUnlock } from "./backupUnlock.js";

const SECRET = process.env.JWT_SECRET as string;
const USER_ID = "user-1";

function createRes() {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

function createReq(token?: string) {
  return {
    headers: token ? { "x-backup-unlock": token } : {},
    user: {
      id: USER_ID,
      username: "tester",
      roleType: "SuperAdmin",
      isActive: true,
      permission: "Full Access",
    },
  } as any;
}

function sign(payload: object, options?: SignOptions) {
  return jwt.sign(payload, SECRET, options);
}

describe("requireBackupUnlock", () => {
  it("rejects a request with no unlock header", () => {
    const res = createRes();
    const next = vi.fn();

    requireBackupUnlock(createReq(), res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects a token signed with the wrong secret", () => {
    const token = jwt.sign(
      { sub: USER_ID, scope: "backup-restore" },
      "wrong-secret"
    );
    const res = createRes();
    const next = vi.fn();

    requireBackupUnlock(createReq(token), res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects an expired token", () => {
    const token = sign({
      sub: USER_ID,
      scope: "backup-restore",
      exp: Math.floor(Date.now() / 1000) - 10,
    });
    const res = createRes();
    const next = vi.fn();

    requireBackupUnlock(createReq(token), res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects a token with the wrong scope", () => {
    const token = sign({ sub: USER_ID, scope: "something-else" });
    const res = createRes();
    const next = vi.fn();

    requireBackupUnlock(createReq(token), res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects a token belonging to a different user", () => {
    const token = sign({ sub: "another-user", scope: "backup-restore" });
    const res = createRes();
    const next = vi.fn();

    requireBackupUnlock(createReq(token), res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("calls next for a valid unlock token", () => {
    const token = sign({ sub: USER_ID, scope: "backup-restore" });
    const res = createRes();
    const next = vi.fn();

    requireBackupUnlock(createReq(token), res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });
});
