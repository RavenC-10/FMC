import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Category, FormTemplate, FormRow, FormField, FieldType, FormSettings } from '../types';
import {
  Plus,
  Trash2,
  Check,
  ChevronUp,
  ChevronDown,
  Copy,
  Eye,
  Settings,
  PlusCircle,
  Folder,
  Calendar,
  Layers,
  History,
  FileText,
  AlertCircle,
  HelpCircle,
  Star,
  ToggleLeft,
  ToggleRight,
  Search,
  X,
  ArrowLeft,
  ListOrdered,
  Upload
} from 'lucide-react';

interface FormBuilderProps {
  categories: Category[];
  forms: FormTemplate[];
  onUpdateForms: (updated: FormTemplate[]) => void;
}

export default function FormBuilder({ categories, forms, onUpdateForms }: FormBuilderProps) {
  // Navigation / Workspace States
  const [activeFormId, setActiveFormId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Filter States for list view
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Version History Tracker (saved locally per form to support reverting)
  // We can simulate version backups by keeping an array in memory or localStorage.
  const [versionHistory, setVersionHistory] = useState<{ [formId: string]: FormTemplate[] }>(() => {
    try {
      const saved = localStorage.getItem('feedback_mgt_form_versions');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Track if saving current workspace edits as a new version increment
  const [saveAsNewVersion, setSaveAsNewVersion] = useState(false);

  useEffect(() => {
    localStorage.setItem('feedback_mgt_form_versions', JSON.stringify(versionHistory));
  }, [versionHistory]);

  // Active form workspace state
  const [formName, setFormName] = useState('');
  const [formCategoryCodes, setFormCategoryCodes] = useState<string[]>([]);
  const [formStatus, setFormStatus] = useState<'draft' | 'published' | 'unpublished'>('draft');
  const [formVersion, setFormVersion] = useState(1);
  const [formRows, setFormRows] = useState<FormRow[]>([]);
  const [formSettings, setFormSettings] = useState<FormSettings>({
    allowAnonymous: false,
    notificationTrigger: false,
    notificationEmails: '',
    deadline: '',
    showQuestionNumbers: false,
  });

  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setIsCategoryDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (isPreviewOpen) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [isPreviewOpen]);

  // Current selected template for preview/workspace
  const currentEditingTemplate = useMemo(() => {
    if (!activeFormId) return null;
    return forms.find((f) => f.id === activeFormId) || null;
  }, [activeFormId, forms]);

  // Filter and organize forms by category & search query
  const filteredForms = useMemo(() => {
    return forms.filter((f) => {
      const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase());
      if (selectedCategory === 'all') {
        return matchesSearch;
      }
      if (selectedCategory === 'unassigned') {
        return matchesSearch && f.categoryCodes.length === 0;
      }
      return matchesSearch && f.categoryCodes.includes(selectedCategory);
    });
  }, [forms, searchQuery, selectedCategory]);

  // Load selected template into workspace state
  const loadTemplateIntoWorkspace = (tpl: FormTemplate) => {
    setActiveFormId(tpl.id);
    setIsCreating(false);
    setFormName(tpl.name);
    setFormCategoryCodes(tpl.categoryCodes);
    setFormStatus(tpl.status);
    setFormVersion(tpl.version);
    setFormRows(JSON.parse(JSON.stringify(tpl.rows))); // Deep copy
    setFormSettings({ ...tpl.settings });
    setSaveAsNewVersion(false);
  };

  const handleStartCreateNew = () => {
    setActiveFormId('new-form');
    setIsCreating(true);
    setFormName('New Operational Feedback Survey');
    setFormCategoryCodes([]);
    setFormStatus('draft');
    setFormVersion(1);
    setFormSettings({
      allowAnonymous: false,
      notificationTrigger: false,
      notificationEmails: '',
      deadline: '',
      showQuestionNumbers: false,
    });
    setFormRows([
      {
        id: 'row-init-1',
        columnsCount: 1,
        fields: [
          {
            id: 'f-init-1',
            type: 'rating',
            question: 'How would you rate your overall experience?',
            required: true,
          }
        ]
      }
    ]);
    setSaveAsNewVersion(false);
  };

  // Adding Layout Rows & Fields
  const handleAddRow = (columnsCount: number) => {
    const newRowId = `row-${Date.now()}`;
    const fields: FormField[] = [];

    for (let i = 0; i < columnsCount; i++) {
      fields.push({
        id: `f-${Date.now()}-${i}`,
        type: 'text',
        question: `Question Panel ${i + 1}`,
        required: false,
      });
    }

    const newRow: FormRow = {
      id: newRowId,
      columnsCount,
      fields,
    };

    setFormRows([...formRows, newRow]);
  };

  const handleRemoveRow = (rowId: string) => {
    setFormRows(formRows.filter((row) => row.id !== rowId));
  };

  const handleFieldChange = (rowIndex: number, fieldIndex: number, key: keyof FormField, value: any) => {
    const updatedRows = [...formRows];
    updatedRows[rowIndex].fields[fieldIndex] = {
      ...updatedRows[rowIndex].fields[fieldIndex],
      [key]: value,
    };
    setFormRows(updatedRows);
  };

  // Option management for dropdown/radio/checkbox
  const handleAddOption = (rowIndex: number, fieldIndex: number, optionVal: string) => {
    if (!optionVal.trim()) return;
    const updatedRows = [...formRows];
    const field = updatedRows[rowIndex].fields[fieldIndex];
    const options = field.options || [];
    if (!options.includes(optionVal.trim())) {
      field.options = [...options, optionVal.trim()];
    }
    setFormRows(updatedRows);
  };

  const handleRemoveOption = (rowIndex: number, fieldIndex: number, optionVal: string) => {
    const updatedRows = [...formRows];
    const field = updatedRows[rowIndex].fields[fieldIndex];
    if (field.options) {
      field.options = field.options.filter((o) => o !== optionVal);
    }
    setFormRows(updatedRows);
  };

  // Up/Down reordering in preview
  const handleMoveRow = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === formRows.length - 1) return;

    const updatedRows = [...formRows];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Swap rows
    const temp = updatedRows[index];
    updatedRows[index] = updatedRows[targetIndex];
    updatedRows[targetIndex] = temp;

    setFormRows(updatedRows);
  };

  // Toggle category assignments
  const handleToggleCategory = (code: string) => {
    if (formCategoryCodes.includes(code)) {
      setFormCategoryCodes(formCategoryCodes.filter((c) => c !== code));
    } else {
      setFormCategoryCodes([...formCategoryCodes, code]);
    }
  };

  // Helper to retrieve all available version numbers for a form
  const getAvailableVersionsForForm = (formId: string): number[] => {
    const versions = new Set<number>();
    const current = forms.find((f) => f.id === formId);
    if (current) {
      versions.add(current.version);
    }
    const history = versionHistory[formId] || [];
    history.forEach((h) => versions.add(h.version));
    return Array.from(versions).sort((a, b) => a - b);
  };

  const handleVersionDropdownChange = (selectedVer: number) => {
    if (!activeFormId) return;
    
    if (confirm(`Are you sure you want to load version ${selectedVer}? Any unsaved changes in your current workspace will be discarded.`)) {
      // Check if they selected the current active template version
      const activeTpl = forms.find((f) => f.id === activeFormId);
      if (activeTpl && activeTpl.version === selectedVer) {
        setFormName(activeTpl.name);
        setFormCategoryCodes(activeTpl.categoryCodes);
        setFormStatus(activeTpl.status);
        setFormVersion(activeTpl.version);
        setFormRows(JSON.parse(JSON.stringify(activeTpl.rows)));
        setFormSettings({ ...activeTpl.settings });
        setSaveAsNewVersion(false);
        return;
      }

      // Otherwise, find it in history
      const history = versionHistory[activeFormId] || [];
      const matched = history.find((h) => h.version === selectedVer);
      if (matched) {
        setFormName(matched.name);
        setFormCategoryCodes(matched.categoryCodes);
        setFormStatus(matched.status);
        setFormVersion(matched.version);
        setFormRows(JSON.parse(JSON.stringify(matched.rows)));
        setFormSettings({ ...matched.settings });
        setSaveAsNewVersion(false);
      }
    }
  };

  // Save / Publish / Versioning
  const handleSaveWorkspace = (statusOverride?: 'draft' | 'published' | 'unpublished') => {
    if (!formName.trim()) {
      alert('Please specify a form name before saving.');
      return;
    }

    const nextStatus = statusOverride || formStatus;
    let nextVersion = formVersion;

    if (!isCreating && activeFormId) {
      const availableVersions = getAvailableVersionsForForm(activeFormId);
      const maxVersion = availableVersions.length > 0 ? Math.max(...availableVersions) : formVersion;

      if (saveAsNewVersion) {
        nextVersion = maxVersion + 1;
      } else {
        // Increment version if transitioning to published
        if (nextStatus === 'published' && currentEditingTemplate && currentEditingTemplate.status !== 'published') {
          nextVersion = maxVersion + 1;
        }
      }
    }

    const templatePayload: FormTemplate = {
      id: isCreating ? `form-${Date.now()}` : activeFormId!,
      name: formName.trim(),
      categoryCodes: formCategoryCodes,
      status: nextStatus,
      version: nextVersion,
      lastUpdated: new Date().toISOString(),
      rows: formRows,
      settings: formSettings,
    };

    const formId = templatePayload.id;

    // Save this current state to version history
    setVersionHistory((prev) => {
      const currentHistory = prev[formId] || [];
      
      // Filter out any existing saved copy of the same version to overwrite it,
      // and then add this new payload.
      const filteredHistory = currentHistory.filter((h) => h.version !== templatePayload.version);
      const updatedHistory = [...filteredHistory, { ...templatePayload }].sort((a, b) => a.version - b.version);
      
      // Also, if we just saved as a new version, we should make sure the old version is also preserved in history
      if (saveAsNewVersion && currentEditingTemplate) {
        const hasOldVersion = updatedHistory.some((h) => h.version === currentEditingTemplate.version);
        if (!hasOldVersion) {
          updatedHistory.push({ ...currentEditingTemplate });
          updatedHistory.sort((a, b) => a.version - b.version);
        }
      }

      return {
        ...prev,
        [formId]: updatedHistory,
      };
    });

    // Update main array
    let updatedTemplatesList: FormTemplate[] = [];
    if (isCreating) {
      updatedTemplatesList = [...forms, templatePayload];
    } else {
      updatedTemplatesList = forms.map((f) => (f.id === activeFormId ? templatePayload : f));
    }

    onUpdateForms(updatedTemplatesList);
    
    // Exit workspace
    setActiveFormId(null);
    setIsCreating(false);
    setSaveAsNewVersion(false);
  };

  // Clone template
  const handleCloneForm = (tpl: FormTemplate) => {
    const cloned: FormTemplate = {
      ...tpl,
      id: `form-cloned-${Date.now()}`,
      name: `${tpl.name} (Cloned)`,
      status: 'draft',
      version: 1,
      lastUpdated: new Date().toISOString(),
      rows: JSON.parse(JSON.stringify(tpl.rows)), // deep copy
    };

    onUpdateForms([...forms, cloned]);
  };

  // Revert version from backup list
  const handleRevertVersion = (formId: string, targetVersionTemplate: FormTemplate) => {
    const updated = forms.map((f) => (f.id === formId ? { ...targetVersionTemplate, lastUpdated: new Date().toISOString() } : f));
    onUpdateForms(updated);
    alert(`Successfully reverted form to version ${targetVersionTemplate.version}.`);
  };

  // Delete form template
  const handleDeleteForm = (id: string) => {
    if (confirm('Are you sure you want to permanently delete this feedback form template?')) {
      onUpdateForms(forms.filter((f) => f.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      {!activeFormId ? (
        // ------------------ TEMPLATES LIST VIEW ------------------
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden animate-fadeIn">
          <div className="p-5 border-b border-slate-150 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-slate-900">Feedback Form</h1>
              <p className="text-xs text-slate-500 mt-1">Design, version, and assign customer satisfaction surveys to respective sectors</p>
            </div>
            
            <button
              id="btn-create-form"
              type="button"
              onClick={handleStartCreateNew}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="h-4 w-4" /> Form
            </button>
          </div>

          {/* Category Filter and Search Toolbar */}
          <div className="bg-slate-50/65 border-b border-slate-150 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Category horizontal pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 md:pb-0 scrollbar-none scroll-smooth">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-blue-600 text-white shadow-sm font-bold'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                }`}
              >
                All Categories ({forms.length})
              </button>
              {categories.map((cat) => {
                const count = forms.filter((f) => f.categoryCodes.includes(cat.code)).length;
                return (
                  <button
                    key={cat.code}
                    type="button"
                    onClick={() => setSelectedCategory(cat.code)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                      selectedCategory === cat.code
                        ? 'bg-blue-600 text-white shadow-sm font-bold'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                    }`}
                  >
                    <span>{cat.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono font-bold ${selectedCategory === cat.code ? 'bg-blue-700 text-blue-100' : 'bg-slate-100 text-slate-500'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
              {forms.some((f) => f.categoryCodes.length === 0) && (
                <button
                  type="button"
                  onClick={() => setSelectedCategory('unassigned')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                    selectedCategory === 'unassigned'
                      ? 'bg-blue-600 text-white shadow-sm font-bold'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                  }`}
                >
                  <span>Unassigned</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono font-bold ${selectedCategory === 'unassigned' ? 'bg-blue-700 text-blue-100' : 'bg-slate-100 text-slate-500'}`}>
                    {forms.filter((f) => f.categoryCodes.length === 0).length}
                  </span>
                </button>
              )}
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-72 shrink-0">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <Search className="h-3.5 w-3.5" />
              </span>
              <input
                type="text"
                placeholder="Search feedback forms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-8 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 shadow-sm placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {/* Form List Grid */}
          <div className="divide-y divide-slate-100">
            {filteredForms.length > 0 ? (
              filteredForms.map((tpl) => {
                return (
                  <div key={tpl.id} className="p-5 hover:bg-slate-50/30 transition-colors flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-xs">
                    {/* Form Identity */}
                    <div className="space-y-2 max-w-md">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-slate-400" />
                        <h3 className="font-bold text-slate-900 text-sm">{tpl.name}</h3>
                      </div>
                      
                      <p className="text-slate-500 leading-normal text-[11px] flex items-center gap-1.5 flex-wrap">
                        <span>Assigned Sectors:</span>
                        {tpl.categoryCodes.length > 0 ? (
                          tpl.categoryCodes.map((code) => (
                            <span key={code} className="bg-blue-50 text-blue-700 border border-blue-100 font-mono font-bold uppercase text-[9px] px-1.5 py-0.5 rounded">
                              {code}
                            </span>
                          ))
                        ) : (
                          <span className="text-red-500 italic">Unassigned (Inactive)</span>
                        )}
                      </p>

                      <div className="text-[10px] text-slate-400 font-mono flex items-center gap-3">
                        <span>Last updated: {new Date(tpl.lastUpdated).toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Actions Panel */}
                    <div className="flex items-center gap-3 self-start md:self-center">
                      {/* Status Badging */}
                      <div>
                        {tpl.status === 'published' && (
                          <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-1 rounded-lg font-semibold text-[10px]">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span> Published
                          </span>
                        )}
                        {tpl.status === 'draft' && (
                          <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-100 px-2.5 py-1 rounded-lg font-semibold text-[10px]">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span> Draft
                          </span>
                        )}
                        {tpl.status === 'unpublished' && (
                          <span className="inline-flex items-center gap-1.5 bg-red-50 text-red-700 border border-red-100 px-2.5 py-1 rounded-lg font-semibold text-[10px]">
                            <span className="h-1.5 w-1.5 rounded-full bg-red-500"></span> Suspended
                          </span>
                        )}
                      </div>

                      {/* Modify actions */}
                      <button
                        type="button"
                        onClick={() => loadTemplateIntoWorkspace(tpl)}
                        className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg"
                        title="Edit workspace"
                      >
                        <Eye className="h-4.5 w-4.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCloneForm(tpl)}
                        className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg"
                        title="Clone template"
                      >
                        <Copy className="h-4.5 w-4.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteForm(tpl.id)}
                        className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg"
                        title="Delete template"
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-12 text-center text-slate-400 font-medium">
                {searchQuery || selectedCategory !== 'all' ? (
                  <div>
                    <p className="text-slate-500 font-bold mb-1">No feedback forms found</p>
                    <p className="text-xs text-slate-400">Try clearing your search query or selecting a different category filter.</p>
                  </div>
                ) : (
                  "No custom feedback forms designed yet. Click 'Form' to start!"
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        // ------------------ WORKSPACE / EDITING WORKSPACE ------------------
        <div className="space-y-6 animate-fadeIn">
          {/* Header Action Row - Sticky at the top on scroll */}
          <div className="sticky top-0 z-20 -mt-6 md:-mt-8 -mx-6 md:-mx-8 px-6 md:px-8 py-4 bg-white/95 backdrop-blur-md border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm before:content-[''] before:absolute before:-top-6 md:before:-top-8 before:left-0 before:right-0 before:h-6 md:before:h-8 before:bg-white">
            <div className="flex items-center gap-3">
              <button
                id="btn-workspace-back"
                type="button"
                onClick={() => {
                  setActiveFormId(null);
                  setIsCreating(false);
                }}
                className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-sm hover:shadow transition-all"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-sm font-bold text-slate-900">
                    {isCreating ? 'Design New Survey' : `Workspace: ${formName}`}
                  </h1>
                  
                  {/* Version Selector beside title */}
                  {!isCreating && activeFormId && (
                    <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-lg text-xs">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Version:</span>
                      <select
                        id="form-version-selector"
                        className="bg-white border border-slate-200 rounded px-1 py-0.5 text-[11px] text-slate-700 font-bold focus:outline-none cursor-pointer"
                        value={formVersion}
                        onChange={(e) => handleVersionDropdownChange(parseInt(e.target.value, 10))}
                      >
                        {getAvailableVersionsForForm(activeFormId).map((v) => (
                          <option key={v} value={v}>
                            v{v} {v === (currentEditingTemplate?.version) ? '(Active)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-slate-500">Configure visual grid rows, input fields, and publication configurations</p>
              </div>
            </div>

            {/* Quick status controls */}
            <div className="flex items-center gap-2 flex-wrap">
              <select
                id="workspace-status"
                className="bg-white border border-slate-200 text-slate-700 text-xs px-2.5 py-1.5 rounded-xl focus:outline-none font-semibold shadow-sm cursor-pointer"
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as any)}
              >
                <option value="draft">Save as Draft</option>
                <option value="published">Publish Active</option>
                <option value="unpublished">Unpublish / Suspend</option>
              </select>


              <button
                id="btn-save-form"
                type="button"
                onClick={() => handleSaveWorkspace()}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer transition-colors"
              >
                <Check className="h-3.5 w-3.5" /> Commit Template
              </button>
            </div>
          </div>

          {/* Form Builder Main Sections (max-w-3xl centered layout matching customer feedback profile card) */}
          <div className="max-w-3xl mx-auto space-y-6 pt-6 md:pt-10 pb-12">

            {/* 1. Form Settings */}
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm space-y-4 animate-fadeIn">
              <h3 className="font-bold text-slate-900 text-xs flex items-center gap-1.5 border-b border-slate-150 pb-2">
                <Settings className="h-4 w-4 text-blue-600" /> Form Settings
              </h3>

              <div className="space-y-4 text-xs">
                {/* First Row: Feedback Form Name */}
                <div>
                  <label className="block text-slate-600 font-semibold mb-1 text-[11px]">Feedback Form Name</label>
                  <input
                    id="workspace-form-name"
                    type="text"
                    className="w-full h-9 bg-slate-50 border border-slate-200 rounded-lg px-3 text-slate-900 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white text-[11px]"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                  />
                </div>

                {/* Second Row: Assign to Categories */}
                <div className="relative" ref={categoryDropdownRef}>
                  <span className="block text-slate-600 font-semibold mb-1 text-[11px]">Assign to Categories</span>
                  <button
                    type="button"
                    onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                    className="w-full h-9 flex items-center justify-between bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg px-3 text-slate-700 text-[11px] font-semibold text-left focus:outline-none transition-colors"
                  >
                    <span className="truncate">
                      {formCategoryCodes.length === 0
                        ? 'Select Categories...'
                        : `${formCategoryCodes.length} categories selected (${formCategoryCodes.map(code => {
                            const cat = categories.find(c => c.code === code);
                            return cat ? cat.name : code;
                          }).join(', ')})`
                      }
                    </span>
                    <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isCategoryDropdownOpen && (
                    <div className="absolute left-0 right-0 z-50 mt-1 max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg p-2 space-y-1 animate-fadeIn">
                      {categories.length === 0 ? (
                        <p className="text-[10px] text-slate-400 p-2">No categories available</p>
                      ) : (
                        categories.map((c) => {
                          const isAssigned = formCategoryCodes.includes(c.code);
                          return (
                            <label
                              key={c.id}
                              className={`flex items-center gap-2 px-2 py-1.5 text-[11px] font-medium rounded-md cursor-pointer transition-colors ${
                                isAssigned ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              <input
                                type="checkbox"
                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                                checked={isAssigned}
                                onChange={() => handleToggleCategory(c.code)}
                              />
                              <span className="truncate">{c.name} ({c.code})</span>
                            </label>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>

                {/* Third Row: Active Period Deadline and Question Number Index */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Deadline date selection */}
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1 items-center gap-1 text-[11px]">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" /> Active Period Deadline
                    </label>
                    <input
                      id="setting-deadline"
                      type="date"
                      className="w-full h-9 bg-slate-50 border border-slate-200 rounded-lg px-3 text-[11px] text-slate-800 focus:outline-none"
                      value={formSettings.deadline || ''}
                      onChange={(e) => setFormSettings({ ...formSettings, deadline: e.target.value })}
                    />
                  </div>

                  {/* Question numbering selection */}
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1 items-center gap-1 text-[11px]">
                      <ListOrdered className="h-3.5 w-3.5 text-slate-400" /> Question Number Index
                    </label>
                    <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-3 h-9 text-[11px] text-slate-800">
                      <span className="text-slate-500">Show index numbers (1, 2, 3...)</span>
                      <button
                        id="setting-show-numbers"
                        type="button"
                        onClick={() => setFormSettings({ ...formSettings, showQuestionNumbers: !formSettings.showQuestionNumbers })}
                        className="text-slate-600 hover:text-blue-600 cursor-pointer flex items-center"
                      >
                        {formSettings.showQuestionNumbers ? (
                          <ToggleRight className="h-5.5 w-5.5 text-blue-600" />
                        ) : (
                          <ToggleLeft className="h-5.5 w-5.5 text-slate-400" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Feedback Elements Canvas */}
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-150">
                <h3 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <PlusCircle className="h-4 w-4 text-blue-600" /> Feedback Elements Canvas
                </h3>
              </div>

              {/* Rows mapped - WITHOUT independent inner scrollbar */}
              <div className="space-y-4 pr-1">
                {formRows.length > 0 ? (
                  formRows.map((row, rIdx) => (
                    <div key={row.id} className="border border-slate-150 rounded-xl overflow-hidden shadow-sm bg-white flex items-stretch">
                      {/* Fields in Row */}
                      <div className={`p-4 flex-1 grid gap-4 grid-cols-1 ${row.columnsCount === 2 ? 'md:grid-cols-2' : ''} bg-white`}>
                        {row.fields.map((field, fIdx) => (
                          <div key={field.id} className="p-3 bg-slate-50 rounded-lg border border-slate-150 space-y-2 text-xs">
                            {/* Field Type selection */}
                            <div className="flex items-center gap-2">
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Question type</label>
                              <select
                                id={`field-type-${rIdx}-${fIdx}`}
                                className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-[11px] text-slate-700"
                                value={field.type}
                                onChange={(e) => handleFieldChange(rIdx, fIdx, 'type', e.target.value as FieldType)}
                              >
                                <option value="text">Single Line Text</option>
                                <option value="textarea">Paragraph Area</option>
                                <option value="number">Numeric Input</option>
                                <option value="rating">Rating Stars</option>
                                <option value="dropdown">Selection Dropdown</option>
                                <option value="radio">Radio Buttons</option>
                                <option value="checkbox">Multi Checkboxes</option>
                                <option value="date">Date Picker</option>
                                <option value="file">File Attachment Upload</option>
                              </select>
                            </div>

                            {/* Question title */}
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Question</label>
                              <input
                                id={`field-question-${rIdx}-${fIdx}`}
                                type="text"
                                className="w-full bg-white border border-slate-200 rounded px-2.5 py-1 text-[11px] text-slate-800 focus:outline-none"
                                value={field.question}
                                onChange={(e) => handleFieldChange(rIdx, fIdx, 'question', e.target.value)}
                              />
                            </div>

                            {/* Check Required */}
                            <div className="flex items-center gap-1.5 pt-1">
                              <input
                                id={`field-required-${rIdx}-${fIdx}`}
                                type="checkbox"
                                className="rounded border-slate-300 text-blue-600"
                                checked={field.required}
                                onChange={(e) => handleFieldChange(rIdx, fIdx, 'required', e.target.checked)}
                              />
                              <span className="text-[10px] text-slate-500 font-bold uppercase">Required Field</span>
                            </div>

                            {/* Options List (for dropdown, radio, checkbox) */}
                            {['dropdown', 'radio', 'checkbox'].includes(field.type) && (
                              <div className="space-y-1.5 pt-2 border-t border-slate-200">
                                <label className="block text-[10px] font-bold text-slate-500 uppercase">Interactive Options</label>
                                
                                {/* List */}
                                <div className="flex flex-wrap gap-1">
                                  {(field.options || []).map((opt) => (
                                    <span key={opt} className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded flex items-center gap-1 text-[10px] font-medium border border-slate-300">
                                      {opt}
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveOption(rIdx, fIdx, opt)}
                                        className="text-red-500 hover:text-red-700 font-bold font-sans text-[9px]"
                                      >
                                        x
                                      </button>
                                    </span>
                                  ))}
                                </div>

                                {/* Add Option Input */}
                                <div className="flex gap-1">
                                  <input
                                    id={`new-opt-input-${rIdx}-${fIdx}`}
                                    type="text"
                                    placeholder="New Option"
                                    className="flex-1 bg-white border border-slate-200 rounded px-1.5 py-0.5 text-[10px] focus:outline-none"
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        const val = e.currentTarget.value;
                                        handleAddOption(rIdx, fIdx, val);
                                        e.currentTarget.value = '';
                                      }
                                    }}
                                  />
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      const input = document.getElementById(`new-opt-input-${rIdx}-${fIdx}`) as HTMLInputElement;
                                      if (input) {
                                        handleAddOption(rIdx, fIdx, input.value);
                                        input.value = '';
                                      }
                                    }}
                                    className="px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-semibold"
                                  >
                                    Add
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Row Actions on the right side */}
                      <div className="flex flex-col justify-center items-center gap-1.5 bg-slate-50/70 border-l border-slate-150 px-2 shrink-0 w-11">
                        <button
                          type="button"
                          onClick={() => handleMoveRow(rIdx, 'up')}
                          disabled={rIdx === 0}
                          className="p-1 hover:bg-slate-200 text-slate-600 disabled:opacity-30 rounded cursor-pointer transition-colors"
                          title="Move Up"
                        >
                          <ChevronUp className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveRow(rIdx, 'down')}
                          disabled={rIdx === formRows.length - 1}
                          className="p-1 hover:bg-slate-200 text-slate-600 disabled:opacity-30 rounded cursor-pointer transition-colors"
                          title="Move Down"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(row.id)}
                          className="p-1 hover:bg-red-50 text-red-600 rounded cursor-pointer transition-colors mt-1.5"
                          title="Remove Row"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-slate-400 italic">
                    Form is empty. Click "+ Column Row" to insert elements.
                  </div>
                )}
              </div>

              {/* Quick Row Injectors */}
              <div className="pt-2 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => handleAddRow(1)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold shadow-sm hover:shadow transition-all cursor-pointer"
                >
                  <Plus className="h-4 w-4 text-slate-500" /> Add 1 Column Row
                </button>
                <button
                  type="button"
                  onClick={() => handleAddRow(2)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold shadow-sm hover:shadow transition-all cursor-pointer"
                >
                  <Plus className="h-4 w-4 text-slate-500" /> Add 2 Column Row
                </button>
              </div>
            </div>

          </div>

          {/* 3. Pop-out Live Preview Modal */}
          {isPreviewOpen && (
            <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/60 backdrop-blur-sm p-4 pt-10 md:pt-16 animate-fadeIn">
              <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
                {/* Modal Header */}
                <div className="bg-slate-900 text-slate-100 px-5 py-3.5 flex items-center justify-between shrink-0">
                  <span className="flex items-center gap-1.5 text-xs font-bold tracking-wide uppercase">
                    <Eye className="h-4 w-4 text-blue-400" /> LIVE VISUAL PREVIEW
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsPreviewOpen(false)}
                    className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-lg transition-colors"
                    title="Close Preview"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                
                {/* Modal Scrollable Body */}
                <div className="p-6 overflow-y-auto space-y-5">
                  {/* Form Title banner */}
                  <div className="text-center pb-4 border-b border-slate-150">
                    <h2 className="font-bold text-slate-900 text-base">{formName || 'Operational Feedback Form'}</h2>
                    <p className="text-[11px] text-slate-400 mt-1">Please provide your genuine experience ratings below</p>
                  </div>

                  {/* Simulated form contents */}
                  <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); alert('Demo submission successful! (Simulated submission action)'); }}>
                    {(() => {
                      let questionCounter = 0;
                      return formRows.map((row) => (
                        <div key={row.id} className={`grid gap-4 grid-cols-1 ${row.columnsCount === 2 ? 'md:grid-cols-2' : ''}`}>
                          {row.fields.map((field) => {
                            questionCounter++;
                            const currentNum = questionCounter;
                            return (
                              <div key={field.id} className="space-y-1.5 text-xs">
                                <label className="block font-semibold text-slate-700">
                                  {formSettings.showQuestionNumbers ? `${currentNum}. ` : ''}
                                  {field.question || 'Configuring question...'}
                                  {field.required && <span className="text-red-500 ml-0.5">*</span>}
                                </label>

                                {/* Render Field visual styles */}
                                {field.type === 'text' && (
                                  <input
                                    type="text"
                                    disabled
                                    placeholder="Customer text answer goes here"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-500 text-xs cursor-not-allowed"
                                  />
                                )}

                                {field.type === 'textarea' && (
                                  <textarea
                                    disabled
                                    rows={3}
                                    placeholder="Customer paragraph answer goes here"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-500 text-xs cursor-not-allowed"
                                  ></textarea>
                                )}

                                {field.type === 'number' && (
                                  <input
                                    type="number"
                                    disabled
                                    placeholder="0.00"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-500 text-xs cursor-not-allowed"
                                  />
                                )}

                                {field.type === 'rating' && (
                                  <div className="flex items-center gap-1.5 bg-amber-50 p-2 rounded-lg border border-amber-100 w-fit">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                      <Star key={i} className="h-4.5 w-4.5 text-amber-400 fill-amber-400" />
                                    ))}
                                    <span className="text-xs text-amber-800 font-bold ml-1">5.0 / 5.0</span>
                                  </div>
                                )}

                                {field.type === 'date' && (
                                  <input
                                    type="date"
                                    disabled
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-500 text-xs cursor-not-allowed"
                                  />
                                )}

                                {field.type === 'file' && (
                                  <div className="border border-dashed border-slate-300 hover:border-slate-400 rounded-xl p-6 text-center bg-slate-50 flex flex-col items-center justify-center gap-2 transition-colors">
                                    <div className="p-2 bg-slate-100 border border-slate-200 rounded-full">
                                      <Upload className="h-5 w-5 text-slate-500" />
                                    </div>
                                    <div className="text-xs font-semibold text-slate-700">Drag & drop files here, or click to upload</div>
                                    <p className="text-[10px] text-slate-400">Supports image files, PDF documents up to 10MB</p>
                                    <button
                                      type="button"
                                      className="mt-1 px-3 py-1.5 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 border border-slate-200 rounded-lg shadow-sm hover:shadow transition-all cursor-pointer"
                                    >
                                      Browse Files
                                    </button>
                                  </div>
                                )}

                                {field.type === 'dropdown' && (
                                  <select disabled className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-500 text-xs cursor-not-allowed">
                                    <option>Select Option...</option>
                                    {(field.options || []).map((o) => (
                                      <option key={o}>{o}</option>
                                    ))}
                                  </select>
                                )}

                                {field.type === 'radio' && (
                                  <div className="space-y-2 pl-1">
                                    {(field.options || []).map((o) => (
                                      <label key={o} className="flex items-center gap-2 text-slate-500">
                                        <input type="radio" disabled className="text-slate-300 border-slate-200 h-3.5 w-3.5" />
                                        <span>{o}</span>
                                      </label>
                                    ))}
                                  </div>
                                )}

                                {field.type === 'checkbox' && (
                                  <div className="space-y-2 pl-1">
                                    {(field.options || []).map((o) => (
                                      <label key={o} className="flex items-center gap-2 text-slate-500">
                                        <input type="checkbox" disabled className="text-slate-300 border-slate-200 h-3.5 w-3.5 rounded" />
                                        <span>{o}</span>
                                      </label>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ));
                    })()}

                    <div className="pt-4">
                      <button
                        type="submit"
                        className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold shadow-md hover:bg-slate-800 transition-colors"
                      >
                        Submit Mock Survey Response
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
      {/* Workspace Wrapper End */}
      </div>
      )}

      {/* Floating Live Preview Action Button */}
      {activeFormId && (
        <button
          id="btn-preview-form"
          type="button"
          onClick={() => setIsPreviewOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg cursor-pointer transition-all hover:scale-110 active:scale-95 group border border-blue-500/10 animate-bounce"
          title="View Live Preview"
        >
          <Eye className="h-5 w-5" />
          <span className="absolute right-14 bg-slate-900 text-white text-[10px] px-2 py-1 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none font-bold">
            View Live Preview
          </span>
        </button>
      )}
    </div>
  );
}
