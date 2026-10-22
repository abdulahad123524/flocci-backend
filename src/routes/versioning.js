const express = require("express");
const router = express.Router();
const {
  getBucketVersioning,
  setBucketVersioning,
  getObjectVersions,
} = require("../controller/versioning");

router.get("/bucket-versioning", getBucketVersioning);
router.post("/bucket-versioning", setBucketVersioning);
router.get("/object-versions", getObjectVersions);
module.exports = router;
