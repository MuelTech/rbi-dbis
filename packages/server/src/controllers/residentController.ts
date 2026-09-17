import type { Request, Response, NextFunction } from "express";
import { prisma, Prisma } from "@rbi/db";
import { logUpdate, logArchive, logAction } from "../services/auditService.js";
import { buildResidentSearchWhere } from "../services/residentSearch.js";
import { validateFamilyImportRow } from "../services/familyImportValidation.js";

const STATUS_MAP_TO_DB: Record<string, string> = {
  Active: "Alive",
  Deceased: "Deceased",
  "Move out": "MovedOut",
};

const STATUS_MAP_TO_UI: Record<string, string> = {
  Alive: "Active",
  Deceased: "Deceased",
  MovedOut: "Move out",
};

function computeAge(dateOfBirth: Date | null): number {
  if (!dateOfBirth) return 0;
  const today = new Date();
  let age = today.getFullYear() - dateOfBirth.getFullYear();
  const m = today.getMonth() - dateOfBirth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dateOfBirth.getDate())) age--;
  return age;
}

/**
 * Parses an optional `registered_at` cell. Returns undefined when missing or
 * invalid so the database default (now) applies.
 */
function parseRegisteredAt(value: unknown): Date | undefined {
  if (value === undefined || value === null || String(value).trim() === "") {
    return undefined;
  }
  const parsed = new Date(String(value));
  return isNaN(parsed.getTime()) ? undefined : parsed;
}

export async function getResidents(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const qStr = (key: string): string => {
      const v = req.query[key];
      return typeof v === "string" ? v.trim() : "";
    };

    const page = Math.max(1, parseInt(qStr("page")) || 1);
    const pageSize = Math.max(1, Math.min(100, parseInt(qStr("pageSize")) || 20));
    const search = qStr("search");
    const statusParam = qStr("status");
    const sexParam = qStr("sex");
    const voterParam = qStr("voter");

    const where: Prisma.ResidentWhereInput = {};
    const andClauses: Prisma.ResidentWhereInput[] = [];

    if (search) {
      const searchWhere = buildResidentSearchWhere(search);
      if (searchWhere) andClauses.push(searchWhere);
    }

    if (statusParam) {
      const dbStatuses = statusParam
        .split(",")
        .map((s) => STATUS_MAP_TO_DB[s.trim()])
        .filter(Boolean) as any[];
      if (dbStatuses.length > 0) {
        andClauses.push({ statusType: { in: dbStatuses } });
      }
    }

    if (sexParam) {
      const sexValues = sexParam
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s === "Male" || s === "Female") as any[];
      if (sexValues.length > 0) {
        andClauses.push({ sex: { in: sexValues } });
      }
    }

    if (voterParam) {
      if (voterParam === "Voter") {
        andClauses.push({ isVoter: true });
      } else if (voterParam === "Non-Voter") {
        andClauses.push({ isVoter: false });
      }
    }

    if (andClauses.length > 0) {
      where.AND = andClauses;
    }

    const skip = (page - 1) * pageSize;

    const [total, residents] = await Promise.all([
      prisma.resident.count({ where }),
      prisma.resident.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
    ]);

    const totalPages = Math.ceil(total / pageSize);

    const data = residents.map((r) => ({
      id: r.id,
      displayId: r.displayId,
      lastName: r.lastName,
      firstName: r.firstName,
      middleName: r.middleName,
      suffix: r.suffix,
      placeOfBirth: r.placeOfBirth,
      dateOfBirth: r.dateOfBirth,
      sex: r.sex,
      civilStatus: r.civilStatus,
      voter: r.isVoter ? "Yes" : "No",
      isVoter: r.isVoter,
      isPwd: r.isPwd,
      isSoloParent: r.isSoloParent,
      isOwner: r.isOwner,
      studentType: r.studentType,
      status: STATUS_MAP_TO_UI[r.statusType] ?? "Active",
      statusType: r.statusType,
      contactNumber: r.contactNumber,
      occupation: r.occupationType,
      profileImage: r.profileImage,
      age: computeAge(r.dateOfBirth),
      registeredAt: r.registeredAt,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));

    res.json({ data, meta: { page, pageSize, total, totalPages } });
  } catch (err) {
    next(err);
  }
}

