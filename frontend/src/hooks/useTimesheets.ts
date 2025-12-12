// src/hooks/useTimesheets.ts - TIMESHEET MANAGEMENT HOOK
import { useState } from 'react';
import * as timesheetService from '../services/timesheet.service';
import { Timesheet, TimesheetFormData, TimesheetFilters } from '../types/timesheet.types';

export const useTimesheets = () => {
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createTimesheet = async (data: TimesheetFormData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await timesheetService.createTimesheet(data);
      return response;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create timesheet');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const fetchMyTimesheets = async (filters?: TimesheetFilters) => {
    setLoading(true);
    setError(null);
    try {
      const response = await timesheetService.getMyTimesheets(filters);
      setTimesheets(response.data);
      return response;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch timesheets');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateTimesheet = async (id: string, data: Partial<TimesheetFormData>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await timesheetService.updateTimesheet(id, data);
      return response;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update timesheet');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteTimesheet = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await timesheetService.deleteTimesheet(id);
      return response;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete timesheet');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const submitTimesheet = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await timesheetService.submitTimesheet(id);
      return response;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit timesheet');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Admin functions
  const fetchAllTimesheets = async (filters?: TimesheetFilters) => {
    setLoading(true);
    setError(null);
    try {
      const response = await timesheetService.getAllTimesheets(filters);
      setTimesheets(response.data);
      return response;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch timesheets');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const approveTimesheet = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await timesheetService.approveTimesheet(id);
      return response;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to approve timesheet');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const rejectTimesheet = async (id: string, reason: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await timesheetService.rejectTimesheet(id, reason);
      return response;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reject timesheet');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    timesheets,
    loading,
    error,
    createTimesheet,
    fetchMyTimesheets,
    updateTimesheet,
    deleteTimesheet,
    submitTimesheet,
    fetchAllTimesheets,
    approveTimesheet,
    rejectTimesheet
  };
};
