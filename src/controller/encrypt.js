const encryptService = require("../services/s3-encrypt");

const encryptBucket = async (req, res) => {
  try {
    const { bucketName, algorithm } = req.body || {};
    if (!bucketName) {
      return res.status(400).json({ message: "bucketName is required" });
    }
    const result = await encryptService.encryptBucket(
      bucketName,
      algorithm || "AES256",
    );
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getBucketEncryption = async (req, res) => {
  try {
    const bucketName = req.query.bucketName || req.body?.bucketName;
    if (!bucketName) {
      return res.status(400).json({ message: "bucketName is required" });
    }
    const result = await encryptService.getBucketEncryption(bucketName);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteBucketEncryption = async (req, res) => {
  try {
    const bucketName = req.body?.bucketName || req.query.bucketName;
    if (!bucketName) {
      return res.status(400).json({ message: "bucketName is required" });
    }
    const result = await encryptService.deleteBucketEncryption(bucketName);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  encryptBucket,
  getBucketEncryption,
  deleteBucketEncryption,
};
