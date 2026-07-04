import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

const QA_USERNAME = "qa_admin";
const QA_PASSWORD = "Rbi#QA2026!xK9m";

async function main() {
  console.log("Seeding users...");

  const users = [
    {
      username: "admin",
      password: "Admin@418!",
      roleType: "SuperAdmin",
      permission: "Full Access",
      info: { firstName: "Admin", lastName: "User", phoneNumber: "0912-345-6789" },
    },
    {
      username: "johndoe",
      password: "John#2026!",
      roleType: "Admin",
      permission: "Document Access",
      info: { firstName: "John", lastName: "Doe", phoneNumber: "0912-345-6789" },
    },
    {
      username: QA_USERNAME,
      password: QA_PASSWORD,
      roleType: "SuperAdmin",
      permission: "Full Access",
      info: { firstName: "QA", lastName: "Tester", phoneNumber: "0900-000-0000" },
    },
  ];

  for (const u of users) {
    const hashed = await bcrypt.hash(u.password, SALT_ROUNDS);
    const user = await prisma.user.upsert({
      where: { username: u.username },
      update: { password: hashed, roleType: u.roleType, permission: u.permission },
      create: {
        username: u.username,
        password: hashed,
        roleType: u.roleType,
        permission: u.permission,
        isActive: true,
      },
    });

    await prisma.userInfo.upsert({
      where: { userId: user.id },
      update: { ...u.info },
      create: { ...u.info, userId: user.id },
    });

    console.log(`  Upserted user: ${u.username} (displayId: ${user.displayId})`);
  }

  console.log("\nSeeding document types...");

  const documentTypes = [
    { documentName: "Barangay Business Clearance", amount: 500 },
    { documentName: "Business Permit", amount: 500 },
    { documentName: "Certificate of Indigency", amount: 0 },
    { documentName: "Barangay Clearance", amount: 200 },
    { documentName: "Certificate of Residency", amount: 150 },
  ];

  for (const dt of documentTypes) {
    const existing = await prisma.documentType.findFirst({
      where: { documentName: dt.documentName },
    });

    if (existing) {
      await prisma.documentType.update({
        where: { id: existing.id },
        data: { amount: dt.amount },
      });
    } else {
      await prisma.documentType.create({
        data: {
          documentName: dt.documentName,
          amount: dt.amount,
        },
      });
    }
    console.log(`  Upserted document type: ${dt.documentName}`);
  }

  console.log("\nSeed complete.");
  console.log(`QA account -> username: ${QA_USERNAME}  password: ${QA_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
