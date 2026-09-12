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

module.exports = {
  getBucketVersioning,
  setBucketVersioning,
};
