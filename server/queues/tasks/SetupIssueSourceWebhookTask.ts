import { Integration } from "@server/models";
import { Hook, PluginManager } from "@server/utils/PluginManager";
import BaseTask from "./BaseTask";

type Props = {
  integrationId: string;
};

export default class SetupIssueSourceWebhookTask extends BaseTask<Props> {
  async perform({ integrationId }: Props) {
    const integration = await Integration.findByPk(integrationId);
    if (!integration) {
      return;
    }

    const plugins = PluginManager.getHooks(Hook.IssueProvider);
    const plugin = plugins.find((p) => p.value.service === integration.service);
    if (!plugin) {
      return;
    }

    await plugin.value.setupSourceWebhook(integration);
  }
}
