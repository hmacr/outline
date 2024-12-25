import {
  useReactTable,
  getCoreRowModel,
  SortingState,
  flexRender,
  ColumnSort,
  functionalUpdate,
  Row as TRow,
  createColumnHelper,
  AccessorFn,
  CellContext,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { observer } from "mobx-react";
import { CollapsedIcon } from "outline-icons";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { useHistory, useLocation } from "react-router-dom";
import { Waypoint } from "react-waypoint";
import styled from "styled-components";
import { s } from "@shared/styles";
import DelayedMount from "~/components/DelayedMount";
import Empty from "~/components/Empty";
import Flex from "~/components/Flex";
import NudeButton from "~/components/NudeButton";
import PlaceholderText from "~/components/PlaceholderText";
import usePrevious from "~/hooks/usePrevious";
import useQuery from "~/hooks/useQuery";

type DataColumn<TData> = {
  type: "data";
  header: string;
  accessor: AccessorFn<TData>;
  sortable?: boolean;
};

type ActionColumn = {
  type: "action";
  header?: string;
};

export type Column<TData> = {
  id: string;
  component: (data: TData) => React.ReactNode;
  width: string;
} & (DataColumn<TData> | ActionColumn);

type ColumnMeta = { width: string };

export type Props<TData> = {
  data?: TData[];
  columns: Column<TData>[];
  sort: ColumnSort;
  loading: boolean;
  page: {
    hasNext: boolean;
    fetchNext?: () => Promise<void>;
  };
  rowHeight: number;
};

export const VirtualTable = observer(function <TData>({
  data,
  columns,
  sort,
  loading,
  page,
  rowHeight,
}: Props<TData>) {
  const { t } = useTranslation();
  const location = useLocation();
  const history = useHistory();
  const params = useQuery();
  const containerRef = React.useRef(null);

  const columnHelper = createColumnHelper<TData>();
  const transformedColumns = columns.map((column) => {
    const cell = ({ row }: CellContext<TData, unknown>) => (
      <ObservedCell data={row.original} render={column.component} />
    );
    const meta: ColumnMeta = { width: column.width };

    return column.type === "data"
      ? columnHelper.accessor(column.accessor, {
          id: column.id,
          header: column.header,
          enableSorting: column.sortable ?? true,
          cell,
          meta,
        })
      : columnHelper.display({
          id: column.id,
          header: column.header ?? "",
          cell,
          meta,
        });
  });

  const handleSortChange = React.useCallback(
    (sortState: SortingState) => {
      const newState = functionalUpdate(sortState, [sort]);
      const newSort = newState[0];

      if (newSort) {
        params.set("sort", newSort.id);
        params.set("direction", newSort.desc ? "desc" : "asc");
      } else {
        params.delete("sort");
        params.delete("direction");
      }

      history.replace({
        pathname: location.pathname,
        search: params.toString(),
      });
    },
    [params, history, location.pathname, sort]
  );

  const prevSort = usePrevious(sort);
  const sortChanged = sort !== prevSort;
  const prevData = usePrevious(data, true);

  const finalData = data ?? prevData ?? [];

  const isEmpty = !loading && finalData.length === 0;
  const showPlaceholder = loading && finalData.length === 0;

  const table = useReactTable({
    data: finalData,
    columns: transformedColumns,
    getCoreRowModel: getCoreRowModel(),
    enableMultiSort: false,
    manualSorting: true,
    state: {
      sorting: [sort],
    },
    onSortingChange: handleSortChange,
  });

  const { rows } = table.getRowModel();

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    estimateSize: () => rowHeight,
    getScrollElement: () => containerRef.current,
  });

  React.useEffect(() => {
    rowVirtualizer.scrollToOffset?.(0, { behavior: "smooth" });
  }, [sortChanged, rowVirtualizer]);

  return (
    <Container ref={containerRef} $empty={isEmpty}>
      <InnerTable>
        <thead
          style={{
            position: "sticky",
            top: 0,
            zIndex: 1,
          }}
        >
          {table.getHeaderGroups().map((headerGroup) => (
            <Row key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <Head
                  key={header.id}
                  style={{
                    width: (header.column.columnDef.meta as ColumnMeta).width,
                  }}
                >
                  <SortWrapper
                    align="center"
                    $sortable={header.column.getCanSort()}
                    gap={4}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                    {header.column.getIsSorted() === "asc" ? (
                      <AscSortIcon />
                    ) : header.column.getIsSorted() === "desc" ? (
                      <DescSortIcon />
                    ) : (
                      <div />
                    )}
                  </SortWrapper>
                </Head>
              ))}
            </Row>
          ))}
        </thead>

        <tbody
          style={{
            position: "relative",
            height: `${rowVirtualizer.getTotalSize()}px`,
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const tableRow = rows[virtualRow.index] as TRow<TData>;
            return (
              <Row
                key={tableRow.id}
                data-index={virtualRow.index}
                style={{
                  position: "absolute",
                  display: "flex",
                  alignItems: "center",
                  width: "100%",
                  transform: `translateY(${virtualRow.start}px)`,
                  height: `${virtualRow.size}px`,
                }}
              >
                {tableRow.getAllCells().map((cell) => (
                  <Cell
                    key={cell.id}
                    style={{
                      width: (cell.column.columnDef.meta as ColumnMeta).width,
                    }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </Cell>
                ))}
              </Row>
            );
          })}
        </tbody>
        {showPlaceholder && <Placeholder columns={columns.length} />}
      </InnerTable>
      {page.hasNext && !loading && (
        <Waypoint key={data?.length} onEnter={page.fetchNext} />
      )}
      {isEmpty && (
        <DelayedMount>
          <Empty>{t("No results")}</Empty>
        </DelayedMount>
      )}
    </Container>
  );
});

