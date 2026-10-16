const express = require("express");
const router = express.Router();

const {
  createsnsTopic,
  handleSubcribeTopic,
} = require("../controller/snscontroller");

router.post("/sns/create-topic", createsnsTopic);
router.post("/sns/sns-subscribe", handleSubcribeTopic);
module.exports = router;
