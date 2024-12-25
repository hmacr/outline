import { ColumnSort } from "@tanstack/react-table";
import deburr from "lodash/deburr";
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
import Fade from "~/components/Fade";
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
import {
  Filter as TableFilter,
  useTableRequest,
} from "~/hooks/useTableRequestNew";
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

  const reqParams = React.useMemo(
    () => ({
      query: params.get("query") || undefined,
      filter: params.get("filter") || undefined,
      role: params.get("role") || undefined,
      sort: params.get("sort") || "name",
      direction: (params.get("direction") || "asc").toUpperCase() as
        | "ASC"
        | "DESC",
    }),
    [params]
  );
  const sort: ColumnSort = React.useMemo(
    () => ({
      id: reqParams.sort,
      desc: reqParams.direction === "DESC",
    }),
    [reqParams]
  );

  const filters = React.useMemo<TableFilter<User>[] | undefined>(() => {
    if (!reqParams.query && !reqParams.filter && !reqParams.role) {
      return;
    }

    const tableFilters: TableFilter<User>[] = [];

    if (reqParams.query) {
      const deburredQuery = deburr(reqParams.query);
      tableFilters.push({
        name: "query",
        value: reqParams.query,
        fn: (user) =>
          deburr(user.email).toLowerCase().includes(deburredQuery) ||
          deburr(user.name).toLowerCase().includes(deburredQuery),
      });
    }

    if (reqParams.filter) {
    }

    return tableFilters;
  }, [reqParams]);

  // const requestFn = React.useCallback(
  //   (paginationParams: PaginationParams) =>
  //     users.fetchPage({
  //       ...reqParams,
  //       ...paginationParams,
  //     }),
  //   [users, reqParams]
  // );

  // const { data, loading, next, end, error } = usePaginatedRequest<User>(
  //   requestFn,
  //   {
  //     limit: Pagination.defaultLimit,
  //   }
  // );

  const { data, error, loading, end, next } = useTableRequest({
    requestFn: users.fetchPage,
    sort,
    filters,
  });

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
      shrink
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
          value={reqParams.query ?? ""}
          placeholder={`${t("Filter")}…`}
          onChange={handleSearch}
        />
        <LargeUserStatusFilter
          activeKey={reqParams.filter ?? ""}
          onSelect={handleStatusFilter}
        />
        <LargeUserRoleFilter
          activeKey={reqParams.role ?? ""}
          onSelect={handleRoleFilter}
        />
      </Flex>
      <Fade>
        <PeopleTable
          data={data}
          sort={sort}
          canManage={can.update}
          loading={loading}
          page={{
            hasNext: !end,
            fetchNext: next,
          }}
        />
      </Fade>
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
