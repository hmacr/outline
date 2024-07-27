export type GetAccessTokenProps =
  | {
      type: "authorization_code";
      code: string;
    }
  | {
      type: "refresh_token";
      refresh_token: string;
    };
