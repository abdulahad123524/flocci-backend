import { SQSClient } from "@aws-sdk/client-sqs";

const sqs = new SQSClient({
  region: process.env.AWS_REGION,
  endpoint: process.env.AWS_ENDPOINT_URL,
});

const handler = async (event) => {
  console.log("SQS Lambda triggered");

  for (const record of event.Records) {
    console.log("Message ID:", record.messageId);

    console.log("Message body:", record.body);

    const data = JSON.parse(record.body);

    console.log("User ID:", data.userId);
    console.log("Action:", data.action);
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "SQS message processed",
    }),
  };
};

const sendMessageToQueue = async (queueUrl, messageBody) => {
  try {
    if (!queueUrl) {
      throw new Error("Queue URL is required");
    }

    if (!messageBody) {
      throw new Error("Message body is required");
    }

    const params = {
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify(messageBody),
    };
    const command = new SendMessageCommand(params);
    const response = await sqs.send(command);
    return response;
  } catch (error) {
    console.error("Error sending message to SQS queue:", error);
    throw new Error("Error sending message to SQS queue: " + error.message);
  }
};

module.exports = {
  sendMessageToQueue,
  handler,
};
