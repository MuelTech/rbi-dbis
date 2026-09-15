import { prisma, Prisma } from "@rbi/db";
import {
  BACKUP_VERSION,
  validateBackup,
  summarizeBackup,
  type BackupPayload,
} from "./backupValidation.js";

export { BACKUP_VERSION, validateBackup, summarizeBackup };
export type { BackupPayload };

const RESTORE_TRANSACTION_TIMEOUT_MS = 120_000;
const RESTORE_TRANSACTION_MAX_WAIT_MS = 10_000;

export interface BackupProgress {
  step: string;
  current: number;
  total: number;
  percent: number;
}

export type ProgressReporter = (progress: BackupProgress) => void;

/**
 * Compile-time completeness guard.
 *
 * `Record<Prisma.ModelName, true>` requires an entry for EVERY model in the
 * Prisma schema. If a new model is added (or an existing one renamed/removed),
 * the server build fails here until backup/restore is updated to handle it.
 * Do not use `Partial<>` — that would defeat the guard.
 */
export const HANDLED_MODELS: Record<Prisma.ModelName, true> = {
  Block: true,
  Household: true,
  Family: true,
  FamilyPet: true,
  FamilyVehicle: true,
  FamilyMember: true,
  Address: true,
  Resident: true,
  Record: true,
  User: true,
  UserInfo: true,
  Order: true,
  Document: true,
  DocumentType: true,
  DocumentSigner: true,
  BarangayOfficial: true,
  AuditTrail: true,
  BarangaySetting: true,
  // Infrastructure state, intentionally NOT exported/restored by backup.
  SessionState: true,
  CryptoKeyring: true,
};

const EXPORT_STEPS: { key: string; label: string; run: () => Promise<any> }[] = [
  { key: "settings", label: "Fetching settings...", run: () => prisma.barangaySetting.findFirst() },
  { key: "blocks", label: "Fetching blocks...", run: () => prisma.block.findMany() },
  { key: "records", label: "Fetching records...", run: () => prisma.record.findMany() },
  { key: "households", label: "Fetching households...", run: () => prisma.household.findMany() },
  { key: "residents", label: "Fetching residents...", run: () => prisma.resident.findMany() },
  { key: "families", label: "Fetching families...", run: () => prisma.family.findMany({ include: { pet: true, vehicle: true, address: true, members: true } }) },
  { key: "barangayOfficials", label: "Fetching barangay officials...", run: () => prisma.barangayOfficial.findMany() },
  { key: "users", label: "Fetching users...", run: () => prisma.user.findMany({ include: { userInfo: true } }) },
  { key: "documentTypes", label: "Fetching document types...", run: () => prisma.documentType.findMany() },
  { key: "documents", label: "Fetching documents...", run: () => prisma.document.findMany({ include: { documentType: true, signers: true } }) },
  { key: "orders", label: "Fetching orders...", run: () => prisma.order.findMany() },
  { key: "auditTrails", label: "Fetching activity logs...", run: () => prisma.auditTrail.findMany() },
];

export async function buildBackup(onProgress: ProgressReporter): Promise<BackupPayload> {
  const data: Record<string, any> = {};
  const total = EXPORT_STEPS.length;

  for (let i = 0; i < total; i++) {
    const step = EXPORT_STEPS[i];
    onProgress({
      step: step.label,
      current: i + 1,
      total,
      percent: Math.round(((i + 1) / total) * 100),
    });

    const result = await step.run();
    data[step.key] = step.key === "settings" ? (result as any)?.data ?? null : result;
  }

  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data,
    meta: summarizeBackup(data),
  };
}

interface RestoreContext {
  addressMap: Map<string, string>;
  documentTypeMap: Map<string, string>;
}

type RestoreStep = {
  label: string;
  run: (
    tx: Prisma.TransactionClient,
    data: Record<string, any>,
    ctx: RestoreContext
  ) => Promise<void>;
};

/**
 * Order matters and must satisfy foreign keys:
 * records before residents; addresses/households before families;
 * barangay officials before document signers; document types before documents;
 * users/residents/documents before orders; users before audit trails.
 */
