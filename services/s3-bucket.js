const fs = require("fs");
const path = require("path");
const {
  S3Client,
  CreateBucketCommand,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  ListBucketsCommand,
  DeleteBucketCommand,
  DeleteObjectsCommand,
} = require("@aws-sdk/client-s3");

const s3 = new S3Client({
  region: process.env.AWS_DEFAULT_REGION,
  endpoint: process.env.AWS_ENDPOINT_URL,
  forcePathStyle: true,
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const createBucket = async (bucketName) => {
  try {
    const command = new CreateBucketCommand({
      Bucket: bucketName,
    });
    const response = await s3.send(command);
    return response;
  } catch (err) {
    if (
      err.name === "BucketAlreadyOwnedByYou" ||
      err.name === "BucketAlreadyExists"
    ) {
      console.log("Bucket already exists:", bucketName);
      return;
    }
    throw err;
  }
};

// const listBuckets = async () => {
//   const command = new ListBucketsCommand({});
//   console.log("command", command);
//   const response = await s3.send(command);
//   console.log("response", response);
//   return response.Buckets;
// };

const listBuckets = async () => {
  const response = await s3.send(new ListBucketsCommand({}));

  return (response.Buckets || []).map((bucket) => ({
    name: bucket.Name,
    creationDate: bucket.CreationDate,
  }));
};

const uploadfile = async (file, bucketName) => {
  const bucket = bucketName || process.env.AWS_BUCKET_NAME;
  if (!bucket) {
    throw new Error("No bucket selected");
  }

  const isPath = typeof file === "string";
  const key = isPath ? path.basename(file) : file.originalname;
  const body = isPath ? fs.readFileSync(file) : file.buffer;
  const contentType = isPath
    ? "application/octet-stream"
    : file.mimetype || "application/octet-stream";

  if (!key) {
    throw new Error("File name is required");
  }
  if (!body || !body.length) {
    throw new Error("File body is empty");
  }

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: contentType,
    ContentLength: body.length,
  });
  const response = await s3.send(command);
  console.log("File uploaded:", key, "->", bucket);
  return { key, etag: response.ETag };
};

const listfiles = async (bucketName) => {
  const command = new ListObjectsV2Command({
    Bucket: bucketName || process.env.AWS_BUCKET_NAME,
  });
  const response = await s3.send(command);
  return (response.Contents || []).map((item) => ({
    key: item.Key,
    size: item.Size,
    lastModified: item.LastModified,
    etag: item.ETag,
  }));
};

const getfile = async (key, bucketName) => {
  const command = new GetObjectCommand({
    Bucket: bucketName || process.env.AWS_BUCKET_NAME,
    Key: key,
  });
  const response = await s3.send(command);
  const bytes = await response.Body.transformToByteArray();
  const contentType = response.ContentType || "application/octet-stream";
  const isText =
    contentType.startsWith("text/") ||
    contentType.includes("json") ||
    /\.(txt|json|md|csv|js|css|html)$/i.test(key);

  return {
    key,
    contentType,
    size: bytes.length,
    text: isText ? new TextDecoder().decode(bytes) : null,
    dataUrl: isText
      ? null
      : `data:${contentType};base64,${Buffer.from(bytes).toString("base64")}`,
  };
};

const deleteBucket = async (bucketName) => {
  const objects = await listfiles(bucketName);
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

module.exports = {
  s3,
  createBucket,
  uploadfile,
  getfile,
  listfiles,
  listBuckets,
  deleteBucket,
};
