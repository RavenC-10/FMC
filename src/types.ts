export interface Category {
  id: string;
  name: string;
  code: string; // unique, e.g. 'HOTEL', 'THEME_PARK', 'SHOW', 'FB'
  description: string;
  icon: string; // Lucide icon name
  status: 'active' | 'inactive';
  displayOrder: number;
  teamEmail: string; // Team email associated with the category
}

export type FeedbackStatus = string;

export interface AuditLog {
  id: string;
  fromStatus: string;
  toStatus: string;
  changedBy: string;
  changedAt: string;
  comment?: string;
}

export interface FeedbackReply {
  id: string;
  staffName: string;
  content: string;
  sentAt: string;
}

export interface FeedbackItem {
  id: string; // Ticket ID e.g. TKT-2026-0001
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  bookingReference?: string;
  formname: string;
  categoryCode: string; // Associated Category code
  productName: string;
  location: string;
  rating: number; // 1-5
  comments: string;
  dateOfExperience: string;
  submittedDate: string;
  lastUpdated: string;
  sentToSystemA: boolean;
  repliedToCustomer: boolean;
  internalNotes: string[];
  replies: FeedbackReply[];
  statusLog: AuditLog[];
  attachments: string[]; // Mock image URLs/names
}

export type FieldType =
  | 'text'
  | 'textarea'
  | 'dropdown'
  | 'radio'
  | 'checkbox'
  | 'rating'
  | 'date'
  | 'file'
  | 'number';

export interface FormField {
  id: string;
  type: FieldType;
  question: string;
  required: boolean;
  options?: string[]; // Used for dropdown, radio, checkbox
}

export interface FormRow {
  id: string;
  columnsCount: number; // 1 or 2
  fields: FormField[];
}

export interface FormSettings {
  deadline?: string;
  allowAnonymous: boolean;
  notificationTrigger: boolean;
  notificationEmails?: string;
  showQuestionNumbers?: boolean;
}

export interface FormTemplate {
  id: string;
  name: string;
  categoryCodes: string[]; // Can be assigned to multiple categories
  status: 'draft' | 'published' | 'unpublished';
  version: number;
  lastUpdated: string;
  rows: FormRow[];
  settings: FormSettings;
}

export interface LoginLockout {
  failedAttempts: number;
  lockoutUntil?: string; // ISO string if locked out
}

export type UserStatus = 'Active' | 'Inactive' | 'Locked';

export interface User {
  id: string; // auto-generated
  username: string;
  fullName: string;
  email: string;
  userGroupId: string; // foreign key to UserGroup
  status: UserStatus;
  createdDate: string;
  lastLoginDate: string;
}

export interface UserGroup {
  id: string;
  name: string;
  code: string; // e.g. 'SUPER_ADMIN', 'MANAGER', 'AGENT', 'VIEWER'
  description: string;
  status: 'Active' | 'Inactive';
}

export type PermissionAction = 'view' | 'create' | 'edit' | 'delete' | 'reply' | 'export';

export type AppModule = 
  | 'Dashboard'
  | 'Customer Feedback'
  | 'Form Builder'
  | 'Category'
  | 'User'
  | 'User Group'
  | 'Setting';

// Map of module -> actions supported/allowed
export interface ModulePermissions {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  reply: boolean;
  export: boolean;
}

export interface UserAccessRights {
  userGroupId: string; // key
  permissions: Record<AppModule, ModulePermissions>;
}

export interface UamAuditLog {
  id: string;
  changedBy: string;
  changedAt: string;
  userGroupName: string;
  moduleName: AppModule;
  actionName: PermissionAction;
  newValue: boolean;
}

