const {
  SQSClient,
  CreateQueueCommand,
  GetQueueAttributesCommand,
  SetQueueAttributesCommand,
  ReceiveMessageCommand,
} = require("@aws-sdk/client-sqs");

require("dotenv").config();

const sqs = new SQSClient({
  region: process.env.AWS_DEFAULT_REGION || "us-east-1",
  endpoint: process.env.AWS_ENDPOINT_URL,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const S3_OBJECT_EVENT_QUEUE_NAME =
  process.env.S3_OBJECT_EVENT_QUEUE_NAME || "s3-object-events";

const createObjectEventQueue = async () => {
  const createResponse = await sqs.send(
    new CreateQueueCommand({
      QueueName: S3_OBJECT_EVENT_QUEUE_NAME,
    }),
  );

  const queueUrl = createResponse.QueueUrl;

  if (!queueUrl) {
    throw new Error("SQS queue URL was not returned");
  }

  const attributesResponse = await sqs.send(
    new GetQueueAttributesCommand({
      QueueUrl: queueUrl,
      AttributeNames: ["QueueArn"],
    }),
  );

  const queueArn = attributesResponse.Attributes?.QueueArn;

  if (!queueArn) {
    throw new Error("SQS queue ARN was not returned");
  }

  return {
    queueName: S3_OBJECT_EVENT_QUEUE_NAME,
    queueUrl,
    queueArn,
  };
};

const getObjectEventQueue = async () => {
  return createObjectEventQueue();
};

const setQueuePolicy = async (queueUrl, queueArn, bucketName) => {
  if (!queueUrl || !queueArn || !bucketName) {
    throw new Error("Queue URL, queue ARN, and bucket name are required");
  }

  const { Attributes = {} } = await sqs.send(
    new GetQueueAttributesCommand({
      QueueUrl: queueUrl,
      AttributeNames: ["Policy"],
    }),
  );
  const existingPolicy = Attributes.Policy ? JSON.parse(Attributes.Policy) : {};
  const statementId = `AllowS3Bucket${bucketName.replace(/[^A-Za-z0-9]/g, "")}`;
  const statements = (existingPolicy.Statement || []).filter(
    (statement) => statement.Sid !== statementId,
  );
  const policy = {
    ...existingPolicy,
    Version: existingPolicy.Version || "2012-10-17",
    Statement: [
      ...statements,
      {
        Sid: statementId,
        Effect: "Allow",
        Principal: { Service: "s3.amazonaws.com" },
        Action: "sqs:SendMessage",
        Resource: queueArn,
        Condition: {
          ArnLike: { "aws:SourceArn": `arn:aws:s3:::${bucketName}` },
        },
      },
    ],
  };

  await sqs.send(
    new SetQueueAttributesCommand({
      QueueUrl: queueUrl,
      Attributes: {
        Policy: JSON.stringify(policy),
      },
    }),
  );

  return true;
};

const receiveMessages = async (queueUrl) => {
  if (!queueUrl) {
    throw new Error("Queue URL is required");
  }

  const response = await sqs.send(
    new ReceiveMessageCommand({
      QueueUrl: queueUrl,
      MaxNumberOfMessages: 10,
      WaitTimeSeconds: 1,
      VisibilityTimeout: 0,
      AttributeNames: ["All"],
      MessageAttributeNames: ["All"],
    }),
  );

  return (response.Messages || []).map((message) => ({
    messageId: message.MessageId,
    receiptHandle: message.ReceiptHandle,
    body: message.Body,
    attributes: message.Attributes || {},
    messageAttributes: message.MessageAttributes || {},
  }));
};

module.exports = {
  createObjectEventQueue,
  getObjectEventQueue,
  setQueuePolicy,
  receiveMessages,
};
