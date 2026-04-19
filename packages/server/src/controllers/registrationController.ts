import type { Request, Response, NextFunction } from "express";
import { prisma } from "@rbi/db";

export async function registerFamily(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { household, address, head, pet, vehicle, familyMembers } = req.body;

    if (!household?.blockNumber || !household?.brgyHouseholdNo) {
      res.status(400).json({ error: "household.blockNumber and household.brgyHouseholdNo are required" });
      return;
    }
    if (!address?.houseNo || !address?.streetName || !address?.alleyName) {
      res.status(400).json({ error: "address.houseNo, address.streetName, and address.alleyName are required" });
      return;
    }
    if (!head?.lastName || !head?.firstName || !head?.sex) {
      res.status(400).json({ error: "head.lastName, head.firstName, and head.sex are required" });
      return;
    }
    if (familyMembers && !Array.isArray(familyMembers)) {
      res.status(400).json({ error: "familyMembers must be an array" });
      return;
    }

    const result = await prisma.$transaction(async (tx) => {
      let block = await tx.block.findFirst({
        where: { blockNumber: household.blockNumber },
      });
      if (!block) {
        block = await tx.block.create({
          data: { blockNumber: household.blockNumber },
        });
      }

      const createdHousehold = await tx.household.create({
        data: {
          brgyHouseholdNo: household.brgyHouseholdNo,
          blockId: block.id,
        },
      });

      const createdAddress = await tx.address.create({
        data: {
          houseNo: address.houseNo,
          streetName: address.streetName,
          alleyName: address.alleyName,
        },
      });

      const headResident = await tx.resident.create({
        data: {
          lastName: head.lastName,
          firstName: head.firstName,
          middleName: head.middleName || null,
          suffix: head.suffix || null,
          placeOfBirth: head.placeOfBirth || null,
          dateOfBirth: head.dateOfBirth ? new Date(head.dateOfBirth) : null,
          sex: head.sex,
          civilStatus: head.civilStatus || null,
          isVoter: head.isVoter ?? false,
          isPwd: head.isPwd ?? false,
          isSoloParent: head.isSoloParent ?? false,
          isOwner: head.isOwner ?? false,
          occupationType: head.occupationType || null,
          contactNumber: head.contactNumber || null,
          studentType: head.studentType || null,
        },
      });

      const family = await tx.family.create({
        data: {
          familyName: head.lastName,
          householdId: createdHousehold.id,
          headPersonId: headResident.id,
          addressId: createdAddress.id,
        },
      });

      if (pet?.isPetOwner) {
        await tx.familyPet.create({
          data: {
            familyId: family.id,
            isPetOwner: true,
            numberOfDogs: Number(pet.numberOfDogs) || 0,
            numberOfCats: Number(pet.numberOfCats) || 0,
            others: pet.others || null,
          },
        });
      }

      if (
        vehicle &&
        (Number(vehicle.numberOfMotorcycles) > 0 ||
          Number(vehicle.numberOfVehicles) > 0)
      ) {
        await tx.familyVehicle.create({
          data: {
            familyId: family.id,
            numberOfMotorcycles: Number(vehicle.numberOfMotorcycles) || 0,
            motorcyclePlateNumber: vehicle.motorcyclePlateNumber || null,
            numberOfVehicles: Number(vehicle.numberOfVehicles) || 0,
            vehiclePlateNumber: vehicle.vehiclePlateNumber || null,
          },
        });
      }

      const members = familyMembers ?? [];
      for (const m of members) {
        if (!m.lastName || !m.firstName || !m.sex || !m.relationshipType) {
          throw new Error(
            `Each family member requires lastName, firstName, sex, and relationshipType`
          );
        }

        const memberResident = await tx.resident.create({
          data: {
            lastName: m.lastName,
            firstName: m.firstName,
            middleName: m.middleName || null,
            suffix: m.suffix || null,
            placeOfBirth: m.placeOfBirth || null,
            dateOfBirth: m.dateOfBirth ? new Date(m.dateOfBirth) : null,
            sex: m.sex,
            civilStatus: m.civilStatus || null,
            isVoter: m.isVoter ?? false,
            isPwd: m.isPwd ?? false,
            isSoloParent: m.isSoloParent ?? false,
            occupationType: m.occupationType || null,
            contactNumber: m.contactNumber || null,
            studentType: m.studentType || null,
          },
        });

        await tx.familyMember.create({
          data: {
            familyId: family.id,
            residentId: memberResident.id,
            relationshipType: m.relationshipType,
          },
        });
      }

      return {
        headDisplayId: headResident.displayId,
        familyDisplayId: family.displayId,
        householdDisplayId: createdHousehold.displayId,
        memberCount: members.length,
      };
    });

    res.status(201).json(result);
  } catch (err: any) {
    if (err?.message?.includes("family member requires")) {
      res.status(400).json({ error: err.message });
      return;
    }
    next(err);
  }
}
