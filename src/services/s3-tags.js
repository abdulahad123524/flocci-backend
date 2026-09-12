const { s3 } = require("../config/config");
const {
  PutBucketTaggingCommand,
  GetBucketTaggingCommand,
  DeleteBucketTaggingCommand,
} = require("@aws-sdk/client-s3");

const toTagSet = (tags = []) =>
  tags
    .map((tag) => ({
      Key: String(tag.Key || tag.key || "").trim(),
      Value: String(tag.Value ?? tag.value ?? ""),
    }))
    .filter((tag) => tag.Key);

const tagsBucket = async (bucketName, tags) => {
  const tagSet = toTagSet(tags);
  if (!tagSet.length) {
    await s3.send(new DeleteBucketTaggingCommand({ Bucket: bucketName }));
    return { bucketName, tags: [] };
  }

  await s3.send(
    new PutBucketTaggingCommand({
      Bucket: bucketName,
      Tagging: { TagSet: tagSet },
    }),
  );
  return { bucketName, tags: tagSet };
};

const getBucketTags = async (bucketName) => {
  try {
    const response = await s3.send(
      new GetBucketTaggingCommand({ Bucket: bucketName }),
    );
    return {
      bucketName,
      tags: response.TagSet || [],
    };
  } catch (error) {
    if (
      error?.name === "NoSuchTagSet" ||
      error?.Code === "NoSuchTagSet" ||
      error?.$metadata?.httpStatusCode === 404
    ) {
      return { bucketName, tags: [] };
    }
    throw error;
  }
};

module.exports = {
  tagsBucket,
  getBucketTags,
};
