import { User } from "@server/models";
import Reaction from "@server/models/Reaction";
import { allow } from "./cancan";
import { isOwner } from "./utils";

allow(User, "delete", Reaction, (actor, reaction) => isOwner(actor, reaction));
