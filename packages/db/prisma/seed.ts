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

  console.log("\nSeed complete.");
  console.log(`QA account -> username: ${QA_USERNAME}  password: ${QA_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
