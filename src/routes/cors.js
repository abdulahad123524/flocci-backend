const express = require("express");
const router = express.Router();
const {
  corsBucket,
  getCorsBucket,
  deleteCorsBucket,
} = require("../controller/cors");

router.put("/bucket-cors", corsBucket);
router.get("/bucket-cors", getCorsBucket);
router.delete("/bucket-cors", deleteCorsBucket);

module.exports = router;
