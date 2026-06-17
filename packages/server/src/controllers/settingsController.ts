import type { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { prisma, Prisma } from "@rbi/db";

const DEFAULT_SETTINGS = {
  slogan: "Serbisyong Tapat, Para sa Lahat",
  barangayName: "Barangay 418",
  municipality: "Manila City",
  province: "Metro Manila",
  telephone: "8921-1234",
  punongBarangay: "Juan Dela Cruz",
  councilor1: "Pedro Penduko",
  councilor2: "Maria Makiling",
  councilor3: "Jose Rizal",
  councilor4: "Andres Bonifacio",
  councilor5: "Emilio Aguinaldo",
  councilor6: "Gabriela Silang",
  councilor7: "Melchora Aquino",
  skChairman: "Kabataan Pagasa",
  treasurer: "Yaman Bayan",
  secretary: "Sulat Kamay",
  clearanceFee: "200",
  residencyFee: "150",
  businessFee: "500",
  ownershipFee: "300",
  purposes: [
    "Employment application",
    "School enrollment",
    "Legal documents",
    "Job application",
    "Scholarship application",
    "Housing program applications",
    "Business permit requirements",
  ],
};

export async function getSettings(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    let setting = await prisma.barangaySetting.findFirst();
    if (!setting) {
      setting = await prisma.barangaySetting.create({
        data: { data: DEFAULT_SETTINGS },
      });
    }
    res.json(setting.data);
  } catch (err) {
    next(err);
  }
}

export async function updateSettings(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    let setting = await prisma.barangaySetting.findFirst();
    if (setting) {
      await prisma.barangaySetting.update({
        where: { id: setting.id },
        data: { data: req.body },
      });
    } else {
      await prisma.barangaySetting.create({
        data: { data: req.body },
      });
    }
    res.json(req.body);
  } catch (err) {
    next(err);
  }
}

export async function backupData(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const [setting, residents, families, households, blocks, users, documents, documentTypes] =
      await Promise.all([
        prisma.barangaySetting.findFirst(),
        prisma.resident.findMany(),
        prisma.family.findMany({
          include: { pet: true, vehicle: true, address: true, members: true },
        }),
        prisma.household.findMany(),
        prisma.block.findMany(),
        prisma.user.findMany({
          include: { userInfo: true },
        }),
        prisma.document.findMany({
          include: { documentType: true, signers: true },
        }),
        prisma.documentType.findMany(),
      ]);

    const backup = {
      version: 1,
      exportedAt: new Date().toISOString(),
      data: {
        settings: setting?.data ?? null,
        residents,
        families,
        households,
        blocks,
        users,
        documents,
        documentTypes,
      },
    };

    res.json(backup);
  } catch (err) {
    next(err);
  }
}

export async function restoreData(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { data } = req.body;
    if (!data) {
      return res.status(400).json({ error: "No backup data provided" });
    }

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Clear existing data in reverse dependency order
      await tx.documentSigner.deleteMany();
      await tx.order.deleteMany();
      await tx.document.deleteMany();
      await tx.documentType.deleteMany();
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

      // Restore blocks (strip auto-generated fields)
      if (data.blocks?.length) {
        for (const block of data.blocks) {
          await tx.block.create({
            data: { id: block.id, blockNumber: block.blockNumber },
          });
        }
      }

      // Restore households
      if (data.households?.length) {
        for (const h of data.households) {
          await tx.household.create({
            data: { id: h.id, brgyHouseholdNo: h.brgyHouseholdNo, blockId: h.blockId },
          });
        }
      }

      // Restore residents (strip relations and auto-fields)
      if (data.residents?.length) {
        for (const r of data.residents) {
          await tx.resident.create({
            data: {
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
            },
          });
        }
      }

      // Restore addresses
      const addressMap = new Map<string, string>();
      if (data.families?.length) {
        for (const family of data.families) {
          if (family.address) {
            const addr = family.address;
            const newAddr = await tx.address.create({
              data: { houseNo: addr.houseNo, streetName: addr.streetName, alleyName: addr.alleyName },
            });
            addressMap.set(addr.id, newAddr.id);
          }
        }
      }

      // Restore families
      if (data.families?.length) {
        for (const family of data.families) {
          const newAddressId = addressMap.get(family.addressId) ?? family.addressId;
          await tx.family.create({
            data: {
              id: family.id,
              familyName: family.familyName,
              isArchived: family.isArchived,
              householdId: family.householdId,
              headPersonId: family.headPersonId,
              addressId: newAddressId,
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
      }

      // Restore users
      if (data.users?.length) {
        const defaultPassword = await bcrypt.hash("changeme123", 10);
        for (const user of data.users) {
          await tx.user.create({
            data: {
              id: user.id,
              username: user.username,
              password: user.password || defaultPassword,
              roleType: user.roleType,
              isActive: user.isActive,
              permission: user.permission,
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
      }

      // Restore document types
      const docTypeMap = new Map<string, string>();
      if (data.documentTypes?.length) {
        for (const dt of data.documentTypes) {
          const newDt = await tx.documentType.create({
            data: { documentName: dt.documentName, amount: dt.amount },
          });
          docTypeMap.set(dt.id, newDt.id);
        }
      }

      // Restore documents
      if (data.documents?.length) {
        for (const doc of data.documents) {
          const newDocTypeId = docTypeMap.get(doc.documentTypeId) ?? doc.documentTypeId;
          await tx.document.create({
            data: {
              id: doc.id,
              issueDate: new Date(doc.issueDate),
              purpose: doc.purpose,
              validityPeriod: doc.validityPeriod,
              documentTypeId: newDocTypeId,
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
      }

      // Restore settings
      if (data.settings) {
        await tx.barangaySetting.create({ data: { data: data.settings } });
      }
    });

    res.json({ success: true, message: "Data restored successfully" });
  } catch (err: any) {
    console.error("Restore error:", err);
    res.status(500).json({ error: err?.message ?? "Restore failed" });
  }
}
