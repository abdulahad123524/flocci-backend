const express = require("express");
const router = express.Router();
const {
  listBuckets,
  createBucket,
  deleteBucket,
  headBucket,
  copyBucket,
  configureSqsNotification,
  configureAllBucketsForSqs,
} = require("../controller/bucket");

router.get("/buckets", listBuckets);
router.post("/create-bucket", createBucket);
router.delete("/delete-bucket", deleteBucket);
router.post("/head-bucket", headBucket);
router.post("/copy-bucket", copyBucket);
router.post("/bucket/sqs-notification", configureSqsNotification);
router.post("/buckets/sqs-notification", configureAllBucketsForSqs);

module.exports = router;
