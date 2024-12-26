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

  const columnWidths = React.useMemo(() => {
    if (canManage) {
      return {
        name: "35%",
        email: "35%",
        lastActiveAt: "15%",
        role: "10%",
        action: "5%",
      };
    }

    return {
      name: "50%",
      email: "0%",
      lastActiveAt: "30%",
      role: "20%",
      action: "0%",
    };
  }, [canManage]);

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
          width: columnWidths["name"],
        },
        canManage
          ? {
              type: "data",
              id: "email",
              header: t("Email"),
              accessor: (user) => user.email,
              component: (user) => <>{user.email}</>,
              width: columnWidths["email"],
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
          width: columnWidths["lastActiveAt"],
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
          width: columnWidths["role"],
        },
        canManage
          ? {
              type: "action",
              id: "action",
              component: (user) =>
                currentUser.id !== user.id ? <UserMenu user={user} /> : null,
              width: columnWidths["action"],
            }
          : undefined,
      ]),
    [t, currentUser, canManage, columnWidths]
  );

  return <VirtualTable columns={columns} rowHeight={60} {...rest} />;
}

const Badges = styled(Flex)`
  margin-left: -10px;
`;

export default observer(PeopleTable);
