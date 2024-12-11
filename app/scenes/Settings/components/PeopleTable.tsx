import compact from "lodash/compact";
import { observer } from "mobx-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import User from "~/models/User";
import { Avatar } from "~/components/Avatar";
import Badge from "~/components/Badge";
import Flex from "~/components/Flex";
import Time from "~/components/Time";
import {
  VirtualTable,
  type Column as TableColumn,
  type Props as TableProps,
} from "~/components/VirtualTable";
import useCurrentUser from "~/hooks/useCurrentUser";
import UserMenu from "~/menus/UserMenu";

type Props = Omit<TableProps<User>, "columns" | "rowHeight"> & {
  canManage: boolean;
};

function PeopleTable({ canManage, ...rest }: Props) {
  const { t } = useTranslation();
  const currentUser = useCurrentUser();

  const columns = React.useMemo<TableColumn<User>[]>(
    () =>
      compact<TableColumn<User>>([
        {
          type: "data",
          id: "name",
          header: t("Name"),
          accessor: (user) => user.name,
          component: ({ cell, row }) => (
            <Flex align="center" gap={8}>
              <Avatar model={row.original} size={32} /> {cell.getValue()}{" "}
              {currentUser.id === row.original.id && `(${t("You")})`}
            </Flex>
          ),
          width: "35%",
        },
        canManage
          ? {
              type: "data",
              id: "email",
              header: t("Email"),
              accessor: (user) => user.email,
              component: ({ cell }) => <>{cell.renderValue()}</>,
              width: "35%",
            }
          : undefined,
        {
          type: "data",
          id: "lastActiveAt",
          header: t("Last active"),
          accessor: (user) => user.lastActiveAt,
          component: ({ cell }) =>
            cell.getValue() ? (
              <Time dateTime={cell.getValue() as string} addSuffix />
            ) : null,
          width: "15%",
        },
        {
          type: "data",
          id: "role",
          header: t("Role"),
          accessor: (user) => user.role,
          component: ({ row }) => (
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
          width: "10%",
        },
        canManage
          ? {
              type: "action",
              id: "action",
              component: ({ cell, row }) =>
                currentUser.id !== cell.getValue() ? (
                  <UserMenu user={row.original} />
                ) : null,
              width: "5%",
            }
          : undefined,
      ]),
    [t, currentUser, canManage]
  );

  return <VirtualTable columns={columns} rowHeight={60} {...rest} />;
}

const Badges = styled.div`
  margin-left: -10px;
`;

export default observer(PeopleTable);
