import "dotenv/config";
import express from "express";
import cors from "cors";
import { residentRouter } from "./routes/residents.js";
import { householdRouter } from "./routes/households.js";
import { documentRouter } from "./routes/documents.js";
import { userRouter } from "./routes/users.js";
import { activityLogRouter } from "./routes/activityLogs.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();
const PORT = process.env.PORT ?? 4000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/residents", residentRouter);
app.use("/api/households", householdRouter);
app.use("/api/documents", documentRouter);
app.use("/api/users", userRouter);
app.use("/api/activity-logs", activityLogRouter);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
