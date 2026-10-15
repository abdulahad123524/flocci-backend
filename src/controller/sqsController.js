const {
  getObjectEventQueue,
  receiveMessages,
  sqsSpendTime,
} = require("../services/s3.sqsservice");
const bucketService = require("../services/s3-bucket");

const sqsCreate = async (req, res) => {
  try {
    const result = await getObjectEventQueue();

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

const sqsRead = async (_req, res) => {
  try {
    const queue = await getObjectEventQueue();

    const messages = await receiveMessages(queue.queueUrl);

    return res.status(200).json({
      messages,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

const sqsConfigure = async (req, res) => {
  try {
    const { bucketName } = req.body || {};
    if (!bucketName) {
      return res.status(400).json({ message: "bucketName is required" });
    }

    const result = await bucketService.configureSqsNotification(bucketName);
    return res.status(200).json({
      message: "S3 object notifications configured",
      result,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const sqsSpendTest = async (req, res) => {
  try {
    const queue = await getObjectEventQueue();
    const result = await sqsSpendTime(queue.queueUrl);

    return res.status(200).json({
      success: true,
      message: "Direct SQS test message sent successfully",
      data: result,
    });
  } catch (e) {
    return res.status(500).json({
      success: false,
      message: e.message,
    });
  }
};

const sqsDeleteMessage = async (req, res) => {
  try {
    const { reciepthandle } = req.body;
    if (!reciepthandle) {
      return res.json(400).json({
        success: false,
        message: "Receipt handle not required",
      });
    }
  } catch (error) {
    throw new Error(error, "");
  }
};

module.exports = {
  sqsCreate,
  sqsRead,
  sqsConfigure,
  sqsSpendTest,
  sqsDeleteMessage,
};
