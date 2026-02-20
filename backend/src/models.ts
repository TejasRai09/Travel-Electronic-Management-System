import mongoose, { Schema } from 'mongoose';

export type EmployeeProfile = {
  fullName?: string;
  employeeId?: string;
  department?: string;
  managerEmail?: string;
  phone?: string;
  impactLevel?: string; // UC, 1, 2A-C, 3A-C, 4A-C, 5A-C, 6A-C
};

const employeeProfileSchema = new Schema<EmployeeProfile>(
  {
    fullName: { type: String, required: false, trim: true, default: '' },
    employeeId: { type: String, required: false, trim: true, default: '' },
    department: { type: String, required: false, trim: true, default: '' },
    managerEmail: { type: String, required: false, trim: true },
    phone: { type: String, required: false, trim: true },
    impactLevel: { type: String, required: false, trim: true, default: '6C' }, // Default to lowest grade
  },
  { _id: false }
);

export type UserDoc = {
  email: string;
  passwordHash: string;
  verified: boolean;
  isPOC: boolean;
  isVendor: boolean;
  isAdmin: boolean;
  profile: EmployeeProfile;
  createdAt: Date;
  updatedAt: Date;
};

const userSchema = new Schema<UserDoc>(
  {
    email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    verified: { type: Boolean, required: true, default: true },
    isPOC: { type: Boolean, required: true, default: false },
    isVendor: { type: Boolean, required: true, default: false },
    isAdmin: { type: Boolean, required: true, default: false },
    profile: { type: employeeProfileSchema, required: true, default: {} },
  },
  { timestamps: true }
);

export const User = mongoose.models.User || mongoose.model<UserDoc>('User', userSchema);

export type PendingSignupDoc = {
  email: string;
  passwordHash: string;
  profile: EmployeeProfile;
  otpHash: string;
  otpExpiresAt: Date;
  resendAvailableAt: Date;
  attempts: number;
  createdAt: Date;
  updatedAt: Date;
};

