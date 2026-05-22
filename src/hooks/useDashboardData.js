import { useState, useEffect, useCallback, useRef } from 'react';
import dashboardService from '../services/dashboardService';
import {
  unwrapDashboardPayload,
  unwrapRealTimePayload,
} from '../utils/dashboardNormalize';

/**
 * Primary gov dashboard load — single auto-fill call.
 */
export const useAutoFillData = (params = {}, options = {}) => {
  const { days = 30, governorate, governorateId } = params;
  const { pollIntervalMs = 60000 } = options;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const requestId = useRef(0);

  const fetchData = useCallback(
    async (silent = false) => {
      const id = ++requestId.current;
      try {
        if (!silent) {
          setLoading(true);
          setError(null);
        }
        const result = await dashboardService.getAutoFillData({
          days,
          governorate,
          governorateId: governorateId || undefined,
        });
        if (id !== requestId.current) return;
        setData(unwrapDashboardPayload(result));
        setError(null);
      } catch (err) {
        if (id !== requestId.current) return;
        if (!silent) {
          setError(err.message || 'Failed to fetch dashboard data');
          setData(null);
        }
      } finally {
        if (id === requestId.current && !silent) setLoading(false);
      }
    },
    [days, governorate, governorateId]
  );

  useEffect(() => {
    fetchData(false);
    if (pollIntervalMs > 0) {
      const timer = setInterval(() => fetchData(true), pollIntervalMs);
      return () => clearInterval(timer);
    }
  }, [fetchData, pollIntervalMs]);

  return { data, loading, error, refresh: () => fetchData(false) };
};

/**
 * Real-time strip — polls every 30s by default.
 */
export const useRealTimeData = (pollIntervalMs = 30000) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;

    const fetchRealTime = async () => {
      try {
        const result = await dashboardService.getRealTimeData();
        if (!mounted.current) return;
        setData(unwrapRealTimePayload(result));
        setError(null);
      } catch (err) {
        if (!mounted.current) return;
        setError(err.message || 'Failed to fetch real-time data');
      } finally {
        if (mounted.current) setLoading(false);
      }
    };

    fetchRealTime();
    const interval = pollIntervalMs > 0 ? setInterval(fetchRealTime, pollIntervalMs) : null;

    return () => {
      mounted.current = false;
      if (interval) clearInterval(interval);
    };
  }, [pollIntervalMs]);

  return { data, loading, error };
};

/** @deprecated Use topGovernorates from auto-fill instead */
export const useMapData = (date = null) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMapData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await dashboardService.getMapData(date || undefined);
        setData(result);
      } catch (err) {
        setError(err.message || 'Failed to fetch map data');
      } finally {
        setLoading(false);
      }
    };
    fetchMapData();
  }, [date]);

  return { data, loading, error };
};

export const useDashboardKPIs = useMapData;

export default useAutoFillData;
