import { useState, useEffect, useCallback } from 'react';
import dashboardService from '../services/dashboard.service';
import { DashboardData, DashboardStats } from '../types/meetings.types';

export const useDashboard = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [stats, setStats] = useState<DashboardStats>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const statsData = await dashboardService.getDashboardStats();
      
      const data: DashboardData = {
        stats: statsData,
        recentTasks: [],
      };
      
      setStats(statsData);
      setDashboardData(data);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to fetch dashboard data';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
    // Auto-refresh every minute
    const interval = setInterval(fetchDashboard, 60000);
    return () => clearInterval(interval);
  }, [fetchDashboard]);

  return {
    dashboardData,
    stats,
    loading,
    error,
    refetch: fetchDashboard,
  };
};
