import { env } from "process";
import { observer } from "mobx-react";
import { useCallback, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { useLocation, useParams } from "react-router-dom";
import styled, { ThemeProvider } from "styled-components";
import { s } from "@shared/styles";
import CollectionModel from "~/models/Collection";
import Error404 from "~/scenes/Errors/Error404";
import ClickablePadding from "~/components/ClickablePadding";
import { DocumentContextProvider } from "~/components/DocumentContext";
import Layout from "~/components/Layout";
import Sidebar from "~/components/Sidebar/Shared";
import { TeamContext } from "~/components/TeamContext";
import Text from "~/components/Text";
import useBuildTheme from "~/hooks/useBuildTheme";
import useCurrentUser from "~/hooks/useCurrentUser";
import { usePostLoginPath } from "~/hooks/useLastVisitedPath";
import useRequest from "~/hooks/useRequest";
import useStores from "~/hooks/useStores";
import { client } from "~/utils/ApiClient";
import { AuthorizationError, OfflineError } from "~/utils/errors";
import isCloudHosted from "~/utils/isCloudHosted";
import { changeLanguage, detectLanguage } from "~/utils/language";
import Loading from "../Document/components/Loading";
import ErrorOffline from "../Errors/ErrorOffline";
import Login from "../Login";
import { Document } from "./Document";

// Parse the canonical origin from the SSR HTML, only needs to be done once.
const canonicalUrl = document
  .querySelector("link[rel=canonical]")
  ?.getAttribute("href");
const canonicalOrigin = canonicalUrl
  ? new URL(canonicalUrl).origin
  : window.location.origin;

type PathParams = {
  shareId: string;
  collectionSlug?: string;
  documentSlug?: string;
};

type LocationState = {
  title?: string;
};

function useModel() {
  const { collectionSlug, documentSlug } = useParams<PathParams>();
  const { collections, documents } = useStores();
  return collectionSlug
    ? collections.get(collectionSlug)
    : documentSlug
    ? documents.get(documentSlug)
    : undefined;
}

function SharedScene() {
  const { t, i18n } = useTranslation();
  const { shareId, collectionSlug, documentSlug } = useParams<PathParams>();
  const location = useLocation<LocationState>();
  const { collections, documents, shares } = useStores();
  const user = useCurrentUser({ rejectOnEmpty: false });
  const [, setPostLoginPath] = usePostLoginPath();

  env.ROOT_SHARE_ID = shareId;

  const share = shares.get(shareId);
  const team = share?.team;
  const theme = useBuildTheme(team?.customTheme);

  const model = useModel();
  const pageTitle = model
    ? model instanceof CollectionModel
      ? model.name
      : model.title
    : undefined;

  const { request, error, loaded } = useRequest(
    useCallback(async () => {
      await Promise.all([
        shares.fetchWithSharedTree(shareId),
        collectionSlug ? collections.fetch(collectionSlug) : () => {},
        documentSlug ? documents.fetch(documentSlug) : () => {},
      ]);
    }, [shares, collections, documents, shareId, collectionSlug, documentSlug])
  );

  useEffect(() => {
    if (!user) {
      void changeLanguage(detectLanguage(), i18n);
    }
  }, [user, i18n]);

  useEffect(() => {
    client.setShareId(shareId);
    return () => client.setShareId(undefined);
  }, [shareId]);

  useEffect(() => {
    void request();
  }, [request]);

  if (!loaded) {
    return <Loading location={location} />;
  }

  if (error) {
    if (error instanceof OfflineError) {
      return <ErrorOffline />;
    } else if (error instanceof AuthorizationError) {
      setPostLoginPath(location.pathname);
      return (
        <Login>
          {(config) =>
            config?.name && isCloudHosted ? (
              <Content>
                {t(
                  "{{ teamName }} is using {{ appName }} to share documents, please login to continue.",
                  {
                    teamName: config.name,
                    appName: env.APP_NAME,
                  }
                )}
              </Content>
            ) : null
          }
        </Login>
      );
    } else {
      return <Error404 />;
    }
  }

  if (!share) {
    return <Error404 />;
  }

  return (
    <>
      <Helmet>
        <link
          rel="canonical"
          href={canonicalOrigin + location.pathname.replace(/\/$/, "")}
        />
      </Helmet>
      <TeamContext.Provider value={team}>
        <ThemeProvider theme={theme}>
          <DocumentContextProvider>
            <Layout
              title={pageTitle}
              sidebar={
                share.tree?.children.length ? (
                  <Sidebar rootNode={share.tree} shareId={shareId} />
                ) : null
              }
            >
              {model ? (
                model instanceof CollectionModel ? undefined : (
                  <Document
                    document={model}
                    shareId={share.id}
                    sharedTree={share.tree}
                  />
                )
              ) : null}
            </Layout>
            <ClickablePadding minHeight="20vh" />
          </DocumentContextProvider>
        </ThemeProvider>
      </TeamContext.Provider>
    </>
  );
}

const Content = styled(Text)`
  color: ${s("textSecondary")};
  text-align: center;
  margin-top: -8px;
`;

export default observer(SharedScene);
