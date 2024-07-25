import { Hook, PluginManager } from "@server/utils/PluginManager";
import config from "../plugin.json";
import env from "./env";
import api from "./routes";

const enabled =
  !!env.MATTERMOST_SERVER_URL &&
  !!env.MATTERMOST_CLIENT_ID &&
  !!env.MATTERMOST_CLIENT_SECRET;

if (enabled) {
  PluginManager.add([
    {
      ...config,
      type: Hook.API,
      value: api,
    },
  ]);
}