const RESTORE_STEPS: RestoreStep[] = [
  {
    label: "Restoring blocks...",
    run: async (tx, data) => {
      if (data.blocks?.length) {
        await tx.block.createMany({
          data: data.blocks.map((block: any) => ({
            id: block.id,
            blockNumber: block.blockNumber,
          })),
        });
      }
    },
  },
  {
    label: "Restoring records...",
    run: async (tx, data) => {
      if (data.records?.length) {
        await tx.record.createMany({
          data: data.records.map((record: any) => ({
            id: record.id,
            hasRecord: record.hasRecord,
            recordDate: record.recordDate ? new Date(record.recordDate) : null,
            description: record.description,
          })),
        });
      }
    },
  },
  {
    label: "Restoring households...",
    run: async (tx, data) => {
      if (data.households?.length) {
        await tx.household.createMany({
          data: data.households.map((h: any) => ({
            id: h.id,
            brgyHouseholdNo: h.brgyHouseholdNo,
            blockId: h.blockId,
          })),
        });
      }
    },
  },
  {
    label: "Restoring residents...",
    run: async (tx, data) => {
      if (data.residents?.length) {
        await tx.resident.createMany({
          data: data.residents.map((r: any) => ({
            id: r.id,
            lastName: r.lastName,
            firstName: r.firstName,
            middleName: r.middleName,
            suffix: r.suffix,
            placeOfBirth: r.placeOfBirth,
            dateOfBirth: r.dateOfBirth ? new Date(r.dateOfBirth) : null,
            sex: r.sex,
            civilStatus: r.civilStatus,
            isVoter: r.isVoter,
            isPwd: r.isPwd,
            isSoloParent: r.isSoloParent,
            isOwner: r.isOwner,
            studentType: r.studentType,
            statusType: r.statusType,
            contactNumber: r.contactNumber,
            occupationType: r.occupationType,
            profileImage: r.profileImage,
            recordId: r.recordId,
          })),
        });
      }
    },
  },
  {
    label: "Restoring addresses...",
    run: async (tx, data, ctx) => {
      for (const family of data.families ?? []) {
        if (family.address) {
          const addr = family.address;
          const created = await tx.address.create({
            data: {
              houseNo: addr.houseNo,
              streetName: addr.streetName,
              alleyName: addr.alleyName,
            },
          });
          ctx.addressMap.set(addr.id, created.id);
        }
      }
    },
  },
  {
    label: "Restoring families...",
    run: async (tx, data, ctx) => {
      for (const family of data.families ?? []) {
        const addressId = ctx.addressMap.get(family.addressId) ?? family.addressId;
        await tx.family.create({
          data: {
            id: family.id,
            familyName: family.familyName,
            isArchived: family.isArchived,
            householdId: family.householdId,
            headPersonId: family.headPersonId,
            addressId,
            ...(family.pet && {
              pet: {
                create: {
                  isPetOwner: family.pet.isPetOwner,
                  numberOfDogs: family.pet.numberOfDogs,
                  numberOfCats: family.pet.numberOfCats,
                  others: family.pet.others,
                },
              },
            }),
            ...(family.vehicle && {
              vehicle: {
                create: {
                  numberOfMotorcycles: family.vehicle.numberOfMotorcycles,
                  motorcyclePlateNumber: family.vehicle.motorcyclePlateNumber,
                  numberOfVehicles: family.vehicle.numberOfVehicles,
                  vehiclePlateNumber: family.vehicle.vehiclePlateNumber,
                },
              },
            }),
            ...(family.members?.length && {
              members: {
                create: family.members.map((m: any) => ({
                  relationshipType: m.relationshipType,
                  residentId: m.residentId,
                })),
              },
            }),
          },
        });
      }
    },
  },
  {
    label: "Restoring barangay officials...",
    run: async (tx, data) => {
      if (data.barangayOfficials?.length) {
        await tx.barangayOfficial.createMany({
          data: data.barangayOfficials.map((official: any) => ({
            id: official.id,
            firstName: official.firstName,
            lastName: official.lastName,
            roleType: official.roleType,
          })),
        });
      }
    },
  },
  {
    label: "Restoring users...",
    run: async (tx, data) => {
      for (const user of data.users ?? []) {
        await tx.user.create({
          data: {
            id: user.id,
            username: user.username,
            password: user.password,
            roleType: user.roleType,
            isActive: user.isActive,
            permission: user.permission,
            lastLogin: user.lastLogin ? new Date(user.lastLogin) : null,
            mustChangePassword: user.mustChangePassword ?? false,
            tokenVersion: user.tokenVersion ?? 0,
            ...(user.userInfo && {
              userInfo: {
                create: {
                  firstName: user.userInfo.firstName,
                  lastName: user.userInfo.lastName,
                  phoneNumber: user.userInfo.phoneNumber,
                  profileImage: user.userInfo.profileImage,
                },
              },
            }),
          },
        });
      }
    },
  },
  {
    label: "Restoring document types...",
    run: async (tx, data, ctx) => {
      for (const dt of data.documentTypes ?? []) {
        const created = await tx.documentType.create({
          data: { documentName: dt.documentName, amount: dt.amount },
        });
        ctx.documentTypeMap.set(dt.id, created.id);
      }
    },
  },
  {
    label: "Restoring documents...",
    run: async (tx, data, ctx) => {
      for (const doc of data.documents ?? []) {
        const documentTypeId =
          ctx.documentTypeMap.get(doc.documentTypeId) ?? doc.documentTypeId;
        await tx.document.create({
          data: {
            id: doc.id,
            issueDate: new Date(doc.issueDate),
            purpose: doc.purpose,
            validityPeriod: doc.validityPeriod,
            documentTypeId,
            ...(doc.formData != null ? { formData: doc.formData } : {}),
            ...(doc.signers?.length && {
              signers: {
                create: doc.signers.map((s: any) => ({
                  signerFirstName: s.signerFirstName,
                  signerLastName: s.signerLastName,
                  signerRole: s.signerRole,
                  barangayOfficialId: s.barangayOfficialId,
                })),
              },
            }),
          },
        });
      }
    },
  },
  {
    label: "Restoring orders...",
    run: async (tx, data) => {
      if (data.orders?.length) {
        await tx.order.createMany({
          data: data.orders.map((order: any) => ({
            id: order.id,
            orNumber: order.orNumber,
            orderDate: new Date(order.orderDate),
            amount: order.amount,
            userId: order.userId,
            residentId: order.residentId,
            documentId: order.documentId,
          })),
        });
      }
    },
  },
  {
    label: "Restoring activity logs...",
    run: async (tx, data) => {
      if (data.auditTrails?.length) {
        await tx.auditTrail.createMany({
          data: data.auditTrails.map((log: any) => ({
            id: log.id,
            tableName: log.tableName,
            recordId: log.recordId,
            actionType: log.actionType,
            timestamp: log.timestamp ? new Date(log.timestamp) : new Date(),
            ...(log.changes != null ? { changes: log.changes } : {}),
            summary: log.summary,
            userId: log.userId,
          })),
        });
      }
    },
  },
  {
    label: "Restoring settings...",
    run: async (tx, data) => {
      if (data.settings) {
        await tx.barangaySetting.create({ data: { data: data.settings } });
      }
    },
  },
];

