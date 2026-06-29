import type { Request, Response, NextFunction } from "express";
import { prisma, Prisma } from "@rbi/db";
import { logCreate, logUpdate, logArchive } from "../services/auditService.js";

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
      const searchOr: Prisma.ResidentWhereInput[] = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
      ];
      const parsed = parseInt(search);
      if (!isNaN(parsed)) {
        searchOr.push({ displayId: { equals: parsed } });
      }
      andClauses.push({ OR: searchOr });
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
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));

    res.json({ data, meta: { page, pageSize, total, totalPages } });
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

export async function createResident(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user?.id;
    const data = { ...req.body };
    delete data.displayId;
    delete data.display_id;
    if (data.dateOfBirth) data.dateOfBirth = new Date(data.dateOfBirth);
    const resident = await prisma.resident.create({ data });

    if (userId) {
      await logCreate("residents", resident.id, userId, {
        firstName: resident.firstName,
        lastName: resident.lastName,
        sex: resident.sex,
      });
    }

    res.status(201).json(resident);
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
    const { families, duplicateAction = "skip" } = req.body;

    if (!Array.isArray(families) || families.length === 0) {
      res.status(400).json({ error: "families array is required" });
      return;
    }

    let totalCreated = 0;
    let totalUpdated = 0;
    let totalSkipped = 0;
    const errors: string[] = [];

    for (const fam of families) {
      try {
        await prisma.$transaction(async (tx) => {
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

          let createdAddress = await tx.address.findFirst({
            where: {
              houseNo: fam.address?.house_number ?? "",
              streetName: fam.address?.street_name ?? "",
              alleyName: fam.address?.alley ?? "",
            },
          });
          if (!createdAddress) {
            createdAddress = await tx.address.create({
              data: {
                houseNo: fam.address?.house_number ?? "",
                streetName: fam.address?.street_name ?? "",
                alleyName: fam.address?.alley ?? "",
              },
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
          };

          const existingHead = await tx.resident.findFirst({
            where: {
              lastName: headData.lastName,
              firstName: headData.firstName,
              dateOfBirth: headData.dateOfBirth,
            },
          });

          let headResident;
          if (existingHead) {
            if (duplicateAction === "overwrite") {
              headResident = await tx.resident.update({
                where: { id: existingHead.id },
                data: headData,
              });
              totalUpdated++;
            } else {
              totalSkipped++;
              return;
            }
          } else {
            headResident = await tx.resident.create({ data: headData });
            totalCreated++;
          }

          let family = await tx.family.findFirst({
            where: { headPersonId: headResident.id },
          });
          if (family) {
            family = await tx.family.update({
              where: { id: family.id },
              data: {
                familyName: headData.lastName,
                householdId: createdHousehold.id,
                addressId: createdAddress.id,
              },
            });
          } else {
            family = await tx.family.create({
              data: {
                familyName: headData.lastName,
                householdId: createdHousehold.id,
                headPersonId: headResident.id,
                addressId: createdAddress.id,
              },
            });
          }

          // Delete existing pet/vehicle/members for overwrite
          await tx.familyPet.deleteMany({ where: { familyId: family.id } });
          await tx.familyVehicle.deleteMany({ where: { familyId: family.id } });
          await tx.familyMember.deleteMany({ where: { familyId: family.id } });

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

          const members = fam.members ?? [];
          for (const m of members) {
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
            };

            const existingMember = await tx.resident.findFirst({
              where: {
                lastName: memberData.lastName,
                firstName: memberData.firstName,
                dateOfBirth: memberData.dateOfBirth,
              },
            });

            let memberResident;
            if (existingMember) {
              if (duplicateAction === "overwrite") {
                memberResident = await tx.resident.update({
                  where: { id: existingMember.id },
                  data: memberData,
                });
                totalUpdated++;
              } else {
                totalSkipped++;
                continue;
              }
            } else {
              memberResident = await tx.resident.create({ data: memberData });
              totalCreated++;
            }

            await tx.familyMember.create({
              data: {
                familyId: family.id,
                residentId: memberResident.id,
                relationshipType: m.relationship,
              },
            });
          }
        });
      } catch (err: any) {
        errors.push(`Family ${fam.head?.last_name ?? "unknown"}: ${err.message}`);
      }
    }

    res.json({
      created: totalCreated,
      updated: totalUpdated,
      skipped: totalSkipped,
      families: families.length,
      errors,
    });
  } catch (err) {
    next(err);
  }
}
