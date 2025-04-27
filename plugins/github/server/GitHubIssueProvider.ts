import { Endpoints } from "@octokit/types";
import { RepositoryEvent } from "@octokit/webhooks-types";
import { IssueSource } from "@shared/schema";
import { IntegrationService, IntegrationType } from "@shared/types";
import Logger from "@server/logging/Logger";
import { Integration } from "@server/models";
import { sequelize } from "@server/storage/database";
import { BaseIssueProvider } from "@server/utils/BaseIssueProvider";
import { GitHub } from "./github";

// This is needed to handle Octokit paginate response type mismatch.
type ReposForInstallation =
  Endpoints["GET /installation/repositories"]["response"]["data"]["repositories"];

export class GitHubIssueProvider extends BaseIssueProvider {
  constructor() {
    super(IntegrationService.GitHub);
  }

  async fetchSources(
    integration: Integration<IntegrationType.Embed>
  ): Promise<IssueSource[]> {
    const client = await GitHub.authenticateAsInstallation(
      integration.settings.github!.installation.id
    );

    const sources: IssueSource[] = [];

    for await (const response of client.requestRepos()) {
      const repos = response.data as unknown as ReposForInstallation;
      sources.push(
        ...repos.map<IssueSource>((repo) => ({
          id: String(repo.id),
          name: repo.name,
          owner: { id: String(repo.owner.id), name: repo.owner.login },
          service: IntegrationService.GitHub,
        }))
      );
    }

    return sources;
  }

  async setupSourceWebhook(
    integration: Integration<IntegrationType.Embed>
  ): Promise<void> {
    const client = await GitHub.authenticateAsInstallation(
      integration.settings.github!.installation.id
    );

    const orgName = integration.settings.github!.installation.account.name;

    try {
      await client.setupReposWebhook(orgName);
    } catch (err) {
      if ("status" in err && err.status === 422) {
        Logger.info(
          "task",
          `GitHub repository webhook already exists for org: ${orgName}`
        );
        return;
      }
      throw err;
    }
  }

  async processSourceWebhook({
    payload,
    headers,
  }: {
    payload: Record<string, unknown>;
    headers: Record<string, unknown>;
  }) {
    const eventName = headers["x-github-event"] as string;
    const accountId = headers["x-github-hook-installation-target-id"] as string;

    if (eventName !== "repository") {
      Logger.info("task", `Ignoring non-repository event: ${eventName}`);
      return;
    }

    if (!accountId) {
      Logger.warn(
        "Missing installation-target-id header in received GitHub webhook"
      );
      return;
    }

    await sequelize.transaction(async (transaction) => {
      const integration = await Integration.findOne({
        where: {
          service: IntegrationService.GitHub,
          "settings.github.installation.account.id": accountId,
        },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!integration) {
        return;
      }

      let modified = false;
      let newIssueSources = integration.issueSources ?? [];
      const event = payload as unknown as RepositoryEvent;

      switch (event.action) {
        case "created": {
          newIssueSources.push({
            id: String(event.repository.id),
            name: event.repository.name,
            owner: {
              id: String(event.repository.owner.id),
              name: event.repository.owner.login,
            },
            service: IntegrationService.GitHub,
          });
          modified = true;
          break;
        }

        case "deleted": {
          newIssueSources = newIssueSources.filter(
            (source) => source.id !== String(event.repository.id)
          );
          modified = true;
          break;
        }

        case "renamed": {
          const existingSourceIndex = newIssueSources.findIndex(
            (source) => source.id === String(event.repository.id)
          );
          if (existingSourceIndex !== -1) {
            newIssueSources[existingSourceIndex].name = event.repository.name;
            modified = true;
          }
          break;
        }

        default:
          Logger.info(
            "task",
            `Uninterested GitHub repository webhook event: ${event.action}`
          );
      }

      if (modified) {
        integration.issueSources = newIssueSources;
        integration.changed("issueSources", true);
        await integration.save({ transaction });
      }
    });
  }
}
