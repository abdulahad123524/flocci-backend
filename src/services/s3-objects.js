const fs = require("fs");
const path = require("path");
const {
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
  CopyObjectCommand,
} = require("@aws-sdk/client-s3");
const { s3 } = require("../config/config");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");





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
  const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
  const response = await s3.send(command);
  return { key, etag: response.ETag, imageUrl: url };
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
  const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
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
      imageUrl: url,
  };
};

const deleteBucketobject = async (bucketName, key) => {
  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: key,
  });
  return s3.send(command);
};

const copyObject = async (sourceBucketName, targetBucketName, key) => {
  try {
    await s3.send(
      new CopyObjectCommand({
        Bucket: targetBucketName,
        Key: key,
        CopySource: `${sourceBucketName}/${key}`,
      }),
    );
  } catch {
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
  }
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
  uploadfile,
  listfiles,
  getfile,
  deleteBucketobject,
  copyObject,
  downlaodFile,
};
