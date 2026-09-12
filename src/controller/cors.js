const corsService = require("../services/s3-cors");

const corsBucket = async (req, res) => {
  try {
    const {
      bucketName,
      allowedOrigins,
      allowedMethods,
      allowedHeaders,
      exposeHeaders,
      maxAgeSeconds,
      corsRules,
    } = req.body || {};
    if (!bucketName) {
      return res.status(400).json({ message: "bucketName is required" });
    }
    const result = await corsService.corsBucket(bucketName, {
      allowedOrigins,
      allowedMethods,
      allowedHeaders,
      exposeHeaders,
      maxAgeSeconds,
      corsRules,
    });
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getCorsBucket = async (req, res) => {
  try {
    const bucketName = req.query.bucketName || req.body?.bucketName;
    if (!bucketName) {
      return res.status(400).json({ message: "bucketName is required" });
    }
    const result = await corsService.getCorsBucket(bucketName);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteCorsBucket = async (req, res) => {
  try {
    const bucketName = req.body?.bucketName || req.query.bucketName;
    if (!bucketName) {
      return res.status(400).json({ message: "bucketName is required" });
    }
    const result = await corsService.deleteCorsBucket(bucketName);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  corsBucket,
  getCorsBucket,
  deleteCorsBucket,
};
