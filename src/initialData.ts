import { Category, FeedbackItem, FormTemplate, User, UserGroup, UserAccessRights, UamAuditLog, AppModule, ModulePermissions } from './types';

export const INITIAL_CATEGORIES: Category[] = [
  {
    id: 'cat-1',
    name: 'Hotel & Resorts',
    code: 'HOTEL',
    description: 'Guest feedback regarding resort stays, room services, housekeeping, and front desk operations.',
    icon: 'Hotel',
    status: 'active',
    displayOrder: 1,
    teamEmail: 'hotel-ops@resortcorp.com',
  },
  {
    id: 'cat-2',
    name: 'Theme Parks',
    code: 'THEME_PARK',
    description: 'Visitor input about rides, safety measures, queues, park cleanliness, and ticketing services.',
    icon: 'Sparkles',
    status: 'active',
    displayOrder: 2,
    teamEmail: 'park-safety@resortcorp.com',
  },
  {
    id: 'cat-3',
    name: 'Live Shows & Concerts',
    code: 'SHOW',
    description: 'Audience reviews on theater seating, audio-visual quality, performance, and general operations.',
    icon: 'Ticket',
    status: 'active',
    displayOrder: 3,
    teamEmail: 'entertainment@resortcorp.com',
  },
  {
    id: 'cat-4',
    name: 'Food & Beverage',
    code: 'FB',
    description: 'Dining feedback on restaurants, cafes, bar service, menu selections, and hygiene standard.',
    icon: 'Utensils',
    status: 'active',
    displayOrder: 4,
    teamEmail: 'fb-team@resortcorp.com',
  },
];

