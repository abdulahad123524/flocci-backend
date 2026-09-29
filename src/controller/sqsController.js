const {
  getObjectEventQueue,
  receiveMessages,
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

module.exports = {
  sqsCreate,
  sqsRead,
  sqsConfigure,
};
