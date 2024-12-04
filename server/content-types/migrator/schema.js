module.exports = {
  kind: "collectionType",
  collectionName: "migrator",
  info: {
    displayName: "Migrator",
    description: "Tracks details of all completed migrations",
    singularName: "migrator",
    pluralName: "migrators",
  },
  attributes: {
    fromUrl: {
      type: "string",
      required: true,
    },
    fromRecordId: {
      type: "string",
      required: true,
    },
    toRecordId: {
      type: "string",
      required: true,
    },
    contentType: {
      type: "string",
      required: true,
    },
    status: {
      type: "string",
      default: "Pending",
      enum: ["Pending", "Completed", "Failed"],
    },
    errorMessage: {
      type: "text",
    },
    timestamp: {
      type: "datetime",
      required: true,
    },
  },
};