export const INITIAL_FEEDBACK: FeedbackItem[] = [
  {
    id: 'TKT-2026-0001',
    customerName: 'Sarah Jenkins',
    customerEmail: 'sarah.j@example.com',
    customerPhone: '+1 (555) 234-5678',
    bookingReference: 'BK-9912A',
    formname: 'Grand Resort Guest Experience Survey',
    categoryCode: 'HOTEL',
    productName: 'Grand Royal Plaza Hotel',
    location: 'Tower A - Room 402',
    rating: 2,
    comments: 'The room cleanliness was disappointing. Dust on the TV stand, and the towels felt damp upon arrival. I called room service but it took over 45 minutes for a replacement set of towels. The location is excellent, but service quality needs major improvements.',
    dateOfExperience: '2026-07-10',
    submittedDate: '2026-07-11T09:30:00Z',
    lastUpdated: '2026-07-13T14:20:00Z',
    sentToSystemA: true,
    repliedToCustomer: false,
    internalNotes: [
      'Housekeeping supervisor notified of Tower A Room 402 towels delay.',
      'Guest offered complimentary breakfast voucher as apology.',
    ],
    replies: [
      {
        id: 'rep-1',
        staffName: 'Marcus Vance (Guest Relations Manager)',
        content: 'Dear Sarah, thank you for sharing your experience. I sincerely apologize for the delay in replacing your towels and the oversight in dusting. This does not represent our usual standards. We are looking into our Tower A staffing to prevent this from recurring. I hope the breakfast voucher we emailed helps restore your confidence in our resort.',
        sentAt: '2026-07-13T14:15:00Z',
      },
    ],
    statusLog: [
      {
        id: 'log-1',
        fromStatus: 'created',
        toStatus: 'pending',
        changedBy: 'System',
        changedAt: '2026-07-11T09:30:00Z',
        comment: 'Feedback submitted online.',
      },
      {
        id: 'log-2',
        fromStatus: 'pending',
        toStatus: 'wip',
        changedBy: 'Marcus Vance',
        changedAt: '2026-07-13T14:10:00Z',
        comment: 'Assigned to Guest Relations, investigating Tower A housekeeping logs.',
      },
    ],
    attachments: ['https://images.unsplash.com/photo-1590490360182-c33d57733427?w=400&auto=format&fit=crop'],
  },
  {
    id: 'TKT-2026-0002',
    customerName: 'David Chen',
    customerEmail: 'dchen.tech@example.com',
    customerPhone: '+1 (555) 876-5432',
    bookingReference: 'BK-5011B',
    formname: 'Theme Park Ride Satisfaction Survey',
    categoryCode: 'THEME_PARK',
    productName: 'Adventure Kingdom',
    location: 'HyperCoaster Extreme',
    rating: 5,
    comments: 'Incredible experience! The Express Lane system worked beautifully. The ride operators were energetic and highly prioritized safety checks. Even during peak hours, the queue area felt breezy and comfortable.',
    dateOfExperience: '2026-07-12',
    submittedDate: '2026-07-12T18:45:00Z',
    lastUpdated: '2026-07-14T10:00:00Z',
    sentToSystemA: true,
    repliedToCustomer: true,
    internalNotes: [
      'Compliment passed to HyperCoaster shift lead.',
    ],
    replies: [
      {
        id: 'rep-2',
        staffName: 'Elena Rostova (Operations Director)',
        content: 'Hi David! Thank you so much for the fantastic feedback! We are thrilled to hear you had an amazing experience at our HyperCoaster Extreme and that our safety measures and Express queue system lived up to your expectations. We look forward to welcoming you back soon!',
        sentAt: '2026-07-14T09:55:00Z',
      },
    ],
    statusLog: [
      {
        id: 'log-3',
        fromStatus: 'created',
        toStatus: 'pending',
        changedBy: 'System',
        changedAt: '2026-07-12T18:45:00Z',
        comment: 'Feedback received.',
      },
      {
        id: 'log-4',
        fromStatus: 'pending',
        toStatus: 'completed',
        changedBy: 'Elena Rostova',
        changedAt: '2026-07-14T10:00:00Z',
        comment: 'Sent formal appreciation note to guest, marked as closed.',
      },
    ],
    attachments: [],
  },
  {
    id: 'TKT-2026-0003',
    customerName: 'Aisha Rahman',
    customerEmail: 'arahman@example.com',
    customerPhone: '+44 20 7946 0958',
    bookingReference: 'BK-3398D',
    formname: 'Show Seating & Sound Quality Check',
    categoryCode: 'SHOW',
    productName: 'The Mystical Symphony Theater',
    location: 'Row G - Seat 14 & 15',
    rating: 3,
    comments: 'The performers and musicians were top-tier, truly breathtaking. However, our view from Row G was obstructed by an oversized speaker rig on the left. In addition, the theater hall was freezing! We had to keep our winter coats on the entire show.',
    dateOfExperience: '2026-07-13',
    submittedDate: '2026-07-14T02:10:00Z',
    lastUpdated: '2026-07-14T02:10:00Z',
    sentToSystemA: false,
    repliedToCustomer: false,
    internalNotes: [],
    replies: [],
    statusLog: [
      {
        id: 'log-5',
        fromStatus: 'created',
        toStatus: 'pending',
        changedBy: 'System',
        changedAt: '2026-07-14T02:10:00Z',
        comment: 'Feedback logged via digital theater survey.',
      },
    ],
    attachments: [],
  },
  {
    id: 'TKT-2026-0004',
    customerName: 'Robert Kowalski',
    customerEmail: 'rob.kow@example.com',
    customerPhone: '+48 22 123 4567',
    bookingReference: 'BK-2041C',
    formname: 'Show Seating & Sound Quality Check',
    categoryCode: 'FB',
    productName: 'Oceanic Seafood Grill',
    location: 'Table 14 - Terrace',
    rating: 1,
    comments: 'Extremely disappointed. We ordered the Lobster Platter which arrived lukewarm. When we informed the waiter, they seemed annoyed and took another 30 minutes to bring a recooked dish. By that time, the rest of my family had finished eating.',
    dateOfExperience: '2026-07-13',
    submittedDate: '2026-07-14T11:20:00Z',
    lastUpdated: '2026-07-14T15:00:00Z',
    sentToSystemA: true,
    repliedToCustomer: false,
    internalNotes: [
      'Chef Andre consulted on Table 14 platter issue. Re-emphasized grill serving standards.',
      'Waiter Kevin coached on customer service recovery and complaint handling.',
    ],
    replies: [],
    statusLog: [
      {
        id: 'log-6',
        fromStatus: 'created',
        toStatus: 'pending',
        changedBy: 'System',
        changedAt: '2026-07-14T11:20:00Z',
        comment: 'Negative score alert triggered. Assigned to F&B duty manager.',
      },
      {
        id: 'log-7',
        fromStatus: 'pending',
        toStatus: 'wip',
        changedBy: 'Robert Chen (F&B Director)',
        changedAt: '2026-07-14T15:00:00Z',
        comment: 'Investigating service logs for waiter on terrace shift. Drafted apology.',
      },
    ],
    attachments: [],
  },
  {
    id: 'TKT-2026-0005',
    customerName: 'Michael Chang',
    customerEmail: 'mchang@example.com',
    customerPhone: '+1 (555) 443-1122',
    bookingReference: 'BK-7704F',
    formname: 'Grand Resort Guest Experience Survey',
    categoryCode: 'HOTEL',
    productName: 'Bayside Marina Lodge',
    location: 'Lobby Bar',
    rating: 4,
    comments: 'Great check-in process and exceptionally friendly staff. The swimming pool was fantastic, but the lobby bar was extremely crowded with a 20-minute wait just to order a soft drink. Rooms are perfect though!',
    dateOfExperience: '2026-07-09',
    submittedDate: '2026-07-10T15:10:00Z',
    lastUpdated: '2026-07-11T12:00:00Z',
    sentToSystemA: true,
    repliedToCustomer: true,
    internalNotes: ['Lobby bar staffing is being increased on Friday/Saturday nights.'],
    replies: [
      {
        id: 'rep-3',
        staffName: 'Marcus Vance',
        content: 'Hi Michael! Glad you loved the pool and rooms. We have taken your comments regarding the Lobby Bar congestion to heart. We are scheduling an extra mixologist and cashier on peak weekend nights to speed up orders. Thanks for helping us improve!',
        sentAt: '2026-07-11T11:58:00Z',
      },
    ],
    statusLog: [
      {
        id: 'log-8',
        fromStatus: 'created',
        toStatus: 'pending',
        changedBy: 'System',
        changedAt: '2026-07-10T15:10:00Z',
        comment: 'Feedback logged.',
      },
      {
        id: 'log-9',
        fromStatus: 'pending',
        toStatus: 'completed',
        changedBy: 'Marcus Vance',
        changedAt: '2026-07-11T12:00:00Z',
        comment: 'Replied and verified bar action item.',
      },
    ],
    attachments: [],
  },
  {
    id: 'TKT-2026-0006',
    customerName: 'Sophia Loren',
    customerEmail: 'sophia@example.com',
    customerPhone: '+39 02 8765 4321',
    bookingReference: 'BK-1029X',
    formname: 'Show Seating & Sound Quality Check',
    categoryCode: 'FB',
    productName: 'La Bella Vista Pizzeria',
    location: 'Main Oven Counter',
    rating: 5,
    comments: 'Best authentic pizza I have had in years outside of Italy! The truffle mushroom pizza is sublime, and the chef made our kids custom dough shapes which made their day. Amazing hospitality!',
    dateOfExperience: '2026-07-11',
    submittedDate: '2026-07-12T20:15:00Z',
    lastUpdated: '2026-07-13T09:00:00Z',
    sentToSystemA: true,
    repliedToCustomer: true,
    internalNotes: ['Chef Luigi applauded at the morning meeting!'],
    replies: [
      {
        id: 'rep-4',
        staffName: 'Chef Luigi',
        content: 'Grazie mille Sophia! It was an absolute joy baking for your beautiful family. We take pride in our sourdough and custom shapes for the little ones! Hope to see you back for more truffle pizzas!',
        sentAt: '2026-07-13T08:50:00Z',
      },
    ],
    statusLog: [
      {
        id: 'log-10',
        fromStatus: 'created',
        toStatus: 'pending',
        changedBy: 'System',
        changedAt: '2026-07-12T20:15:00Z',
        comment: 'Complimentary review logged.',
      },
      {
        id: 'log-11',
        fromStatus: 'pending',
        toStatus: 'completed',
        changedBy: 'Chef Luigi',
        changedAt: '2026-07-13T09:00:00Z',
        comment: 'Luigi thanked the guest directly.',
      },
    ],
    attachments: [],
  },
  {
    id: 'TKT-2026-0007',
    customerName: 'Thomas Anderson',
    customerEmail: 'neo@example.com',
    customerPhone: '+1 (555) 101-0101',
    bookingReference: 'BK-11001',
    formname: 'Theme Park Ride Satisfaction Survey',
    categoryCode: 'THEME_PARK',
    productName: 'Virtual Arena',
    location: 'Matrix Ride Cabin 2',
    rating: 4,
    comments: 'The VR simulation is mind-bendingly realistic. The motion tracking was flawless, but the sanitizing of the VR headsets felt a bit rushed between sessions. Please ensure a thorough antiseptic wipe is used.',
    dateOfExperience: '2026-07-13',
    submittedDate: '2026-07-14T05:30:00Z',
    lastUpdated: '2026-07-14T05:30:00Z',
    sentToSystemA: false,
    repliedToCustomer: false,
    internalNotes: [],
    replies: [],
    statusLog: [
      {
        id: 'log-12',
        fromStatus: 'created',
        toStatus: 'pending',
        changedBy: 'System',
        changedAt: '2026-07-14T05:30:00Z',
        comment: 'Logged online.',
      },
    ],
    attachments: [],
  },
  {
    id: 'TKT-2026-0008',
    customerName: 'Chloe Henderson',
    customerEmail: 'chloe.h@example.com',
    customerPhone: '+61 2 9382 0192',
    bookingReference: 'BK-4552G',
    formname: 'Show Seating & Sound Quality Check',
    categoryCode: 'SHOW',
    productName: 'Spectacular Water World Acrobatics',
    location: 'Splash Zone - Row B',
    rating: 5,
    comments: 'Unbelievable dives! The trampoline segments were synchronized to perfection. We got thoroughly drenched as promised! Worth every penny. Highly recommend purchasing the splash zone raincoat.',
    dateOfExperience: '2026-07-11',
    submittedDate: '2026-07-12T11:00:00Z',
    lastUpdated: '2026-07-12T14:00:00Z',
    sentToSystemA: true,
    repliedToCustomer: true,
    internalNotes: [],
    replies: [
      {
        id: 'rep-5',
        staffName: 'Elena Rostova',
        content: 'Hi Chloe! Great to hear you survived the Splash Zone and loved the synchronized dives! Our acrobatic diving team works incredibly hard on timing and choreographies. Stay dry and we look forward to splashing you again!',
        sentAt: '2026-07-12T13:45:00Z',
      },
    ],
    statusLog: [
      {
        id: 'log-13',
        fromStatus: 'created',
        toStatus: 'pending',
        changedBy: 'System',
        changedAt: '2026-07-12T11:00:00Z',
        comment: 'Feedback logged.',
      },
      {
        id: 'log-14',
        fromStatus: 'pending',
        toStatus: 'completed',
        changedBy: 'Elena Rostova',
        changedAt: '2026-07-12T14:00:00Z',
        comment: 'Marked closed with a friendly reply.',
      },
    ],
    attachments: [],
  },
];

