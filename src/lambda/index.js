const { LambdaClient } = require("@aws-sdk/client-lambda");

const lambda = new LambdaClient({
  region: process.env.AWS_DEFAULT_REGION || "us-east-1",
  endpoint: process.env.AWS_ENDPOINT_URL,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "test",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "test",
  },
});

const handler = async (event) => {
  console.log("Lambda event received");

  for (const record of event.Records ?? []) {
    let s3Event;

    // SQS → Lambda
    if (record.eventSource === "aws:sqs") {
      const body = JSON.parse(record.body);

      // S3 → SQS direct event
      // or S3 → SNS → SQS wrapped event
      if (body.Type === "Notification" && body.Message) {
        s3Event = JSON.parse(body.Message);
      } else {
        s3Event = body;
      }
    } else {
      // Direct S3 event
      s3Event = event;
    }

    for (const s3Record of s3Event.Records ?? []) {
      if (!s3Record.s3?.bucket?.name || !s3Record.s3?.object?.key) {
        console.log("Skipping non-S3 event record");
        continue;
      }

      const bucket = s3Record.s3.bucket.name;
      const key = decodeURIComponent(
        s3Record.s3.object.key.replace(/\+/g, " "),
      );

      console.log("Bucket:", bucket);
      console.log("Uploaded file:", key);
      console.log("Event:", s3Record.eventName);
    }
  }

  return {
    message: "S3 event processed successfully",
  };
};

module.exports = {
  handler,
  lambda,
};
