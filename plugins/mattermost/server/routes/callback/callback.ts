import Router from "koa-router";
import { parseDomain } from "@shared/utils/domains";
import { ValidationError } from "@server/errors";
import auth from "@server/middlewares/authentication";
import validate from "@server/middlewares/validate";
import { Team } from "@server/models";
import { APIContext } from "@server/types";
import { parseOAuthState } from "../../../shared/oauthState";
import { callbackUrl, settingsUrl } from "../../../shared/url";
import * as T from "./schema";

const router = new Router();

router.get(
  "mattermost.callback",
  auth({
    optional: true,
  }),
  validate(T.MattermostPostSchema),
  async (ctx: APIContext<T.MattermostPostReq>) => {
    const { code, state, error } = ctx.input.query;
    const { user } = ctx.state.auth;

    if (error) {
      ctx.redirect(settingsUrl({ error }));
      return;
    }

    let parsedState;
    try {
      parsedState = parseOAuthState(state);
    } catch (err) {
      throw ValidationError("Invalid state");
    }

    const { teamId, type, collectionId } = parsedState;

    if (!user) {
      if (teamId) {
        try {
          const team = await Team.findByPk(teamId, {
            rejectOnEmpty: true,
          });
          return parseDomain(ctx.host).teamSubdomain === team.subdomain
            ? ctx.redirect("/")
            : ctx.redirectOnClient(
                callbackUrl({
                  baseUrl: team.url,
                  params: ctx.request.querystring,
                })
              );
        } catch (err) {
          return ctx.redirect(settingsUrl({ error: "unauthenticated" }));
        }
      } else {
        return ctx.redirect(settingsUrl({ error: "unauthenticated" }));
      }
    }

    ctx.redirect(settingsUrl());
  }
);

export default router;
