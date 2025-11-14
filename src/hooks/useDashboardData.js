import { useState, useEffect } from 'react';
import dashboardService from '../services/dashboardService';

/**
 * Hook for government dashboard KPIs
 */
export const useDashboardKPIs = (date = null) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchKPIs = async () => {
      try {
        setLoading(true);
        setError(null);
        // Only pass date if it's not null/undefined
        const result = await dashboardService.getKPIs(date || undefined);
        setData(result);
      } catch (err) {
        setError(err.message || 'Failed to fetch KPIs');
        console.error('KPI fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchKPIs();
  }, [date]);

  return { data, loading, error };
};

/**
 * Hook for map data
 */
export const useMapData = (date = null) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMapData = async () => {
      try {
        setLoading(true);
        setError(null);
        // Only pass date if it's not null/undefined
        const result = await dashboardService.getMapData(date || undefined);
        setData(result);
      } catch (err) {
        setError(err.message || 'Failed to fetch map data');
        console.error('Map data fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMapData();
  }, [date]);

  return { data, loading, error };
};

/**
 * Hook for auto-fill dashboard data (comprehensive)
 */
export const useAutoFillData = (params = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { days = 30, governorate } = params;

  useEffect(() => {
    const fetchAutoFillData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await dashboardService.getAutoFillData({ days, governorate });
        setData(result);
      } catch (err) {
        setError(err.message || 'Failed to fetch dashboard data');
        console.error('Auto-fill data fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAutoFillData();
  }, [days, governorate]);

  return { data, loading, error };
};

/**
 * Hook for real-time dashboard data
 */
export const useRealTimeData = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRealTimeData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await dashboardService.getRealTimeData();
        setData(result);
      } catch (err) {
        setError(err.message || 'Failed to fetch real-time data');
        console.error('Real-time data fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRealTimeData();
  }, []);

  return { data, loading, error };
};

export default useDashboardKPIs;

