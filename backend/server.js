import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { runResearch } from "./graph/agent.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000"
}));

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/research", async (req, res) => {
  const company = req.query.company?.trim();

  if (!company) {
    return res.status(400).json({ error: "Company name is required" });
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  const send = (event, data) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  send("connected", { company, message: "Starting research..." });

  try {
    await runResearch(company, (update) => {
      if (update.status === "running") {
        send("stage_start", { stage: update.stage });
      } else if (update.status === "done") {
        send("stage_done", { stage: update.stage, result: update.data });
      } else if (update.status === "error") {
        send("stage_error", { stage: update.stage, error: update.data.message });
      }
    });

    send("complete", { message: "Done" });
  } catch (err) {
    send("error", { message: err.message || "Something went wrong" });
  } finally {
    res.end();
  }
});

app.listen(port, () => {
  console.log(`Backend running on http://localhost:${port}`);
  console.log(`Gemini key: ${process.env.GEMINI_API_KEY ? "loaded" : "MISSING"}`);
});