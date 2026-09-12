const express = require("express");
const router = express.Router();
const {
  getBucketVersioning,
  setBucketVersioning,
} = require("../controller/versioning");

router.get("/bucket-versioning", getBucketVersioning);
router.post("/bucket-versioning", setBucketVersioning);

module.exports = router;
