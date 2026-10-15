const express = require("express");
const router = express.Router();
const {
  sqsCreate,
  sqsRead,
  sqsConfigure,
  sqsSpendTest,
  sqsDeleteMessage,
} = require("../controller/sqsController");

router.post("/sqs-create", sqsCreate);
router.get("/sqs-messages", sqsRead);
router.post("/sqs-configure", sqsConfigure);
router.post("/sqs-SpendTest", sqsSpendTest);
router.delete("/sqs-deleteMessage", sqsDeleteMessage);
module.exports = router;
