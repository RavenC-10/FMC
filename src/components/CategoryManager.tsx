import React, { useState, useMemo } from 'react';
import { Category, FeedbackItem, FormTemplate } from '../types';
import DynamicIcon from './DynamicIcon';
import {
  Plus,
  Trash2,
  Edit2,
  CheckCircle,
  XCircle,
  Mail,
  AlertTriangle,
  FolderOpen,
  Tag,
  Check,
  X,
  FileText
} from 'lucide-react';

interface CategoryManagerProps {
  categories: Category[];
  feedback: FeedbackItem[];
  forms: FormTemplate[];
  onUpdateCategories: (updated: Category[]) => void;
}

export default function CategoryManager({
  categories,
  feedback,
  forms,
  onUpdateCategories,
}: CategoryManagerProps) {
  // Navigation / Modal States
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Form Fields State
  const [catName, setCatName] = useState('');
  const [catCode, setCatCode] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catIcon, setCatIcon] = useState('FolderOpen');
  const [catStatus, setCatStatus] = useState<'active' | 'inactive'>('active');
  const [catTeamEmail, setCatTeamEmail] = useState('');

  // Predefined Lucide icons for category visual lookup
  const ICON_LIBRARY = [
    'Hotel',
    'Sparkles',
    'Ticket',
    'Utensils',
    'Compass',
    'Ship',
    'Waves',
    'Gift',
    'ShoppingBag',
    'Coffee',
    'Wine',
    'MapPin',
    'Award',
    'Heart',
    'FolderOpen',
    'HelpCircle'
  ];

  // Derive stats for each category
  const categoryStatsMap = useMemo(() => {
    const stats: { [code: string]: { ticketCount: number; formCount: number; formNames: string[] } } = {};
    
    categories.forEach((cat) => {
      const ticketCount = feedback.filter((f) => f.categoryCode === cat.code).length;
      
      const assignedForms = forms.filter((form) => form.categoryCodes.includes(cat.code));
      const formCount = assignedForms.length;
      const formNames = assignedForms.map((f) => f.name);

      stats[cat.code] = { ticketCount, formCount, formNames };
    });

    return stats;
  }, [categories, feedback, forms]);

  // Load category details into editing state
  const handleStartEdit = (cat: Category) => {
    setEditingId(cat.id);
    setIsCreating(false);
    setCatName(cat.name);
    setCatCode(cat.code);
    setCatDesc(cat.description);
    setCatIcon(cat.icon);
    setCatStatus(cat.status);
    setCatTeamEmail(cat.teamEmail);
  };

  const handleStartCreate = () => {
    setEditingId('new-cat');
    setIsCreating(true);
    setCatName('');
    setCatCode('');
    setCatDesc('');
    setCatIcon('FolderOpen');
    setCatStatus('active');
    setCatTeamEmail('');
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();

    if (!catName.trim() || !catCode.trim() || !catTeamEmail.trim()) {
      alert('Name, unique Code, and Operations Email are required fields.');
      return;
    }

    const uppercaseCode = catCode.toUpperCase().replace(/[^A-Z0-9_]/g, '');

    // Check code uniqueness for creations
    if (isCreating && categories.some((c) => c.code === uppercaseCode)) {
      alert(`The category code '${uppercaseCode}' already exists. Code must be unique.`);
      return;
    }

    const payload: Category = {
      id: isCreating ? `cat-${Date.now()}` : editingId!,
      name: catName.trim(),
      code: isCreating ? uppercaseCode : catCode, // Can't change code when editing
      description: catDesc.trim(),
      icon: catIcon,
      status: catStatus,
      displayOrder: 1,
      teamEmail: catTeamEmail.trim(),
    };

    let updatedList: Category[] = [];
    if (isCreating) {
      updatedList = [...categories, payload];
    } else {
      updatedList = categories.map((c) => (c.id === editingId ? payload : c));
    }

    onUpdateCategories(updatedList);
    setEditingId(null);
    setIsCreating(false);
  };

  // Safe soft delete implementation
  const handleDeleteCategory = (cat: Category) => {
    const stats = categoryStatsMap[cat.code] || { ticketCount: 0 };
    
    if (stats.ticketCount > 0) {
      // Soft Delete: Deactivate instead and warn the admin
      alert(
        `Safety Override: Category '${cat.name}' contains ${stats.ticketCount} customer feedback tickets. It cannot be permanently deleted. Its operational status has been set to 'Inactive' instead.`
      );
      
      const updatedList = categories.map((c): Category => (c.id === cat.id ? { ...c, status: 'inactive' } : c));
      onUpdateCategories(updatedList);
    } else {
      // Hard delete is safe since no feedback is tied to it
      if (confirm(`Are you sure you want to delete '${cat.name}'? There is no active feedback referencing this category.`)) {
        onUpdateCategories(categories.filter((c) => c.id !== cat.id));
      }
    }
  };

  // Toggle active/inactive quick action
  const handleToggleStatus = (cat: Category) => {
    const nextStatus: 'active' | 'inactive' = cat.status === 'active' ? 'inactive' : 'active';
    const updatedList = categories.map((c): Category => (c.id === cat.id ? { ...c, status: nextStatus } : c));
    onUpdateCategories(updatedList);
  };

  // Sort categories list alphabetically by name
  const sortedCategoriesList = useMemo(() => {
    return [...categories].sort((a, b) => a.name.localeCompare(b.name));
  }, [categories]);

  return (
    <div className="space-y-6">
      {/* Category List Overview Panel */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden animate-fadeIn">
        <div className="p-5 border-b border-slate-150 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Categories</h1>
            <p className="text-xs text-slate-500 mt-1">Configure resort touchpoints, notification workflows, and associated surveys</p>
          </div>

          <button
            id="btn-create-category"
            type="button"
            onClick={handleStartCreate}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Create Category
          </button>
        </div>

        {/* Categories List Cards Grid */}
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
          {sortedCategoriesList.map((cat) => {
            const stats = categoryStatsMap[cat.code] || { ticketCount: 0, formCount: 0, formNames: [] };
            return (
              <div
                key={cat.id}
                className={`border rounded-2xl p-5 flex flex-col justify-between transition-all ${
                  cat.status === 'active'
                    ? 'bg-white border-slate-200/80 shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}
              >
                {/* Header info */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                        cat.status === 'active' ? 'bg-blue-50 text-blue-600' : 'bg-slate-200 text-slate-400'
                      }`}>
                        <DynamicIcon name={cat.icon} className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                          {cat.name}
                          <span className="font-mono text-[9px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded tracking-wide border border-slate-200 uppercase">
                            {cat.code}
                          </span>
                        </h3>
                      </div>
                    </div>

                    {/* Status badge toggle clickable */}
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(cat)}
                      className="cursor-pointer"
                      title="Toggle operational status"
                    >
                      {cat.status === 'active' ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2.5 py-0.5 border border-emerald-100 rounded-full font-semibold text-[10px]">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-slate-200 text-slate-600 px-2.5 py-0.5 rounded-full font-semibold text-[10px]">
                          Inactive
                        </span>
                      )}
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-500 leading-normal line-clamp-2">
                    {cat.description || 'No description provided.'}
                  </p>

                  {/* Team Email */}
                  <div className="text-[11px] text-slate-600 flex items-center gap-2 font-mono">
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                    <span>Workflow Router: <b className="text-slate-800 font-semibold">{cat.teamEmail}</b></span>
                  </div>
                </div>

                {/* Sub-structures & Actions Row */}
                <div className="mt-5 pt-4 border-t border-slate-100 flex justify-end items-center">
                  {/* Actions buttons */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(cat)}
                      className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 inline-flex items-center gap-1 text-[11px] font-bold"
                    >
                      <Edit2 className="h-3.5 w-3.5" /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteCategory(cat)}
                      className="p-1.5 hover:bg-red-50 rounded-lg text-red-600 inline-flex items-center gap-1 text-[11px] font-bold"
                      title="Deletes if empty, else deactivates"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Remove
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Editor Modal Overlay */}
      {editingId !== null && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 max-w-lg w-full overflow-hidden animate-scaleIn">
            
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-150 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <Tag className="h-4.5 w-4.5 text-blue-600" />
                {isCreating ? 'Create Operational Category' : `Modify Category: ${catName}`}
              </h3>
              <button
                type="button"
                onClick={() => setEditingId(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveCategory} className="p-6 space-y-4 text-xs">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Category Name */}
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Category Name</label>
                  <input
                    id="cat-name-input"
                    type="text"
                    required
                    placeholder="e.g. Health & Safety"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                  />
                </div>

                {/* Unique Code */}
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Category Code (Unique, A-Z Only)</label>
                  <input
                    id="cat-code-input"
                    type="text"
                    required
                    disabled={!isCreating}
                    placeholder="e.g. SAFETY"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white uppercase disabled:opacity-50"
                    value={catCode}
                    onChange={(e) => setCatCode(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                  />
                </div>

                {/* Team email workflow target */}
                <div className="sm:col-span-2">
                  <label className="block text-slate-600 font-semibold mb-1">Workflow Escalation Team Email</label>
                  <input
                    id="cat-email-input"
                    type="email"
                    required
                    placeholder="e.g. entertainment-safety@resortcorp.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                    value={catTeamEmail}
                    onChange={(e) => setCatTeamEmail(e.target.value)}
                  />
                </div>

                {/* Status selection */}
                <div className="sm:col-span-2">
                  <label className="block text-slate-600 font-semibold mb-1">Operational Status</label>
                  <select
                    id="cat-status-input"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                    value={catStatus}
                    onChange={(e) => setCatStatus(e.target.value as any)}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                {/* Description */}
                <div className="sm:col-span-2">
                  <label className="block text-slate-600 font-semibold mb-1">Description / Definition</label>
                  <textarea
                    id="cat-desc-input"
                    rows={2}
                    placeholder="Describe resort sector workflows..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                    value={catDesc}
                    onChange={(e) => setCatDesc(e.target.value)}
                  ></textarea>
                </div>

                {/* Icon selection grid */}
                <div className="sm:col-span-2">
                  <span className="block text-slate-600 font-semibold mb-2">Choose Display Icon</span>
                  <div className="grid grid-cols-8 gap-2 p-3 bg-slate-50 rounded-lg border border-slate-150 max-h-36 overflow-y-auto">
                    {ICON_LIBRARY.map((icon) => {
                      const isSelected = catIcon === icon;
                      return (
                        <button
                          key={icon}
                          type="button"
                          onClick={() => setCatIcon(icon)}
                          className={`p-2 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-blue-600 text-white shadow-sm scale-110'
                              : 'bg-white hover:bg-slate-100 border border-slate-200 text-slate-600'
                          }`}
                          title={icon}
                        >
                          <DynamicIcon name={icon} className="h-4.5 w-4.5" />
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-150 flex justify-end gap-3.5">
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  id="btn-cat-save"
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md transition-colors flex items-center gap-1"
                >
                  <Check className="h-3.5 w-3.5" /> Save Category
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
