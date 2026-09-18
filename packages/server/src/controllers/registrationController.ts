import type { Request, Response, NextFunction } from "express";
import { prisma } from "@rbi/db";
import { logCreate } from "../services/auditService.js";
import { validateResident } from "../services/residentValidation.js";

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

    const hhNum = parseInt(String(household.brgyHouseholdNo), 10);
    if (isNaN(hhNum) || hhNum < 1 || hhNum > 100) {
      res.status(400).json({ error: "household.brgyHouseholdNo must be between 1 and 100" });
      return;
    }
    household.brgyHouseholdNo = String(hhNum).padStart(3, "0");

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

    const validationErrors: string[] = [];
    const validateAndNormalize = (person: any, label: string) => {
      const { errors, value } = validateResident(
        {
          firstName: person?.firstName,
          lastName: person?.lastName,
          middleName: person?.middleName,
          suffix: person?.suffix,
          placeOfBirth: person?.placeOfBirth,
          dateOfBirth: person?.dateOfBirth,
          sex: person?.sex,
          civilStatus: person?.civilStatus,
          occupation: person?.occupationType,
          educationLevel: person?.studentType,
          isVoter: person?.isVoter,
          isPwd: person?.isPwd,
          isSoloParent: person?.isSoloParent,
          isOwner: person?.isOwner,
          contactNumber: person?.contactNumber,
        },
        { requireCore: true }
      );
      for (const e of errors) validationErrors.push(`${label}: ${e}`);

      if (value.firstName !== undefined) person.firstName = value.firstName;
      if (value.lastName !== undefined) person.lastName = value.lastName;
      if (value.middleName !== undefined) person.middleName = value.middleName;
      if (value.suffix !== undefined) person.suffix = value.suffix;
      if (value.placeOfBirth !== undefined) person.placeOfBirth = value.placeOfBirth;
      if (value.dateOfBirth !== undefined) person.dateOfBirth = value.dateOfBirth;
      if (value.sex !== undefined) person.sex = value.sex;
      if (value.civilStatus !== undefined) person.civilStatus = value.civilStatus;
      if (value.occupation !== undefined) person.occupationType = value.occupation;
      if (value.educationLevel !== undefined) person.studentType = value.educationLevel;
      if (value.isVoter !== undefined) person.isVoter = value.isVoter;
      if (value.isPwd !== undefined) person.isPwd = value.isPwd;
      if (value.isSoloParent !== undefined) person.isSoloParent = value.isSoloParent;
      if (value.isOwner !== undefined) person.isOwner = value.isOwner;
      if (value.contactNumber !== undefined) person.contactNumber = value.contactNumber;
    };

    validateAndNormalize(head, "Head");
    (familyMembers ?? []).forEach((m: any, i: number) =>
      validateAndNormalize(m, `Member ${i + 1}`)
    );

    if (validationErrors.length > 0) {
      res.status(400).json({ error: validationErrors.join("; ") });
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

      let createdHousehold = await tx.household.findFirst({
        where: {
          blockId: block.id,
          brgyHouseholdNo: household.brgyHouseholdNo,
        },
      });
      if (!createdHousehold) {
        createdHousehold = await tx.household.create({
          data: {
            brgyHouseholdNo: household.brgyHouseholdNo,
            blockId: block.id,
          },
        });
      }

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

    const userId = req.user?.id;
    if (userId) {
      await logCreate("families", result.familyDisplayId.toString(), userId, {
        familyName: head.lastName,
        householdNo: household.brgyHouseholdNo,
      });
    }

    res.status(201).json(result);
  } catch (err: any) {
    if (err?.message?.includes("family member requires")) {
      res.status(400).json({ error: err.message });
      return;
    }
    next(err);
  }
}
