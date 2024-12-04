import React from "react";
import { useLocation } from "react-router-dom";

export default function useQuery() {
  const location = useLocation();

  React.useEffect(() => {
    console.log("location changed");
  }, [location]);

  const query = React.useMemo(
    () => new URLSearchParams(location.search),
    [location]
  );

  return query;
}
