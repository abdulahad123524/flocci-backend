const { s3 } = require("../config/config");
const {
  PutPublicAccessBlockCommand,
  GetPublicAccessBlockCommand,
  DeletePublicAccessBlockCommand,
} = require("@aws-sdk/client-s3");

const DEFAULT_POLICY = {
  BlockPublicAcls: false,
  IgnorePublicAcls: false,
  BlockPublicPolicy: false,
  RestrictPublicBuckets: false,
};

const BLOCK_ALL_POLICY = {
  BlockPublicAcls: true,
  IgnorePublicAcls: true,
  BlockPublicPolicy: true,
  RestrictPublicBuckets: true,
};

const toBool = (value, fallback = false) => {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  const text = String(value).toLowerCase();
  if (["true", "1", "yes", "on"].includes(text)) return true;
  if (["false", "0", "no", "off"].includes(text)) return false;
  return fallback;
};

const normalizePolicy = (policy = {}) => ({
  BlockPublicAcls: toBool(policy.BlockPublicAcls ?? policy.blockPublicAcls),
  IgnorePublicAcls: toBool(policy.IgnorePublicAcls ?? policy.ignorePublicAcls),
  BlockPublicPolicy: toBool(
    policy.BlockPublicPolicy ?? policy.blockPublicPolicy,
  ),
  RestrictPublicBuckets: toBool(
    policy.RestrictPublicBuckets ?? policy.restrictPublicBuckets,
  ),
});

const isMissingBlock = (error) =>
  error?.name === "NoSuchPublicAccessBlockConfiguration" ||
  error?.Code === "NoSuchPublicAccessBlockConfiguration" ||
  error?.$metadata?.httpStatusCode === 404;

const parsePolicy = (bucketName, config, configured = true) => {
  const policy = normalizePolicy(config || DEFAULT_POLICY);
  return {
    bucketName,
    configured,
    blockAll:
      policy.BlockPublicAcls &&
      policy.IgnorePublicAcls &&
      policy.BlockPublicPolicy &&
      policy.RestrictPublicBuckets,
    policy,
  };
};

const getBlockPolicy = async (bucketName) => {
  try {
    const response = await s3.send(
      new GetPublicAccessBlockCommand({ Bucket: bucketName }),
    );
    return parsePolicy(
      bucketName,
      response.PublicAccessBlockConfiguration,
      true,
    );
  } catch (error) {
    if (isMissingBlock(error)) {
      return parsePolicy(bucketName, DEFAULT_POLICY, false);
    }
    throw error;
  }
};

const putBlockPolicy = async (bucketName, policy) => {
  const next = normalizePolicy(policy);
  await s3.send(
    new PutPublicAccessBlockCommand({
      Bucket: bucketName,
      PublicAccessBlockConfiguration: next,
    }),
  );
  return getBlockPolicy(bucketName);
};

const deleteBlockPolicy = async (bucketName) => {
  try {
    await s3.send(new DeletePublicAccessBlockCommand({ Bucket: bucketName }));
  } catch (error) {
    if (!isMissingBlock(error)) throw error;
  }
  return getBlockPolicy(bucketName);
};

module.exports = {
  DEFAULT_POLICY,
  BLOCK_ALL_POLICY,
  getBlockPolicy,
  putBlockPolicy,
  deleteBlockPolicy,
};
