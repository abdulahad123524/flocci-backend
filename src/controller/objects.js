const objectService = require("../services/s3-objects");

const listObjects = async (req, res) => {
  try {
    const bucket = req.query.bucket;
    const objects = await objectService.listfiles(bucket);
    res.json({
      bucket: bucket || process.env.AWS_BUCKET_NAME,
      objects,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getObject = async (req, res) => {
  try {
    const file = await objectService.getfile(req.params.key, req.query.bucket);
    res.json(file);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const uploadObject = async (req, res) => {
  try {
    const { filename, content, contentType, bucketName } = req.body || {};
    if (!filename || !content) {
      return res.status(400).json({ message: "No file provided" });
    }
    if (!bucketName) {
      return res.status(400).json({ message: "Select a bucket first" });
    }
    const response = await objectService.uploadfile(
      {
        originalname: filename,
        buffer: Buffer.from(content, "base64"),
        mimetype: contentType || "application/octet-stream",
      },
      bucketName,
    );
    res
      .status(200)
      .json({ message: "File uploaded successfully", ...response });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteBucketObject = async (req, res) => {
  try {
    const { bucketName, key } = req.body;
    if (!bucketName || !key) {
      return res
        .status(400)
        .json({ message: "bucketName and key are required" });
    }
    await objectService.deleteBucketobject(bucketName, key);
    res
      .status(200)
      .json({ message: "Object deleted successfully", bucketName, key });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const downloadFile = async (req, res) => {
  try {
    const key = req.query.key;
    const bucketName = req.query.bucketName;
    if (!key || !bucketName) {
      return res
        .status(400)
        .json({ message: "key and bucketName are required" });
    }
    const file = await objectService.downlaodFile(key, bucketName);
    const filename = key.split("/").pop() || key;
    res.setHeader("Content-Type", file.contentType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${filename.replace(/"/g, "")}"`,
    );
    res.send(file.body);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  listObjects,
  getObject,
  uploadObject,
  deleteBucketObject,
  downloadFile,
};
