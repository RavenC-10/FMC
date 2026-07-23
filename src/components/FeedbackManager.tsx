import React, { useState, useMemo, useEffect } from 'react';
import { Category, FeedbackItem, FeedbackStatus, AuditLog, FeedbackReply } from '../types';
import {
  Search,
  Filter,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  AlertCircle,
  Clock,
  CheckCircle,
  Star,
  User,
  Mail,
  Phone,
  Bookmark,
  MapPin,
  Calendar,
  MessageSquare,
  Paperclip,
  Plus,
  History,
  Send,
  Eye,
  ArrowLeft,
  Briefcase
} from 'lucide-react';

interface FeedbackManagerProps {
  categories: Category[];
  feedback: FeedbackItem[];
  onUpdateFeedback: (updated: FeedbackItem[]) => void;
  activeTicketId: string | null;
  onClearActiveTicket: () => void;
  currentUser: string;
}

export default function FeedbackManager({
  categories,
  feedback,
  onUpdateFeedback,
  activeTicketId,
  onClearActiveTicket,
  currentUser,
}: FeedbackManagerProps) {
  // Navigation / Selected Detail View State
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterRating, setFilterRating] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Selection state for bulk actions
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState<string>('');

  // Detail View Sub-states
  const [statusComment, setStatusComment] = useState('');

  // Handle opening ticket from dashboard link
  useEffect(() => {
    if (activeTicketId) {
      setSelectedId(activeTicketId);
      onClearActiveTicket();
    }
  }, [activeTicketId]);

  // Sync selectedId with list adjustments
  const currentSelectedFeedback = useMemo(() => {
    if (!selectedId) return null;
    return feedback.find((f) => f.id === selectedId) || null;
  }, [selectedId, feedback]);

  // 1. Filtering Logic
  const filteredFeedback = useMemo(() => {
    return feedback.filter((item) => {
      // Text search
      const matchesSearch =
        item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.comments.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.bookingReference && item.bookingReference.toLowerCase().includes(searchQuery.toLowerCase()));

      // Category filter
      const matchesCategory = filterCategory === 'all' || item.categoryCode === filterCategory;

      // Status filter
      let matchesStatus = true;
      if (filterStatus === 'sent_a') {
        matchesStatus = item.sentToSystemA;
      } else if (filterStatus === 'pending_a') {
        matchesStatus = !item.sentToSystemA;
      } else if (filterStatus === 'replied') {
        matchesStatus = item.repliedToCustomer;
      } else if (filterStatus === 'pending_reply') {
        matchesStatus = !item.repliedToCustomer;
      }

      // Rating filter
      const matchesRating = filterRating === 'all' || item.rating.toString() === filterRating;

      // Date filter
      let matchesDate = true;
      if (startDate) {
        const itemDate = new Date(item.submittedDate);
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        matchesDate = matchesDate && itemDate >= start;
      }
      if (endDate) {
        const itemDate = new Date(item.submittedDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        matchesDate = matchesDate && itemDate <= end;
      }

      return matchesSearch && matchesCategory && matchesStatus && matchesRating && matchesDate;
    });
  }, [feedback, searchQuery, filterCategory, filterStatus, filterRating, startDate, endDate]);

  // Reset page when filters adjust
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterCategory, filterStatus, filterRating, startDate, endDate]);

  // 2. Pagination Math
  const totalItems = filteredFeedback.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  
  const paginatedFeedback = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredFeedback.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredFeedback, currentPage, itemsPerPage]);

  // Bulk selectors
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const pageIds = paginatedFeedback.map((f) => f.id);
      setSelectedItems((prev) => Array.from(new Set([...prev, ...pageIds])));
    } else {
      const pageIds = paginatedFeedback.map((f) => f.id);
      setSelectedItems((prev) => prev.filter((id) => !pageIds.includes(id)));
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedItems((prev) => [...prev, id]);
    } else {
      setSelectedItems((prev) => prev.filter((item) => item !== id));
    }
  };

  const isAllPageSelected = useMemo(() => {
    if (paginatedFeedback.length === 0) return false;
    return paginatedFeedback.every((f) => selectedItems.includes(f.id));
  }, [paginatedFeedback, selectedItems]);

  // Bulk action implementations
  const handleBulkStatusChange = () => {
    if (!bulkStatus || selectedItems.length === 0) return;

    const updatedFeedback = feedback.map((item) => {
      if (selectedItems.includes(item.id)) {
        let updatedItem = { ...item };
        let actionComment = '';

        if (bulkStatus === 'sync') {
          if (!item.sentToSystemA) {
            updatedItem.sentToSystemA = true;
            actionComment = 'Bulk marked as Synced to System A';
          }
        } else if (bulkStatus === 'unsync') {
          if (item.sentToSystemA) {
            updatedItem.sentToSystemA = false;
            actionComment = 'Bulk marked as Pending Sync';
          }
        } else if (bulkStatus === 'reply') {
          if (!item.repliedToCustomer) {
            updatedItem.repliedToCustomer = true;
            actionComment = 'Bulk marked as Replied to Customer';
          }
        } else if (bulkStatus === 'unreply') {
          if (item.repliedToCustomer) {
            updatedItem.repliedToCustomer = false;
            actionComment = 'Bulk marked as No Reply';
          }
        }

        if (actionComment) {
          const newLog: AuditLog = {
            id: `log-${Date.now()}-${Math.random()}`,
            fromStatus: 'update',
            toStatus: bulkStatus,
            changedBy: currentUser,
            changedAt: new Date().toISOString(),
            comment: actionComment,
          };
          updatedItem.statusLog = [...item.statusLog, newLog];
          updatedItem.lastUpdated = new Date().toISOString();
        }

        return updatedItem;
      }
      return item;
    });

    onUpdateFeedback(updatedFeedback);
    setSelectedItems([]);
    setBulkStatus('');
  };

  const handleBulkExportCSV = () => {
    const exportData = feedback.filter((f) => selectedItems.length === 0 || selectedItems.includes(f.id));
    
    // Prepare Headers
    const headers = ['Ticket ID', 'Customer Name', 'Customer Email', 'Category', 'Product', 'Rating', 'Sent To System A', 'Replied To Customer', 'Submitted Date', 'Experience Date', 'Comments'];
    const rows = exportData.map((f) => [
      f.id,
      `"${f.customerName.replace(/"/g, '""')}"`,
      f.customerEmail,
      f.categoryCode,
      `"${f.productName.replace(/"/g, '""')}"`,
      f.rating,
      f.sentToSystemA ? 'YES' : 'NO',
      f.repliedToCustomer ? 'YES' : 'NO',
      f.submittedDate,
      f.dateOfExperience,
      `"${f.comments.replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `feedback_export_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Detail view update functions
  const handleToggleSystemASync = () => {
    if (!currentSelectedFeedback) return;
    const nextVal = !currentSelectedFeedback.sentToSystemA;
    const comment = nextVal ? 'Feedback marked as sent to System A' : 'Feedback marked as unsent/pending for System A';
    
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      fromStatus: currentSelectedFeedback.sentToSystemA ? 'sent' : 'pending',
      toStatus: nextVal ? 'sent' : 'pending',
      changedBy: currentUser,
      changedAt: new Date().toISOString(),
      comment: statusComment || comment,
    };

    const updatedItem: FeedbackItem = {
      ...currentSelectedFeedback,
      sentToSystemA: nextVal,
      statusLog: [...currentSelectedFeedback.statusLog, newLog],
      lastUpdated: new Date().toISOString(),
    };

    const updatedFeedbackList = feedback.map((f) => (f.id === selectedId ? updatedItem : f));
    onUpdateFeedback(updatedFeedbackList);
    setStatusComment('');
  };

  const handleToggleCustomerReply = () => {
    if (!currentSelectedFeedback) return;
    const nextVal = !currentSelectedFeedback.repliedToCustomer;
    const comment = nextVal ? 'Feedback marked as replied to customer' : 'Feedback marked as outstanding reply';

    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      fromStatus: currentSelectedFeedback.repliedToCustomer ? 'replied' : 'pending_reply',
      toStatus: nextVal ? 'replied' : 'pending_reply',
      changedBy: currentUser,
      changedAt: new Date().toISOString(),
      comment: statusComment || comment,
    };

    const updatedItem: FeedbackItem = {
      ...currentSelectedFeedback,
      repliedToCustomer: nextVal,
      statusLog: [...currentSelectedFeedback.statusLog, newLog],
      lastUpdated: new Date().toISOString(),
    };

    const updatedFeedbackList = feedback.map((f) => (f.id === selectedId ? updatedItem : f));
    onUpdateFeedback(updatedFeedbackList);
    setStatusComment('');
  };

  return (
    <div className="space-y-4">
      {!selectedId ? (
        // ------------------ FEEDBACK LIST VIEW ------------------
        <div className="space-y-4 animate-fadeIn">
          {/* Page Title & Tagline Header (Outside of any boxes/cards) */}
          <div>
            <h1 className="text-xl font-bold text-slate-900">Customer Feedback</h1>
            <p className="text-xs text-slate-500 mt-1">Review, assign, and reply to guest submissions across resort touchpoints</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
            {/* Header Panel */}
            <div className="p-4 border-b border-slate-150">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                {/* Action utilities */}
                <div className="flex items-center gap-2 md:ml-auto">
                  <button
                    type="button"
                    onClick={handleBulkExportCSV}
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 rounded-xl shadow-sm transition-colors cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5 text-slate-500" />
                    {selectedItems.length > 0 ? `Export CSV (${selectedItems.length})` : 'Export'}
                  </button>
                </div>
            </div>

            {/* Comprehensive Multi-Filters Panel */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5 mt-3.5 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
              {/* Keyword Search */}
              <div className="lg:col-span-2 relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  id="feedback-search"
                  type="text"
                  placeholder="Search keywords..."
                  className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 focus:border-blue-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Category Filter */}
              <div>
                <select
                  id="feedback-filter-category"
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                >
                  <option value="all">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.code}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <select
                  id="feedback-filter-status"
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="pending_a">Pending Sync</option>
                  <option value="sent_a">Synced to System A</option>
                  <option value="pending_reply">Pending Customer Reply</option>
                  <option value="replied">Replied to Customer</option>
                </select>
              </div>

              {/* Rating Filter */}
              <div>
                <select
                  id="feedback-filter-rating"
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={filterRating}
                  onChange={(e) => setFilterRating(e.target.value)}
                >
                  <option value="all">All Ratings</option>
                  <option value="5">5 Stars</option>
                  <option value="4">4 Stars</option>
                  <option value="3">3 Stars</option>
                  <option value="2">2 Stars</option>
                  <option value="1">1 Star</option>
                </select>
              </div>

              {/* Clear button */}
              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setFilterCategory('all');
                    setFilterStatus('all');
                    setFilterRating('all');
                    setStartDate('');
                    setEndDate('');
                  }}
                  className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold cursor-pointer underline underline-offset-2"
                >
                  Clear Filters
                </button>
              </div>

              {/* Date Filters Row */}
              <div className="sm:col-span-2 flex items-center gap-2 text-slate-500 text-xs">
                <span>From:</span>
                <input
                  id="feedback-date-start"
                  type="date"
                  className="flex-1 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-800 focus:outline-none"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="sm:col-span-2 flex items-center gap-2 text-slate-500 text-xs">
                <span>To:</span>
                <input
                  id="feedback-date-end"
                  type="date"
                  className="flex-1 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-800 focus:outline-none"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Bulk Action Processing Header Bar */}
          {selectedItems.length > 0 && (
            <div className="px-5 py-3 bg-indigo-50/70 border-b border-indigo-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs animate-fadeIn">
              <span className="font-semibold text-indigo-900 flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-indigo-600" />
                {selectedItems.length} operational tickets selected for bulk processing
              </span>
              <div className="flex items-center gap-2">
                <select
                  id="bulk-status-select"
                  className="bg-white border border-indigo-200 text-indigo-900 text-xs px-2.5 py-1 rounded-lg focus:outline-none"
                  value={bulkStatus}
                  onChange={(e) => setBulkStatus(e.target.value)}
                >
                  <option value="">Bulk Action Operations...</option>
                  <option value="sync">Sync to System A</option>
                  <option value="unsync">Set as Pending Sync</option>
                  <option value="reply">Mark as Replied to Guest</option>
                  <option value="unreply">Set as Haven't Replied</option>
                </select>
                <button
                  id="btn-bulk-status-apply"
                  type="button"
                  disabled={!bulkStatus}
                  onClick={handleBulkStatusChange}
                  className={`px-3 py-1 rounded-lg font-semibold text-white transition-colors text-xs ${
                    bulkStatus ? 'bg-indigo-600 hover:bg-indigo-700 cursor-pointer' : 'bg-slate-300 cursor-not-allowed'
                  }`}
                >
                  Apply Status
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedItems([])}
                  className="text-indigo-600 hover:text-indigo-800 font-semibold px-2"
                >
                  Deselect All
                </button>
              </div>
            </div>
          )}

          {/* Interactive Core Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead>
                <tr className="border-b border-slate-150 text-slate-400 font-semibold uppercase text-[9px] tracking-wider text-left bg-slate-50/50">
                  <th className="py-2 px-3 text-center w-10">
                    <input
                      type="checkbox"
                      className="rounded border-slate-300"
                      checked={isAllPageSelected}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th className="py-2 px-2.5">Ticket ID</th>
                  <th className="py-2 px-2.5">Customer Name</th>
                  <th className="py-2 px-2.5">Category</th>
                  <th className="py-2 px-2.5">Product</th>
                  <th className="py-2 px-2.5 text-center">Rating</th>
                  <th className="py-2 px-2.5">Status</th>
                  <th className="py-2 px-2.5">Submitted</th>
                  <th className="py-2 px-2.5">Last Activity</th>
                  <th className="py-2 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150">
                {paginatedFeedback.length > 0 ? (
                  paginatedFeedback.map((item) => {
                    const isSelected = selectedItems.includes(item.id);
                    return (
                      <tr
                        key={item.id}
                        className={`hover:bg-slate-50/50 transition-colors ${isSelected ? 'bg-indigo-50/20' : ''}`}
                      >
                        <td className="py-2 px-3 text-center">
                          <input
                            type="checkbox"
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            checked={isSelected}
                            onChange={(e) => handleSelectOne(item.id, e.target.checked)}
                          />
                        </td>
                        <td className="py-2 px-2.5 font-mono font-bold text-blue-600">{item.id}</td>
                        <td className="py-2 px-2.5 font-semibold text-slate-800">{item.customerName}</td>
                        <td className="py-2 px-2.5">
                          <span className="inline-flex items-center bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-bold text-[9px] tracking-wider uppercase">
                            {item.categoryCode}
                          </span>
                        </td>
                        <td className="py-2 px-2.5 text-slate-600 truncate max-w-[120px]">{item.productName}</td>
                        <td className="py-2 px-2.5 text-center">
                          <span className="inline-flex items-center gap-0.5 bg-amber-50 text-amber-700 font-bold px-1 py-0.5 rounded text-[10px] border border-amber-100">
                            {item.rating} <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500" />
                          </span>
                        </td>
                        <td className="py-2 px-2.5">
                          <div className="flex flex-wrap gap-1 justify-start">
                            {item.sentToSystemA ? (
                              <span className="inline-flex items-center bg-emerald-50 text-emerald-700 border border-emerald-100 px-1.5 py-0.5 rounded font-medium text-[8px] uppercase tracking-wide">
                                System A
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
                        <td className="py-2 px-2.5 text-slate-500">
                          {new Date(item.submittedDate).toLocaleDateString()}
                        </td>
                        <td className="py-2 px-2.5 text-slate-500">
                          {new Date(item.lastUpdated).toLocaleDateString()}
                        </td>
                        <td className="py-2 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedId(item.id)}
                            className="inline-flex items-center gap-0.5 text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                          >
                            <Eye className="h-3 w-3" /> Inspect
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400 font-medium">
                      No customer tickets match the current filter selection.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="px-5 py-4 border-t border-slate-150 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-4">
              <span>
                Showing <b>{totalItems > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</b> to{' '}
                <b>{Math.min(currentPage * itemsPerPage, totalItems)}</b> of <b>{totalItems}</b> tickets
              </span>
              
              {/* Row Count Selector */}
              <div className="flex items-center gap-1.5">
                <span>Show:</span>
                <select
                  id="items-per-page-select"
                  className="bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 font-medium text-slate-700"
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
                className={`p-1.5 rounded-lg border border-slate-200 transition-colors ${
                  currentPage === 1 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className={`h-7 w-7 rounded-lg font-semibold transition-colors ${
                    currentPage === page
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
                className={`p-1.5 rounded-lg border border-slate-200 transition-colors ${
                  currentPage === totalPages ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
      ) : (
        // ------------------ FEEDBACK DETAIL VIEW ------------------
        <div className="space-y-6 animate-fadeIn">
          {/* Back Utility Header - Sticky at the top on scroll */}
          <div className="sticky top-0 z-20 -mt-6 md:-mt-8 -mx-6 md:-mx-8 px-6 md:px-8 py-4 bg-white/95 backdrop-blur-md border-b border-slate-200/80 flex items-center justify-between shadow-sm before:content-[''] before:absolute before:-top-6 md:before:-top-8 before:left-0 before:right-0 before:h-6 md:before:h-8 before:bg-white">
            <div className="flex items-center gap-4">
              <button
                id="btn-detail-back"
                type="button"
                onClick={() => {
                  setSelectedId(null);
                  setStatusComment('');
                }}
                className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-sm hover:shadow transition-all"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <div className="hidden sm:block">
                <h1 className="text-sm font-bold text-slate-900">Feedback Submission Detail</h1>
                <p className="text-[10px] text-slate-500">Review and action guest ticket #{currentSelectedFeedback?.id}</p>
              </div>
            </div>

            {/* Right side status indicators */}
            {currentSelectedFeedback && (
              <div className="flex items-center gap-2 sm:gap-3">
                {/* System A Status Badge */}
                <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border ${
                  currentSelectedFeedback.sentToSystemA
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                    : 'bg-red-50 text-red-700 border-red-100'
                }`}>
                  {currentSelectedFeedback.sentToSystemA ? 'System A: Sent' : 'System A: Pending'}
                </span>

                {/* Reply Status Badge */}
                <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border ${
                  currentSelectedFeedback.repliedToCustomer
                    ? 'bg-blue-50 text-blue-700 border-blue-100'
                    : 'bg-slate-50 text-slate-500 border-slate-200'
                }`}>
                  {currentSelectedFeedback.repliedToCustomer ? 'Replied' : 'Pending Reply'}
                </span>
              </div>
            )}
          </div>

          {currentSelectedFeedback ? (
            <div className="max-w-3xl mx-auto space-y-6 pt-6 md:pt-10 pb-12">
                 
                 {/* Profile Card */}
                 <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5" />
                      </div>
                      <div>
                        <h2 className="font-bold text-slate-900 text-sm">{currentSelectedFeedback.customerName}</h2>
                        <p className="text-xs text-slate-400">Registered Corporate Guest</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-600">
                    <div className="flex items-center gap-2.5">
                      <Mail className="h-4 w-4 text-slate-400" />
                      <a href={`mailto:${currentSelectedFeedback.customerEmail}`} className="text-blue-600 hover:underline">
                        {currentSelectedFeedback.customerEmail}
                      </a>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Phone className="h-4 w-4 text-slate-400" />
                      <span>{currentSelectedFeedback.customerPhone}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Bookmark className="h-4 w-4 text-slate-400" />
                      <span>Booking Code: <b className="font-mono text-slate-800">{currentSelectedFeedback.bookingReference || 'N/A'}</b></span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      <span>Visit Date: <b className="text-slate-800">{currentSelectedFeedback.dateOfExperience}</b></span>
                    </div>
                  </div>
                </div>

                {/* Feedback Content Card */}
                <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Product & Venue</span>
                      <h3 className="font-bold text-slate-900 text-base">{currentSelectedFeedback.productName}</h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3.5 w-3.5" /> {currentSelectedFeedback.location}
                      </p>
                    </div>

                    <div className="flex flex-col items-start sm:items-end">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Customer Experience Rating</span>
                      <div className="flex items-center gap-0.5 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < currentSelectedFeedback.rating ? 'text-amber-500 fill-amber-500' : 'text-slate-200'
                            }`}
                          />
                        ))}
                        <span className="font-bold text-amber-800 text-xs ml-1.5">{currentSelectedFeedback.rating}/5</span>
                      </div>
                    </div>
                  </div>

                  {/* Feedback comments */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Comments</span>
                    <div className="p-4 bg-slate-50 rounded-xl text-xs text-slate-800 leading-relaxed italic border border-slate-100">
                      "{currentSelectedFeedback.comments}"
                    </div>
                  </div>

                  {/* File Attachments */}
                  {currentSelectedFeedback.attachments && currentSelectedFeedback.attachments.length > 0 && (
                    <div className="space-y-2 pt-3 border-t border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <Paperclip className="h-3.5 w-3.5" /> Customer Attachment upload (1)
                      </span>
                      <div className="relative group w-48 rounded-lg overflow-hidden border border-slate-200 shadow-sm">
                        <img
                          src={currentSelectedFeedback.attachments[0]}
                          alt="Feedback attachment"
                          referrerPolicy="no-referrer"
                          className="h-32 w-full object-cover group-hover:scale-105 transition-transform duration-250"
                        />
                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <a
                            href={currentSelectedFeedback.attachments[0]}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-white text-[10px] font-bold bg-slate-900/80 px-2.5 py-1 rounded-md"
                          >
                            Open Original
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
                </div>



                {/* Status Transition Audit Timeline */}
                <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <h3 className="font-bold text-slate-900 text-sm">Status Audit Trail</h3>
                    <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded font-mono font-bold text-slate-500">HISTORY</span>
                  </div>

                  <div className="relative pl-4 border-l border-slate-150 space-y-4 text-xs">
                    {currentSelectedFeedback.statusLog.map((log) => {
                      const dateStr = new Date(log.changedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                      return (
                        <div key={log.id} className="relative">
                          {/* Dot */}
                          <span className="absolute -left-[20.5px] top-1 h-3 w-3 rounded-full bg-white border-2 border-blue-600"></span>
                          
                          <div className="font-semibold text-slate-800 flex items-center gap-1">
                            <span className="capitalize">{log.fromStatus === 'created' ? 'Created' : log.fromStatus}</span> 
                            <span>→</span> 
                            <span className="capitalize text-indigo-600">{log.toStatus}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                            By {log.changedBy} on {dateStr}
                          </div>
                          {log.comment && (
                            <div className="text-[11px] text-slate-500 mt-1 italic font-sans leading-relaxed">
                              "{log.comment}"
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
          ) : (
            <div className="p-12 text-center text-slate-400 font-medium">
              Ticket could not be retrieved. Please check ID.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