const pendingSignupSchema = new Schema<PendingSignupDoc>(
  {
    email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    profile: { type: employeeProfileSchema, required: true, default: {} },
    otpHash: { type: String, required: true },
    otpExpiresAt: { type: Date, required: true },
    resendAvailableAt: { type: Date, required: true },
    attempts: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

export const PendingSignup =
  mongoose.models.PendingSignup || mongoose.model<PendingSignupDoc>('PendingSignup', pendingSignupSchema);

export type PasswordResetDoc = {
  email: string;
  otpHash: string;
  otpExpiresAt: Date;
  resendAvailableAt: Date;
  attempts: number;
  createdAt: Date;
  updatedAt: Date;
};

const passwordResetSchema = new Schema<PasswordResetDoc>(
  {
    email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    otpHash: { type: String, required: true },
    otpExpiresAt: { type: Date, required: true },
    resendAvailableAt: { type: Date, required: true },
    attempts: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

export const PasswordReset =
  mongoose.models.PasswordReset || mongoose.model<PasswordResetDoc>('PasswordReset', passwordResetSchema);

export type EmployeeDoc = {
  employeeNumber: string;
  employeeName: string;
  designation: string;
  email: string;
  phone: string;
  managerEmail: string;
  managerEmployeeNo: string;
  managerEmployeeName: string;
  impactLevel: string;
  createdAt: Date;
  updatedAt: Date;
};

const employeeSchema = new Schema<EmployeeDoc>(
  {
    employeeNumber: { type: String, required: true, trim: true, index: true },
    employeeName: { type: String, required: true, trim: true },
    designation: { type: String, required: false, trim: true, default: '' },
    email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    phone: { type: String, required: false, trim: true, default: '' },
    managerEmail: { type: String, required: false, trim: true, default: '' },
    managerEmployeeNo: { type: String, required: false, trim: true, default: '' },
    managerEmployeeName: { type: String, required: false, trim: true, default: '' },
    impactLevel: { type: String, required: false, trim: true, default: '' },
  },
  { timestamps: true }
);

export const Employee = mongoose.models.Employee || mongoose.model<EmployeeDoc>('Employee', employeeSchema);

export type ChatMessage = {
  sender: string; // email of sender
  senderName: string;
  message: string;
  timestamp: Date;
};

export type FileAttachment = {
  fileName: string;
  fileUrl: string;
  uploadedBy: string; // email
  uploadedByName: string;
  uploadedAt: Date;
};

export type VendorMessage = {
  message: string;
  attachments: FileAttachment[];
  sentBy: string; // email of vendor
  sentByName: string;
  sentAt: Date;
};

export type ApprovalChainItem = {
  email: string;
  name: string;
  impactLevel: string;
  employeeNumber: string;
  approved: boolean;
  approvedAt?: Date;
};

export type TravelRequestDoc = {
  // Metadata
  userId: mongoose.Types.ObjectId;
  uniqueId: string;
  status: string; // Pending, ManagerApproved, Approved (POC final), Rejected, POCRejected
  originatorEmail: string;
  originatorName: string;
  
  // Approval tracking
  managerApprovedBy?: string;
  managerApprovedAt?: Date;
  pocApprovedBy?: string;
  pocApprovedAt?: Date;
  pocEditedAt?: Date;
  
  // Multi-level approval chain
  approvalChain?: ApprovalChainItem[];
  currentApprovalIndex?: number;

  // Trip Config
  tripNature: string; // One Way, Round Trip
  mode: string; // Flight, Train, Car
  
  // Passenger Info
  passengerName: string;
  passengerPhone: string;
  dietaryPreference: string;

  // Itinerary
  origin: string;
  destination: string;
  travelDate: Date;
  returnDate?: Date;
  departureTimeSlot?: string;
  itineraryLegs?: {
    origin: string;
    destination: string;
    travelDate: Date;
    timeSlot?: string;
  }[];
  travelClass: string;

  // Business Details
  purpose: string;

  // Accommodation
  accommodationRequired: boolean;
  hotelPreference?: string;
  checkInDate?: Date;
  checkOutDate?: Date;

  // Other
  specialInstructions?: string;

  // Chat & Files
  chatMessages: ChatMessage[];
  fileAttachments: FileAttachment[];
  vendorMessages: VendorMessage[];
  vendorChatMessages: ChatMessage[]; // Private chat between requester and vendor

  createdAt: Date;
  updatedAt: Date;
};

const itineraryLegSchema = new Schema<{
  origin: string;
  destination: string;
  travelDate: Date;
  timeSlot?: string;
}>(
  {
    origin: { type: String, required: true },
    destination: { type: String, required: true },
    travelDate: { type: Date, required: true },
    timeSlot: { type: String },
  },
  { _id: false }
);

const chatMessageSchema = new Schema<ChatMessage>(
  {
    sender: { type: String, required: true },
    senderName: { type: String, required: true },
    message: { type: String, required: true },
    timestamp: { type: Date, required: true, default: () => new Date() },
  },
  { _id: false }
);

const fileAttachmentSchema = new Schema<FileAttachment>(
  {
    fileName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    uploadedBy: { type: String, required: true },
    uploadedByName: { type: String, required: true },
    uploadedAt: { type: Date, required: true, default: () => new Date() },
  },
  { _id: false }
);

const vendorMessageSchema = new Schema<VendorMessage>(
  {
    message: { type: String, required: true },
    attachments: { type: [fileAttachmentSchema], default: [] },
    sentBy: { type: String, required: true },
    sentByName: { type: String, required: true },
    sentAt: { type: Date, required: true, default: () => new Date() },
  },
  { _id: false }
);

const approvalChainItemSchema = new Schema<ApprovalChainItem>(
  {
    email: { type: String, required: true },
    name: { type: String, required: true },
    impactLevel: { type: String, required: true },
    employeeNumber: { type: String, required: true },
    approved: { type: Boolean, required: true, default: false },
    approvedAt: { type: Date },
  },
  { _id: false }
);

const travelRequestSchema = new Schema<TravelRequestDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    uniqueId: { type: String, required: true, unique: true, index: true },
    status: { type: String, required: true, default: 'Pending' },
    originatorEmail: { type: String, required: true, index: true },
    originatorName: { type: String, required: true },
    
    managerApprovedBy: { type: String },
    managerApprovedAt: { type: Date },
    pocApprovedBy: { type: String },
    pocApprovedAt: { type: Date },
    pocEditedAt: { type: Date },
    
    approvalChain: { type: [approvalChainItemSchema], default: [] },
    currentApprovalIndex: { type: Number, default: 0 },

    tripNature: { type: String, required: true },
    mode: { type: String, required: true },

    passengerName: { type: String, required: true },
    passengerPhone: { type: String, required: true },
    dietaryPreference: { type: String, required: true },

    origin: { type: String, required: true },
    destination: { type: String, required: true },
    travelDate: { type: Date, required: true },
    returnDate: { type: Date },
    departureTimeSlot: { type: String },
    itineraryLegs: { type: [itineraryLegSchema], default: undefined },
    travelClass: { type: String, required: true },

    purpose: { type: String, required: true },

    accommodationRequired: { type: Boolean, required: true, default: false },
    hotelPreference: { type: String },
    checkInDate: { type: Date },
    checkOutDate: { type: Date },

    specialInstructions: { type: String },

    chatMessages: { type: [chatMessageSchema], default: [] },
    fileAttachments: { type: [fileAttachmentSchema], default: [] },
    vendorMessages: { type: [vendorMessageSchema], default: [] },
    vendorChatMessages: { type: [chatMessageSchema], default: [] },
  },
  { timestamps: true }
);

export const TravelRequest = mongoose.models.TravelRequest || mongoose.model<TravelRequestDoc>('TravelRequest', travelRequestSchema);

// Notification Schema
export type NotificationDoc = {
  recipientEmail: string;
  type: 'approval' | 'rejection' | 'vendor_response' | 'request_created' | 'manager_approved' | 'poc_approved' | 'comment';
  title: string;
  message: string;
  relatedRequestId?: string;
  relatedRequestUniqueId?: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
};

const notificationSchema = new Schema<NotificationDoc>(
  {
    recipientEmail: { type: String, required: true, lowercase: true, trim: true, index: true },
    type: { 
      type: String, 
      required: true, 
      enum: ['approval', 'rejection', 'vendor_response', 'request_created', 'manager_approved', 'poc_approved', 'comment'] 
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    relatedRequestId: { type: String },
    relatedRequestUniqueId: { type: String },
    isRead: { type: Boolean, required: true, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ recipientEmail: 1, isRead: 1, createdAt: -1 });

export const Notification = mongoose.models.Notification || mongoose.model<NotificationDoc>('Notification', notificationSchema);

// System Configuration
export type SystemConfigDoc = {
  configKey: string; // unique identifier like 'approval_logic'
  configValue: any; // flexible JSON data
  description: string;
  updatedBy: string; // admin email
  createdAt: Date;
  updatedAt: Date;
};

const systemConfigSchema = new Schema<SystemConfigDoc>(
  {
    configKey: { type: String, required: true, unique: true, index: true },
    configValue: { type: Schema.Types.Mixed, required: true },
    description: { type: String, required: false, default: '' },
    updatedBy: { type: String, required: false, default: '' },
  },
  { timestamps: true }
);

export const SystemConfig = mongoose.models.SystemConfig || mongoose.model<SystemConfigDoc>('SystemConfig', systemConfigSchema);

// Activity Log
export type ActivityLogDoc = {
  userEmail: string;
  userName: string;
  action: string; // 'login', 'logout', 'create_request', 'approve_request', etc.
  details: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
};

const activityLogSchema = new Schema<ActivityLogDoc>(
  {
    userEmail: { type: String, required: true, lowercase: true, trim: true, index: true },
    userName: { type: String, required: true, trim: true },
    action: { type: String, required: true, index: true },
    details: { type: String, required: true },
    ipAddress: { type: String, required: false, default: '' },
    userAgent: { type: String, required: false, default: '' },
  },
  { timestamps: true }
);

activityLogSchema.index({ userEmail: 1, createdAt: -1 });
activityLogSchema.index({ action: 1, createdAt: -1 });

export const ActivityLog = mongoose.models.ActivityLog || mongoose.model<ActivityLogDoc>('ActivityLog', activityLogSchema);

// Travel Policy Management
export type TravelModeEntitlement = {
  airTravel: {
    allowed: boolean;
    classes: string[]; // e.g., ['Business', 'Premium Economy', 'Economy']
  };
  trainTravel: {
    allowed: boolean;
    classes: string[]; // e.g., ['1AC', '2AC', '3AC', 'Executive Chair Car', 'AC Chair Car']
  };
  publicTransport: {
    allowed: boolean;
    types: string[]; // e.g., ['AC Bus', 'Non-AC Bus']
  };
};

export type LocalConveyance = {
  options: string[]; // e.g., ['Hired Taxi (Luxury Car)', 'Uber Sedan', 'Uber Go', 'Uber Auto', '3-Wheeler', 'Public Transport']
};

export type ImpactLevelPolicy = {
  level: string; // e.g., 'UC', '1', '2A', '2B', '2C', '3A', '3B', '3C', '4A', '4B', '4C', '5A', '5B', '5C', '6A', '6B', '6C'
  travelMode: TravelModeEntitlement;
  localConveyance: LocalConveyance;
  description?: string;
};

export type CityGroup = {
  name: string; // 'Group A', 'Group B', 'Group C'
  cities: string[];
  roomRentLimit: number; // 0 means actual expenses
  foodExpenseLimit: number; // 0 means actual expenses
};

export type PolicyRules = {
  incidentalExpenses: number;
  advanceBookingDays: number; // minimum days to book air tickets in advance
  expenseSubmissionDays: number; // days to submit expenses after return
  expenseSettlementDays: number; // days for accounts to settle expenses
  outstandingAdvanceWeeks: number; // weeks after which advance is deducted from salary
  roomRentDeviationPercent: number; // allowed deviation percentage
  requireOriginalBills: boolean;
  guestHouseMandatory: boolean;
  alcoholReimbursement: boolean;
  cigaretteReimbursement: boolean;
};

export type TravelPolicyDoc = {
  _id?: string;
  policyName: string;
  policyVersion: string;
  impactLevels: ImpactLevelPolicy[];
  cityGroups: CityGroup[];
  policyRules: PolicyRules;
  isActive: boolean;
  effectiveFrom: Date;
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
};

const travelModeEntitlementSchema = new Schema<TravelModeEntitlement>(
  {
    airTravel: {
      allowed: { type: Boolean, required: true, default: false },
      classes: { type: [String], required: true, default: [] },
    },
    trainTravel: {
      allowed: { type: Boolean, required: true, default: true },
      classes: { type: [String], required: true, default: [] },
    },
    publicTransport: {
      allowed: { type: Boolean, required: true, default: false },
      types: { type: [String], required: true, default: [] },
    },
  },
  { _id: false }
);

const localConveyanceSchema = new Schema<LocalConveyance>(
  {
    options: { type: [String], required: true, default: [] },
  },
  { _id: false }
);

const impactLevelPolicySchema = new Schema<ImpactLevelPolicy>(
  {
    level: { type: String, required: true, trim: true },
    travelMode: { type: travelModeEntitlementSchema, required: true },
    localConveyance: { type: localConveyanceSchema, required: true },
    description: { type: String, required: false, trim: true },
  },
  { _id: false }
);

const cityGroupSchema = new Schema<CityGroup>(
  {
    name: { type: String, required: true, trim: true },
    cities: { type: [String], required: true, default: [] },
    roomRentLimit: { type: Number, required: true, default: 0 },
    foodExpenseLimit: { type: Number, required: true, default: 0 },
  },
  { _id: false }
);

const policyRulesSchema = new Schema<PolicyRules>(
  {
    incidentalExpenses: { type: Number, required: true, default: 3000 },
    advanceBookingDays: { type: Number, required: true, default: 7 },
    expenseSubmissionDays: { type: Number, required: true, default: 5 },
    expenseSettlementDays: { type: Number, required: true, default: 7 },
    outstandingAdvanceWeeks: { type: Number, required: true, default: 3 },
    roomRentDeviationPercent: { type: Number, required: true, default: 15 },
    requireOriginalBills: { type: Boolean, required: true, default: true },
    guestHouseMandatory: { type: Boolean, required: true, default: true },
    alcoholReimbursement: { type: Boolean, required: true, default: false },
    cigaretteReimbursement: { type: Boolean, required: true, default: false },
  },
  { _id: false }
);

const travelPolicySchema = new Schema<TravelPolicyDoc>(
  {
    policyName: { type: String, required: true, trim: true },
    policyVersion: { type: String, required: true, trim: true },
    impactLevels: { type: [impactLevelPolicySchema], required: true, default: [] },
    cityGroups: { type: [cityGroupSchema], required: true, default: [] },
    policyRules: { type: policyRulesSchema, required: true },
    isActive: { type: Boolean, required: true, default: true },
    effectiveFrom: { type: Date, required: true, default: Date.now },
    createdBy: { type: String, required: true, lowercase: true, trim: true },
    updatedBy: { type: String, required: true, lowercase: true, trim: true },
  },
  { timestamps: true }
);

travelPolicySchema.index({ isActive: 1, effectiveFrom: -1 });

export const TravelPolicy = mongoose.models.TravelPolicy || mongoose.model<TravelPolicyDoc>('TravelPolicy', travelPolicySchema);
