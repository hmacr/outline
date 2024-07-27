import { observer } from "mobx-react";
import React from "react";
import { useTranslation, Trans } from "react-i18next";
import { IntegrationService, IntegrationType } from "@shared/types";
import Collection from "~/models/Collection";
import Integration from "~/models/Integration";
import Heading from "~/components/Heading";
import CollectionIcon from "~/components/Icons/CollectionIcon";
import List from "~/components/List";
import ListItem from "~/components/List/Item";
import Notice from "~/components/Notice";
import Scene from "~/components/Scene";
import Text from "~/components/Text";
import env from "~/env";
import useCurrentTeam from "~/hooks/useCurrentTeam";
import useQuery from "~/hooks/useQuery";
import useStores from "~/hooks/useStores";
import { createOAuthState } from "../shared/oauthState";
import MattermostIcon from "./Icon";
import ConnectButton from "./components/ConnectButton";
import ConnectedListItem from "./components/ConnectedListItem";

const MatterMost = () => {
  const { t } = useTranslation();
  const { collections, integrations } = useStores();
  const team = useCurrentTeam();
  const query = useQuery();
  const error = query.get("error");

  const appName = env.APP_NAME;

  const groupedCollections = collections.orderedData
    .map<[Collection, Integration | undefined]>((collection) => {
      const integration = integrations.find({
        service: IntegrationService.Mattermost,
        collectionId: collection.id,
      });

      return [collection, integration];
    })
    .sort((a) => (a[1] ? -1 : 1));

  React.useEffect(() => {
    void collections.fetchPage({
      limit: 100,
    });
    void integrations.fetchPage({
      service: IntegrationService.Slack,
      limit: 100,
    });
  }, [collections, integrations]);

  return (
    <Scene title="Mattermost" icon={<MattermostIcon />}>
      <Heading>Mattermost</Heading>

      {error && (
        <Notice>
          <Trans>
            Something went wrong while authenticating your request. Please try
            logging in again.
          </Trans>
        </Notice>
      )}

      <Heading as="h2">{t("Collections")}</Heading>
      <Text as="p" type="secondary">
        <Trans>
          Connect {{ appName }} collections to Mattermost channels.
          <br /> Messages will be automatically posted to Mattermost when
          documents are published or updated.
        </Trans>
      </Text>

      <List>
        {groupedCollections.map(([collection, integration]) => {
          if (integration) {
            return (
              <ConnectedListItem
                key={integration.id}
                collection={collection}
                integration={integration as Integration<IntegrationType.Post>}
              />
            );
          }

          return (
            <ListItem
              key={collection.id}
              title={collection.name}
              image={<CollectionIcon collection={collection} />}
              actions={
                <ConnectButton
                  state={createOAuthState({
                    teamId: team.id,
                    type: IntegrationType.Post,
                    collectionId: collection.id,
                  })}
                  scopes={["manage_incoming_webhooks"]}
                  label={t("Connect")}
                />
              }
            />
          );
        })}
      </List>
    </Scene>
  );
};

export default observer(MatterMost);
