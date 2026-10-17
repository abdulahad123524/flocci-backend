const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema(
  {
    filename: {
      type: String,
      required: true,
      trim: true,
    },

    bucketName: {
      type: String,
      required: true,
    },

    key: {
      type: String,
      required: true,
    },

    contentType: {
      type: String,
      default: "application/octet-stream",
    },

    size: {
      type: Number,
      default: 0,
    },

    etag: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// Same S3 object record duplicate na ho
fileSchema.index({ bucketName: 1, key: 1 }, { unique: true });

module.exports = mongoose.model("File", fileSchema);