export const INITIAL_FORMS: FormTemplate[] = [
  {
    id: 'form-1',
    name: 'Grand Resort Guest Experience Survey',
    categoryCodes: ['HOTEL'],
    status: 'published',
    version: 2,
    lastUpdated: '2026-07-10T08:00:00Z',
    settings: {
      deadline: '2026-12-31',
      allowAnonymous: false,
      notificationTrigger: true,
      notificationEmails: 'hotel-ops@resortcorp.com',
    },
    rows: [
      {
        id: 'row-1',
        columnsCount: 1,
        fields: [
          {
            id: 'f-1',
            type: 'rating',
            question: 'How would you rate your overall room cleanliness?',
            required: true,
          },
        ],
      },
      {
        id: 'row-2',
        columnsCount: 2,
        fields: [
          {
            id: 'f-2',
            type: 'dropdown',
            question: 'Which block did you stay in?',
            required: true,
            options: ['Tower A', 'Tower B', 'Lakeside Cabanas', 'Ocean Villas'],
          },
          {
            id: 'f-3',
            type: 'text',
            question: 'What was your room number?',
            required: false,
          },
        ],
      },
      {
        id: 'row-3',
        columnsCount: 1,
        fields: [
          {
            id: 'f-4',
            type: 'textarea',
            question: 'Please share any specific suggestions to improve our guest relations service.',
            required: false,
          },
        ],
      },
    ],
  },
  {
    id: 'form-2',
    name: 'Theme Park Ride Satisfaction Survey',
    categoryCodes: ['THEME_PARK'],
    status: 'published',
    version: 1,
    lastUpdated: '2026-06-15T10:30:00Z',
    settings: {
      allowAnonymous: true,
      notificationTrigger: false,
      notificationEmails: 'park-safety@resortcorp.com',
    },
    rows: [
      {
        id: 'row-4',
        columnsCount: 1,
        fields: [
          {
            id: 'f-5',
            type: 'rating',
            question: 'Overall ride excitement and thrill rating:',
            required: true,
          },
        ],
      },
      {
        id: 'row-5',
        columnsCount: 2,
        fields: [
          {
            id: 'f-6',
            type: 'dropdown',
            question: 'Which ride is this feedback for?',
            required: true,
            options: ['HyperCoaster Extreme', 'Water Splash Flume', 'Virtual Arena', 'Merry-Go-Round Deluxe'],
          },
          {
            id: 'f-7',
            type: 'radio',
            question: 'Did you use the Express Queue pass?',
            required: true,
            options: ['Yes, fully worth it', 'Yes, but too expensive', 'No, queue was short', 'No, queue was too long'],
          },
        ],
      },
      {
        id: 'row-6',
        columnsCount: 1,
        fields: [
          {
            id: 'f-8',
            type: 'file',
            question: 'Upload any photos of ride conditions or facilities (Optional):',
            required: false,
          },
        ],
      },
    ],
  },
  {
    id: 'form-3',
    name: 'Show Seating & Sound Quality Check',
    categoryCodes: ['SHOW'],
    status: 'draft',
    version: 1,
    lastUpdated: '2026-07-14T11:00:00Z',
    settings: {
      allowAnonymous: true,
      notificationTrigger: true,
      notificationEmails: 'entertainment@resortcorp.com',
    },
    rows: [
      {
        id: 'row-7',
        columnsCount: 1,
        fields: [
          {
            id: 'f-9',
            type: 'rating',
            question: 'Audibility and audio clarity rating:',
            required: true,
          },
        ],
      },
      {
        id: 'row-8',
        columnsCount: 1,
        fields: [
          {
            id: 'f-10',
            type: 'checkbox',
            question: 'Were any of these issues experienced during your show?',
            required: false,
            options: [
              'Obstructed sightline',
              'Hall temperature too cold/warm',
              'Squeaky seating',
              'Late-seating distractions',
            ],
          },
        ],
      },
    ],
  },
];



