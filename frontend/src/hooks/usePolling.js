import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook untuk polling API endpoint dengan interval tertentu.
 * FR-007: Dashboard polling setiap 5 detik.
 *
 * @param {Function} apiFunction - Fungsi API yang dipanggil (dari taskApi, dll.)
 * @param {Array} args - Argumen yang diteruskan ke apiFunction
 * @param {number} delay - Interval polling dalam ms (default: 5000)
 * @returns {{ data, loading, error, refetch }}
 */
export const usePolling = (apiFunction, args = [], delay = 5000) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Simpan args & apiFunction sebagai ref agar tidak memicu re-render
  const argsRef = useRef(args);
  const fnRef = useRef(apiFunction);
  const isFirstFetch = useRef(true);

  useEffect(() => { argsRef.current = args; }, [args]);
  useEffect(() => { fnRef.current = apiFunction; }, [apiFunction]);

  const fetchData = useCallback(async () => {
    try {
      const response = await fnRef.current(...argsRef.current);
      setData(response.data.data);
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      // Hanya set loading=false sekali di awal
      if (isFirstFetch.current) {
        setLoading(false);
        isFirstFetch.current = false;
      }
    }
  }, []); // tidak ada dependensi — stabil selamanya

  useEffect(() => {
    fetchData(); // Initial fetch langsung

    const intervalId = setInterval(fetchData, delay);
    return () => clearInterval(intervalId); // Cleanup saat unmount
  }, [fetchData, delay]);

  return { data, loading, error, refetch: fetchData };
};
