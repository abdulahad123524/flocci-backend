const fs = require("fs");
const path = require("path");
const {
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
  CopyObjectCommand,
  CreateMultipartUploadCommand,
  PutMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  UploadPartCommand,
} = require("@aws-sdk/client-s3");
const { s3 } = require("../config/config");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { error } = require("console");
const { type } = require("os");

const multipartfile = async function name(file, bucketname) {
  const bucket = bucketname || process.env.AWS_BUCKET_NAME;

  if (!bucketname) {
    throw new Error("bucket name is missing");
  }
  const isPath = typeof file === "string";
  const key = isPath ? path.basename(file) : file.originalname;
  // If no buffer/body is provided in the initial multipart request,
  // we are only initializing the upload process.
  const body = isPath ? fs.readFileSync(file) : (file.buffer || null);
  const contentType = isPath
    ? "application/octet-stream"
    : file.mimetype || "application/octet-stream";

  if (!key) {
    throw new Error("File name is required");
  }
  
  // Removed strict check on body existence here, as multipart
  // initialization does not require the full file body yet.
  
  const command = new CreateMultipartUploadCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });
  const response = await s3.send(command);
  return { key, uploadId: response.UploadId };
};

// const uploadfile = async (file, bucketName,) => {
//   const bucket = bucketName || process.env.AWS_BUCKET_NAME;
//   if (!bucket) {
//     throw new Error("No bucket selected");
//   }

//   const isPath = typeof file === "string";
//   const key = isPath ? path.basename(file) : file.originalname;
//   const body = isPath ? fs.readFileSync(file) : file.buffer;
//   const contentType = isPath
//     ? "application/octet-stream"
//     : file.mimetype || "application/octet-stream";

//   if (!key) {
//     throw new Error("File name is required");
//   }
//   if (!body || !body.length) {
//     throw new Error("File body is empty");
//   }
// const One_Gb =  1024 * 1024 * 1024
// const res = await createMultipartUpload()

// if(body.length > One_Gb){
//  const command  = new CreateMultipartUploadCommand({
//     Bucket: bucket,
//     Key: key,
// contentType: contentType,
//   })

// const res = await s3.send(command)
// const uploadId = res.UploadId
// const partSize = 10 * 1024 * 1024; // 10MB
// const numParts = Math.ceil(body.length / partSize);

// const uploadCommand  = new UploadPartCommand({
//   Bucket: bucket,
//   Key: key,
//   Body: body,
//   uploadId:   uploadId,
//   PartNumber:numParts,
//   ContentLength: body.length,
// })
  
// const response = await s3.send(uploadCommand)


// const  fullmutlipartUploadCommand = new CompleteMultipartUploadCommand({
//   Bucket: bucket,
//   Key: key,
//   UploadId: response.uploadId,
//   MultipartUpload: {
//     Parts: Array.from({ length: numParts }, (_, i) => ({
//       ETag: response.ETag,  
//     })),
//   },
// });
// await s3.send(fullmutlipartUploadCommand);
// return { key, etag: response.ETag, uploadId: uploadId, partNumber: numParts };

// }


//   const command = new PutObjectCommand({
//     Bucket: bucket,
//     Key: key,
//     Body: body,
//     ContentType: contentType,
//     ContentLength: body.length,
//   });
//   const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
//   const response = await s3.send(command);
//   return { key, etag: response.ETag, imageUrl: url };
// };


const uploadfile = async (file, bucketName) => {
  const bucket = bucketName || process.env.AWS_BUCKET_NAME;

  if (!bucket) {
    throw new Error("No bucket selected");
  }

  const isPath = typeof file === "string";

  const key = isPath
    ? path.basename(file)
    : file.originalname;

  const body = isPath
    ? fs.readFileSync(file)
    : file.buffer;

  const contentType = isPath
    ? "application/octet-stream"
    : file.mimetype || "application/octet-stream";

  if (!key) {
    throw new Error("File name is required");
  }

  if (!body || !body.length) {
    throw new Error("File body is empty");
  }

  const One_Gb = 1024 * 1024 * 1024;

  // ==============================
  // Multipart Upload
  // ==============================

  if (body.length >= One_Gb) {

    // Step 1: Create Multipart Upload

    const createCommand = new CreateMultipartUploadCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
    });

    const createResponse = await s3.send(createCommand);

    const uploadId = createResponse.UploadId;

    // Step 2: Divide file into parts

    const partSize = 10 * 1024 * 1024; // 10 MB

    const numParts = Math.ceil(
      body.length / partSize
    );

    const parts = [];

    // Step 3: Upload every part

    for (let i = 0; i < numParts; i++) {

      const start = i * partSize;

      const end = Math.min(
        start + partSize,
        body.length
      );

      const part = body.subarray(start, end);

      const uploadCommand = new UploadPartCommand({
        Bucket: bucket,
        Key: key,
        UploadId: uploadId,
        PartNumber: i + 1,
        Body: part,
        ContentLength: part.length,
      });

      const response = await s3.send(
        uploadCommand
      );

      parts.push({
        PartNumber: i + 1,
        ETag: response.ETag,
      });
    }
console.log("All parts uploaded successfully:", parts);
    // Step 4: Complete Multipart Upload

    const fullMultipartUploadCommand =
      new CompleteMultipartUploadCommand({
        Bucket: bucket,
        Key: key,
        UploadId: uploadId,
        MultipartUpload: {
          Parts: parts,
        },
      });

    const completeResponse = await s3.send(
      fullMultipartUploadCommand
    );

    return {
      key,
      uploadId,
      parts,
      etag: completeResponse.ETag,
      location: completeResponse.Location,
    };
  }

  // ==============================
  // Normal Upload
  // ==============================

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: contentType,
    ContentLength: body.length,
  });

  const url = await getSignedUrl(s3, command, {
    expiresIn: 3600,
  });

  const response = await s3.send(command);

  return {
    key,
    etag: response.ETag,
    imageUrl: url,
  };
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
  multipartfile
};
