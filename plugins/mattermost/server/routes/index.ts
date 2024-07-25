import Router from "koa-router";
import callback from "./callback";

const api = new Router();

api.use(callback.routes());

export default api;
