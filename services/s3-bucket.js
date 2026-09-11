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
  DeleteObjectCommand,
  HeadBucketCommand,
  CopyObjectCommand,
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

const deleteBucketobject = async (bucketName, key) => {
  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: key,
  });
  const response = await s3.send(command);
  return response;
};

const headBucket = async (bucketName) => {
  const command = new HeadBucketCommand({
    Bucket: bucketName,
  });
  const response = await s3.send(command);
  return response;
};

const copyObject = async (sourceBucketName, targetBucketName, key) => {
  const source = await s3.send(
    new GetObjectCommand({
      Bucket: sourceBucketName,
      Key: key,
    }),
  );
  const bytes = await source.Body.transformToByteArray();
  await s3.send(
    new PutObjectCommand({
      Bucket: targetBucketName,
      Key: key,
      Body: Buffer.from(bytes),
      ContentType: source.ContentType || "application/octet-stream",
      ContentLength: bytes.length,
    }),
  );
};

const copyBucket = async (sourceBucketName, targetBucketName, key) => {
  if (sourceBucketName === targetBucketName) {
    throw new Error("Source and target buckets must be different");
  }
  await headBucket(sourceBucketName);
  await headBucket(targetBucketName);

  const keys = key
    ? [key]
    : (await listfiles(sourceBucketName)).map((obj) => obj.key);

  if (!keys.length) {
    throw new Error("Source bucket has no files to copy");
  }

  for (const objectKey of keys) {
    try {
      await s3.send(
        new CopyObjectCommand({
          Bucket: targetBucketName,
          Key: objectKey,
          CopySource: `${sourceBucketName}/${objectKey}`,
        }),
      );
    } catch {
      await copyObject(sourceBucketName, targetBucketName, objectKey);
    }
  }
  return { copied: keys.length, keys };
};

const downlaodFile = async (key, bucketName) => {
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });
  const response = await s3.send(command);
  const bytes = await response.Body.transformToByteArray();
  return {
    key,
    contentType: response.ContentType || "application/octet-stream",
    body: Buffer.from(bytes),
  };
};

module.exports = {
  s3,
  createBucket,
  uploadfile,
  getfile,
  listfiles,
  listBuckets,
  deleteBucket,
  deleteBucketobject,
  headBucket,
  copyBucket,
  downlaodFile,
};
