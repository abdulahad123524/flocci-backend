const { Protocol } = require("@aws-sdk/client-s3");
const {
  SNSClient,
  CreateTopicCommand,
  SubscribeCommand,
} = require("@aws-sdk/client-sns");
require("dotenv").config();

const sns = new SNSClient({
  region: process.env.AWS_DEFAULT_REGION,
  endpoint: process.env.AWS_ENDPOINT_URL,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const createSnsTopic = async (topicName) => {
  if (!topicName || typeof topicName !== "string") {
    throw new Error("SNS topic name is required");
  }

  const normalizeName = topicName.trim();

  if (!/^[a-zA-Z0-9_-]{1,256}$/.test(normalizeName)) {
    throw new Error(
      "Topic name can contain only letters, numbers, hyphens and underscores",
    );
  }

  const response = await sns.send(
    new CreateTopicCommand({
      Name: normalizeName,
    }),
  );

  if (!response.TopicArn) {
    throw new Error("SNS topic ARN was not returned");
  }

  return {
    topicName: normalizeName,
    topicArn: response.TopicArn,
  };
};

const subcribeSnsTopic = async ({ topicArn, protocol, endpoint }) => {
  if (!topicArn || typeof topicArn !== "string") {
    throw new Error("topic Arn is required ");
  }

  if (!protocol || typeof protocol !== "string") {
    throw new Error("Protocol is required");
  }
  if (!endpoint || typeof endpoint !== "string") {
    throw new Error("End point is required");
  }
  const response = sns.send(
    new SubscribeCommand({
      TopicArn: topicArn.trim(),
      Protocol: protocol.trim(),
      Endpoint: endpoint.trim(),
      ReturnSubscriptionArn: true,
    }),
  );

  return response.status(200).json(response);
};

module.exports = {
  createSnsTopic,
  subcribeSnsTopic,
};
