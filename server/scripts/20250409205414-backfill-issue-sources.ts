import { randomInteger } from "@shared/random";
import { IntegrationService } from "@shared/types";
import { Second } from "@shared/utils/time";
import { Integration } from "@server/models";
import CacheIssueSourcesTask from "@server/queues/tasks/CacheIssueSourcesTask";

const BatchLimit = 100;
const MaxDelay = 10 * Second.ms;

export default async function main(exit = false) {
  let page = 0;

  await Integration.findAllInBatches<Integration>(
    {
      where: {
        service: IntegrationService.GitHub,
      },
      batchLimit: BatchLimit,
    },
    async (integrations) => {
      console.log(`Backfill integration issue sources… page ${page++}`);

      await Promise.all(
        integrations.map((integration) =>
          CacheIssueSourcesTask.schedule(
            { integrationId: integration.id },
            { delay: randomInteger(0, MaxDelay) }
          )
        )
      );
    }
  );

  console.log("Scheduled tasks for backfilling integration issue sources");

  if (exit) {
    process.exit(0);
  }
}

// In the test suite we import the script rather than run via node CLI
if (process.env.NODE_ENV !== "test") {
  void main(true);
}
