import { DateTime } from "luxon";
import { useEffect, useState } from "react";

export const useNow = () => {
  const [now, setNow] = useState(DateTime.local());
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(DateTime.local());
    }, 1_000);
    return () => clearInterval(interval);
  }, []);
  return now;
};
