const blockaccess = require("../services/s3-blockpolicy");

const readBucketName = (req) =>
  req.query.bucketName || req.body?.bucketName || req.params.bucketName;

const getBlockAccess = async (req, res) => {
  try {
    const bucketName = readBucketName(req);
    if (!bucketName) {
      return res.status(400).json({ message: "bucketName is required" });
    }
    const result = await blockaccess.getBlockPolicy(bucketName);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const setBlockAccess = async (req, res) => {
  try {
    const { bucketName, policy, blockAll, ...flags } = req.body || {};
    if (!bucketName) {
      return res.status(400).json({ message: "bucketName is required" });
    }
    const nextPolicy =
      blockAll === true
        ? blockaccess.BLOCK_ALL_POLICY
        : { ...flags, ...(policy || {}) };
    const result = await blockaccess.putBlockPolicy(bucketName, nextPolicy);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteBlockAccess = async (req, res) => {
  try {
    const bucketName = readBucketName(req);
    if (!bucketName) {
      return res.status(400).json({ message: "bucketName is required" });
    }
    const result = await blockaccess.deleteBlockPolicy(bucketName);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getBlockAccess,
  setBlockAccess,
  deleteBlockAccess,
};
