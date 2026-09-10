const express = require("express");
const {
  uploadfile,
  getfile,
  listfiles,
  createBucket,
  listBuckets,
  deleteBucket,
} = require("./services/s3-bucket");

const router = express.Router();

router.get("/buckets", async (req, res) => {
  try {
    const buckets = await listBuckets();
    res.json({ buckets });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/objects", async (req, res) => {
  try {
    const bucket = req.query.bucket;
    const objects = await listfiles(bucket);
    res.json({
      bucket: bucket || process.env.AWS_BUCKET_NAME,
      objects,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/objects/:key", async (req, res) => {
  try {
    const file = await getfile(req.params.key, req.query.bucket);
    res.json(file);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/upload", async (req, res) => {
  try {
    const { filename, content, contentType, bucketName } = req.body || {};
    if (!filename || !content) {
      return res.status(400).json({ message: "No file provided" });
    }
    if (!bucketName) {
      return res.status(400).json({ message: "Select a bucket first" });
    }
    const response = await uploadfile(
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
});

router.post("/create-bucket", async (req, res) => {
  try {
    const { bucketName } = req.body;
    if (!bucketName) {
      return res.status(400).json({ message: "bucketName is required" });
    }
    await createBucket(bucketName);
    res
      .status(200)
      .json({ message: "Bucket created successfully", bucketName });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
router.delete("/delete-bucket", async (req, res) => {
  try {
    const { bucketName } = req.body;
    if (!bucketName) {
      return res.status(400).json({ message: "bucketName is required" });
    }
    await deleteBucket(bucketName);
    res
      .status(200)
      .json({ message: "Bucket deleted successfully", bucketName });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
