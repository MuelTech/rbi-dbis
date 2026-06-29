import { prisma, Prisma } from "@rbi/db";

type Changes = Record<string, [unknown, unknown]>;

function computeDiff(oldData: Record<string, any>, newData: Record<string, any>): Changes {
  const changes: Changes = {};
  const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);

  for (const key of allKeys) {
    const oldVal = oldData[key];
    const newVal = newData[key];

    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      changes[key] = [oldVal ?? null, newVal ?? null];
    }
  }

  return changes;
}

function buildSummary(tableName: string, actionType: string, changes: Changes): string {
  const fieldNames = Object.keys(changes);
  const count = fieldNames.length;

  if (actionType === "CREATE") {
    return `Created new ${tableName} record`;
  }
  if (actionType === "ARCHIVE") {
    return `Archived ${tableName} record`;
  }

  if (count === 0) return `Updated ${tableName} record`;
  if (count <= 3) {
    return `Updated ${count} field${count > 1 ? "s" : ""}: ${fieldNames.join(", ")}`;
  }
  return `Updated ${count} fields: ${fieldNames.slice(0, 3).join(", ")}...`;
}

export async function logCreate(
  tableName: string,
  recordId: string,
  userId: string,
  data: Record<string, any>
) {
  const fieldNames = Object.keys(data).slice(0, 3);
  const summary = fieldNames.length > 0
    ? `Created new ${tableName}: ${fieldNames.join(", ")}`
    : `Created new ${tableName} record`;

  await prisma.auditTrail.create({
    data: {
      tableName,
      recordId,
      actionType: "CREATE",
      summary,
      userId,
    },
  });
}

export async function logUpdate(
  tableName: string,
  recordId: string,
  userId: string,
  oldData: Record<string, any>,
  newData: Record<string, any>
) {
  const changes = computeDiff(oldData, newData);

  if (Object.keys(changes).length === 0) return;

  await prisma.auditTrail.create({
    data: {
      tableName,
      recordId,
      actionType: "UPDATE",
      changes: changes as Prisma.InputJsonValue,
      summary: buildSummary(tableName, "UPDATE", changes),
      userId,
    },
  });
}

export async function logArchive(
  tableName: string,
  recordId: string,
  userId: string
) {
  await prisma.auditTrail.create({
    data: {
      tableName,
      recordId,
      actionType: "ARCHIVE",
      summary: `Archived ${tableName} record`,
      userId,
    },
  });
}

export async function logAction(
  tableName: string,
  recordId: string,
  userId: string,
  actionType: string,
  changes?: Changes | null,
  summary?: string
) {
  await prisma.auditTrail.create({
    data: {
      tableName,
      recordId,
      actionType,
      changes: changes ? (changes as Prisma.InputJsonValue) : undefined,
      summary: summary ?? `${actionType} ${tableName} record`,
      userId,
    },
  });
}
