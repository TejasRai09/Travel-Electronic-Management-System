import mongoose, { Schema } from 'mongoose';

export type EmployeeProfile = {
  fullName?: string;
  employeeId?: string;
  department?: string;
  managerEmail?: string;
  phone?: string;
};

const employeeProfileSchema = new Schema<EmployeeProfile>(
  {
    fullName: { type: String, required: false, trim: true, default: '' },
    employeeId: { type: String, required: false, trim: true, default: '' },
    department: { type: String, required: false, trim: true, default: '' },
    managerEmail: { type: String, required: false, trim: true },
    phone: { type: String, required: false, trim: true },
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
