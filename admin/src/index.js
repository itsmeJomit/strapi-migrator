// Auto-generated component
import PluginIcon from "./components/PluginIcon";
import pluginId from "./pluginId";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

export default {
  register(app) {
    app.addMenuLink({
      to: `/plugins/${pluginId}`,
      icon: PluginIcon,
      intlLabel: {
        id: `${pluginId}.plugin.name`,
        defaultMessage: "Migrator",
      },
      Component: async () => {
        const component = await import(
          /* webpackChunkName: "my-plugin" */ "./pages/App"
        );

        return component;
      },
      permissions: [], // array of permissions (object), allow a user to access a plugin depending on its permissions
    });
    app.registerPlugin({
      id: pluginId,
      name,
    });
  },
};
