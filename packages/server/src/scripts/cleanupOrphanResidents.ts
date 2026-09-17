import "dotenv/config";
import { prisma } from "@rbi/db";

/**
 * One-off cleanup: remove residents that have no family linkage (neither a
 * Family.headPersonId nor a FamilyMember row). These are "orphans" — they show
 * up in the Residents list but resolve to no household, address or family.
 *
 * Dry-run by default. Pass --apply to actually delete.
 *
 * FK-safe order per resident: documentSigner -> order -> document -> resident
 * (and the resident's Record, if any).
 */
const APPLY = process.argv.includes("--apply");

function fullName(r: {
  firstName: string;
  middleName: string | null;
  lastName: string;
}): string {
  return [r.firstName, r.middleName, r.lastName].filter(Boolean).join(" ");
}

async function findOrphans() {
  return prisma.resident.findMany({
    where: { familyHead: null, familyMember: null },
    orderBy: { displayId: "asc" },
    select: {
      id: true,
      displayId: true,
      firstName: true,
      middleName: true,
      lastName: true,
      recordId: true,
      orders: {
        select: {
          id: true,
          orNumber: true,
          documentId: true,
          document: { select: { displayId: true } },
        },
      },
    },
  });
}

async function main() {
  const orphans = await findOrphans();

  if (orphans.length === 0) {
    console.log("No orphan residents found. Nothing to do.");
    return;
  }

  console.log(`${APPLY ? "Deleting" : "Would delete"} ${orphans.length} orphan resident(s):\n`);
  for (const r of orphans) {
    console.log(`  #${r.displayId} ${fullName(r)} (${r.id})`);
    for (const o of r.orders) {
      console.log(
        `      order ${o.orNumber} -> document #${o.document?.displayId ?? "?"} (${o.documentId})`
      );
    }
  }

  if (!APPLY) {
    console.log("\nDry run. Re-run with --apply to delete.");
    return;
  }

  await prisma.$transaction(async (tx) => {
    for (const r of orphans) {
      const orderIds = r.orders.map((o) => o.id);
      const documentIds = r.orders.map((o) => o.documentId).filter(Boolean);

      if (documentIds.length > 0) {
        await tx.documentSigner.deleteMany({
          where: { documentId: { in: documentIds } },
        });
        await tx.order.deleteMany({ where: { id: { in: orderIds } } });
        await tx.document.deleteMany({ where: { id: { in: documentIds } } });
      }

      await tx.resident.delete({ where: { id: r.id } });

      if (r.recordId) {
        await tx.record.delete({ where: { id: r.recordId } });
      }
    }
  });

  const remaining = await prisma.resident.count({
    where: { familyHead: null, familyMember: null },
  });
  console.log(`\nDeleted ${orphans.length} orphan(s). Remaining orphans: ${remaining}.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