async function clearAll(tx: Prisma.TransactionClient) {
  // Delete in reverse dependency order
  await tx.documentSigner.deleteMany();
  await tx.order.deleteMany();
  await tx.document.deleteMany();
  await tx.documentType.deleteMany();
  await tx.barangayOfficial.deleteMany();
  await tx.familyMember.deleteMany();
  await tx.familyPet.deleteMany();
  await tx.familyVehicle.deleteMany();
  await tx.family.deleteMany();
  await tx.address.deleteMany();
  await tx.household.deleteMany();
  await tx.block.deleteMany();
  await tx.resident.deleteMany();
  await tx.auditTrail.deleteMany();
  await tx.userInfo.deleteMany();
  await tx.user.deleteMany();
  await tx.barangaySetting.deleteMany();
  await tx.record.deleteMany();
}

export async function applyBackup(
  data: Record<string, any>,
  onProgress: ProgressReporter
): Promise<void> {
  const total = RESTORE_STEPS.length + 1; // +1 for the clear step
  let current = 0;

  const ctx: RestoreContext = {
    addressMap: new Map<string, string>(),
    documentTypeMap: new Map<string, string>(),
  };

  await prisma.$transaction(
    async (tx: Prisma.TransactionClient) => {
      current += 1;
      onProgress({
        step: "Clearing old data...",
        current,
        total,
        percent: Math.round((current / total) * 100),
      });
      await clearAll(tx);

      for (const step of RESTORE_STEPS) {
        current += 1;
        onProgress({
          step: step.label,
          current,
          total,
          percent: Math.round((current / total) * 100),
        });
        await step.run(tx, data, ctx);
      }
    },
    {
      timeout: RESTORE_TRANSACTION_TIMEOUT_MS,
      maxWait: RESTORE_TRANSACTION_MAX_WAIT_MS,
    }
  );
}
