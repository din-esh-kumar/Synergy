// src/hooks/useDashboard.ts
import { useState, useEffect, useCallback } from 'react';
import dashboardService, {
  NormalizedDashboardData,
} from '../services/dashboard.service';
import { DashboardStats } from '../types/dashboard.types';

interface DashboardData {
  stats: DashboardStats;
  upcomingMeetings: any[];
  recentTasks: any[];
}

export const useDashboard = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null,
  );
  const [stats, setStats] = useState<DashboardStats>({} as DashboardStats);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const payload: NormalizedDashboardData =
        await dashboardService.getDashboardStats();

      const statsData = payload.stats;

      const data: DashboardData = {
        stats: statsData,
        upcomingMeetings: payload.upcomingMeetings || [],
        recentTasks: payload.recentTasks || [],
      };

      setStats(statsData);
      setDashboardData(data);
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.message || 'Failed to fetch dashboard data';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
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
