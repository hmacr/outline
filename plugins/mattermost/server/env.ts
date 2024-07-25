import { IsOptional } from "class-validator";
import { Environment } from "@server/env";
import { Public } from "@server/utils/decorators/Public";
import environment from "@server/utils/environment";
import { CannotUseWithout } from "@server/utils/validators";

class MattermostEnvironment extends Environment {
  /**
   * Mattermost server url where it's hosted.
   */
  @Public
  @IsOptional()
  public MATTERMOST_SERVER_URL = this.toOptionalString(
    environment.MATTERMOST_SERVER_URL
  );

  @Public
  @IsOptional()
  public MATTERMOST_CLIENT_ID = this.toOptionalString(
    environment.MATTERMOST_CLIENT_ID
  );

  @Public
  @IsOptional()
  @CannotUseWithout("MATTERMOST_CLIENT_ID")
  public MATTERMOST_CLIENT_SECRET = this.toOptionalString(
    environment.MATTERMOST_CLIENT_SECRET
  );
}

export default new MattermostEnvironment();
