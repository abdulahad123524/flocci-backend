const {
  getObjectEventQueue,
  receiveMessages,
  sqsSpendTime,
  deleteSqsMessage,
  configureSqsLambdaMapping,
} = require("../services/s3.sqsservice");

const bucketService = require("../services/s3-bucket");

const sqsCreate = async (_req, res) => {
  try {
    const queue = await getObjectEventQueue();

    return res.status(200).json({
      success: true,
      message: "SQS queue created or retrieved successfully",
      data: queue,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Read SQS messages
const sqsRead = async (_req, res) => {
  try {
    const queue = await getObjectEventQueue();
    const messages = await receiveMessages(queue.queueUrl);

    return res.status(200).json({
      success: true,
      queueName: queue.queueName,
      messages,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Configure S3 bucket notifications and SQS-to-Lambda mapping
const sqsConfigure = async (req, res) => {
  try {
    const { bucketName } = req.body || {};

    if (!bucketName) {
      return res.status(400).json({
        success: false,
        message: "bucketName is required",
      });
    }

    // Configure S3 -> SQS notification
    const notificationResult =
      await bucketService.configureSqsNotification(bucketName);

    // Get queue ARN and configure SQS -> Lambda
    const queue = await getObjectEventQueue();

    const lambdaMappingResult = await configureSqsLambdaMapping({
      queueArn: queue.queueArn,
      functionName:
        process.env.SQS_LAMBDA_FUNCTION_NAME || "floci-s3-object-created",
    });

    return res.status(200).json({
      success: true,
      message: "S3 -> SQS -> Lambda configuration completed",
      data: {
        bucketName,
        queue,
        notificationResult,
        lambdaMappingResult,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Send a direct test message to SQS
const sqsSpendTest = async (_req, res) => {
  try {
    const queue = await getObjectEventQueue();
    const result = await sqsSpendTime(queue.queueUrl);

    return res.status(200).json({
      success: true,
      message: "Direct SQS test message sent successfully",
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete an SQS message using its receipt handle
const sqsDeleteMessage = async (req, res) => {
  try {
    const { receiptHandle } = req.body || {};

    if (!receiptHandle) {
      return res.status(400).json({
        success: false,
        message: "receiptHandle is required",
      });
    }

    const queue = await getObjectEventQueue();

    const result = await deleteSqsMessage(queue.queueUrl, receiptHandle);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  sqsCreate,
  sqsRead,
  sqsConfigure,
  sqsSpendTest,
  sqsDeleteMessage,
};