export async function getResidentLookup(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const residents = await prisma.resident.findMany({
      select: { firstName: true, lastName: true, dateOfBirth: true },
      orderBy: { displayId: "asc" },
    });
    res.json(
      residents.map((r) => ({
        firstName: r.firstName,
        lastName: r.lastName,
        dateOfBirth: r.dateOfBirth,
      }))
    );
  } catch (err) {
    next(err);
  }
}

async function buildResidentDetail(id: string) {
  const [resident, auditTrails] = await Promise.all([
    prisma.resident.findUnique({
      where: { id },
      include: {
        familyHead: {
          include: {
            household: true,
            address: true,
          },
        },
        familyMember: {
          include: {
            family: {
              include: {
                headPerson: true,
                household: true,
                address: true,
              },
            },
          },
        },
        orders: {
          include: {
            document: { include: { documentType: true } },
            user: { include: { userInfo: true } },
          },
          orderBy: { orderDate: "desc" as const },
        },
      },
    }),
    prisma.auditTrail.findMany({
      where: { tableName: "residents", recordId: id },
      include: { user: { include: { userInfo: true } } },
      orderBy: { timestamp: "desc" },
      take: 50,
    }),
  ]);

  if (!resident) return null;

  const family = resident.familyHead
    ?? resident.familyMember?.family
    ?? null;

  const headPerson = resident.familyHead
    ? resident
    : resident.familyMember?.family?.headPerson ?? null;

  const familyHeadLabel = headPerson
    ? `${headPerson.lastName}, ${headPerson.firstName}${headPerson.suffix ? ` ${headPerson.suffix}` : ""}`
    : null;

  const relationshipToHead = resident.familyHead
    ? "Head"
    : resident.familyMember?.relationshipType ?? null;

  const household = family
    ? {
        householdNo: family.household?.brgyHouseholdNo ?? "",
        streetName: family.address?.streetName ?? "",
        alley: family.address?.alleyName ?? "",
      }
    : null;

  const orders = resident.orders.map((o) => ({
    displayId: o.displayId,
    orderDate: o.orderDate,
    documentType: o.document?.documentType?.documentName ?? "",
    amount: Number(o.amount),
    personnelName: o.user?.userInfo
      ? `${o.user.userInfo.firstName} ${o.user.userInfo.lastName}`
      : o.user?.username ?? "",
  }));

  const shapedAuditTrails = auditTrails.map((a) => ({
    id: a.id,
    timestamp: a.timestamp,
    personnelName: a.user?.userInfo
      ? `${a.user.userInfo.firstName} ${a.user.userInfo.lastName}`
      : a.user?.username ?? "",
    actionType: a.actionType,
    changes: a.changes,
    summary: a.summary,
  }));

  return {
    id: resident.id,
    displayId: resident.displayId,
    lastName: resident.lastName,
    firstName: resident.firstName,
    middleName: resident.middleName,
    suffix: resident.suffix,
    placeOfBirth: resident.placeOfBirth,
    dateOfBirth: resident.dateOfBirth,
    sex: resident.sex,
    civilStatus: resident.civilStatus,
    voter: resident.isVoter ? "Yes" : "No",
    isVoter: resident.isVoter,
    isPwd: resident.isPwd,
    isSoloParent: resident.isSoloParent,
    isOwner: resident.isOwner,
    studentType: resident.studentType,
    status: STATUS_MAP_TO_UI[resident.statusType] ?? "Active",
    contactNumber: resident.contactNumber,
    occupation: resident.occupationType,
    profileImage: resident.profileImage,
    age: computeAge(resident.dateOfBirth),
    registeredAt: resident.registeredAt,
    createdAt: resident.createdAt,
    updatedAt: resident.updatedAt,
    familyHead: familyHeadLabel ? { name: familyHeadLabel } : null,
    relationshipToHead,
    household,
    orders,
    auditTrails: shapedAuditTrails,
  };
}

export async function getResidentById(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const detail = await buildResidentDetail(req.params.id as string);
    if (!detail) return res.status(404).json({ error: "Resident not found" });
    res.json(detail);
  } catch (err) {
    next(err);
  }
}