export const INITIAL_USER_GROUPS: UserGroup[] = [
  {
    id: 'group-1',
    name: 'Super Admin',
    code: 'SUPER_ADMIN',
    description: 'Full access to all modules and configurations with zero restrictions.',
    status: 'Active',
  },
  {
    id: 'group-2',
    name: 'Manager',
    code: 'MANAGER',
    description: 'Access to view dashboard, manage feedback, manage forms, and view users list.',
    status: 'Active',
  },
  {
    id: 'group-3',
    name: 'Agent',
    code: 'AGENT',
    description: 'Front-line staff who can view customer feedback and post replies/remedies.',
    status: 'Active',
  },
  {
    id: 'group-4',
    name: 'Viewer',
    code: 'VIEWER',
    description: 'Read-only access to dashboard indicators and customer feedback tickets.',
    status: 'Active',
  },
];

export const INITIAL_USERS: User[] = [
  {
    id: 'user-1',
    username: 'admin',
    fullName: 'Administrator',
    email: 'admin@resortcorp.com',
    userGroupId: 'group-1',
    status: 'Active',
    createdDate: '2026-01-10T08:00:00Z',
    lastLoginDate: '2026-07-15T00:10:00Z',
  },
  {
    id: 'user-2',
    username: 'jdoe',
    fullName: 'Jane Doe',
    email: 'jane.doe@resortcorp.com',
    userGroupId: 'group-2',
    status: 'Active',
    createdDate: '2026-02-15T09:30:00Z',
    lastLoginDate: '2026-07-14T16:45:00Z',
  },
  {
    id: 'user-3',
    username: 'rsmith',
    fullName: 'Robert Smith',
    email: 'rsmith@resortcorp.com',
    userGroupId: 'group-3',
    status: 'Active',
    createdDate: '2026-03-22T10:15:00Z',
    lastLoginDate: '2026-07-15T01:05:00Z',
  },
  {
    id: 'user-4',
    username: 'ajohnson',
    fullName: 'Alice Johnson',
    email: 'ajohnson@resortcorp.com',
    userGroupId: 'group-4',
    status: 'Inactive',
    createdDate: '2026-05-01T14:20:00Z',
    lastLoginDate: '2026-06-30T11:40:00Z',
  },
];

