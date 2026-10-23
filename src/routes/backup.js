const express = require("express");
const {
  backupBucket,
  ensureBackupBucket,
  getBucketBackups,
} = require("../controller/backup");

const router = express.Router();

router.post("/backup/bucket", backupBucket);
router.get("/backup/bucket/:sourceBucketName", getBucketBackups);
router.post("/backup/initialize", ensureBackupBucket);

module.exports = router;
