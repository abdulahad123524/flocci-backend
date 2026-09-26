const express = require("express");
const router = express.Router();
const bucketNotificationController = require("../controller/bucketnotification");

router.post(
  "/bucketnotification",
  bucketNotificationController.bucketNotification,
);
router.get(
  "/bucketnotification",
  bucketNotificationController.getBucketNotification,
);
router.put(
  "/bucketnotification",
  bucketNotificationController.updateBucketNotification,
);
router.delete(
  "/bucketnotification",
  bucketNotificationController.deleteBucketNotification,
);
router.post(
  "/bucketnotification/configure",
  bucketNotificationController.configureBucketNotification,
);
router.post(
  "/bucketnotification/configure/queue",
  bucketNotificationController.configureBucketNotificationWithQueue,
);

module.exports = router;
