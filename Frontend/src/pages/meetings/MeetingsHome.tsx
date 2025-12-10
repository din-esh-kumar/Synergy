// src/pages/MeetingsHome.tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Meeting } from '../../types/meetings.types';
import MeetingList from '../meetings/MeetingList';
import MeetingCalendar from '../meetings/MeetingCalendar';

export default function MeetingsHome() {
  const [activeTab, setActiveTab] = useState<'list' | 'calendar'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // ✅ FIX: Add meetings state
  const [meetings, setMeetings] = useState<Meeting[]>([]);

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <i className="fas fa-video text-white"></i>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Meetings</h1>
              <p className="text-sm text-gray-600">Manage and schedule team meetings</p>
            </div>
          </div>
          <Link
            to="/meetings/new"
            className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
          >
            <i className="fas fa-plus"></i>
            <span>New Meeting</span>
          </Link>
        </div>
      </div>

      {/* Tabs and Filters Card */}
      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="border-b border-gray-200 px-4 sm:px-6">
          <div className="flex gap-4 -mb-px overflow-x-auto">
            <button
              onClick={() => setActiveTab('list')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
                ${activeTab === 'list'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'}`}
            >
              <i className="fas fa-list mr-2"></i> List View
            </button>

            <button
              onClick={() => setActiveTab('calendar')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
                ${activeTab === 'calendar'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'}`}
            >
              <i className="fas fa-calendar-alt mr-2"></i> Calendar View
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                <input
                  type="text"
                  placeholder="Search by title or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2
                             focus:ring-blue-500 focus:border-transparent outline-none transition-shadow"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500
                           focus:border-transparent outline-none transition-shadow"
              >
                <option value="all">All Status</option>
                <option value="scheduled">Scheduled</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {activeTab === 'list' 
          ? <MeetingList searchTerm={searchTerm} statusFilter={statusFilter} />
          : <MeetingCalendar meetings={meetings} />  // ✅ FIX HERE
        }
      </div>
    </div>
  );
}