export async function updateResident(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const id = req.params.id as string;
    const body = req.body;
    const userId = req.user?.id;

    const oldResident = await prisma.resident.findUnique({ where: { id } });
    if (!oldResident) return res.status(404).json({ error: "Resident not found" });

    const dbData: Record<string, unknown> = {};

    const directFields = [
      "firstName", "lastName", "middleName", "suffix",
      "placeOfBirth", "civilStatus", "contactNumber", "profileImage",
    ] as const;
    for (const f of directFields) {
      if (body[f] !== undefined) dbData[f] = body[f];
    }

    if (body.dateOfBirth !== undefined) {
      dbData.dateOfBirth = body.dateOfBirth ? new Date(body.dateOfBirth) : null;
    }
    if (body.sex !== undefined) dbData.sex = body.sex;
    if (body.occupation !== undefined) dbData.occupationType = body.occupation;
    if (body.studentType !== undefined) dbData.studentType = body.studentType;
    if (body.isVoter !== undefined) dbData.isVoter = body.isVoter;
    if (body.isPwd !== undefined) dbData.isPwd = body.isPwd;
    if (body.isSoloParent !== undefined) dbData.isSoloParent = body.isSoloParent;
    if (body.isOwner !== undefined) dbData.isOwner = body.isOwner;

    if (body.status !== undefined) {
      const mapped = STATUS_MAP_TO_DB[body.status];
      if (mapped) dbData.statusType = mapped;
    }

    await prisma.resident.update({ where: { id }, data: dbData });

    if (userId) {
      const newData = await prisma.resident.findUnique({ where: { id } });
      if (newData) {
        const oldData = {
          firstName: oldResident.firstName,
          lastName: oldResident.lastName,
          middleName: oldResident.middleName,
          sex: oldResident.sex,
          civilStatus: oldResident.civilStatus,
          isVoter: oldResident.isVoter,
          isPwd: oldResident.isPwd,
          contactNumber: oldResident.contactNumber,
          occupationType: oldResident.occupationType,
          statusType: oldResident.statusType,
        };
        const updatedData = {
          firstName: newData.firstName,
          lastName: newData.lastName,
          middleName: newData.middleName,
          sex: newData.sex,
          civilStatus: newData.civilStatus,
          isVoter: newData.isVoter,
          isPwd: newData.isPwd,
          contactNumber: newData.contactNumber,
          occupationType: newData.occupationType,
          statusType: newData.statusType,
        };
        await logUpdate("residents", id, userId, oldData, updatedData);
      }
    }

    const detail = await buildResidentDetail(id);
    if (!detail) return res.status(404).json({ error: "Resident not found" });
    res.json(detail);
  } catch (err) {
    next(err);
  }
}

