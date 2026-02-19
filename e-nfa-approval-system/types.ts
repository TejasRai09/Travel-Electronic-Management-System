
export enum TravelStatus {
  PENDING = 'Pending',
  MANAGER_APPROVED = 'ManagerApproved',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
  POC_REJECTED = 'POCRejected',
  DRAFT = 'Draft'
}

export enum TravelMode {
  FLIGHT = 'Flight',
  TRAIN = 'Train',
  CAR = 'Car'
}

export enum TripNature {
  ONE_WAY = 'One Way',
  ROUND_TRIP = 'Round Trip',
  MULTI_CITY = 'Multicity'
}

export type ItineraryLeg = {
  origin: string;
  destination: string;
  travelDate: string;
  timeSlot?: string;
};

export enum DietaryPreference {
  VEG = 'Veg',
  NON_VEG = 'Non-Veg',
  JAIN = 'Jain',
  NO_PREFERENCE = 'No Preference'
}

export interface ChatMessage {
  sender: string;
  senderName: string;
  message: string;
  timestamp: string;
}

export interface FileAttachment {
  fileName: string;
  fileUrl: string;
  uploadedBy: string;
  uploadedByName: string;
  uploadedAt: string;
}

export interface VendorMessage {
  message: string;
  attachments: FileAttachment[];
  sentBy: string;
  sentByName: string;
  sentAt: string;
}

export interface ApprovalChainItem {
  email: string;
  name: string;
  impactLevel: string;
  employeeNumber: string;
  approved: boolean;
  approvedAt?: string;
}

export interface TravelRequest {
  id: string;
  uniqueId: string;
  purpose: string;
  origin: string;
  destination: string;
  travelDate: string;
  returnDate?: string;
  departureTimeSlot?: string;
  itineraryLegs?: ItineraryLeg[];
  mode: TravelMode;
  travelClass: string;
  department: string;
  status: TravelStatus;
  originator: string;
  originatorEmail?: string;
  createdAt: string;
  // Approval tracking
  managerApprovedBy?: string;
  managerApprovedAt?: string;
  pocApprovedBy?: string;
  pocApprovedAt?: string;
  pocEditedAt?: string;
  // Multi-level approval chain
  approvalChain?: ApprovalChainItem[];
  currentApprovalIndex?: number;
  // Production additions
  tripNature: TripNature;
  accommodationRequired: boolean;
  hotelPreference?: string;
  checkInDate?: string;
  checkOutDate?: string;
  specialInstructions?: string;
  // Passenger Details for Ticketing
  passengerName: string;
  passengerPhone: string;
  dietaryPreference: DietaryPreference;
  // Chat & Files
  chatMessages?: ChatMessage[];
  fileAttachments?: FileAttachment[];
  // Vendor Messages
  vendorMessages?: VendorMessage[];
  vendorChatMessages?: ChatMessage[]; // Private chat between requester and vendor
}

export enum UserRole {
  EMPLOYEE = 'employee',
  MANAGER = 'manager',
  TRAVEL_DESK = 'travel_desk',
  ADMIN = 'admin'
}

export interface User {
  name: string;
  email: string;
  role: UserRole;
  department: string;
  isVendor?: boolean;
  isPOC?: boolean;
  isManager?: boolean;
}

export type EmployeeProfile = {
  employeeNumber: string;
  employeeName: string;
  designation: string;
  email: string;
  phone: string;
  managerEmail: string;
  managerEmployeeNo: string;
  managerEmployeeName: string;
  impactLevel: string;
};
