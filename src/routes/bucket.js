const express = require("express");
const router = express.Router();
const {
  listBuckets,
  createBucket,
  deleteBucket,
  headBucket,
  copyBucket,
} = require("../controller/bucket");

router.get("/buckets", listBuckets);
router.post("/create-bucket", createBucket);
router.delete("/delete-bucket", deleteBucket);
router.post("/head-bucket", headBucket);
router.post("/copy-bucket", copyBucket);

module.exports = router;
