import { ColumnDef, ColumnSort } from "@tanstack/react-table";
import compact from "lodash/compact";
import { observer } from "mobx-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import User from "~/models/User";
import { Avatar } from "~/components/Avatar";
import Badge from "~/components/Badge";
import Flex from "~/components/Flex";
import { NewProps, NewTable } from "~/components/Table";
import Time from "~/components/Time";
import useCurrentUser from "~/hooks/useCurrentUser";
import useQuery from "~/hooks/useQuery";
import UserMenu from "~/menus/UserMenu";

type Props = Omit<NewProps<User>, "columns" | "sort"> & {
  canManage: boolean;
};

function PeopleTable({ canManage, ...rest }: Props) {
  const { t } = useTranslation();
  const currentUser = useCurrentUser();
  const params = useQuery();

  const sort: ColumnSort = React.useMemo(
    () => ({
      id: params.get("sort") ?? "name",
      desc: (params.get("direction") ?? "asc") === "desc",
    }),
    [params]
  );

  const columns = React.useMemo<ColumnDef<User>[]>(
    () =>
      compact<ColumnDef<User>>([
        {
          id: "name",
          header: t("Name"),
          accessorKey: "name",
          cell: ({ cell, row }) => (
            <Flex align="center" gap={8}>
              <Avatar model={row.original} size={32} /> {cell.getValue()}{" "}
              {currentUser.id === row.original.id && `(${t("You")})`}
            </Flex>
          ),
          size: 200,
        },
        canManage
          ? {
              id: "email",
              header: t("Email"),
              accessorKey: "email",
              cell: ({ cell }) => <>{cell.renderValue()}</>,
              size: 300,
            }
          : undefined,
        {
          id: "lastActiveAt",
          header: t("Last active"),
          accessorKey: "lastActiveAt",
          cell: ({ cell }) =>
            cell.getValue() ? (
              <Time dateTime={cell.getValue() as string} addSuffix />
            ) : null,
          size: 300,
        },
        {
          id: "role",
          header: t("Role"),
          accessorKey: "role",
          cell: ({ row }) => (
            <Badges>
              {!row.original.lastActiveAt && <Badge>{t("Invited")}</Badge>}
              {row.original.isAdmin ? (
                <Badge primary>{t("Admin")}</Badge>
              ) : row.original.isViewer ? (
                <Badge>{t("Viewer")}</Badge>
              ) : row.original.isGuest ? (
                <Badge yellow>{t("Guest")}</Badge>
              ) : (
                <Badge>{t("Editor")}</Badge>
              )}
              {row.original.isSuspended && <Badge>{t("Suspended")}</Badge>}
            </Badges>
          ),
          size: 100,
        },
        canManage
          ? {
              id: "action",
              header: " ",
              accessorKey: "id",
              enableSorting: false,
              cell: ({ cell, row }) =>
                currentUser.id !== cell.getValue() ? (
                  <UserMenu user={row.original} />
                ) : null,
              size: 50,
            }
          : undefined,
      ]),
    [t, currentUser, canManage]
  );

  return <NewTable columns={columns} sort={sort} {...rest} />;
}

const Badges = styled.div`
  margin-left: -10px;
`;

export default observer(PeopleTable);
