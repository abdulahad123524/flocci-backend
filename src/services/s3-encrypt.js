const { s3 } = require("../config/config");
const {
  PutBucketEncryptionCommand,
  GetBucketEncryptionCommand,
  DeleteBucketEncryptionCommand,
} = require("@aws-sdk/client-s3");

const isMissingEncryption = (error) =>
  error?.name === "ServerSideEncryptionConfigurationNotFoundError" ||
  error?.Code === "ServerSideEncryptionConfigurationNotFoundError" ||
  error?.$metadata?.httpStatusCode === 404;

const parseEncryption = (bucketName, result) => {
  const rule = result?.ServerSideEncryptionConfiguration?.Rules?.[0];
  const defaults = rule?.ApplyServerSideEncryptionByDefault || {};
  return {
    bucketName,
    encrypted: Boolean(defaults.SSEAlgorithm),
    algorithm: defaults.SSEAlgorithm || null,
    kmsKeyId: defaults.KMSMasterKeyID || null,
    bucketKeyEnabled: Boolean(rule?.BucketKeyEnabled),
  };
};

const getBucketEncryption = async (bucketName) => {
  try {
    const result = await s3.send(
      new GetBucketEncryptionCommand({ Bucket: bucketName }),
    );
    return parseEncryption(bucketName, result);
  } catch (error) {
    if (isMissingEncryption(error)) {
      return {
        bucketName,
        encrypted: false,
        algorithm: null,
        kmsKeyId: null,
        bucketKeyEnabled: false,
      };
    }
    throw error;
  }
};

const encryptBucket = async (bucketName, algorithm = "AES256") => {
  await s3.send(
    new PutBucketEncryptionCommand({
      Bucket: bucketName,
      ServerSideEncryptionConfiguration: {
        Rules: [
          {
            ApplyServerSideEncryptionByDefault: {
              SSEAlgorithm: algorithm,
            },
          },
        ],
      },
    }),
  );
  return getBucketEncryption(bucketName);
};

const deleteBucketEncryption = async (bucketName) => {
  await s3.send(new DeleteBucketEncryptionCommand({ Bucket: bucketName }));
  return getBucketEncryption(bucketName);
};

module.exports = {
  encryptBucket,
  getBucketEncryption,
  deleteBucketEncryption,
};
