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

type Props<T> = {
  requestFn: (params: FetchPageParams) => Promise<PaginatedResponse<T>>;
  params: Omit<FetchPageParams, "offset" | "limit">;
};

type Response<T> = {
  data: T[] | undefined;
  error: unknown;
  loading: boolean;
  next: (() => void) | undefined;
};

export function useTableRequest<T>({
  requestFn,
  params,
}: Props<T>): Response<T> {
  const [data, setData] = React.useState<T[]>();
  const [total, setTotal] = React.useState<number>();
  const [offset, setOffset] = React.useState({ value: INITIAL_OFFSET });
  const prevParamsRef = React.useRef(params);

  const fetchPage = React.useCallback(
    () => requestFn({ ...params, offset: offset.value, limit: PAGE_SIZE }),
    [requestFn, params, offset]
  );

  const { request, loading, error } = useRequest(fetchPage);

  const next = React.useCallback(
    () =>
      setOffset((prev) => ({
        value: prev.value + PAGE_SIZE,
      })),
    []
  );

  React.useEffect(() => {
    if (prevParamsRef.current !== params) {
      prevParamsRef.current = params;
      setOffset({ value: INITIAL_OFFSET });
      return;
    }

    let ignore = false;

    const handleRequest = async () => {
      const response = await request();
      if (!response || ignore) {
        return;
      }

      if (offset.value === INITIAL_OFFSET) {
        setData(response);
      } else {
        setData((prev) => uniqBy((prev ?? []).concat(response), "id"));
      }

      setTotal(response[PAGINATION_SYMBOL]?.total);
    };

    void handleRequest();

    return () => {
      ignore = true;
    };
  }, [params, offset, request]);

  return {
    data,
    error,
    loading,
    next: !loading && data && total && data.length < total ? next : undefined,
  };
}
