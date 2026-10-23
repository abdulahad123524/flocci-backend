const {
  CreateBucketCommand,
  HeadBucketCommand,
  ListObjectsV2Command,
  GetObjectCommand,
  PutObjectCommand,
} = require("@aws-sdk/client-s3");

const { randomUUID } = require("crypto");
const { s3 } = require("../config/config");

const BACKUP_BUCKET = process.env.S3_BACKUP_BUCKET_NAME || "floci-backups";

// Check whether the backup bucket exists.
// If it does not exist, create it.
const ensureBackupBucket = async () => {
  try {
    await s3.send(
      new HeadBucketCommand({
        Bucket: BACKUP_BUCKET,
      }),
    );

    return {
      bucketName: BACKUP_BUCKET,
      created: false,
    };
  } catch (error) {
    const statusCode = error?.$metadata?.httpStatusCode;

    if (
      statusCode !== 404 &&
      error?.name !== "NotFound" &&
      error?.name !== "NoSuchBucket"
    ) {
      throw error;
    }
  }

  try {
    await s3.send(
      new CreateBucketCommand({
        Bucket: BACKUP_BUCKET,
      }),
    );

    return {
      bucketName: BACKUP_BUCKET,
      created: true,
    };
  } catch (error) {
    // Another request may have created the bucket meanwhile.
    if (
      error?.name === "BucketAlreadyOwnedByYou" ||
      error?.name === "BucketAlreadyExists"
    ) {
      return {
        bucketName: BACKUP_BUCKET,
        created: false,
      };
    }

    throw error;
  }
};

// Retrieve ALL objects, including objects beyond the first 1,000.
const listAllObjects = async (sourceBucketName) => {
  const objects = [];
  let continuationToken;

  do {
    const response = await s3.send(
      new ListObjectsV2Command({
        Bucket: sourceBucketName,
        ContinuationToken: continuationToken,
      }),
    );

    objects.push(...(response.Contents || []));

    continuationToken = response.IsTruncated
      ? response.NextContinuationToken
      : undefined;
  } while (continuationToken);

  return objects;
};

// Back up one source bucket into a unique backup folder.
const backupBucket = async (sourceBucketName) => {
  if (typeof sourceBucketName !== "string" || !sourceBucketName.trim()) {
    throw new Error("sourceBucketName is required");
  }

  sourceBucketName = sourceBucketName.trim();

  if (sourceBucketName === BACKUP_BUCKET) {
    throw new Error("Backup bucket cannot be used as a source");
  }

  // Make sure the source bucket exists.
  await s3.send(
    new HeadBucketCommand({
      Bucket: sourceBucketName,
    }),
  );

  // Create the destination bucket if required.
  const backupBucketInfo = await ensureBackupBucket();

  // Unique ID ensures a new backup does not overwrite an older backup.
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupId = `${timestamp}-${randomUUID()}`;
  const backupPrefix = `backups/${backupId}`;

  const objects = await listAllObjects(sourceBucketName);

  const manifest = {
    backupId,
    sourceBucketName,
    backupBucketName: BACKUP_BUCKET,
    createdAt: new Date().toISOString(),
    totalObjects: objects.length,
    successfulObjects: 0,
    failedObjects: 0,
    objects: [],
  };

  for (const object of objects) {
    const sourceKey = object.Key;

    try {
      // Read the original object and its metadata from S3.
      const sourceObject = await s3.send(
        new GetObjectCommand({
          Bucket: sourceBucketName,
          Key: sourceKey,
        }),
      );

      // Preserve the original key under the source bucket's folder.
      const backupKey = `${backupPrefix}/${sourceBucketName}/${sourceKey}`;

      // Copy object content and supported metadata.
      await s3.send(
        new PutObjectCommand({
          Bucket: BACKUP_BUCKET,
          Key: backupKey,
          Body: sourceObject.Body,
          ContentLength: sourceObject.ContentLength,
          ContentType: sourceObject.ContentType,
          Metadata: sourceObject.Metadata,
          CacheControl: sourceObject.CacheControl,
          ContentDisposition: sourceObject.ContentDisposition,
          ContentEncoding: sourceObject.ContentEncoding,
          ContentLanguage: sourceObject.ContentLanguage,
          Expires: sourceObject.Expires,
          WebsiteRedirectLocation: sourceObject.WebsiteRedirectLocation,
        }),
      );

      manifest.successfulObjects += 1;

      manifest.objects.push({
        sourceKey,
        backupKey,
        size: sourceObject.ContentLength ?? object.Size ?? null,
        contentType: sourceObject.ContentType || "application/octet-stream",
        status: "success",
      });
    } catch (error) {
      manifest.failedObjects += 1;

      manifest.objects.push({
        sourceKey,
        status: "failed",
        error: error.message,
      });
    }
  }

  manifest.status = manifest.failedObjects === 0 ? "completed" : "partial";

  // Save the manifest even when some objects fail.
  const manifestKey = `${backupPrefix}/_manifest.json`;

  await s3.send(
    new PutObjectCommand({
      Bucket: BACKUP_BUCKET,
      Key: manifestKey,
      Body: JSON.stringify(manifest, null, 2),
      ContentType: "application/json",
    }),
  );

  return {
    message:
      manifest.status === "completed"
        ? "S3 backup completed successfully"
        : "S3 backup completed with some failures",
    backupId,
    sourceBucketName,
    backupBucketName: BACKUP_BUCKET,
    backupPrefix,
    manifestKey,
    totalObjects: manifest.totalObjects,
    successfulObjects: manifest.successfulObjects,
    failedObjects: manifest.failedObjects,
    status: manifest.status,
    backupBucketCreated: backupBucketInfo.created,
    failedFiles: manifest.objects.filter((item) => item.status === "failed"),
  };
};

module.exports = {
  backupBucket,
  ensureBackupBucket,
  listAllObjects,
};
