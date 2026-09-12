const express = require("express");
const router = express.Router();
const { getBucketTags, tagsBucket } = require("../controller/tags");

router.get("/bucket-tags", getBucketTags);
router.put("/bucket-tags", tagsBucket);

module.exports = router;
