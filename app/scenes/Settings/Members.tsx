import { observer } from "mobx-react";
import { PlusIcon, UserIcon } from "outline-icons";
import * as React from "react";
import { Trans, useTranslation } from "react-i18next";
import { useHistory, useLocation } from "react-router-dom";
import { toast } from "sonner";
import styled from "styled-components";
import { Pagination } from "@shared/constants";
import User from "~/models/User";
import { Action } from "~/components/Actions";
import Button from "~/components/Button";
import Flex from "~/components/Flex";
import Heading from "~/components/Heading";
import InputSearch from "~/components/InputSearch";
import Scene from "~/components/Scene";
import Text from "~/components/Text";
import { inviteUser } from "~/actions/definitions/users";
import env from "~/env";
import useActionContext from "~/hooks/useActionContext";
import useCurrentTeam from "~/hooks/useCurrentTeam";
import usePaginatedRequest from "~/hooks/usePaginatedRequest";
import usePolicy from "~/hooks/usePolicy";
import useQuery from "~/hooks/useQuery";
import useStores from "~/hooks/useStores";
import { PaginationParams } from "~/types";
import PeopleTable from "./components/PeopleTable";
import UserRoleFilter from "./components/UserRoleFilter";
import UserStatusFilter from "./components/UserStatusFilter";

function Members() {
  const location = useLocation();
  const history = useHistory();
  const team = useCurrentTeam();
  const context = useActionContext();
  const { users } = useStores();
  const { t } = useTranslation();
  const params = useQuery();
  const can = usePolicy(team);

  const query = params.get("query") || undefined;
  const filter = params.get("filter") || undefined;
  const role = params.get("role") || undefined;
  const sort = params.get("sort") || "name";
  const direction = (params.get("direction") || "asc").toUpperCase() as
    | "ASC"
    | "DESC";

  const requestFn = React.useCallback(
    (paginationParams: PaginationParams) =>
      users.fetchPage({
        sort,
        direction,
        query,
        filter,
        role,
        ...paginationParams,
      }),
    [users, sort, direction, query, filter, role]
  );

  const { data, loading, next, end, error } = usePaginatedRequest<User>(
    requestFn,
    {
      limit: Pagination.defaultLimit,
    }
  );

  React.useEffect(() => {
    if (error) {
      toast.error(t("Could not load members"));
    }
  }, [t, error]);

  const handleStatusFilter = React.useCallback(
    (f) => {
      if (f) {
        params.set("filter", f);
        params.delete("page");
      } else {
        params.delete("filter");
      }

      history.replace({
        pathname: location.pathname,
        search: params.toString(),
      });
    },
    [params, history, location.pathname]
  );

  const handleRoleFilter = React.useCallback(
    (r) => {
      if (r) {
        params.set("role", r);
        params.delete("page");
      } else {
        params.delete("role");
      }

      history.replace({
        pathname: location.pathname,
        search: params.toString(),
      });
    },
    [params, history, location.pathname]
  );

  const handleSearch = React.useCallback(
    (event) => {
      const { value } = event.target;

      if (value) {
        params.set("query", event.target.value);
        params.delete("page");
      } else {
        params.delete("query");
      }

      history.replace({
        pathname: location.pathname,
        search: params.toString(),
      });
    },
    [params, history, location.pathname]
  );

  const appName = env.APP_NAME;

  return (
    <Scene
      title={t("Members")}
      icon={<UserIcon />}
      actions={
        <>
          {can.inviteUser && (
            <Action>
              <Button
                type="button"
                data-on="click"
                data-event-category="invite"
                data-event-action="peoplePage"
                action={inviteUser}
                context={context}
                icon={<PlusIcon />}
              >
                {t("Invite people")}…
              </Button>
            </Action>
          )}
        </>
      }
      wide
    >
      <Heading>{t("Members")}</Heading>
      <Text as="p" type="secondary">
        <Trans>
          Everyone that has signed into {{ appName }} is listed here. It’s
          possible that there are other users who have access through{" "}
          {{ signinMethods: team.signinMethods }} but haven’t signed in yet.
        </Trans>
      </Text>
      <Flex gap={8}>
        <InputSearch
          short
          value={query ?? ""}
          placeholder={`${t("Filter")}…`}
          onChange={handleSearch}
        />
        <LargeUserStatusFilter
          activeKey={filter ?? ""}
          onSelect={handleStatusFilter}
        />
        <LargeUserRoleFilter
          activeKey={role ?? ""}
          onSelect={handleRoleFilter}
        />
      </Flex>
      <PeopleTable
        data={data ?? []}
        canManage={can.update}
        loading={loading}
        page={{
          size: Pagination.defaultLimit,
          hasNext: !end,
          fetchNext: next,
        }}
      />
    </Scene>
  );
}

const LargeUserStatusFilter = styled(UserStatusFilter)`
  height: 32px;
`;

const LargeUserRoleFilter = styled(UserRoleFilter)`
  height: 32px;
`;

export default observer(Members);
