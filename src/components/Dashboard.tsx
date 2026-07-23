import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Cell, } from 'recharts';
import type { Category, FeedbackItem } from '../types';
import DynamicIcon from './DynamicIcon';
import { MessageSquare, ArrowRight, Calendar, Filter, Send, Cloud, CloudOff } from 'lucide-react';

interface DashboardProps {
  categories: Category[];
  feedback: FeedbackItem[];
  onViewFeedback: (id: string) => void;
}

export default function Dashboard({ categories, feedback, onViewFeedback }: DashboardProps) {
  // Filters for recent feedback
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Colors for charts
  const COLORS = ['#3b82f6', '#818cf8', '#6366f1', '#4f46e5', '#312e81'];

  // 1. Calculate General KPI Totals
  const stats = useMemo(() => {
    const total = feedback.length;
    const sentToSystemA = feedback.filter((f) => f.sentToSystemA).length;
    const pendingSystemA = total - sentToSystemA;
    const repliedToCustomer = feedback.filter((f) => f.repliedToCustomer).length;
    const pendingReply = total - repliedToCustomer;
    
    return { total, sentToSystemA, pendingSystemA, repliedToCustomer, pendingReply };
  }, [feedback]);

  // 2. Category Summary Cards Data
  const categorySummary = useMemo(() => {
    return categories.map((cat) => {
      const catFeedback = feedback.filter((f) => f.categoryCode === cat.code);
      const totalCount = catFeedback.length;
      
      const sentCount = catFeedback.filter((f) => f.sentToSystemA).length;
      const pendingSyncCount = totalCount - sentCount;
      const repliedCount = catFeedback.filter((f) => f.repliedToCustomer).length;

      return {
        ...cat,
        totalCount,
        sentCount,
        pendingSyncCount,
        repliedCount
      };
    });
  }, [categories, feedback]);

  // 3. Recharts Data - Feedback Volume by Category (Bar Chart)
  const categoryChartData = useMemo(() => {
    return categories.map((cat) => {
      const catFeedback = feedback.filter((f) => f.categoryCode === cat.code);
      return {
        name: cat.name,
        code: cat.code,
        Count: catFeedback.length,
      };
    });
  }, [categories, feedback]);

  // 5. Recharts Data - Trend Line Over Time
  const trendChartData = useMemo(() => {
    // Group feedback by day
    const datesMap: { [date: string]: number } = {};
    
    feedback.forEach((f) => {
      // Extract date string YYYY-MM-DD
      const dateStr = f.submittedDate.split('T')[0];
      datesMap[dateStr] = (datesMap[dateStr] || 0) + 1;
    });

    // Get unique dates sorted chronologically
    const sortedDates = Object.keys(datesMap).sort();

    return sortedDates.map((dateStr) => {
      // Reformat date string for display (e.g., "Jul 11")
      const dateObj = new Date(dateStr);
      const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
      return {
        date: formattedDate,
        Volume: datesMap[dateStr],
      };
    });
  }, [feedback]);

  // 6. Recent Feedback Table Filtered
  const filteredRecentFeedback = useMemo(() => {
    return feedback
      .filter((f) => {
        const matchesCat = filterCategory === 'all' || f.categoryCode === filterCategory;
        let matchesStatus = true;
        if (filterStatus === 'sent_a') {
          matchesStatus = f.sentToSystemA;
        } else if (filterStatus === 'pending_a') {
          matchesStatus = !f.sentToSystemA;
        } else if (filterStatus === 'replied') {
          matchesStatus = f.repliedToCustomer;
        } else if (filterStatus === 'pending_reply') {
          matchesStatus = !f.repliedToCustomer;
        }
        return matchesCat && matchesStatus;
      })
      .sort((a, b) => new Date(b.submittedDate).getTime() - new Date(a.submittedDate).getTime())
      .slice(0, 5); // Grab up to 5 recent items for compact desktop display
  }, [feedback, filterCategory, filterStatus]);

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Page Title & Tagline Header (Outside of any boxes/cards) */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-xs text-slate-500 mt-1">Monitor consolidated hospitality and amusement feedback metrics across resort sectors</p>
      </div>

      {/* Two Column Layout: Left (Charts & Table), Right (Categories List) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch h-85">
        {/* Left Column (Charts and Recent Table) */}
        <div className="lg:col-span-2 h-full space-y-4">
          {/* Main KPI Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Feedback Card */}
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Total Feedback</span>
                <div className="text-xl font-bold text-slate-900">{stats.total}</div>
              </div>
              <div className="h-9 w-9 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                <MessageSquare className="h-4.5 w-4.5" />
              </div>
            </div>

            {/* Pending Sync Card */}
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Pending Sync</span>
                <div className="text-xl font-bold text-red-600">{stats.pendingSystemA}</div>
              </div>
              <div className="h-9 w-9 bg-red-50 text-red-600 rounded-lg flex items-center justify-center">
                <CloudOff className="h-4.5 w-4.5 animate-pulse" />
              </div>
            </div>

            {/* Synced Card */}
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Synced</span>
                <div className="text-xl font-bold text-emerald-600">{stats.sentToSystemA}</div>
              </div>
              <div className="h-9 w-9 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
                <Cloud className="h-4.5 w-4.5" />
              </div>
            </div>

            {/* Replied Card */}
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Replied</span>
                <div className="text-xl font-bold text-blue-600">{stats.repliedToCustomer}</div>
              </div>
              <div className="h-9 w-9 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                <Send className="h-4.5 w-4.5 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Trend Line Chart */}
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-slate-900 text-xs">Feedback Submissions Trend</h3>
                  <p className="text-[10px] text-slate-400">Daily survey submissions</p>
                </div>
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
              </div>
              <div className="h-40">
                {trendChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendChartData} margin={{ top: 5, right: 15, left: -25, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#64748b' }} stroke="#cbd5e1" />
                      <YAxis tick={{ fontSize: 9, fill: '#64748b' }} stroke="#cbd5e1" allowDecimals={false} />
                      <Tooltip contentStyle={{ fontSize: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }} />
                      <Line type="monotone" dataKey="Volume" stroke="#4f46e5" strokeWidth={2} activeDot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-[10px] text-slate-400">
                    No recent chronological trend data.
                  </div>
                )}
              </div>
            </div>

            {/* Volume by Category Bar Chart */}
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-slate-900 text-xs">Volume by Category</h3>
                  <p className="text-[10px] text-slate-400">Submissions per category code</p>
                </div>
                <Filter className="h-3.5 w-3.5 text-slate-400" />
              </div>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryChartData} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="code" tick={{ fontSize: 9, fill: '#64748b' }} stroke="#cbd5e1" />
                    <YAxis tick={{ fontSize: 9, fill: '#64748b' }} stroke="#cbd5e1" allowDecimals={false} />
                    <Tooltip contentStyle={{ fontSize: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }} />
                    <Bar dataKey="Count" fill="#3b82f6" radius={[3, 3, 0, 0]}>
                      {categoryChartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Categories List Overview (Scrollable leaderboard format) */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm flex flex-col overflow-auto">
          <div className="p-4 shrink-0">
            <h3 className="font-semibold text-slate-900 text-xs">Categories Overview</h3>
            <p className="text-[10px] text-slate-400">Operational performance per resort category</p>
          </div>
          
          <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2.5">
            {categorySummary.map((cat) => (
              <div
                key={cat.id}
                className="flex flex-col p-2.5 rounded-lg border border-slate-100 bg-slate-50/40 hover:bg-slate-50 transition-all text-xs"
              >
                {/* Header: Icon, Name, Code & Stats */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="h-7 w-7 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
                      <DynamicIcon name={cat.icon} className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-800 truncate text-[11px] leading-tight">{cat.name}</h4>
                      <span className="font-mono text-[8px] font-bold text-slate-400 uppercase tracking-wider">{cat.code}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[9px] text-slate-400 font-medium">{cat.totalCount} submissions</span>
                  </div>
                </div>

                {/* Sub row: Count values per status */}
                <div className="mt-2 pt-1.5 border-t border-slate-100/60 flex items-center justify-between text-[9px] text-slate-400 font-medium">
                  <span className="flex items-center gap-1" title="Pending Sync">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500"></span> {cat.pendingSyncCount}
                  </span>
                  <span className="flex items-center gap-1" title="Synced">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span> {cat.sentCount}
                  </span>
                  <span className="flex items-center gap-1" title="Replied">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span> {cat.repliedCount}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Tickets Table */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col justify-between w-full h-70 overflow-x-auto">
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
            <div>
              <h3 className="font-semibold text-slate-900 text-xs">Recent Feedback Submissions</h3>
              <p className="text-[10px] text-slate-400">Live feed of latest customer submissions</p>
            </div>
            
            {/* Quick Filters */}
            <div className="flex gap-2 text-[10px]">
              <select
                id="dashboard-filter-category"
                className="bg-slate-50 border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.code}>{c.name}</option>
                ))}
              </select>

              <select
                id="dashboard-filter-status"
                className="bg-slate-50 border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="pending_a">Pending Sync</option>
                <option value="sent_a">Synced</option>
                <option value="pending_reply">Pending Reply</option>
                <option value="replied">Replied</option>
              </select>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            <table className="min-w-full text-[11px]">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase text-[9px] tracking-wider text-left bg-slate-50/50">
                  <th className="py-2 px-2.5">Feedback ID</th>
                  <th className="py-2 px-2.5">Customer Name</th>
                  <th className="py-2 px-2.5">Category</th>
                  <th className="py-2 px-2.5">Feedback Form</th>
                  <th className="py-2 px-2.5">Status</th>
                  <th className="py-2 px-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecentFeedback.length > 0 ? (
                  filteredRecentFeedback.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="py-1.5 px-2.5 font-mono font-semibold text-blue-600">{item.id}</td>
                      <td className="py-1.5 px-2.5 font-medium text-slate-800">{item.customerName}</td>
                      <td className="py-1.5 px-2.5">
                        <span className="inline-flex items-center bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-medium text-[9px] tracking-wider uppercase">
                          {item.categoryCode}
                        </span>
                      </td>
                      <td className="py-1.5 px-2.5">
                        <span className="inline-flex items-center bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-medium text-[9px] tracking-wider uppercase">
                          {item.formname}
                        </span>
                      </td>
                      <td className="py-1.5 px-2.5">
                        <div className="flex flex-wrap gap-1 justify-start">
                          {item.sentToSystemA ? (
                            <span className="inline-flex items-center bg-emerald-50 text-emerald-700 border border-emerald-100 px-1.5 py-0.5 rounded font-medium text-[8px] uppercase tracking-wide">
                              Synced
                            </span>
                          ) : (
                            <span className="inline-flex items-center bg-red-50 text-red-700 border border-red-100 px-1.5 py-0.5 rounded font-medium text-[8px] uppercase tracking-wide animate-pulse">
                              Unsynced
                            </span>
                          )}
                          {item.repliedToCustomer ? (
                            <span className="inline-flex items-center bg-blue-50 text-blue-700 border border-blue-100 px-1.5 py-0.5 rounded font-medium text-[8px] uppercase tracking-wide">
                              Replied
                            </span>
                          ) : (
                            <span className="inline-flex items-center bg-slate-100 text-slate-600 border border-slate-200 px-1.5 py-0.5 rounded font-medium text-[8px] uppercase tracking-wide">
                              No Reply
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-1.5 px-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => onViewFeedback(item.id)}
                          className="inline-flex items-center gap-0.5 text-blue-600 hover:text-blue-800 font-semibold"
                        >
                          View <ArrowRight className="h-2.5 w-2.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-4 text-center text-slate-400 font-medium text-[11px]">
                      No submissions match the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
