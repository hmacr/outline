import env from "@shared/env";
import { integrationSettingsPath } from "@shared/utils/routeHelpers";

const AuthBaseUrl = `${env.MATTERMOST_SERVER_URL}/oauth/authorize`;

export const authUrl = ({ state, scope }: { state: string; scope: string }) => {
  const params: Record<string, string> = {
    response_type: "code",
    client_id: env.MATTERMOST_CLIENT_ID,
    state,
    scope,
    redirect_uri: callbackUrl(),
  };
  const urlParams = Object.keys(params)
    .map((key) => `${key}=${encodeURIComponent(params[key])}`)
    .join("&");

  return `${AuthBaseUrl}?${urlParams}`;
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
