const { config } = require("dotenv");
const { s3 } = require("../config/config");
const {
  PutBucketNotificationConfigurationCommand,
  GetBucketNotificationConfigurationCommand,
} = require("@aws-sdk/client-s3");

const createBucketNotification = async (bucketName, notificationConfig) => {
  const bucket = bucketName || process.env.BUCKET_NAME;
  try {
    if (!bucket) {
      throw new Error("Bucket name is required");
    }

    if (!notificationConfig) {
      throw new Error("Notification configuration is required");
    }
    const command = new PutBucketNotificationConfigurationCommand({
      Bucket: bucket,
      NotificationConfiguration: notificationConfig,
    });
    await s3.send(command);
    return {
      message: "Notification configuration set successfully",
      rules: [notificationConfig],
    };
  } catch (error) {
    console.error("Error setting notification configuration:", error);
    throw new Error(
      "Error setting notification configuration: " + error.message,
    );
  }
};

const updateBucketNotification = async (bucketName, config) => {
  const bucket = bucketName || process.env.BUCKET_NAME;
  try {
    if (!bucket) {
      throw new Error("Bucket name is required");
    }

    if (!config) {
      throw new Error("Notification configuration is required");
    }
    const command = new PutBucketNotificationConfigurationCommand({
      Bucket: bucket,
      NotificationConfiguration: config,
    });
    await s3.send(command);
    return {
      message: "Notification configuration set successfully",
      rules: [config],
    };
  } catch (error) {
    console.error("Error setting notification configuration:", error);
    throw new Error(
      "Error setting notification configuration: " + error.message,
    );
  }
};

const deleteBucketNotification = async (bucketName) => {
  const bucket = bucketName || process.env.BUCKET_NAME;
  try {
    if (!bucket) {
      throw new Error("Bucket name is required");
    }
    const command = new PutBucketNotificationConfigurationCommand({
      Bucket: bucket,
      NotificationConfiguration: {
        LambdaFunctionConfigurations: [],
        QueueConfigurations: [],
        TopicConfigurations: [],
      },
    });
    await s3.send(command);
    return {
      message: "Notification configuration removed successfully",
      rules: [],
    };
  } catch (error) {
    console.error("Error removing notification configuration:", error);
    throw new Error(
      "Error removing notification configuration: " + error.message,
    );
  }
};

const getBucketNotification = async (bucketName) => {
  const bucket = bucketName || process.env.BUCKET_NAME;
  try {
    if (!bucket) {
      throw new Error("Bucket name is required");
    }
    const command = new GetBucketNotificationConfigurationCommand({
      Bucket: bucket,
    });

    const response = await s3.send(command);
    return response;
  } catch (error) {
    console.error("Error getting notification configuration:", error);
    throw new Error(
      "Error getting notification configuration: " + error.message,
    );
  }
};

const lambdaFunctionConfigurations = async (
  bucketName,
  lambdaFunctionArn,
  event,
  notificationId,
) => {
  const bucket = bucketName || process.env.BUCKET_NAME;

  try {
    if (!bucket) {
      throw new Error("Bucket name is required");
    }
    if (!lambdaFunctionArn) {
      throw new Error("Lambda function ARN is required");
    }
    if (!event) {
      throw new Error("Event is required");
    }
    const notificationConfiguration = {
      LambdaFunctionConfigurations: [
        {
          Id: notificationId || "lambda-notification",
          LambdaFunctionArn: lambdaFunctionArn,
          Events: events,
        },
      ],

      QueueConfigurations: [],

      TopicConfigurations: [],
    };

    const command = new PutBucketNotificationConfigurationCommand({
      Bucket: bucket,
      NotificationConfiguration: notificationConfiguration,
    });

    const response = await s3.send(command);
    return response;
  } catch (error) {
    console.error("Error getting Lambda function configurations:", error);
    throw new Error(
      "Error getting Lambda function configurations: " + error.message,
    );
  }
};

module.exports = {
  createBucketNotification,
  getBucketNotification,
  updateBucketNotification,
  deleteBucketNotification,
  lambdaFunctionConfigurations,
};
