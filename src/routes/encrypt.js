const express = require("express");
const router = express.Router();
const {
  encryptBucket,
  getBucketEncryption,
  deleteBucketEncryption,
} = require("../controller/encrypt");
router.post("/encrypt-bucket", encryptBucket);
router.get("/get-bucket-encryption", getBucketEncryption);
router.delete("/delete-bucket-encryption", deleteBucketEncryption);
module.exports = router;
