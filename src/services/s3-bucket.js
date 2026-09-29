const {
  CreateBucketCommand,
  ListBucketsCommand,
  DeleteBucketCommand,
  DeleteObjectsCommand,
  HeadBucketCommand,
  GetBucketVersioningCommand,
  PutBucketVersioningCommand,
  GetBucketNotificationConfigurationCommand,
  PutBucketNotificationConfigurationCommand,
} = require("@aws-sdk/client-s3");
const { s3 } = require("../config/config");
const objectService = require("./s3-objects");
const { getObjectEventQueue, setQueuePolicy } = require("./s3.sqsservice");

const isMissingBucketError = (err) =>
  err?.name === "NotFound" ||
  err?.name === "NoSuchBucket" ||
  err?.Code === "NotFound" ||
  err?.$metadata?.httpStatusCode === 404;

// const createBucket = async (bucketName) => {
//   try {
//     await headBucket(bucketName);
//     return { exists: true, bucketName };
//   } catch (err) {
//     if (!isMissingBucketError(err)) throw err;
//   }

//   try {
//     const response = await s3.send(
//       new CreateBucketCommand({ Bucket: bucketName }),
//     );
//     return { exists: false, bucketName, location: response.Location };
//   } catch (err) {
//     if (
//       err.name === "BucketAlreadyOwnedByYou" ||
//       err.name === "BucketAlreadyExists"
//     ) {
//       return { exists: true, bucketName };
//     }
//     throw err;
//   }
// };

const createBucket = async (bucketName) => {
  try {
    await headBucket(bucketName);

    return {
      exists: true,
      bucketName,
    };
  } catch (err) {
    if (!isMissingBucketError(err)) {
      throw err;
    }
  }

  try {
    const response = await s3.send(
      new CreateBucketCommand({
        Bucket: bucketName,
      }),
    );

    // Automatically connect new bucket to common SQS queue
    const sqsNotification = await configureSqsNotification(bucketName);

    return {
      exists: false,
      bucketName,
      location: response.Location,
      sqsNotification,
    };
  } catch (err) {
    if (
      err.name === "BucketAlreadyOwnedByYou" ||
      err.name === "BucketAlreadyExists"
    ) {
      return {
        exists: true,
        bucketName,
      };
    }

    throw err;
  }
};

const listBuckets = async () => {
  const response = await s3.send(new ListBucketsCommand({}));

  return (response.Buckets || []).map((bucket) => ({
    name: bucket.Name,
    creationDate: bucket.CreationDate,
  }));
};

const deleteBucket = async (bucketName) => {
  const objects = await objectService.listfiles(bucketName);
  if (objects.length) {
    await s3.send(
      new DeleteObjectsCommand({
        Bucket: bucketName,
        Delete: { Objects: objects.map((item) => ({ Key: item.key })) },
      }),
    );
  }
  await s3.send(new DeleteBucketCommand({ Bucket: bucketName }));
};

const headBucket = async (bucketName) => {
  const command = new HeadBucketCommand({
    Bucket: bucketName,
  });
  return s3.send(command);
};

const copyBucket = async (sourceBucketName, targetBucketName, key) => {
  if (sourceBucketName === targetBucketName) {
    throw new Error("Source and target buckets must be different");
  }
  await headBucket(sourceBucketName);
  await headBucket(targetBucketName);

  const keys = key
    ? [key]
    : (await objectService.listfiles(sourceBucketName)).map((obj) => obj.key);

  if (!keys.length) {
    throw new Error("Source bucket has no files to copy");
  }

  for (const objectKey of keys) {
    await objectService.copyObject(
      sourceBucketName,
      targetBucketName,
      objectKey,
    );
  }
  return { copied: keys.length, keys };
};

const getbucketVersioning = async (bucketName) => {
  const command = new GetBucketVersioningCommand({
    Bucket: bucketName,
  });
  const response = await s3.send(command);
  return {
    bucketName,
    versioning: response.Status || "Off",
    mfaDelete: response.MFADelete || "Disabled",
  };
};

const setbucketVersioning = async (bucketName, status = "Enabled") => {
  await s3.send(
    new PutBucketVersioningCommand({
      Bucket: bucketName,
      VersioningConfiguration: { Status: status },
    }),
  );
  return getbucketVersioning(bucketName);
};

const configureAllBucketsForSqs = async () => {
  const buckets = await listBuckets();

  const results = [];

  for (const bucket of buckets) {
    if (!bucket.name) {
      continue;
    }

    try {
      const result = await configureSqsNotification(bucket.name);

      results.push({
        bucketName: bucket.name,
        success: true,
        queueUrl: result.queueUrl,
        queueArn: result.queueArn,
      });
    } catch (error) {
      results.push({
        bucketName: bucket.name,
        success: false,
        error: error.message,
      });
    }
  }

  return results;
};

const configureSqsNotification = async (bucketName) => {
  if (!bucketName) {
    throw new Error("Bucket name is required");
  }

  const queue = await getObjectEventQueue();

  await setQueuePolicy(queue.queueUrl, queue.queueArn, bucketName);

  const existingConfiguration = await s3.send(
    new GetBucketNotificationConfigurationCommand({
      Bucket: bucketName,
    }),
  );

  const lambdaConfigurations =
    existingConfiguration.LambdaFunctionConfigurations || [];

  const topicConfigurations = existingConfiguration.TopicConfigurations || [];

  const existingQueueConfigurations =
    existingConfiguration.QueueConfigurations || [];

  const filteredQueueConfigurations = existingQueueConfigurations.filter(
    (config) => config.Id !== "floci-s3-object-events",
  );

  const queueConfigurations = [
    ...filteredQueueConfigurations,
    {
      Id: "floci-s3-object-events",
      QueueArn: queue.queueArn,
      Events: ["s3:ObjectCreated:*"],
    },
  ];

  await s3.send(
    new PutBucketNotificationConfigurationCommand({
      Bucket: bucketName,

      NotificationConfiguration: {
        QueueConfigurations: queueConfigurations,

        LambdaFunctionConfigurations: lambdaConfigurations,

        TopicConfigurations: topicConfigurations,
      },
    }),
  );

  return {
    bucketName,
    queueName: queue.queueName,
    queueUrl: queue.queueUrl,
    queueArn: queue.queueArn,
  };
};

module.exports = {
  createBucket,
  listBuckets,
  deleteBucket,
  headBucket,
  copyBucket,
  getbucketVersioning,
  setbucketVersioning,
  configureAllBucketsForSqs,
  configureSqsNotification,
};
