import express from "express";

const app = express();
app.use(express.json());

app.get("/health", (_req, res) => res.json({ service: "payments-service", status: "ok" }));

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => console.log(`payments-service listening on :${PORT}`));
