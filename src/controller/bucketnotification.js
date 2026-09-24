const notificationService = require("../services/s3-notification");

const bucketNotification = async (req, res) => {
  try {
    const { bucketName, notificationConfig } = req.body;
    if (!bucketName) {
      return res.status(400).json({ message: "Bucket name is required" });
    }
    if (!notificationConfig) {
      return res
        .status(400)
        .json({ message: "Notification configuration is required" });
    }
    const result = await notificationService.createBucketNotification(
      bucketName,
      notificationConfig,
    );

    res.status(200).json({
      message: "Notification configuration set successfully",
      result,
    });
  } catch (error) {
    console.error("Error setting notification configuration:", error);
    res.status(500).json({
      message: "Error setting notification configuration: " + error.message,
    });
  }
};

const getBucketNotification = async (req, res) => {
  try {
    const { bucketName } = req.query;
    if (!bucketName) {
      return res.status(400).json({ message: "Bucket name is required" });
    }
    const result = await notificationService.getBucketNotification(bucketName);
    res.status(200).json({
      message: "Notification configuration retrieved successfully",
      result,
    });
  } catch (error) {
    console.error("Error getting notification configuration:", error);
    res.status(500).json({
      message: "Error getting notification configuration: " + error.message,
    });
  }
};

const updateBucketNotification = async (req, res) => {
  try {
    const { bucketName, config } = req.body;
    if (!bucketName) {
      return res.status(400).json({ message: "Bucket name is required" });
    }
    if (!config) {
      return res
        .status(400)
        .json({ message: "Notification configuration is required" });
    }
    const result = await notificationService.updateBucketNotification(
      bucketName,
      config,
    );

    res.status(200).json({
      message: "Notification configuration updated successfully",
      result,
    });
  } catch (error) {
    console.error("Error updating notification configuration:", error);
    res.status(500).json({
      message: "Error updating notification configuration: " + error.message,
    });
  }
};

const deleteBucketNotification = async (req, res) => {
  try {
    const { bucketName } = req.body;
    if (!bucketName) {
      return res.status(400).json({ message: "Bucket name is required" });
    }
    const result =
      await notificationService.deleteBucketNotification(bucketName);
    res.status(200).json({
      message: "Notification configuration removed successfully",
      result,
    });
  } catch (error) {
    console.error("Error removing notification configuration:", error);
    res.status(500).json({
      message: "Error removing notification configuration: " + error.message,
    });
  }
};

const configureBucketNotification = async (req, res) => {
  try {
    const { bucketName, notificationConfig } = req.body;
    if (!bucketName) {
      return res.status(400).json({ message: "Bucket name is required" });
    }
    if (!notificationConfig) {
      return res
        .status(400)
        .json({ message: "Notification configuration is required" });
    }
    const result = await notificationService.lambdaFunctionConfigurations(
      bucketName,
      notificationConfig,
    );

    res.status(200).json({
      message: "Notification configuration set successfully",
      result,
    });
  } catch (error) {
    console.error("Error setting notification configuration:", error);
    res.status(500).json({
      message: "Error setting notification configuration: " + error.message,
    });
  }
};

module.exports = {
  bucketNotification,
  getBucketNotification,
  updateBucketNotification,
  deleteBucketNotification,
  configureBucketNotification,
};
