import { useState, useEffect } from 'react';
import marketAnalysisService from '../services/marketAnalysisService';

/**
 * Custom hook for fetching market analysis data
 */
export const useMarketData = (fetchFunction, params = {}, dependencies = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Filter out null/undefined/empty values from params
        const filteredParams = {};
        Object.keys(params).forEach(key => {
          if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
            filteredParams[key] = params[key];
          }
        });
        
        const result = await fetchFunction(filteredParams);
        setData(result);
      } catch (err) {
        setError(err.message || 'Failed to fetch data');
        console.error('Market data fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, dependencies);

  const refetch = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchFunction(params);
      setData(result);
    } catch (err) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, refetch };
};

/**
 * Hook for dashboard summary
 */
export const useDashboardSummary = (governorate = null) => {
  return useMarketData(
    marketAnalysisService.getDashboardSummary,
    { governorate },
    [governorate]
  );
};

/**
 * Hook for price trends
 */
export const usePriceTrends = (params) => {
  return useMarketData(
    marketAnalysisService.getPriceTrends,
    params,
    [params.productId, params.governorate, params.startDate, params.endDate]
  );
};

/**
 * Hook for top products
 */
export const useTopProducts = (params) => {
  return useMarketData(
    marketAnalysisService.getTopProductsByRevenue,
    params,
    [params.governorate, params.startDate, params.endDate]
  );
};

export default useMarketData;

