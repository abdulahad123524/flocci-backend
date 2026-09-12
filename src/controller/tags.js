const tagService = require("../services/s3-tags");

const getBucketTags = async (req, res) => {
  try {
    const bucketName = req.query.bucketName;
    if (!bucketName) {
      return res.status(400).json({ message: "bucketName is required" });
    }
    const result = await tagService.getBucketTags(bucketName);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const tagsBucket = async (req, res) => {
  try {
    const { bucketName, tags } = req.body || {};
    if (!bucketName) {
      return res.status(400).json({ message: "bucketName is required" });
    }
    if (!Array.isArray(tags)) {
      return res.status(400).json({ message: "tags array is required" });
    }
    const result = await tagService.tagsBucket(bucketName, tags);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getBucketTags,
  tagsBucket,
};
