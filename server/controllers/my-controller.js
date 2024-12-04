"use strict";

const axios = require("axios");
let urlJoin;

(async () => {
  urlJoin = (await import("url-join")).default;
})();
const fs = require("fs");
const path = require("path");
const { parse } = require("qs");

module.exports = ({ strapi }) => ({
  async find(ctx) {
    const { page = 1, pageSize = 10 } = ctx.query;

    const result = await strapi.query("plugin::migrator.migrator").findMany({
      limit: Number(pageSize),
      offset: (Number(page) - 1) * Number(pageSize),
    });

    const totalCount = await strapi.query("plugin::migrator.migrator").count();

    ctx.send({
      data: result,
      meta: {
        pagination: {
          page: Number(page),
          pageSize: Number(pageSize),
          pageCount: Math.ceil(totalCount / pageSize),
          total: totalCount,
        },
      },
    });
  },
  index(ctx) {
    ctx.body = strapi
      .plugin("migrator")
      .service("myService")
      .getWelcomeMessage();
  },
  async getUrls(ctx) {
    const serverUrls =
      strapi.config.get("plugin.migrator.whitelistedDomains") || [];
    ctx.send({ serverUrls });
  },
  async getContentTypes(ctx) {
    const contentTypes =
      strapi.config.get("plugin.migrator.content-types") || [];
    ctx.send({ contentTypes });
  },
  async uploadMediaToLibrary(mediaUrl, folderId, fileName = null) {
    try {
      /**
       * Validates SVG content to ensure it's safe.
       * @param {string} svgContent - The content of the SVG file.
       * @returns {boolean} - Returns true if the SVG is valid and safe.
       */
      function validateSVG(svgContent) {
        try {
          // Perform basic validation (e.g., check for dangerous scripts/tags)
          const prohibitedTags = /<script[\s\S]*?>[\s\S]*?<\/script>/gi;
          const prohibitedAttributes = /(on\w+=['"][^'"]*['"])/gi;

          if (
            prohibitedTags.test(svgContent) ||
            prohibitedAttributes.test(svgContent)
          ) {
            return false;
          }
          return true; // SVG is safe
        } catch (error) {
          console.error("Error validating SVG:", error.message);
          return false;
        }
      }

      // Download the media file
      const response = await axios.get(mediaUrl, { responseType: "stream" });
      if (response.status == 404) {
        console.log(`URL:${mediaUrl}`, response.status);
        return null;
      }
      // Define the target path for the file in Strapi's uploads folder
      const uploadsFolderPath = path.join(strapi.dirs.static.public, "uploads");
      if (!fs.existsSync(uploadsFolderPath)) {
        fs.mkdirSync(uploadsFolderPath, { recursive: true });
      }

      fileName = fileName || path.basename(mediaUrl);
      const filePath = path.join(uploadsFolderPath, fileName);

      // Save the file to the uploads folder
      const writer = fs.createWriteStream(filePath);
      response.data.pipe(writer);

      // Await the file write completion
      await new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
      });

      // Calculate file size in bytes
      const fileStats = fs.statSync(filePath);
      const fileSize = fileStats.size;

      // Check if the file is an SVG
      if (response.headers["content-type"] === "image/svg+xml") {
        // Validate the SVG content for security
        const svgContent = fs.readFileSync(filePath, "utf-8");
        const isValidSVG = validateSVG(svgContent);

        if (!isValidSVG) {
          fs.unlinkSync(filePath);
          throw new Error("Invalid or potentially unsafe SVG file.");
        }
      }

      // Use Strapi's upload service to add the file to the media library
      const uploadResult = await strapi.plugins[
        "upload"
      ].services.upload.upload({
        data: { folder: folderId || null }, // Optional: Specify folder
        files: {
          path: filePath,
          name: fileName,
          type: response.headers["content-type"], // Set MIME type
          size: fileSize, // Explicitly include file size
        },
      });

      // Return the uploaded media object
      fs.unlinkSync(filePath);
      return uploadResult[0];
    } catch (error) {
      console.error(
        "Error uploading media:",
        error.message,
        `File URL: ${mediaUrl}`,
        error
      );
      return null;
    }
  },

  async createOrGetFolder(folderName) {
    // Check if folder exists
    const folder = await strapi.db
      .queryBuilder("plugin::upload.folder")
      .where({ name: folderName })
      .first()
      .execute();

    // console.log(folder);
    // const folder = await strapi.plugins["upload"].services.folder.findOne({
    //   name: folderName,
    // });

    if (folder) {
      return folder.id;
    }

    // Create the folder if it doesn't exist
    const newFolder = await strapi.plugins["upload"].services.folder.create({
      name: folderName,
    });

    return newFolder.id;
  },
  async processWidgetsRecursively(data, componentName, folderId) {
    const componentSchema = strapi.components[componentName];
    if (!componentSchema) return data;
    // let object = this;

    for (const attribute of Object.keys(data)) {
      const attributeConfig = componentSchema.attributes[attribute];
      let uploadedMedia = null;

      if (!attributeConfig || !data[attribute]) continue;
      // Handle media fields
      if (attributeConfig.type === "media" && data[attribute]) {
        if (Array.isArray(data[attribute])) {
          data[attribute] = await Promise.all(
            data[attribute].map(async (media) => {
              let checkFileExists = await strapi
                .query("plugin::upload.file")
                .findOne({
                  where: {
                    name: media.name,
                  },
                  orderBy: {
                    createdAt: "desc",
                  },
                });
              if (!checkFileExists) {
                uploadedMedia = await this.uploadMediaToLibrary(
                  urlJoin(fromUrl, media.url),
                  // urlJoin("https://admin-qa.wac345.webc.in/", media.url),
                  folderId,
                  media.name
                );
                data[attribute] = !uploadedMedia?.id ? null : uploadedMedia.id;
              } else {
                data[attribute] = checkFileExists?.id || null;

                return checkFileExists?.id || null;
              }

              return uploadedMedia?.id || null; // Link to the uploaded media ID
            })
          );
        } else {
          let checkFileExists = await strapi
            .query("plugin::upload.file")
            .findOne({
              where: {
                name: data[attribute].name,
              },
              orderBy: {
                createdAt: "desc",
              },
            });
          if (!checkFileExists) {
            uploadedMedia = await this.uploadMediaToLibrary(
              // urlJoin("https://admin-qa.wac345.webc.in", data[attribute].url),
              urlJoin(fromUrl, data[attribute].url),
              folderId,
              data[attribute].name
            );
            data[attribute] = !uploadedMedia?.id ? null : uploadedMedia.id;
          } else {
            data[attribute] = checkFileExists?.id || null;
          }
        }
      }

      // Handle nested components

      if (attributeConfig.type === "component") {
        const nestedComponentName = attributeConfig.component;
        if (Array.isArray(data[attribute])) {
          for (let i = 0; i < data[attribute].length; i++) {
            data[attribute][i] = await this.processWidgetsRecursively(
              data[attribute][i],
              nestedComponentName,
              folderId
            );
          }
        } else {
          data[attribute] = await this.processWidgetsRecursively(
            data[attribute],
            nestedComponentName,
            folderId
          );
        }
      }

      // Remove ID fields
      if (data[attribute] && attributeConfig.type === "relation") {
        const relationId = Array.isArray(data[attribute])
          ? data[attribute].map((rel) => rel.id)
          : data[attribute].id;
        const relatedEntityExists = await strapi.db
          .query(`${attributeConfig.target}`)
          .findOne({ where: { id: relationId } });
        if (!relatedEntityExists) {
          data[attribute] = Array.isArray(data[attribute]) ? [] : null;
        }
      }
    }
    // Remove the root ID if present
    if (data.id) delete data.id;

    return data;
  },
  async migrateData(ctx) {
    const { fromUrl, fromServerId, toServerId, contentType } = ctx.request.body;

    if (!fromUrl) {
      return Error("Source URL Not Found");
    }
    try {
      const migrationEntry = {
        fromUrl,
        toRecordId: toServerId,
        fromRecordId: fromServerId,
        contentType,
        status: "Pending",
        timestamp: new Date().toISOString(), // Add the current timestamp here
      };

      const migration = await strapi
        .query("plugin::migrator.migrator")
        .create({ data: migrationEntry });

      // Step 1: Fetch the record from the dev server
      const devRecord = await axios
        .get(`${fromUrl}/migrator/retrieve/${contentType}/${fromServerId}`)
        .then((response) => response.data.data);
      if (!devRecord || !devRecord.widgets) {
        return ctx.badRequest(
          `Widgets data not found for record ID ${fromServerId} in ${contentType} on the dev server`
        );
      }

      const widgetsData = devRecord.widgets;

      // Step 2: Create or get the folder in media library
      const folderId = await this.createOrGetFolder("Migrated Media");
      // Step 3: Process widgets and handle media upload

      // Process each widget in the widgets array
      for (let i = 0; i < widgetsData.length; i++) {
        const widgetComponentName = widgetsData[i].__component;
        widgetsData[i] = await this.processWidgetsRecursively(
          widgetsData[i],
          widgetComponentName,
          folderId
        );
      }
      // return widgetsData;

      // Step 4: Update the widgets field of the target record on production
      const response = await strapi.entityService.update(
        `api::${contentType}.${contentType}`,
        toServerId,
        {
          data: { widgets: widgetsData },
        }
      );
      await strapi.query("plugin::migrator.migrator").update({
        where: { id: migration.id },
        data: { status: "Completed" },
      });
      ctx.send({
        message: "Widgets with components and media migrated successfully.",
        data: response,
      });
    } catch (error) {
      await strapi.query("plugin::migrator.migrator").update({
        where: { id: migrationEntry.id },
        data: { status: "Failed", errorMessage: error.message },
      });
      console.error(
        "Error during widgets and components migration:",
        error.message
      );
      ctx.throw(500, "Migration failed");
    }
  },

  async retrieveData(ctx) {
    const { collectionName, recordId } = ctx.params;

    // Validate the collection name
    const contentType =
      strapi.contentTypes[`api::${collectionName}.${collectionName}`];
    if (
      !contentType ||
      !contentType.attributes.widgets ||
      contentType.attributes.widgets.type !== "dynamiczone"
    ) {
      return ctx.badRequest(
        `The collection ${collectionName} does not have a 'widgets' dynamic zone.`
      );
    }
    // Recursive function to add `__component` keys to components based on schema
    const addComponentKeys = (data, schema) => {
      if (data.hasOwnProperty("id")) delete data.id;
      for (const [key, value] of Object.entries(schema.attributes)) {
        if (value.type === "media") {
          // Remove `media` type fields
          if (data[key]) {
            delete data[key].formats;
          }
          continue;
        }
        if (value.type === "component" && data[key]) {
          const componentSchema = strapi.components[value.component];

          // Add `__component` key to the component data
          if (Array.isArray(data[key])) {
            data[key] = data[key].map((item) => {
              item.__component = value.component;
              return addComponentKeys(item, componentSchema);
            });
          } else {
            data[key].__component = value.component;
            addComponentKeys(data[key], componentSchema);
          }
        } else if (value.type === "dynamiczone" && data[key]) {
          // For dynamic zones, each entry needs `__component`
          data[key] = data[key].map((item) => {
            const componentSchema = strapi.components[item.__component];
            return addComponentKeys(item, componentSchema);
          });
        }
      }
      return data;
    };

    // Helper function to build the populate structure for nested components in widgets
    const buildPopulateStructure = (schema, depth = 10) => {
      if (depth === 0 || !schema) return true;

      const populate = {};

      for (const [key, attribute] of Object.entries(schema.attributes)) {
        if (attribute.type === "component") {
          populate[key] = {
            populate: buildPopulateStructure(
              strapi.components[attribute.component],
              depth - 1
            ),
          };
        } else if (attribute.type === "dynamiczone") {
          populate[key] = {
            populate: Object.fromEntries(
              attribute.components.map((component) => [
                component,
                {
                  populate: buildPopulateStructure(
                    strapi.components[component],
                    depth - 1
                  ),
                },
              ])
            ),
          };
        } else if (attribute.type === "relation") {
          populate[key] = true;
        } else if (attribute.type === "media") {
          populate[key] = true;
        }
      }

      return Object.keys(populate).length == 0 ? true : populate;
    };

    try {
      // Build the populate structure specifically for the `widgets` dynamic zone
      const widgetsPopulateStructure = {
        widgets: {
          on: Object.fromEntries(
            contentType.attributes.widgets.components.map((component) => [
              component,
              {
                populate: buildPopulateStructure(strapi.components[component]),
              },
            ])
          ),
        },
      };

      // Use the query service to retrieve the data with the custom populate structure
      const data = await strapi
        .query(`api::${collectionName}.${collectionName}`)
        .findOne({
          where: { id: recordId },
          populate: widgetsPopulateStructure,
        });

      const processedData = addComponentKeys(data, contentType);

      ctx.send({
        message: "Data retrieved successfully",
        data: processedData,
      });
    } catch (error) {
      console.error("Error retrieving data:", error.message);
      ctx.throw(500, "Failed to retrieve data");
    }
  },
  async validatePassword(ctx) {
    const { password } = ctx.request.body;
    const hardcodedPassword = "openmigratorplugin";

    if (password === hardcodedPassword) {
      ctx.send({ message: "Authorized" });
    } else {
      ctx.throw(401, "Invalid password");
      return;
    }
  },
});
