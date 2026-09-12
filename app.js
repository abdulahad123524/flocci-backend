require("dotenv").config();
const express = require("express");
const cors = require("cors");
const router = require("./src/routes/route");

const app = express();

app.use(cors());
app.use(express.json({ limit: "25mb" }));
app.use("/api", router);

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});

module.exports = app;
