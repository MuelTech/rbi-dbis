import { prisma } from "@rbi/db";
import {
  deriveRecoveryKek,
  formatRecoveryKey,
  generateKey,
  generateRecoveryKey,
} from "./backupCrypto.js";

export async function getKeyring() {
  return prisma.cryptoKeyring.findUnique({ where: { id: "global" } });
}

export async function getOrCreateKeyring(): Promise<{
  keyring: { serverKey: string; recoveryKey: string };
  createdRecoveryKey?: string;
}> {
  const existing = await getKeyring();
  if (existing) {
    return { keyring: existing };
  }

  const serverKey = generateKey();
  const recoveryKey = generateRecoveryKey();
  const keyring = await prisma.cryptoKeyring.create({
    data: {
      id: "global",
      serverKey: serverKey.toString("base64"),
      recoveryKey: recoveryKey.toString("base64"),
    },
  });
  return { keyring, createdRecoveryKey: formatRecoveryKey(recoveryKey) };
}

export function serverKekOf(keyring: { serverKey: string }): Buffer {
  return Buffer.from(keyring.serverKey, "base64");
}

export function recoveryKekOf(keyring: { recoveryKey: string }): Buffer {
  return deriveRecoveryKek(Buffer.from(keyring.recoveryKey, "base64"));
}

export async function regenerateRecoveryKey(): Promise<string> {
  const recoveryKey = generateRecoveryKey();
  await prisma.cryptoKeyring.update({
    where: { id: "global" },
    data: { recoveryKey: recoveryKey.toString("base64") },
  });
  return formatRecoveryKey(recoveryKey);
}
