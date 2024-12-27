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
  VirtualTable2,
  type Column as TableColumn,
  type Props as TableProps,
} from "~/components/VirtualTable2";
import useCurrentUser from "~/hooks/useCurrentUser";
import UserMenu from "~/menus/UserMenu";

type Props = Omit<TableProps<User>, "columns" | "rowHeight" | "gridColumns"> & {
  canManage: boolean;
};

function PeopleTable({ canManage, ...rest }: Props) {
  const { t } = useTranslation();
  const currentUser = useCurrentUser();

  const gridColumns = React.useMemo(() => {
    if (canManage) {
      return "4fr 4fr 2fr 1fr 0.5fr"; // all columns will be displayed.
    }
    return "4fr 2fr 1fr"; // email and action won't be displayed.
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
        },
        canManage
          ? {
              type: "data",
              id: "email",
              header: t("Email"),
              accessor: (user) => user.email,
              component: (user) => <>{user.email}</>,
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
        },
        canManage
          ? {
              type: "action",
              id: "action",
              component: (user) =>
                currentUser.id !== user.id ? <UserMenu user={user} /> : null,
            }
          : undefined,
      ]),
    [t, currentUser, canManage]
  );

  return (
    <VirtualTable2
      columns={columns}
      rowHeight={60}
      gridColumns={gridColumns}
      {...rest}
    />
  );
}

const Badges = styled(Flex)`
  margin-left: -10px;
  row-gap: 4px;
`;

export default observer(PeopleTable);
