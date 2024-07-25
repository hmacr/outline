import { IntegrationType } from "@shared/types";

export type OAuthState = {
  teamId: string;
  type: IntegrationType;
  collectionId?: string;
};

/**
 * Create a state string for use in OAuth flow
 *
 * @param teamId The team ID
 * @param type The integration type
 * @param data Additional data to include in the state
 * @returns A state string
 */
export const createOAuthState = (state: OAuthState) => JSON.stringify(state);

/**
 * Parse a state string from an OAuth flow
 *
 * @param state The state string
 * @returns The parsed state
 */
export const parseOAuthState = (state: string): OAuthState => JSON.parse(state);