const createEmptyPermissions = (overrides?: Partial<Record<AppModule, Partial<ModulePermissions>>>): Record<AppModule, ModulePermissions> => {
  const modules: AppModule[] = [
    'Dashboard',
    'Customer Feedback',
    'Form Builder',
    'Category',
    'User',
    'User Group',
    'Setting',
  ];
  
  const result = {} as Record<AppModule, ModulePermissions>;
  
  modules.forEach((mod) => {
    result[mod] = {
      view: false,
      create: false,
      edit: false,
      delete: false,
      reply: false,
      export: false,
    };
  });

  if (overrides) {
    Object.keys(overrides).forEach((m) => {
      const typedMod = m as AppModule;
      result[typedMod] = {
        ...result[typedMod],
        ...overrides[typedMod],
      };
    });
  }

  return result;
};

export const INITIAL_ACCESS_RIGHTS: UserAccessRights[] = [
  {
    userGroupId: 'group-1', // Super Admin
    permissions: createEmptyPermissions({
      'Dashboard': { view: true, create: false, edit: false, delete: false, reply: false, export: true },
      'Customer Feedback': { view: true, create: false, edit: true, delete: true, reply: true, export: true },
      'Form Builder': { view: true, create: true, edit: true, delete: true, reply: false, export: false },
      'Category': { view: true, create: true, edit: true, delete: true, reply: false, export: false },
      'User': { view: true, create: true, edit: true, delete: true, reply: false, export: false },
      'User Group': { view: true, create: true, edit: true, delete: true, reply: false, export: false },
      'Setting': { view: true, create: false, edit: true, delete: false, reply: false, export: false },
    }),
  },
  {
    userGroupId: 'group-2', // Manager
    permissions: createEmptyPermissions({
      'Dashboard': { view: true, create: false, edit: false, delete: false, reply: false, export: true },
      'Customer Feedback': { view: true, create: false, edit: true, delete: true, reply: true, export: true },
      'Form Builder': { view: true, create: true, edit: true, delete: true, reply: false, export: false },
      'Category': { view: true, create: false, edit: false, delete: false, reply: false, export: false },
      'User': { view: true, create: false, edit: false, delete: false, reply: false, export: false },
      'User Group': { view: true, create: false, edit: false, delete: false, reply: false, export: false },
      'Setting': { view: true, create: false, edit: false, delete: false, reply: false, export: false },
    }),
  },
  {
    userGroupId: 'group-3', // Agent
    permissions: createEmptyPermissions({
      'Dashboard': { view: true, create: false, edit: false, delete: false, reply: false, export: false },
      'Customer Feedback': { view: true, create: false, edit: false, delete: false, reply: true, export: false },
    }),
  },
  {
    userGroupId: 'group-4', // Viewer
    permissions: createEmptyPermissions({
      'Dashboard': { view: true, create: false, edit: false, delete: false, reply: false, export: false },
      'Customer Feedback': { view: true, create: false, edit: false, delete: false, reply: false, export: false },
    }),
  },
];