const ObservedCell = observer(function <TData>({
  data,
  render,
}: {
  data: TData;
  render: (data: TData) => React.ReactNode;
}) {
  return <>{render(data)}</>;
});

function Placeholder({
  columns,
  rows = 3,
}: {
  columns: number;
  rows?: number;
}) {
  return (
    <DelayedMount>
      <tbody>
        {new Array(rows).fill(1).map((_r, row) => (
          <Row key={row}>
            {new Array(columns).fill(1).map((_c, col) => (
              <Cell key={col}>
                <PlaceholderText minWidth={25} maxWidth={75} />
              </Cell>
            ))}
          </Row>
        ))}
      </tbody>
    </DelayedMount>
  );
}

const DescSortIcon = styled(CollapsedIcon)`
  margin-left: -2px;

  &:hover {
    fill: ${s("text")};
  }
`;

const AscSortIcon = styled(DescSortIcon)`
  transform: rotate(180deg);
`;

const Container = styled.div<{ $empty: boolean }>`
  overflow: auto;
  height: ${({ $empty }) => !$empty && "max(700px, 70vh)"};
  width: 100%;
  margin-top: 16px;
`;

const InnerTable = styled.table`
  table-layout: fixed;
  border-collapse: collapse;
  min-width: 100%;
`;

const SortWrapper = styled(Flex)<{ $sortable: boolean }>`
  display: inline-flex;
  height: 24px;
  user-select: none;
  border-radius: 4px;
  white-space: nowrap;
  margin: 0 -4px;
  padding: 0 4px;
  cursor: ${(props) => (props.$sortable ? `var(--pointer)` : "")};

  &:hover {
    background: ${(props) =>
      props.$sortable ? props.theme.backgroundSecondary : "none"};
  }
`;

const Cell = styled.td`
  padding: 10px 6px;
  font-size: 14px;
  text-wrap: wrap;
  word-break: break-word;

  &:first-child {
    font-size: 15px;
    font-weight: 500;
  }

  &.actions,
  &.right-aligned {
    text-align: right;
    vertical-align: bottom;
  }

  &.actions {
    background: ${s("background")};
    position: sticky;
    right: 0;
  }

  ${NudeButton} {
    &:hover,
    &[aria-expanded="true"] {
      background: ${s("sidebarControlHoverBackground")};
    }
  }
`;

const Row = styled.tr`
  border-bottom: 1px solid ${s("divider")};

  ${Cell} {
    &:first-child {
      padding-left: 0;
    }
    &:last-child {
      padding-right: 0;
    }
  }
  &:last-child {
    border-bottom: 0;
  }
`;

const Head = styled.th`
  text-align: left;
  padding: 6px 6px 2px;
  border-bottom: 1px solid ${s("divider")};
  background: ${s("background")};
  font-size: 14px;
  color: ${s("textSecondary")};
  font-weight: 500;
  z-index: 1;

  :first-child {
    padding-left: 0;
  }

  :last-child {
    padding-right: 0;
  }
`;