export async function deleteResident(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const id = req.params.id as string;
    const userId = req.user?.id;

    if (userId) {
      await logArchive("residents", id, userId);
    }

    await prisma.resident.delete({ where: { id } });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

export async function batchImportResidents(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { families } = req.body;

    if (!Array.isArray(families) || families.length === 0) {
      res.status(400).json({ error: "families array is required" });
      return;
    }

    let totalCreated = 0;
    let totalSkipped = 0;
    const errors: string[] = [];

    for (const fam of families) {
      const validationError = validateFamilyImportRow(fam);
      if (validationError) {
        errors.push(
          `Family ${fam?.head?.last_name ?? "unknown"}: ${validationError}`
        );
        continue;
      }

      try {
        const delta = await prisma.$transaction(async (tx) => {
          let block = await tx.block.findFirst({
            where: { blockNumber: fam.household?.block },
          });
          if (!block) {
            block = await tx.block.create({
              data: { blockNumber: fam.household?.block },
            });
          }

          const hhNum = String(fam.household?.household_number ?? "").padStart(3, "0");
          let createdHousehold = await tx.household.findFirst({
            where: { blockId: block.id, brgyHouseholdNo: hhNum },
          });
          if (!createdHousehold) {
            createdHousehold = await tx.household.create({
              data: { brgyHouseholdNo: hhNum, blockId: block.id },
            });
          }

          const head = fam.head;
          const headData = {
            lastName: head.last_name,
            firstName: head.first_name,
            middleName: head.middle_name || null,
            suffix: head.suffix || null,
            placeOfBirth: head.place_of_birth || null,
            dateOfBirth: head.date_of_birth ? new Date(head.date_of_birth) : null,
            sex: head.sex,
            civilStatus: head.civil_status || null,
            isVoter: head.is_voter === "Yes" || head.is_voter === true,
            isPwd: head.is_pwd === "Yes" || head.is_pwd === true,
            isSoloParent: head.is_solo_parent === "Yes" || head.is_solo_parent === true,
            isOwner: head.is_owner === "Yes" || head.is_owner === true,
            occupationType: head.occupation || null,
            contactNumber: head.contact_number || null,
            studentType: head.is_student === "Yes" ? (head.education_level || "Student") : null,
            registeredAt: parseRegisteredAt(head.registered_at),
          };

          const existingHead = await tx.resident.findFirst({
            where: {
              lastName: headData.lastName,
              firstName: headData.firstName,
              dateOfBirth: headData.dateOfBirth,
            },
          });
          if (existingHead) {
            // Create-only import: an existing head means the family is already
            // registered. Skip it rather than attempting an id-less update.
            return { created: 0, skipped: 1 };
          }

          const headResident = await tx.resident.create({ data: headData });
          let created = 1;
          let skipped = 0;

          // Address is 1:1 with Family, so every new family gets its own row.
          const createdAddress = await tx.address.create({
            data: {
              houseNo: fam.address?.house_number ?? "",
              streetName: fam.address?.street_name ?? "",
              alleyName: fam.address?.alley ?? "",
            },
          });
          const family = await tx.family.create({
            data: {
              familyName: headData.lastName,
              householdId: createdHousehold.id,
              headPersonId: headResident.id,
              addressId: createdAddress.id,
            },
          });

          if (fam.pet?.has_pets === "Yes" || fam.pet?.has_pets === true) {
            await tx.familyPet.create({
              data: {
                familyId: family.id,
                isPetOwner: true,
                numberOfDogs: Number(fam.pet.number_of_dogs) || 0,
                numberOfCats: Number(fam.pet.number_of_cats) || 0,
                others: fam.pet.other_animals || null,
              },
            });
          }

          if (fam.vehicle?.has_vehicles === "Yes" || fam.vehicle?.has_vehicles === true) {
            await tx.familyVehicle.create({
              data: {
                familyId: family.id,
                numberOfMotorcycles: Number(fam.vehicle.number_of_motorcycles) || 0,
                motorcyclePlateNumber: fam.vehicle.motorcycle_plate_numbers || null,
                numberOfVehicles: Number(fam.vehicle.number_of_other_vehicles) || 0,
                vehiclePlateNumber: fam.vehicle.vehicle_plate_numbers || null,
              },
            });
          }

          for (const m of fam.members ?? []) {
            const memberData = {
              lastName: m.last_name,
              firstName: m.first_name,
              middleName: m.middle_name || null,
              suffix: m.suffix || null,
              placeOfBirth: m.place_of_birth || null,
              dateOfBirth: m.date_of_birth ? new Date(m.date_of_birth) : null,
              sex: m.sex,
              civilStatus: m.civil_status || null,
              isVoter: m.is_voter === "Yes" || m.is_voter === true,
              isPwd: m.is_pwd === "Yes" || m.is_pwd === true,
              isSoloParent: m.is_solo_parent === "Yes" || m.is_solo_parent === true,
              occupationType: m.occupation || null,
              contactNumber: m.contact_number || null,
              studentType: m.is_student === "Yes" ? (m.education_level || "Student") : null,
              registeredAt: parseRegisteredAt(m.registered_at ?? head.registered_at),
            };

            const existingMember = await tx.resident.findFirst({
              where: {
                lastName: memberData.lastName,
                firstName: memberData.firstName,
                dateOfBirth: memberData.dateOfBirth,
              },
            });
            if (existingMember) {
              // Already registered (possibly in another family); never create a
              // duplicate or steal an existing link.
              skipped++;
              continue;
            }

            const memberResident = await tx.resident.create({ data: memberData });
            created++;
            await tx.familyMember.create({
              data: {
                familyId: family.id,
                residentId: memberResident.id,
                relationshipType: m.relationship,
              },
            });
          }

          return { created, skipped };
        });

        totalCreated += delta.created;
        totalSkipped += delta.skipped;
      } catch (err: any) {
        errors.push(`Family ${fam.head?.last_name ?? "unknown"}: ${err.message}`);
      }
    }

    // Log batch import
    const userId = req.user?.id;
    if (userId) {
      await logAction(
        "residents",
        "batch-import",
        userId,
        "CREATE",
        null,
        `Batch import: ${totalCreated} created, ${totalSkipped} skipped, ${errors.length} errors`
      );
    }

    res.json({
      created: totalCreated,
      skipped: totalSkipped,
      families: families.length,
      errors,
    });
  } catch (err) {
    next(err);
  }
}
