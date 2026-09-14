process.env.JWT_SECRET = "test-jwt-secret";
process.env.DATABASE_URL =
  process.env.DATABASE_URL ?? "mysql://root@localhost:3306/rbi_test";
