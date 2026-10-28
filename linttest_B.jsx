import { useEffect, useState, useCallback } from "react";

export const Comp = () => {
  const [loading, setLoading] = useState(true);
  const [entry, setEntry] = useState(null);

  const fetchTodayEntry = useCallback(async () => {
    setLoading(true);
    try {
      const data = await Promise.resolve({ results: [] });
      setEntry(data.results[0] || null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const run = async () => {
      await fetchTodayEntry();
    };
    run();
  }, [fetchTodayEntry]);

  return null;
};