const LOCAL_STORAGE_KEYS = {
  CATEGORIES: 'feedback_mgt_categories',
  FEEDBACK: 'feedback_mgt_feedback',
  FORMS: 'feedback_mgt_forms',
  LOCKOUT: 'feedback_mgt_lockout',
  USERS: 'feedback_mgt_users',
  USER_GROUPS: 'feedback_mgt_user_groups',
  UAM_ACCESS: 'feedback_mgt_uam_access',
  UAM_LOGS: 'feedback_mgt_uam_logs',
};

export const loadFromStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Error loading from storage', error);
    return defaultValue;
  }
};

export const saveToStorage = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Error saving to storage', error);
  }
};

export const getStoredCategories = (): Category[] => {
  return loadFromStorage(LOCAL_STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
};

export const saveStoredCategories = (categories: Category[]) => {
  saveToStorage(LOCAL_STORAGE_KEYS.CATEGORIES, categories);
};

export const getStoredFeedback = (): FeedbackItem[] => {
  return loadFromStorage(LOCAL_STORAGE_KEYS.FEEDBACK, INITIAL_FEEDBACK);
};

export const saveStoredFeedback = (feedback: FeedbackItem[]) => {
  saveToStorage(LOCAL_STORAGE_KEYS.FEEDBACK, feedback);
};

export const getStoredForms = (): FormTemplate[] => {
  return loadFromStorage(LOCAL_STORAGE_KEYS.FORMS, INITIAL_FORMS);
};

export const saveStoredForms = (forms: FormTemplate[]) => {
  saveToStorage(LOCAL_STORAGE_KEYS.FORMS, forms);
};

export const getStoredUsers = (): User[] => {
  return loadFromStorage(LOCAL_STORAGE_KEYS.USERS, INITIAL_USERS);
};

export const saveStoredUsers = (users: User[]) => {
  saveToStorage(LOCAL_STORAGE_KEYS.USERS, users);
};

export const getStoredUserGroups = (): UserGroup[] => {
  return loadFromStorage(LOCAL_STORAGE_KEYS.USER_GROUPS, INITIAL_USER_GROUPS);
};

export const saveStoredUserGroups = (groups: UserGroup[]) => {
  saveToStorage(LOCAL_STORAGE_KEYS.USER_GROUPS, groups);
};

export const getStoredUamAccess = (): UserAccessRights[] => {
  return loadFromStorage(LOCAL_STORAGE_KEYS.UAM_ACCESS, INITIAL_ACCESS_RIGHTS);
};

export const saveStoredUamAccess = (rights: UserAccessRights[]) => {
  saveToStorage(LOCAL_STORAGE_KEYS.UAM_ACCESS, rights);
};

export const getStoredUamLogs = (): UamAuditLog[] => {
  return loadFromStorage(LOCAL_STORAGE_KEYS.UAM_LOGS, []);
};

export const saveStoredUamLogs = (logs: UamAuditLog[]) => {
  saveToStorage(LOCAL_STORAGE_KEYS.UAM_LOGS, logs);
};

