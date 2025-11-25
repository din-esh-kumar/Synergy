import { useState, useEffect, useCallback } from 'react';
import { dashboardService } from '../services/dashboard.service';
import { DashboardData } from '../types/dashboard.types';

export const useDashboard = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await dashboardService.getDashboardStats();
      setDashboardData(data);
      return data;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to fetch dashboard data';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return {
    dashboardData,
    loading,
    error,
    refetch: fetchDashboard,
  };
};
