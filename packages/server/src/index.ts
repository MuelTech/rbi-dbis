import "dotenv/config";
import express from "express";
import cors from "cors";
import { authRouter } from "./routes/auth.js";
import { requireAuth } from "./middleware/auth.js";
import { residentRouter } from "./routes/residents.js";
import { householdRouter } from "./routes/households.js";
import { documentRouter } from "./routes/documents.js";
import { userRouter } from "./routes/users.js";
import { activityLogRouter } from "./routes/activityLogs.js";
import { registrationRouter } from "./routes/registrations.js";
import { familyRouter } from "./routes/families.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();
const HOST = process.env.HOST ?? "0.0.0.0";
const PORT = process.env.PORT ?? 4000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRouter);

app.use("/api/residents", requireAuth, residentRouter);
app.use("/api/households", requireAuth, householdRouter);
app.use("/api/documents", requireAuth, documentRouter);
app.use("/api/users", requireAuth, userRouter);
app.use("/api/activity-logs", requireAuth, activityLogRouter);
app.use("/api/resident-registrations", requireAuth, registrationRouter);
app.use("/api/families", requireAuth, familyRouter);

app.use(errorHandler);

app.listen(Number(PORT), HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});
