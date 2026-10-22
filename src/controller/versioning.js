const bucketService = require("../services/s3-bucket");
const getBucketVersioning = async (req, res) => {
  try {
    const bucketName = req.query.bucketName;
    if (!bucketName) {
      return res.status(400).json({ message: "bucketName is required" });
    }
    const result = await bucketService.getbucketVersioning(bucketName);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const setBucketVersioning = async (req, res) => {
  try {
    const { bucketName, status } = req.body;
    if (!bucketName) {
      return res.status(400).json({ message: "bucketName is required" });
    }
    const result = await bucketService.setbucketVersioning(
      bucketName,
      status || "Enabled",
    );
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getObjectVersions = async (req, res) => {
  try {
    const { bucketName, key } = req.query;

    if (!bucketName || !key) {
      return res.status(400).json({
        message: "bucketName and key are required",
      });
    }

    const versions = await bucketService.getObjectVersions(bucketName, key);

    return res.status(200).json({
      message: "Object versions fetched successfully",
      bucketName,
      key,
      count: versions.length,
      versions,
    });
  } catch (error) {
    console.error("Get object versions error:", error);

    return res.status(500).json({
      message: error.message || "Failed to fetch object versions",
    });
  }
};

module.exports = {
  getBucketVersioning,
  setBucketVersioning,
  getObjectVersions,
};
