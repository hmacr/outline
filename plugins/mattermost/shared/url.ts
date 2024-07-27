import env from "@shared/env";
import { integrationSettingsPath } from "@shared/utils/routeHelpers";
import { GetAccessTokenProps } from "../server/types";

const AuthBaseUrl = `${env.MATTERMOST_SERVER_URL}/oauth/authorize`;
const AccessTokenBaseUrl = `${env.MATTERMOST_SERVER_URL}/oauth/access_token`;

export const authUrl = ({
  state,
  scopes,
}: {
  state: string;
  scopes: string[];
}) => {
  const params = new URLSearchParams({
    response_type: "code",
    state,
    scope: scopes.join(" "),
    client_id: env.MATTERMOST_CLIENT_ID,
    redirect_uri: callbackUrl(),
  });
  return `${AuthBaseUrl}?${params}`;
};

export const accessTokenUrl = (props: GetAccessTokenProps) => {
  const params: Record<string, string> = {
    grant_type: props.type,
    client_id: env.MATTERMOST_CLIENT_ID,
    client_secret: env.MATTERMOST_CLIENT_SECRET,
    redirect_uri: callbackUrl(),
  };

  if (props.type === "authorization_code") {
    params["code"] = props.code;
  } else {
    params["refresh_token"] = props.refresh_token;
  }

  return `${AccessTokenBaseUrl}?${new URLSearchParams(params)}`;
};

export const callbackUrl = (
  { baseUrl, params }: { baseUrl: string; params?: string } = {
    baseUrl: env.URL,
  }
) =>
  params
    ? `${baseUrl}/api/mattermost.callback?${params}`
    : `${baseUrl}/api/mattermost.callback`;

export const settingsUrl = ({ error }: { error?: string } = {}) =>
  error
    ? integrationSettingsPath(`mattermost?error=${error}`)
    : integrationSettingsPath("mattermost");
