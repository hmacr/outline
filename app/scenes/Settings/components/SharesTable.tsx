import compact from "lodash/compact";
import { observer } from "mobx-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { unicodeCLDRtoBCP47 } from "@shared/utils/date";
import Share from "~/models/Share";
import { Avatar } from "~/components/Avatar";
import Flex from "~/components/Flex";
import Time from "~/components/Time";
import {
  VirtualTable,
  type Column as TableColumn,
  type Props as TableProps,
} from "~/components/VirtualTable";
import useUserLocale from "~/hooks/useUserLocale";
import ShareMenu from "~/menus/ShareMenu";
import { formatNumber } from "~/utils/language";

type Props = Omit<TableProps<Share>, "columns" | "rowHeight"> & {
  canManage: boolean;
};

type ColumnWidths = {
  title: string;
  createdBy: string;
  createdAt: string;
  lastAccessedAt: string;
  domain: string;
  views: string;
  action: string;
};

function SharesTable({ canManage, data, ...rest }: Props) {
  const { t } = useTranslation();
  const language = useUserLocale();
  const hasDomain = data.some((share) => share.domain);

  const columnWidths = React.useMemo<ColumnWidths>(() => {
    if (canManage) {
      return {
        title: "35%",
        createdBy: "15%",
        createdAt: hasDomain ? "15%" : "20%",
        lastAccessedAt: hasDomain ? "15%" : "20%",
        domain: hasDomain ? "10%" : "0%",
        views: "5%",
        action: "5%",
      };
    }

    return {
      title: "40%",
      createdBy: "15%",
      createdAt: hasDomain ? "15%" : "20%",
      lastAccessedAt: hasDomain ? "15%" : "20%",
      domain: hasDomain ? "10%" : "0%",
      views: "5%",
      action: "0%",
    };
  }, [canManage, hasDomain]);

  const columns = React.useMemo<TableColumn<Share>[]>(
    () =>
      compact<TableColumn<Share>>([
        {
          type: "data",
          id: "title",
          header: t("Document"),
          accessor: (share) => share.documentTitle,
          sortable: false,
          component: (share) => <>{share.documentTitle}</>,
          width: columnWidths.title,
        },
        {
          type: "data",
          id: "createdBy",
          header: t("Shared by"),
          accessor: (share) => share.createdBy,
          sortable: false,
          component: (share) => (
            <Flex align="center" gap={4}>
              {share.createdBy && (
                <>
                  <Avatar model={share.createdBy} />
                  {share.createdBy.name}
                </>
              )}
            </Flex>
          ),
          width: columnWidths.createdBy,
        },
        {
          type: "data",
          id: "createdAt",
          header: t("Date shared"),
          accessor: (share) => share.createdAt,
          component: (share) =>
            share.createdAt ? (
              <Time dateTime={share.createdAt} addSuffix />
            ) : null,
          width: columnWidths.createdAt,
        },
        {
          type: "data",
          id: "lastAccessedAt",
          header: t("Last accessed"),
          accessor: (share) => share.lastAccessedAt,
          component: (share) =>
            share.lastAccessedAt ? (
              <Time dateTime={share.lastAccessedAt} addSuffix />
            ) : null,
          width: columnWidths.lastAccessedAt,
        },
        hasDomain
          ? {
              type: "data",
              id: "domain",
              header: t("Domain"),
              accessor: (share) => share.domain,
              sortable: false,
              component: (share) => <>{share.domain}</>,
              width: columnWidths.domain,
            }
          : undefined,
        {
          type: "data",
          id: "views",
          header: t("Views"),
          accessor: (share) => share.views,
          component: (share) => (
            <>
              {language
                ? formatNumber(share.views, unicodeCLDRtoBCP47(language))
                : share.views}
            </>
          ),
          width: columnWidths.views,
        },
        canManage
          ? {
              type: "action",
              id: "action",
              component: (share) => (
                <Flex align="center">
                  <ShareMenu share={share} />
                </Flex>
              ),
              width: columnWidths.action,
            }
          : undefined,
      ]),
    [t, language, hasDomain, canManage, columnWidths]
  );

  return (
    <VirtualTable data={data} columns={columns} rowHeight={50} {...rest} />
  );
}

export default observer(SharesTable);
