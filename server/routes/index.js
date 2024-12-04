module.exports = [
  {
    method: "POST",
    path: "/details/submit",
    handler: "myController.migrateData",
    config: {
      policies: [],
    },
  },
  {
    method: "GET",
    path: "/server-urls/get",
    handler: "myController.getUrls",
    config: {
      policies: [],
      middlewares: [],
    },
  },
  {
    method: "GET",
    path: "/content-types/get",
    handler: "myController.getContentTypes",
    config: {
      policies: [],
      middlewares: [],
    },
  },
  {
    method: "GET",
    path: "/retrieve/:collectionName/:recordId",
    handler: "myController.retrieveData",
    config: {
      auth: false,
      policies: [],
      middlewares: [],
    },
  },
  {
    method: "POST",
    path: "/validate-password",
    handler: "myController.validatePassword",
    config: {
      policies: [],
      middlewares: [],
    },
  },
  {
    method: "GET",
    path: "/migrations",
    handler: "myController.find",
    config: {
      policies: [],
    },
  },
];
