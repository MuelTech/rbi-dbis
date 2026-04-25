import type { Request, Response, NextFunction } from "express";
import { prisma } from "@rbi/db";

function computeAge(dateOfBirth: Date | null): number {
  if (!dateOfBirth) return 0;
  const today = new Date();
  let age = today.getFullYear() - dateOfBirth.getFullYear();
  const m = today.getMonth() - dateOfBirth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dateOfBirth.getDate())) age--;
  return age;
}

const STATUS_MAP_TO_UI: Record<string, string> = {
  Alive: "Active",
  Deceased: "Deceased",
  MovedOut: "Move out",
};

async function buildFamilyDetail(familyId: string) {
  const family = await prisma.family.findUnique({
    where: { id: familyId },
    include: {
      household: true,
      headPerson: true,
      address: true,
      pet: true,
      vehicle: true,
      members: {
        include: {
          resident: true,
        },
      },
    },
  });

  if (!family) return null;

  const head = family.headPerson;

  return {
    id: family.id,
    displayId: family.displayId,
    familyName: family.familyName,
    household: {
      id: family.household.id,
      brgyHouseholdNo: family.household.brgyHouseholdNo,
    },
    familyHead: {
      id: head.id,
      displayId: head.displayId,
      firstName: head.firstName,
      lastName: head.lastName,
      fullName: `${head.lastName}, ${head.firstName}${head.suffix ? ` ${head.suffix}` : ""}`,
      isVoter: head.isVoter,
      status: STATUS_MAP_TO_UI[head.statusType] ?? "Active",
    },
    address: {
      houseNo: family.address.houseNo,
      streetName: family.address.streetName,
      alleyName: family.address.alleyName,
    },
    pet: family.pet
      ? {
          numberOfCats: family.pet.numberOfCats,
          numberOfDogs: family.pet.numberOfDogs,
          others: family.pet.others ?? "",
        }
      : { numberOfCats: 0, numberOfDogs: 0, others: "" },
    vehicle: family.vehicle
      ? {
          numberOfMotorcycles: family.vehicle.numberOfMotorcycles,
          motorcyclePlateNumber: family.vehicle.motorcyclePlateNumber ?? "",
          numberOfVehicles: family.vehicle.numberOfVehicles,
          vehiclePlateNumber: family.vehicle.vehiclePlateNumber ?? "",
        }
      : {
          numberOfMotorcycles: 0,
          motorcyclePlateNumber: "",
          numberOfVehicles: 0,
          vehiclePlateNumber: "",
        },
    members: [
      {
        id: head.id,
        displayId: head.displayId,
        lastName: head.lastName,
        firstName: head.firstName,
        sex: head.sex,
        age: computeAge(head.dateOfBirth),
        voter: head.isVoter ? "Yes" : "No",
        status: STATUS_MAP_TO_UI[head.statusType] ?? "Active",
      },
      ...family.members.map((m) => ({
        id: m.resident.id,
        displayId: m.resident.displayId,
        lastName: m.resident.lastName,
        firstName: m.resident.firstName,
        sex: m.resident.sex,
        age: computeAge(m.resident.dateOfBirth),
        voter: m.resident.isVoter ? "Yes" : "No",
        status: STATUS_MAP_TO_UI[m.resident.statusType] ?? "Active",
      })),
    ],
  };
}

export async function getFamilyById(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const detail = await buildFamilyDetail(req.params.familyId as string);
    if (!detail) return res.status(404).json({ error: "Family not found" });
    res.json(detail);
  } catch (err) {
    next(err);
  }
}

export async function updateFamily(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const familyId = req.params.familyId as string;

    const family = await prisma.family.findUnique({
      where: { id: familyId },
      select: { id: true, addressId: true, pet: { select: { id: true } }, vehicle: { select: { id: true } } },
    });

    if (!family) return res.status(404).json({ error: "Family not found" });

    const { address, pet, vehicle } = req.body;

    await prisma.$transaction(async (tx) => {
      if (address) {
        await tx.address.update({
          where: { id: family.addressId },
          data: {
            houseNo: address.houseNo,
            streetName: address.streetName,
            alleyName: address.alleyName,
          },
        });
      }

      if (pet) {
        const hasPetData =
          pet.numberOfCats > 0 || pet.numberOfDogs > 0 || (pet.others && pet.others.trim() !== "");

        await tx.familyPet.upsert({
          where: { familyId },
          create: {
            familyId,
            isPetOwner: hasPetData,
            numberOfCats: pet.numberOfCats ?? 0,
            numberOfDogs: pet.numberOfDogs ?? 0,
            others: pet.others ?? null,
          },
          update: {
            isPetOwner: hasPetData,
            numberOfCats: pet.numberOfCats ?? 0,
            numberOfDogs: pet.numberOfDogs ?? 0,
            others: pet.others ?? null,
          },
        });
      }

      if (vehicle) {
        await tx.familyVehicle.upsert({
          where: { familyId },
          create: {
            familyId,
            numberOfMotorcycles: vehicle.numberOfMotorcycles ?? 0,
            motorcyclePlateNumber: vehicle.motorcyclePlateNumber ?? null,
            numberOfVehicles: vehicle.numberOfVehicles ?? 0,
            vehiclePlateNumber: vehicle.vehiclePlateNumber ?? null,
          },
          update: {
            numberOfMotorcycles: vehicle.numberOfMotorcycles ?? 0,
            motorcyclePlateNumber: vehicle.motorcyclePlateNumber ?? null,
            numberOfVehicles: vehicle.numberOfVehicles ?? 0,
            vehiclePlateNumber: vehicle.vehiclePlateNumber ?? null,
          },
        });
      }
    });

    const detail = await buildFamilyDetail(familyId);
    res.json(detail);
  } catch (err) {
    next(err);
  }
}
