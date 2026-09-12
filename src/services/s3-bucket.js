const {
  CreateBucketCommand,
  ListBucketsCommand,
  DeleteBucketCommand,
  DeleteObjectsCommand,
  HeadBucketCommand,
  GetBucketVersioningCommand,
  PutBucketVersioningCommand,
} = require("@aws-sdk/client-s3");
const { s3 } = require("../config/config");
const objectService = require("./s3-objects");

const isMissingBucketError = (err) =>
  err?.name === "NotFound" ||
  err?.name === "NoSuchBucket" ||
  err?.Code === "NotFound" ||
  err?.$metadata?.httpStatusCode === 404;

const createBucket = async (bucketName) => {
  try {
    await headBucket(bucketName);
    return { exists: true, bucketName };
  } catch (err) {
    if (!isMissingBucketError(err)) throw err;
  }

  try {
    const response = await s3.send(
      new CreateBucketCommand({ Bucket: bucketName }),
    );
    return { exists: false, bucketName, location: response.Location };
  } catch (err) {
    if (
      err.name === "BucketAlreadyOwnedByYou" ||
      err.name === "BucketAlreadyExists"
    ) {
      return { exists: true, bucketName };
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

module.exports = {
  createBucket,
  listBuckets,
  deleteBucket,
  headBucket,
  copyBucket,
  getbucketVersioning,
  setbucketVersioning,
};
