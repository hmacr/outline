import {
  ColumnDef,
  useReactTable,
  getCoreRowModel,
  SortingState,
  flexRender,
  ColumnSort,
  functionalUpdate,
  Row as TRow,
  createColumnHelper,
  AccessorColumnDef,
  DisplayColumnDef,
  AccessorKeyColumnDef,
  AccessorFn,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { observer } from "mobx-react";
import { CollapsedIcon } from "outline-icons";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { useHistory, useLocation } from "react-router-dom";
import AutoSizer from "react-virtualized-auto-sizer";
import { Waypoint } from "react-waypoint";
import { FixedSizeList } from "react-window";
import styled from "styled-components";
import { s } from "@shared/styles";
import DelayedMount from "~/components/DelayedMount";
import Empty from "~/components/Empty";
import Flex from "~/components/Flex";
import NudeButton from "~/components/NudeButton";
import PlaceholderText from "~/components/PlaceholderText";
import useQuery from "~/hooks/useQuery";

type DataColumn<TData> = {
  type: "data";
  header: string;
  component: AccessorColumnDef<TData>["cell"];
  accessor: AccessorFn<TData>;
};

type ActionColumn<TData> = {
  type: "action";
  header?: string;
  component: DisplayColumnDef<TData>["cell"];
};

export type Column<TData> = { id: string; width: string } & (
  | DataColumn<TData>
  | ActionColumn<TData>
);

export type Props<TData> = {
  data: TData[];
  columns: Column<TData>[];
  sort: ColumnSort;
  loading: boolean;
  page: {
    hasNext: boolean;
    fetchNext: () => void;
  };
  row: {
    height: number;
    gridColumnsStyle: string;
  };
  resetScroll: boolean;
};

export const VirtualTable = observer(
  <TData,>({
    data,
    columns,
    sort,
    loading,
    page,
    row,
    resetScroll,
  }: Props<TData>) => {
    const { t } = useTranslation();
    const location = useLocation();
    const history = useHistory();
    const params = useQuery();
    const containerRef = React.useRef(null);

    const columnHelper = createColumnHelper<TData>();

    const transformedColumns = columns.map((column) => {
      if (column.type === "data") {
        return columnHelper.accessor(column.accessor, {
          id: column.id,
          header: column.header,
          cell: column.component,
          size: 500,
        });
      } else {
        return columnHelper.display({
          id: column.id,
          header: column.header ?? "",
          cell: column.component,
          size: 100,
        });
      }
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

    const table = useReactTable({
      data,
      columns: transformedColumns,
      getCoreRowModel: getCoreRowModel(),
      enableMultiSort: false,
      manualSorting: true,
      state: {
        sorting: [sort],
      },
      onSortingChange: handleSortChange,
    });

    const isEmpty = !loading && data.length === 0;
    const showPlaceholder = !loading && isEmpty;

    const { rows } = table.getRowModel();

    const rowVirtualizer = useVirtualizer({
      count: rows.length,
      estimateSize: () => row.height,
      getScrollElement: () => containerRef.current,
    });

    React.useEffect(() => {
      if (resetScroll) {
        rowVirtualizer.scrollToOffset?.(0);
      }
    }, [resetScroll, rowVirtualizer]);

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
                    style={{ width: header.column.getSize() }}
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
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  {tableRow.getAllCells().map((cell) => (
                    <Cell
                      key={cell.id}
                      style={{ width: cell.column.getSize() }}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </Cell>
                  ))}
                </Row>
              );
            })}
          </tbody>
          {showPlaceholder && <Placeholder columns={columns.length} />}
        </InnerTable>
        {page.hasNext && !!data.length && (
          <Waypoint key={data.length} onEnter={page.fetchNext} />
        )}
        {isEmpty && (
          // <DelayedMount>
          <Empty>{t("No results")}</Empty>
          // </DelayedMount>
        )}
      </Container>
    );
  }
);

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
        {new Array(rows).fill(1).map((_, row) => (
          <Row key={row}>
            {new Array(columns).fill(1).map((_, col) => (
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
  border-bottom: 1px solid ${s("divider")};
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
  ${Cell} {
    &:first-child {
      padding-left: 0;
    }
    &:last-child {
      padding-right: 0;
    }
  }
  &:last-child {
    ${Cell} {
      border-bottom: 0;
    }
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
