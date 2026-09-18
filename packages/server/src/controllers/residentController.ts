import type { Request, Response, NextFunction } from "express";
import { prisma, Prisma } from "@rbi/db";
import { logUpdate, logArchive, logAction } from "../services/auditService.js";
import { buildResidentSearchWhere } from "../services/residentSearch.js";
import { validateFamilyImportRow } from "../services/familyImportValidation.js";
import { validateResident } from "../services/residentValidation.js";

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
            household: { include: { block: true } },
            address: true,
          },
        },
        familyMember: {
          include: {
            family: {
              include: {
                headPerson: true,
                household: { include: { block: true } },
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
        blockNumber: family.household?.block?.blockNumber ?? "",
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
    familyDisplayId: family?.displayId ?? null,
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

    const { errors: validationErrors, value: normalized } = validateResident({
      firstName: body.firstName,
      lastName: body.lastName,
      middleName: body.middleName,
      suffix: body.suffix,
      placeOfBirth: body.placeOfBirth,
      dateOfBirth: body.dateOfBirth,
      sex: body.sex,
      civilStatus: body.civilStatus,
      occupation: body.occupation,
      educationLevel: body.studentType,
      isVoter: body.isVoter,
      isPwd: body.isPwd,
      isSoloParent: body.isSoloParent,
      isOwner: body.isOwner,
      contactNumber: body.contactNumber,
    });
    // A provided-but-blank required name is an attempt to clear it.
    if (body.firstName !== undefined && !normalized.firstName) {
      validationErrors.push("First name is required");
    }
    if (body.lastName !== undefined && !normalized.lastName) {
      validationErrors.push("Last name is required");
    }
    if (validationErrors.length > 0) {
      return res.status(400).json({ error: validationErrors.join("; ") });
    }

    const dbData: Record<string, unknown> = {};

    const directFields = [
      "firstName", "lastName", "middleName", "suffix",
      "placeOfBirth", "civilStatus", "contactNumber", "profileImage",
    ] as const;
    for (const f of directFields) {
      if (body[f] !== undefined) dbData[f] = normalized[f] ?? body[f];
    }

    if (body.dateOfBirth !== undefined) {
      dbData.dateOfBirth = body.dateOfBirth
        ? (normalized.dateOfBirth ?? new Date(body.dateOfBirth))
        : null;
    }
    if (body.sex !== undefined) dbData.sex = normalized.sex ?? body.sex;
    if (body.occupation !== undefined) {
      dbData.occupationType = normalized.occupation ?? body.occupation;
    }
    if (body.studentType !== undefined) {
      dbData.studentType = normalized.educationLevel ?? body.studentType;
    }
    if (body.isVoter !== undefined) dbData.isVoter = normalized.isVoter ?? body.isVoter;
    if (body.isPwd !== undefined) dbData.isPwd = normalized.isPwd ?? body.isPwd;
    if (body.isSoloParent !== undefined) {
      dbData.isSoloParent = normalized.isSoloParent ?? body.isSoloParent;
    }
    if (body.isOwner !== undefined) dbData.isOwner = normalized.isOwner ?? body.isOwner;

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

      const headRow = fam.head ?? {};
      const headValidation = validateResident(
        {
          firstName: headRow.first_name,
          lastName: headRow.last_name,
          middleName: headRow.middle_name,
          suffix: headRow.suffix,
          placeOfBirth: headRow.place_of_birth,
          dateOfBirth: headRow.date_of_birth,
          sex: headRow.sex,
          civilStatus: headRow.civil_status,
          occupation: headRow.occupation,
          educationLevel: headRow.education_level,
          isStudent: headRow.is_student === "Yes" || headRow.is_student === true,
          isVoter: headRow.is_voter,
          isPwd: headRow.is_pwd,
          isSoloParent: headRow.is_solo_parent,
          isOwner: headRow.is_owner,
          contactNumber: headRow.contact_number,
        },
        { requireCore: true }
      );
      const memberValidations = ((fam.members ?? []) as any[]).map(
        (m: any, index: number) => ({
          row: m,
          index,
          result: validateResident(
            {
              firstName: m.first_name,
              lastName: m.last_name,
              middleName: m.middle_name,
              suffix: m.suffix,
              placeOfBirth: m.place_of_birth,
              dateOfBirth: m.date_of_birth,
              sex: m.sex,
              civilStatus: m.civil_status,
              occupation: m.occupation,
              educationLevel: m.education_level,
              isStudent: m.is_student === "Yes" || m.is_student === true,
              isVoter: m.is_voter,
              isPwd: m.is_pwd,
              isSoloParent: m.is_solo_parent,
              contactNumber: m.contact_number,
            },
            { requireCore: true }
          ),
        })
      );

      const rowErrors = [
        ...headValidation.errors.map((e) => `Head: ${e}`),
        ...memberValidations.flatMap((mv) =>
          mv.result.errors.map((e) => `Member ${mv.index + 1}: ${e}`)
        ),
      ];
      if (rowErrors.length > 0) {
        errors.push(
          `Family ${headRow.last_name ?? "unknown"}: ${rowErrors.join("; ")}`
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

          const hhParsed = parseInt(
            String(fam.household?.household_number ?? ""),
            10
          );
          const hhNum = String(hhParsed).padStart(3, "0");
          let createdHousehold = await tx.household.findFirst({
            where: { blockId: block.id, brgyHouseholdNo: hhNum },
          });
          if (!createdHousehold) {
            createdHousehold = await tx.household.create({
              data: { brgyHouseholdNo: hhNum, blockId: block.id },
            });
          }

          const hv = headValidation.value;
          const headData = {
            lastName: hv.lastName as string,
            firstName: hv.firstName as string,
            middleName: (hv.middleName as string) ?? null,
            suffix: (hv.suffix as string) ?? null,
            placeOfBirth: (hv.placeOfBirth as string) ?? null,
            dateOfBirth: (hv.dateOfBirth as Date) ?? null,
            sex: hv.sex as "Male" | "Female",
            civilStatus: (hv.civilStatus as string) ?? null,
            isVoter: hv.isVoter === true,
            isPwd: hv.isPwd === true,
            isSoloParent: hv.isSoloParent === true,
            isOwner: hv.isOwner === true,
            occupationType: (hv.occupation as string) ?? null,
            contactNumber: (hv.contactNumber as string) ?? null,
            studentType:
              hv.isStudent === true
                ? ((hv.educationLevel as string) ?? null)
                : null,
            registeredAt: parseRegisteredAt(headRow.registered_at),
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

          for (const mv of memberValidations) {
            const m = mv.row;
            const v = mv.result.value;
            const memberData = {
              lastName: v.lastName as string,
              firstName: v.firstName as string,
              middleName: (v.middleName as string) ?? null,
              suffix: (v.suffix as string) ?? null,
              placeOfBirth: (v.placeOfBirth as string) ?? null,
              dateOfBirth: (v.dateOfBirth as Date) ?? null,
              sex: v.sex as "Male" | "Female",
              civilStatus: (v.civilStatus as string) ?? null,
              isVoter: v.isVoter === true,
              isPwd: v.isPwd === true,
              isSoloParent: v.isSoloParent === true,
              occupationType: (v.occupation as string) ?? null,
              contactNumber: (v.contactNumber as string) ?? null,
              studentType:
                v.isStudent === true
                  ? ((v.educationLevel as string) ?? null)
                  : null,
              registeredAt: parseRegisteredAt(
                m.registered_at ?? headRow.registered_at
              ),
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
