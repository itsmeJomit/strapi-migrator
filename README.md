
# **Strapi Plugin: Migrator**

The Migrator plugin for Strapi allows you to migrate content between Strapi instances with ease, track migration history, and manage data seamlessly.

---

## **Installation**

Install the plugin using your preferred package manager:

### Using npm:

```bash
npm install strapi-plugin-migrator
```

### Using yarn:

```bash
yarn add strapi-plugin-migrator
```

---

## **Usage**

1. **Activate the Plugin**  
   Once installed, the plugin will appear in the **Plugins** section of your Strapi admin panel. Open the "Migrator" plugin to access its features.
   
   Add the plugin to your ./config/plugins.js file:

      ```javascript
      module.exports = {
          migrator: {
            enabled: true,
            resolve: "./src/plugins/migrator",
            config: {
               whitelistedDomains: [
               "https://admin.strapi.com",
               "http://localhost:1336",
               ],
               "content-types": ["service", "work", "awards-listing"],
            },
         },
      };

      ```

2. **Migration Setup**  
   - Select the source and target server details.
   - Choose the content type you wish to migrate.
   - (Optional) Include media in your migrations using the "Include Media" checkbox.

3. **Track Migration History**  
   - View previous migrations in the plugin interface.
   - Use the paginated history modal to browse through migration records.

---

## **Features**

- Seamless content migration between Strapi instances.
- Migration history with detailed records.
- Paginated modal for better history navigation.

---



## **Contributing**

Contributions are welcome! If you'd like to improve this plugin, please fork the repository and submit a pull request. For major changes, please open an issue first to discuss what you would like to change.

---

## **License**

This plugin is licensed under the **MIT License**. See the `LICENSE` file for more details.

---

## **Support**

For questions or issues, feel free to open an issue on GitHub or reach out via the Strapi community.

--- 
