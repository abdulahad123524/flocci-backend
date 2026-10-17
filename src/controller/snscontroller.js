const { createSnsTopic, subcribeSnsTopic } = require("../services/s3-SNS");

const createsnsTopic = async (req, res) => {
  try {
    const { topicName } = req.body;
    if (!topicName || typeof topicName !== "string") {
      return res.status(400).json({
        success: false,
        message: "SNS topic name is required",
      });
    }

    const result = await createSnsTopic(topicName);

    return res.status(201).json({
      success: true,
      message: "SNS topic created successfully",
      data: {
        topicName: result.topicName,
        topicArn: result.topicArn,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "failed to create SNS Topic",
    });
  }
};

const handleSubcribeTopic = async (req, res) => {
  try {
    const { topicArn, protocol, endpoint } = req.body;

    console.log("=====>>>> backend===", topicArn, protocol, endpoint);

    if (!topicArn || !protocol || !endpoint) {
      res.status(400).json({
        success: false,
        message: "topicArn , protocol,endpoint are required",
      });
    }
    const result = await subcribeSnsTopic({
      topicArn,
      protocol,
      endpoint,
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createsnsTopic,
  handleSubcribeTopic,
};
