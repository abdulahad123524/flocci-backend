const { config } = require("dotenv");
const { s3 } = require("../config/config");
const {
  PutBucketNotificationConfigurationCommand,
  GetBucketNotificationConfigurationCommand,
} = require("@aws-sdk/client-s3");

const {
  LambdaClient,
  AddPermissionCommand,
  GetPolicyCommand,
} = require("@aws-sdk/client-lambda");
const lambda = new LambdaClient({
  region: process.env.AWS_DEFAULT_REGION,
  endpoint: process.env.AWS_ENDPOINT_URL,
});

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
  events,
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

    if (!Array.isArray(events) || events.length === 0) {
      throw new Error("At least one event is required");
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

    await addS3InvokePermission(bucket, lambdaFunctionArn, notificationId);

    const command = new PutBucketNotificationConfigurationCommand({
      Bucket: bucket,
      NotificationConfiguration: notificationConfiguration,
    });

    await s3.send(command);
    return {
      message: "Lambda notification configured successfully",
      rules: notificationConfiguration.LambdaFunctionConfigurations,
    };
  } catch (error) {
    console.error("Error configuring Lambda notification:", error);

    throw new Error("Error configuring Lambda notification: " + error.message);
  }
};

const queueConfigurations = async (
  bucketName,
  queueArn,
  events,
  notificationId,
) => {
  const bucket = bucketName || process.env.BUCKET_NAME;

  try {
    if (!bucket) {
      throw new Error("Bucket name is required");
    }
    if (!queueArn) {
      throw new Error("Queue ARN is required");
    }
    if (!Array.isArray(events)) {
      throw new Error("Events must be an array");
    }
    if (events.length === 0) {
      throw new Error("At least one event is required");
    }
    const notificationConfiguration = {
      LambdaFunctionConfigurations: [],
      QueueConfigurations: [
        {
          Id: notificationId || "queue-notification",
          QueueArn: queueArn,
          Events: events,
        },
      ],
      TopicConfigurations: [],
    };

    const command = new PutBucketNotificationConfigurationCommand({
      Bucket: bucket,
      NotificationConfiguration: notificationConfiguration,
    });

    const response = await s3.send(command);
    return response;
  } catch (error) {
    console.error("Error getting queue configurations:", error);
    throw new Error("Error getting queue configurations: " + error.message);
  }
};

const addS3InvokePermission = async (
  bucketName,
  lambdaFunctionArn,
  notificationId,
) => {
  const statementId = notificationId || "s3-invoke-permission";
  const sourceArn = `arn:aws:s3:::${bucketName}`;

  try {
    return await lambda.send(
      new AddPermissionCommand({
        FunctionName: lambdaFunctionArn,
        StatementId: statementId,
        Action: "lambda:InvokeFunction",
        Principal: "s3.amazonaws.com",
        SourceArn: sourceArn,
      }),
    );
  } catch (error) {
    if (error.name !== "ResourceConflictException") {
      throw error;
    }

    const { Policy } = await lambda.send(
      new GetPolicyCommand({ FunctionName: lambdaFunctionArn }),
    );
    const policy = JSON.parse(Policy || "{}");
    const statement = policy.Statement?.find(
      (entry) => entry.Sid === statementId,
    );
    const statementSourceArn =
      statement?.Condition?.ArnLike?.["AWS:SourceArn"] ||
      statement?.Condition?.ArnEquals?.["AWS:SourceArn"];
    const principal =
      typeof statement?.Principal === "string"
        ? statement.Principal
        : statement?.Principal?.Service;
    const action = Array.isArray(statement?.Action)
      ? statement.Action
      : [statement?.Action];

    if (
      principal !== "s3.amazonaws.com" ||
      !action.includes("lambda:InvokeFunction") ||
      statementSourceArn !== sourceArn
    ) {
      throw new Error(
        `Lambda permission statement ${statementId} already exists with different permissions`,
      );
    }

    return { message: "Matching S3 invoke permission already exists" };
  }
};

module.exports = {
  createBucketNotification,
  getBucketNotification,
  updateBucketNotification,
  deleteBucketNotification,
  lambdaFunctionConfigurations,
  queueConfigurations,
  addS3InvokePermission,
};
