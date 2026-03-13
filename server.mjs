import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.join(__dirname, "dist");
const indexFile = path.join(distDir, "index.html");

const app = express();
const port = Number(process.env.PORT || 10000);

app.use(
  express.static(distDir, {
    index: false,
    maxAge: "1h",
  }),
);

// React Router fallback for direct navigation.
app.use((_req, res) => {
  res.sendFile(indexFile);
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Supetz web service listening on port ${port}`);
});
