const express = require("express");
const router = express.Router();
const {
  sqsCreate,
  sqsRead,
  sqsConfigure,
} = require("../controller/sqsController");

router.post("/sqs-create", sqsCreate);
router.get("/sqs-messages", sqsRead);
router.post("/sqs-configure", sqsConfigure);

module.exports = router;
