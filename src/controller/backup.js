const backupService = require("../services/s3-backup");

// 1. Create a backup of the source bucket
const backupBucket = async (req, res) => {
  try {
    const { sourceBucketName } = req.body || {};

    if (typeof sourceBucketName !== "string" || !sourceBucketName.trim()) {
      return res.status(400).json({
        message: "sourceBucketName is required",
      });
    }

    const result = await backupService.backupBucket(sourceBucketName.trim());

    return res.status(result.status === "completed" ? 200 : 207).json(result);
  } catch (error) {
    console.error("S3 backup error:", error);

    return res.status(500).json({
      message: error.message || "S3 backup failed",
    });
  }
};

// 2. Get backup history for a source bucket
const getBucketBackups = async (req, res) => {
  try {
    const { sourceBucketName } = req.params;

    if (typeof sourceBucketName !== "string" || !sourceBucketName.trim()) {
      return res.status(400).json({
        message: "sourceBucketName is required",
      });
    }

    const backups = await backupService.listAllObjects(sourceBucketName.trim());

    return res.status(200).json({
      sourceBucketName: sourceBucketName.trim(),
      total: backups.length,
      backups,
    });
  } catch (error) {
    console.error("Get bucket backups error:", error.stack || error);

    return res.status(500).json({
      message: error.message || "Failed to get backup history",
    });
  }
};

// 3. Ensure the backup bucket exists
const ensureBackupBucket = async (req, res) => {
  try {
    const result = await backupService.ensureBackupBucket();

    return res.status(200).json({
      message: "Backup bucket is ready",
      ...result,
    });
  } catch (error) {
    console.error("Ensure backup bucket error:", error);

    return res.status(500).json({
      message: error.message || "Failed to initialize backup bucket",
    });
  }
};

module.exports = {
  backupBucket,
  getBucketBackups,
  ensureBackupBucket,
};
