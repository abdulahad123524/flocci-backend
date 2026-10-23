const objectService = require("../services/s3-objects");
const File = require("../models/File");
const sharp = require("sharp");

const listObjects = async (req, res) => {
  try {
    const bucket = req.query.bucket;
    const objects = await objectService.listfiles(bucket);
    res.json({
      bucket: bucket || process.env.AWS_BUCKET_NAME,
      objects,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getObject = async (req, res) => {
  try {
    const file = await objectService.getfile(req.params.key, req.query.bucket);
    res.json(file);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createMultipartUpload = async (req, res) => {
  try {
    const { filename, contentType, bucketName } = req.body || {};
    if (!filename) {
      return res.status(400).json({ message: "No file name provided" });
    }
    if (!bucketName) {
      return res.status(400).json({ message: "Select a bucket first" });
    }

    const response = await objectService.multipartfile(
      {
        originalname: filename,
        mimetype: contentType || "application/octet-stream",
      },
      bucketName,
    );
    console.log("Multipart upload response:", response);

    res
      .status(200)
      .json({ message: "Multipart upload created successfully", ...response });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// const uploadObject = async (req, res) => {
//   try {
//     const { filename, content, contentType, bucketName } = req.body || {};
//     console.log("Received upload request:", {
//       filename,
//       contentType,
//       bucketName,
//     });
//     if (!filename || !content) {
//       return res.status(400).json({ message: "No file provided" });
//     }
//     if (!bucketName) {
//       return res.status(400).json({ message: "Select a bucket first" });
//     }

//     const buffer = Buffer.from(content, "base64");

//     if (!buffer.length) {
//       return res.status(400).json({ message: "File is empty" });
//     }

//     const miniType = contentType || "application/octet-stream";

//     const response = await objectService.uploadfile(
//       {
//         originalname: filename,
//         buffer,
//         mimetype: miniType,
//       },
//       bucketName,
//     );

//     let thumbnailKey = null;
//     let isImage = false;

//     const savedFile = await File.create({
//       filename,
//       bucketName,
//       key: response.key,
//       contentType: contentType || "application/octet-stream",
//       size: Buffer.length,
//       etag: response.etag || null,
//     });
//     return res
//       .status(200)
//       .json({ message: "File uploaded successfully", data: savedFile });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// const uploadObject = async (req, res) => {
//   let uploadedKey = null;
//   let uploadedThumbnailKey = null;
//   let bucketName = null;

//   try {
//     const { filename, content, contentType } = req.body || {};
//     bucketName = req.body?.bucketName;

//     if (!filename || !content) {
//       return res.status(400).json({ message: "No file provided" });
//     }

//     if (!bucketName) {
//       return res.status(400).json({ message: "Select a bucket first" });
//     }

//     if (typeof content !== "string") {
//       return res.status(400).json({
//         message: "File content must be a Base64 string",
//       });
//     }

//     // Support both plain Base64 and data:image/...;base64,... format.
//     const base64Content = content.replace(/^data:[^;]+;base64,/i, "");

//     const buffer = Buffer.from(base64Content, "base64");

//     if (!buffer.length) {
//       return res.status(400).json({ message: "File is empty" });
//     }

//     const mimeType = contentType || "application/octet-stream";

//     const originalSize = buffer.length;
//     let uploadBuffer = buffer;
//     let uploadContentType = mimeType;
//     let thumbnailKey = null;
//     let isImage = false;
//     let compression = null;

//     // Upload original file.
//     const response = await objectService.uploadfile(
//       {
//         originalname: filename,
//         buffer,
//         mimetype: mimeType,
//       },
//       bucketName,
//     );

//     uploadedKey = response.key;

//     if (mimeType.startsWith("image/")) {
//       let metadata;

//       try {
//         metadata = await sharp(buffer, {
//           limitInputPixels: 40000000,
//         }).metadata();
//       } catch (error) {
//         console.error("Image decode error:", error.message);

//         await objectService.deleteBucketobject(bucketName, uploadedKey);
//         uploadedKey = null;

//         return res.status(400).json({
//           message: "Invalid image data. Please upload a valid image.",
//         });
//       }

//       const supportedFormats = ["jpeg", "png", "webp"];

//       if (!supportedFormats.includes(metadata.format)) {
//         await objectService.deleteBucketobject(bucketName, uploadedKey);
//         uploadedKey = null;

//         return res.status(400).json({
//           message: "Only JPEG, PNG, and WebP images are supported",
//         });
//       }

//       isImage = true;

//       const thumbnailBuffer = await sharp(buffer, {
//         limitInputPixels: 40000000,
//       })
//         .rotate()
//         .resize({
//           width: 300,
//           height: 300,
//           fit: "inside",
//           withoutEnlargement: true,
//         })
//         .jpeg({ quality: 75 })
//         .toBuffer();

//       const safeName = filename
//         .split(/[\\/]/)
//         .pop()
//         .replace(/[^a-zA-Z0-9._-]/g, "_")
//         .replace(/\.[^.]+$/, "");

//       thumbnailKey = `thumbnails/${Date.now()}-${safeName || "image"}.jpg`;

//       const thumbnailResponse = await objectService.uploadfile(
//         {
//           originalname: thumbnailKey,
//           buffer: thumbnailBuffer,
//           mimetype: "image/jpeg",
//         },
//         bucketName,
//       );

//       uploadedThumbnailKey = thumbnailResponse.key;
//       thumbnailKey = thumbnailResponse.key;
//     }

//     const savedFile = await File.findOneAndUpdate(
//       {
//         bucketName,
//         key: response.key,
//       },
//       {
//         $set: {
//           filename,
//           contentType: mimeType,
//           size: buffer.length,
//           etag: response.etag || null,
//           isImage,
//           thumbnailKey,
//         },
//       },
//       {
//         new: true,
//         upsert: true,
//         runValidators: true,
//         setDefaultsOnInsert: true,
//       },
//     );

//     return res.status(201).json({
//       message: "File uploaded successfully",
//       data: savedFile,
//     });
//   } catch (error) {
//     console.error("Upload error:", error);

//     // Best-effort cleanup if a later step fails.
//     if (bucketName && uploadedThumbnailKey) {
//       try {
//         await objectService.deleteBucketobject(
//           bucketName,
//           uploadedThumbnailKey,
//         );
//       } catch (cleanupError) {
//         console.error("Thumbnail cleanup failed:", cleanupError.message);
//       }
//     }

//     if (bucketName && uploadedKey) {
//       try {
//         await objectService.deleteBucketobject(bucketName, uploadedKey);
//       } catch (cleanupError) {
//         console.error("Original cleanup failed:", cleanupError.message);
//       }
//     }

//     return res.status(500).json({
//       message: error.message || "File upload failed",
//     });
//   }
// };

const uploadObject = async (req, res) => {
  let uploadedKey = null;
  let uploadedThumbnailKey = null;
  let bucketName = null;

  try {
    const { filename, content, contentType } = req.body || {};
    bucketName = req.body?.bucketName;

    if (!filename || !content) {
      return res.status(400).json({
        message: "No file provided",
      });
    }

    if (!bucketName) {
      return res.status(400).json({
        message: "Select a bucket first",
      });
    }

    if (typeof content !== "string") {
      return res.status(400).json({
        message: "File content must be a Base64 string",
      });
    }

    // Support plain Base64 and data URL formats.
    const base64Content = content.replace(/^data:[^;]+;base64,/i, "");

    const buffer = Buffer.from(base64Content, "base64");

    if (!buffer.length) {
      return res.status(400).json({
        message: "File is empty",
      });
    }

    const mimeType = contentType || "application/octet-stream";

    const originalSize = buffer.length;
    let uploadBuffer = buffer;
    let uploadContentType = mimeType;
    let thumbnailKey = null;
    let isImage = false;
    let compression = null;

    // Validate and compress supported image formats.
    if (mimeType.startsWith("image/")) {
      let metadata;

      try {
        metadata = await sharp(buffer, {
          limitInputPixels: 40000000,
        }).metadata();
      } catch (error) {
        return res.status(400).json({
          message: "Invalid image data. Please upload a valid image.",
        });
      }

      const supportedFormats = ["jpeg", "png", "webp"];

      if (!supportedFormats.includes(metadata.format)) {
        return res.status(400).json({
          message: "Only JPEG, PNG, and WebP images are supported",
        });
      }

      // Make sure the declared MIME type matches the actual format.
      const expectedMimeTypes = {
        jpeg: ["image/jpeg", "image/jpg"],
        png: ["image/png"],
        webp: ["image/webp"],
      };

      if (
        !expectedMimeTypes[metadata.format].includes(mimeType.toLowerCase())
      ) {
        return res.status(400).json({
          message: "Image content does not match its content type",
        });
      }

      try {
        let imagePipeline = sharp(buffer, {
          limitInputPixels: 40000000,
        }).rotate();

        if (metadata.format === "jpeg") {
          imagePipeline = imagePipeline.jpeg({
            quality: 80,
            mozjpeg: true,
          });
          uploadContentType = "image/jpeg";
        } else if (metadata.format === "webp") {
          imagePipeline = imagePipeline.webp({
            quality: 80,
          });
          uploadContentType = "image/webp";
        } else {
          imagePipeline = imagePipeline.png({
            compressionLevel: 9,
            adaptiveFiltering: true,
          });
          uploadContentType = "image/png";
        }

        uploadBuffer = await imagePipeline.toBuffer();

        compression = {
          originalSize,
          compressedSize: uploadBuffer.length,
          savedBytes: originalSize - uploadBuffer.length,
          reductionPercent: Number(
            (
              ((originalSize - uploadBuffer.length) / originalSize) *
              100
            ).toFixed(2),
          ),
        };

        isImage = true;
      } catch (error) {
        console.error("Image compression error:", error.message);

        return res.status(400).json({
          message: "Image could not be processed",
        });
      }
    }

    // Upload the compressed original image (or unchanged non-image file).
    const response = await objectService.uploadfile(
      {
        originalname: filename,
        buffer: uploadBuffer,
        mimetype: uploadContentType,
      },
      bucketName,
    );

    uploadedKey = response.key;

    // Generate thumbnail from the processed original image.
    if (isImage) {
      const thumbnailBuffer = await sharp(uploadBuffer, {
        limitInputPixels: 40000000,
      })
        .rotate()
        .resize({
          width: 300,
          height: 300,
          fit: "inside",
          withoutEnlargement: true,
        })
        .jpeg({ quality: 75 })
        .toBuffer();

      const safeName = filename
        .split(/[\\/]/)
        .pop()
        .replace(/[^a-zA-Z0-9._-]/g, "_")
        .replace(/\.[^.]+$/, "");

      const thumbnailName = `thumbnails/${Date.now()}-${safeName || "image"}.jpg`;

      const thumbnailResponse = await objectService.uploadfile(
        {
          originalname: thumbnailName,
          buffer: thumbnailBuffer,
          mimetype: "image/jpeg",
        },
        bucketName,
      );

      uploadedThumbnailKey = thumbnailResponse.key;
      thumbnailKey = thumbnailResponse.key;
    }

    // Save the actual uploaded object's size.
    const savedFile = await File.findOneAndUpdate(
      {
        bucketName,
        key: response.key,
      },
      {
        $set: {
          filename,
          contentType: uploadContentType,
          size: uploadBuffer.length,
          etag: response.etag || null,
          isImage,
          thumbnailKey,
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    );

    return res.status(201).json({
      message: "File uploaded successfully",
      data: savedFile,
      ...(compression && { compression }),
    });
  } catch (error) {
    console.error("Upload error:", error);

    // Best-effort cleanup if a later step fails.
    if (bucketName && uploadedThumbnailKey) {
      try {
        await objectService.deleteBucketobject(
          bucketName,
          uploadedThumbnailKey,
        );
      } catch (cleanupError) {
        console.error("Thumbnail cleanup failed:", cleanupError.message);
      }
    }

    if (bucketName && uploadedKey) {
      try {
        await objectService.deleteBucketobject(bucketName, uploadedKey);
      } catch (cleanupError) {
        console.error("Original cleanup failed:", cleanupError.message);
      }
    }

    return res.status(500).json({
      message: error.message || "File upload failed",
    });
  }
};

const deleteBucketObject = async (req, res) => {
  try {
    const { bucketName, key } = req.body;
    if (!bucketName || !key) {
      return res
        .status(400)
        .json({ message: "bucketName and key are required" });
    }

    const file = await File.findOne({
      bucketName,
      key,
    });
    console.log("====check exist or not ", file);
    await objectService.deleteBucketobject(bucketName, key);

    if (file) {
      await File.findByIdAndDelete(file._id);
    }

    res.status(200).json({
      message: "Object deleted successfully",
      bucketName,
      key,
      metadataDeleted: Boolean(file),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const downloadFile = async (req, res) => {
  try {
    const key = req.query.key;
    const bucketName = req.query.bucketName;
    if (!key || !bucketName) {
      return res
        .status(400)
        .json({ message: "key and bucketName are required" });
    }
    const file = await objectService.downlaodFile(key, bucketName);
    const filename = key.split("/").pop() || key;
    res.setHeader("Content-Type", file.contentType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${filename.replace(/"/g, "")}"`,
    );
    res.send(file.body);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getThumbnail = async (req, res) => {
  try {
    console.log("1. Request query:", req.query);

    const { key, bucketName } = req.query;

    if (!key || !bucketName) {
      return res.status(400).json({
        message: "key and bucketName are required",
      });
    }

    console.log("2. Searching MongoDB...");

    const file = await File.findOne({
      key,
      bucketName,
    });

    console.log("3. MongoDB result:", file);

    if (!file || !file.thumbnailKey) {
      return res.status(404).json({
        message: "Thumbnail not found for this object",
      });
    }

    console.log("4. Fetching thumbnail from S3:", {
      key: file.thumbnailKey,
      bucketName: file.bucketName,
    });

    const imageUrl = await objectService.getThumbnailUrl(
      file.thumbnailKey,
      file.bucketName,
    );

    return res.status(200).json({
      message: "Thumbnail fetched successfully",
      thumbnailKey: file.thumbnailKey,
      imageUrl,
    });
  } catch (error) {
    console.error("Get thumbnail error:", error);

    return res.status(500).json({
      message: error.message || "Failed to fetch thumbnail",
    });
  }
};
module.exports = {
  listObjects,
  getObject,
  uploadObject,
  deleteBucketObject,
  downloadFile,
  createMultipartUpload,
  getThumbnail,
};
