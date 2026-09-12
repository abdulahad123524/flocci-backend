const { s3 } = require("../config/config");
const {
  PutBucketCorsCommand,
  GetBucketCorsCommand,
  DeleteBucketCorsCommand,
} = require("@aws-sdk/client-s3");

const splitList = (value, fallback = []) => {
  if (Array.isArray(value)) {
    const items = value.map(String).map((item) => item.trim()).filter(Boolean);
    return items.length ? items : fallback;
  }
  if (typeof value === "string" && value.trim()) {
    return value
      .split(/[\n,]+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return fallback;
};

const isMissingCors = (error) =>
  error?.name === "NoSuchCORSConfiguration" ||
  error?.Code === "NoSuchCORSConfiguration" ||
  error?.$metadata?.httpStatusCode === 404;

const getCorsBucket = async (bucketName) => {
  try {
    const response = await s3.send(
      new GetBucketCorsCommand({ Bucket: bucketName }),
    );
    return { bucketName, rules: response.CORSRules || [] };
  } catch (error) {
    if (isMissingCors(error)) {
      return { bucketName, rules: [] };
    }
    throw error;
  }
};

const corsBucket = async (bucketName, options = {}) => {
  const rules = options.corsRules?.length
    ? options.corsRules
    : [
        {
          AllowedHeaders: splitList(options.allowedHeaders, ["*"]),
          AllowedMethods: splitList(options.allowedMethods, [
            "GET",
            "HEAD",
            "PUT",
            "POST",
            "DELETE",
          ]),
          AllowedOrigins: splitList(options.allowedOrigins, ["*"]),
          ExposeHeaders: splitList(options.exposeHeaders, []),
          MaxAgeSeconds: Number(options.maxAgeSeconds) || 3000,
        },
      ];

  await s3.send(
    new PutBucketCorsCommand({
      Bucket: bucketName,
      CORSConfiguration: { CORSRules: rules },
    }),
  );
  return getCorsBucket(bucketName);
};

const deleteCorsBucket = async (bucketName) => {
  await s3.send(new DeleteBucketCorsCommand({ Bucket: bucketName }));
  return getCorsBucket(bucketName);
};

module.exports = {
  corsBucket,
  getCorsBucket,
  deleteCorsBucket,
};
