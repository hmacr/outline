import { ColumnSort } from "@tanstack/react-table";
import orderBy from "lodash/orderBy";
import uniqBy from "lodash/uniqBy";
import React from "react";
import {
  FetchPageParams,
  PaginatedResponse,
  PAGINATION_SYMBOL,
} from "~/stores/base/Store";
import useRequest from "./useRequest";

const INITIAL_OFFSET = 0;
const PAGE_SIZE = 25;

export type Filter<T> = {
  name: string;
  value: string;
  fn: (item: T) => boolean;
};

type Props<T> = {
  requestFn: (params: FetchPageParams) => Promise<PaginatedResponse<T>>;
  sort: ColumnSort;
  filters?: Filter<T>[];
};

type Response<T> = {
  data: T[] | undefined;
  error: unknown;
  loading: boolean;
  next?: () => Promise<void>;
};

export function useTableRequest<T = unknown>({
  requestFn,
  sort,
  filters,
}: Props<T>): Response<T> {
  const [data, setData] = React.useState<T[]>();
  const [total, setTotal] = React.useState<number>();
  const prevSortRef = React.useRef<ColumnSort>();
  const offsetRef = React.useRef(INITIAL_OFFSET);

  const fetchPage = React.useCallback(async () => {
    const filtersObj = filters?.reduce((obj, filter) => {
      obj[filter.name] = filter.value;
      return obj;
    }, {} as Record<string, string>);

    return requestFn({
      ...filtersObj,
      sort: sort.id,
      direction: sort.desc ? "DESC" : "ASC",
      offset: offsetRef.current,
      limit: PAGE_SIZE,
    });
  }, [requestFn, sort, filters]);

  const handleResponse = React.useCallback(
    (
      response: PaginatedResponse<T> | undefined,
      type: "append" | "replace"
    ) => {
      if (!response) {
        return;
      }

      if (type === "append") {
        setData((prev) => uniqBy((prev ?? []).concat(response), "id"));
      } else {
        setData(response);
      }

      setTotal(response[PAGINATION_SYMBOL]?.total);
      offsetRef.current += PAGE_SIZE;
    },
    []
  );

  const { loading, error, request } = useRequest(fetchPage);

  const next = React.useCallback(async () => {
    handleResponse(await request(), "append");
  }, [request, handleResponse]);

  React.useEffect(() => {
    const handleRequest = async () => {
      const prevSort = prevSortRef.current;
      const sortChanged =
        !prevSort || prevSort.id !== sort.id || prevSort.desc !== sort.desc;

      if (sortChanged) {
        prevSortRef.current = sort;
        offsetRef.current = INITIAL_OFFSET;
        handleResponse(await request(), "replace");
        return;
      }

      // Only filters are changed - use the available data instead of an API call (perf win).
      setData((prev) => {
        if (!prev) {
          return prev;
        }
        const filteredData = prev.filter((item) =>
          filters?.every((filter) => filter.fn(item))
        );
        offsetRef.current = filteredData.length;
        return orderBy(filteredData, sort.id, sort.desc ? "desc" : "asc");
      });
    };

    void handleRequest();
  }, [request, handleResponse, sort, filters]);

  console.log("loading", loading);

  return {
    data,
    error,
    loading,
    next: loading || !data || !total || data.length >= total ? undefined : next,
  };
}
