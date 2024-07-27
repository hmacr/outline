import { InvalidRequestError } from "@server/errors";
import fetch from "@server/utils/fetch";
import { accessTokenUrl } from "../shared/url";
import { GetAccessTokenProps } from "./types";

export const getAccessToken = async (props: GetAccessTokenProps) => {
  const url = accessTokenUrl(props);
  try {
    const response = await fetch(url, { method: "post" });
    return await response.json();
  } catch (err) {
    throw InvalidRequestError(err.message);
  }
};
