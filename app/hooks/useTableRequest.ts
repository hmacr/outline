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

type Filter<T> = {
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
  next: (() => void) | undefined;
};

type State<T> = {
  data: T[] | undefined;
  loading: boolean;
  error: unknown | undefined;
  offset: number;
  total: number | undefined;
};

type Action<T> =
  | { type: "fetch_next_page" }
  | { type: "update_sort"; sort: ColumnSort }
  | { type: "update_filters"; filters: Filter<T>[] };

function reducer<T>(
  params: FetchPageParams,
  action: Action<T>
): FetchPageParams {
  switch (action.type) {
    case "fetch_next_page": {
      return { ...params, offset: (params.offset || 0) + PAGE_SIZE };
    }
    case "update_sort": {
      const sort = action.sort;
      return {
        ...params,
        sort: sort.id,
        direction: sort.desc ? "DESC" : "ASC",
        offset: INITIAL_OFFSET,
      };
    }
    case "update_filters": {
      const filtersObj = action.filters?.reduce((obj, filter) => {
        obj[filter.name] = filter.value;
        return obj;
      }, {} as Record<string, string>);
      return { ...params, ...filtersObj };
    }
  }
}

export function useTableRequest<T = unknown>({
  requestFn,
  sort,
  filters,
}: Props<T>): Response<T> {
  const [data, setData] = React.useState<T[]>();
  const [total, setTotal] = React.useState<number>();
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState();

  const params = React.useMemo<FetchPageParams>(() => {
    const filtersObj = filters?.reduce((obj, filter) => {
      obj[filter.name] = filter.value;
      return obj;
    }, {} as Record<string, string>);
    return {
      ...filtersObj,
      sort: sort.id,
      direction: sort.desc ? "DESC" : "ASC",
    };
  }, [sort, filters]);

  const offset = React.useRef(INITIAL_OFFSET);

  const [offsetState, setOffsetState] = React.useState(INITIAL_OFFSET);

  const loadPage = React.useCallback(
    async (params: FetchPageParams) => {
      const response = await requestFn(params);
      setData((prev) => uniqBy((prev ?? []).concat(response), "id"));
      setTotal(response[PAGINATION_SYMBOL]?.total);
    },
    [requestFn]
  );

  const loadNextPage = () => {
    offset.current += PAGE_SIZE;
    void loadPage({
      ...params,
      offset: offset.current,
      limit: PAGE_SIZE,
    });
  };

  // When filter changes, apply the filter for the available data.
  // Load the first page if we have less than a page's worth of data.
  React.useEffect(() => {
    let loadMore = false;

    setData((prev) => {
      if (!prev) {
        return prev;
      }
      const filteredData = prev.filter((item) =>
        filters?.every((filter) => filter.fn(item))
      );
      loadMore = (filteredData.length || 0) < PAGE_SIZE;
      return orderBy(filteredData, sort.id, sort.desc ? "desc" : "asc");
    });

    if (loadMore) {
      offset.current = 0;
      void loadNextPage();
    }
  }, [loadPage, filters]);

  // When sort changes, fetch the first page of sorted data.
  React.useEffect(() => {
    offset.current = 0;
    void loadPage({
      ...filters,
      sort: sort.id,
      direction: sort.desc ? "DESC" : "ASC",
      offset: 0,
      limit: PAGE_SIZE,
    });
  }, [loadPage, sort]);

  React.useEffect(() => {
    const fetch = async () => {
      const response = await requestFn(params);
      setData((prev) => uniqBy((prev ?? []).concat(response), "id"));
      setTotal(response[PAGINATION_SYMBOL]?.total);
    };
    void fetch();
  }, [state, requestFn]);

  // on mount
  React.useEffect(() => {
    let loadMore = false;

    setData((prev) => {
      if (!prev) {
        return prev;
      }
      const filteredData = prev.filter((item) =>
        filters?.every((filter) => filter.fn(item))
      );
      loadMore = (filteredData.length || 0) < PAGE_SIZE;
      return orderBy(filteredData, sort.id, sort.desc ? "desc" : "asc");
    });

    if (loadMore) {
      offset.current = 0;
      void loadNextPage();
    }
  }, []);

  // on filter change
  React.useEffect(() => {
    setData((prev) => {
      if (!prev) {
        return prev;
      }
      const filteredData = prev.filter((item) =>
        filters?.every((filter) => filter.fn(item))
      );
      return filteredData;
    });
  }, [filters]);

  // on sort change
  React.useEffect(() => {
    setOffsetState(INITIAL_OFFSET);
  }, [sort]);

  // New approach using params

  return {
    data,
    error,
    loading,
    next: data && total && data.length < total ? loadNextPage : undefined,
  };
}
