const express = require("express");
const router = express.Router();
const {
  getBlockAccess,
  setBlockAccess,
  deleteBlockAccess,
} = require("../controller/blockaccess");

router.get("/bucket-block-access", getBlockAccess);
router.put("/bucket-block-access", setBlockAccess);
router.delete("/bucket-block-access", deleteBlockAccess);

module.exports = router;
