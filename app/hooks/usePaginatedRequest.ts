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
  /** Offset */
  offset: number;
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
  const [loading, setLoading] = React.useState(false);
  const [offset, setOffset] = React.useState(INITIAL_OFFSET);
  const [page, setPage] = React.useState(0);
  const [end, setEnd] = React.useState(false);
  const displayLimit = params.limit || DEFAULT_LIMIT;
  const fetchLimit = displayLimit + 1;
  const [paginatedReq, setPaginatedReq] = React.useState<RequestFn<T>>(
    () => async () => []
  );

  const {
    data: response,
    error,
    loading: fetching,
    request,
  } = useRequest<T[]>(paginatedReq);

  const next = React.useCallback(() => {
    setOffset((prev) => prev + displayLimit);
  }, [displayLimit]);

  React.useEffect(() => {
    setLoading(true);
    void request();
  }, [request]);

  React.useEffect(() => {
    if (response && !fetching) {
      setLoading(false);
      setData((prev) =>
        uniqBy((prev ?? []).concat(response.slice(0, displayLimit)), "id")
      );
      setPage((prev) => prev + 1);
      setEnd(response.length <= displayLimit);
    }
  }, [response, displayLimit, fetching]);

  React.useEffect(() => {
    setLoading(false);
  }, [error]);

  // Reset request when requestFn changes
  React.useEffect(() => {
    setEnd(false);
    setData(undefined);
    setPage(0);
    setOffset(0);
    setPaginatedReq(
      () => () => requestFn({ ...params, offset: 0, limit: fetchLimit })
    );
  }, [requestFn]);

  // Update request when offset changes
  React.useEffect(() => {
    if (offset) {
      setPaginatedReq(
        () => () =>
          requestFn({
            ...params,
            offset,
            limit: fetchLimit,
          })
      );
    }
  }, [offset]);

  return { data, next, loading, error, page, offset, end };
}
