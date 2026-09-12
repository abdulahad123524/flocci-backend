const bucketService = require("../services/s3-bucket");

const listBuckets = async (req, res) => {
  try {
    const buckets = await bucketService.listBuckets();
    res.json({ buckets });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createBucket = async (req, res) => {
  try {
    const { bucketName } = req.body;
    if (!bucketName) {
      return res.status(400).json({ message: "bucketName is required" });
    }
    const result = await bucketService.createBucket(bucketName);
    if (result.exists) {
      return res
        .status(409)
        .json({ message: "Bucket already exists", bucketName });
    }
    res
      .status(200)
      .json({ message: "Bucket created successfully", bucketName });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteBucket = async (req, res) => {
  try {
    const { bucketName } = req.body;
    if (!bucketName) {
      return res.status(400).json({ message: "bucketName is required" });
    }
    await bucketService.deleteBucket(bucketName);
    res
      .status(200)
      .json({ message: "Bucket deleted successfully", bucketName });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const headBucket = async (req, res) => {
  try {
    const { bucketName } = req.body;
    if (!bucketName) {
      return res.status(400).json({ message: "bucketName is required" });
    }
    await bucketService.headBucket(bucketName);
    res.status(200).json({ message: "Bucket exists" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const copyBucket = async (req, res) => {
  try {
    const { sourceBucketName, targetBucketName, key } = req.body;
    if (!sourceBucketName || !targetBucketName) {
      return res.status(400).json({
        message: "sourceBucketName and targetBucketName are required",
      });
    }
    const result = await bucketService.copyBucket(
      sourceBucketName,
      targetBucketName,
      key,
    );
    res.status(200).json({
      message: "Bucket copied successfully",
      sourceBucketName,
      targetBucketName,
      copied: result.copied,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  listBuckets,
  createBucket,
  deleteBucket,
  headBucket,
  copyBucket,
};
