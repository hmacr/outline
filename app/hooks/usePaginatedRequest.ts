import uniqBy from "lodash/uniqBy";
import * as React from "react";
import { PaginationParams } from "~/types";
import useRequest from "./useRequest";

type RequestResponse<T> = {
  /** The return value of the paginated request function. */
  data: T[] | undefined;
  /** The request error, if any. */
  error: unknown;
  /** Whether the request is currently in progress. */
  loading: boolean;
  /** Function to trigger next page request. */
  next: () => void;
  /** Page number */
  page: number;
  /** Marks the end of pagination */
  end: boolean;
};

const INITIAL_OFFSET = 0;
const DEFAULT_LIMIT = 10;

type RequestFn<T> = (params?: PaginationParams | undefined) => Promise<T[]>;

/**
 * A hook to make paginated API request and track its state within a component.
 *
 * @param requestFn The function to call to make the request, it should return a promise.
 * @param params Pagination params(limit, offset etc) to be passed to requestFn.
 * @returns
 */
export default function usePaginatedRequest<T = unknown>(
  requestFn: RequestFn<T>,
  params: PaginationParams = {}
): RequestResponse<T> {
  const [data, setData] = React.useState<T[]>();
  const [page, setPage] = React.useState(0);
  const [end, setEnd] = React.useState(false);
  const [paginatedReq, setPaginatedReq] = React.useState<RequestFn<T>>(
    () => () => requestFn({ ...params, offset: 0, limit: fetchLimit })
  );
  const offset = React.useRef(INITIAL_OFFSET);
  const initial = React.useRef(true);
  const displayLimit = params.limit || DEFAULT_LIMIT;
  const fetchLimit = displayLimit + 1;

  const reset = React.useCallback(() => {
    offset.current = INITIAL_OFFSET;
    setData(undefined);
    setPage(0);
    setEnd(false);
    setPaginatedReq(
      () => () => requestFn({ ...params, offset: 0, limit: fetchLimit })
    );
  }, [requestFn]);

  const next = React.useCallback(() => {
    offset.current = offset.current + displayLimit;
    setPaginatedReq(
      () => () =>
        requestFn({
          ...params,
          offset: offset.current,
          limit: fetchLimit,
        })
    );
  }, [requestFn]);

  const {
    data: response,
    error,
    loading,
    request,
  } = useRequest<T[]>(paginatedReq);

  React.useEffect(() => {
    void request();
  }, [request]);

  React.useEffect(() => {
    if (response && !loading) {
      setData((prev) =>
        uniqBy((prev ?? []).concat(response.slice(0, displayLimit)), "id")
      );
      setPage((prev) => prev + 1);
      setEnd(response.length <= displayLimit);
    }
  }, [response, displayLimit, loading]);

  React.useEffect(() => {
    if (!initial.current) {
      reset();
    }
    initial.current = false;
  }, [requestFn]);

  return { data, next, loading, error, page, end };
}
