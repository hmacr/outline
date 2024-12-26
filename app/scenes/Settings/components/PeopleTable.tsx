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
          component: (user) => (
            <Flex align="center" gap={8}>
              <Avatar model={user} size={32} /> {user.name}{" "}
              {currentUser.id === user.id && `(${t("You")})`}
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
              component: (user) => <>{user.email}</>,
              width: "35%",
            }
          : undefined,
        {
          type: "data",
          id: "lastActiveAt",
          header: t("Last active"),
          accessor: (user) => user.lastActiveAt,
          component: (user) =>
            user.lastActiveAt ? (
              <Time dateTime={user.lastActiveAt} addSuffix />
            ) : null,
          width: "13%",
        },
        {
          type: "data",
          id: "role",
          header: t("Role"),
          accessor: (user) => user.role,
          component: (user) => (
            <Badges wrap>
              {!user.lastActiveAt && <Badge>{t("Invited")}</Badge>}
              {user.isAdmin ? (
                <Badge primary>{t("Admin")}</Badge>
              ) : user.isViewer ? (
                <Badge>{t("Viewer")}</Badge>
              ) : user.isGuest ? (
                <Badge yellow>{t("Guest")}</Badge>
              ) : (
                <Badge>{t("Editor")}</Badge>
              )}
              {user.isSuspended && <Badge>{t("Suspended")}</Badge>}
            </Badges>
          ),
          width: "13%",
        },
        canManage
          ? {
              type: "action",
              id: "action",
              component: (user) =>
                currentUser.id !== user.id ? <UserMenu user={user} /> : null,
              width: "4%",
            }
          : undefined,
      ]),
    [t, currentUser, canManage]
  );

  return <VirtualTable columns={columns} rowHeight={60} {...rest} />;
}

const Badges = styled(Flex)`
  margin-left: -10px;
`;

export default observer(PeopleTable);
