const express = require("express");
const router = express.Router();
const {
  listObjects,
  getObject,
  uploadObject,
  deleteBucketObject,
  downloadFile,
  createMultipartUpload,
} = require("../controller/objects");

router.get("/objects", listObjects);
router.get("/objects/:key", getObject);
router.post("/upload", uploadObject);
router.post("/multipart-upload", createMultipartUpload);
router.delete("/delete-bucket-object", deleteBucketObject);
router.get("/download-file", downloadFile);

module.exports = router;
