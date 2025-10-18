export interface User {
  _id: string;
  email: string;
  name: string;
  image?: string;
  role: 'user' | 'tasker' | 'admin';
  phone?: string;
  phoneVerified?: boolean;
  location?: string;
  locationCoordinates?: {
    lat: number;
    lng: number;
  };
  isVerified: boolean;
  rating?: number;
  completedTasks?: number;
  balance?: number;
  totalEarnings?: number;
  // Profile fields for taskers
  about?: string;
  workCategories?: TaskCategory[];
  profileComplete?: boolean;
  ktpVerification?: KTPVerification;
  paymentMethod?: PaymentMethod;
  withdrawalMethod?: WithdrawalMethod;
  createdAt: Date;
  updatedAt: Date;
}

// KTP Verification Types
export interface KTPVerification {
  status: 'pending' | 'approved' | 'rejected' | 'not_submitted';
  ktpImage: string;
  selfieImage: string;
  ktpNumber?: string;
  fullName?: string;
  dateOfBirth?: string;
  address?: string;
  submittedAt: Date;
  verifiedAt?: Date;
  rejectionReason?: string;
}

// Payment Method Types
export interface PaymentMethod {
  type: 'bank' | 'ewallet';
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  ewalletType?: 'gopay' | 'ovo' | 'dana' | 'shopeepay';
  ewalletNumber?: string;
}

// Withdrawal Method Types
export interface WithdrawalMethod {
  type: 'bank' | 'ewallet';
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  ewalletType?: 'gopay' | 'ovo' | 'dana' | 'shopeepay';
  ewalletNumber?: string;
}

// Withdrawal Types
export interface Withdrawal {
  _id: string;
  userId: string;
  amount: number;
  method: WithdrawalMethod;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  processedAt?: Date;
  completedAt?: Date;
  notes?: string;
  createdAt: Date;
}

// Task Types
export interface Task {
  _id: string;
  title: string;
  description: string;
  category: TaskCategory;
  location: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  scheduledDate: Date;
  scheduledTime: string;
  estimatedDuration?: string;
  budget: number;
  pricingType: 'fixed' | 'hourly';
  searchMethod?: 'publish' | 'direct';
  status: TaskStatus;
  photos?: string[];
  posterId: string;
  poster: User;
  assignedTo?: string;
  assignedTasker?: User;
  applicants?: TaskApplicant[];
  agreement?: TaskAgreement;
  payment?: TaskPayment;
  // Simple payment fields
  paymentId?: string;
  paymentStatus?: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod?: 'card' | 'bank' | 'ewallet';
  paymentAmount?: number;
  paymentDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type TaskCategory =
  | 'kebersihan'
  | 'teknisi'
  | 'renovasi'
  | 'tukang'
  | 'angkut'
  | 'taman'
  | 'lainnya';

export type TaskStatus =
  | 'draft'
  | 'open'
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'disputed';

export interface TaskApplicant {
  userId: string;
  user: User;
  appliedAt: Date;
  status: 'pending' | 'accepted' | 'rejected';
  message?: string;
}

// Agreement Types
export interface TaskAgreement {
  clauses: AgreementClause[];
  customClauses?: string;
  acceptedByPoster: boolean;
  acceptedByTasker: boolean;
  acceptedByPosterAt?: Date;
  acceptedByTaskerAt?: Date;
  documentUrl?: string;
}

export interface AgreementClause {
  id: string;
  title: string;
  description: string;
  isRequired: boolean;
}

// Payment Types
export interface TaskPayment {
  amount: number;
  serviceFee: number;
  adminFee: number;
  totalAmount: number;
  status: PaymentStatus;
  method?: PaymentMethodType;
  midtransOrderId?: string;
  midtransTransactionId?: string;
  paidAt?: Date;
  releasedAt?: Date;
}

export type PaymentStatus =
  | 'pending'
  | 'paid'
  | 'held'
  | 'released'
  | 'refunded'
  | 'failed';

export type PaymentMethodType = 'credit_card' | 'bank_transfer' | 'ewallet';

// Review Types
export interface Review {
  _id: string;
  taskId: string;
  fromUserId: string;
  fromUser: User;
  toUserId: string;
  toUser: User;
  rating: number;
  comment: string;
  createdAt: Date;
}

// Report Types
export interface Report {
  _id: string;
  taskId: string;
  task: Task;
  reporterId: string;
  reporter: User;
  reportedUserId: string;
  reportedUser: User;
  reason: ReportReason;
  description: string;
  evidence?: string[];
  status: 'pending' | 'reviewing' | 'resolved' | 'rejected';
  resolution?: string;
  createdAt: Date;
  resolvedAt?: Date;
}

export type ReportReason =
  | 'payment_issue'
  | 'work_not_match'
  | 'no_show'
  | 'contract_breach'
  | 'safety_issue'
  | 'other';

// Notification Types
export interface Notification {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  relatedId?: string;
  isRead: boolean;
  createdAt: Date;
}

export type NotificationType =
  | 'task_assigned'
  | 'task_completed'
  | 'payment_received'
  | 'new_applicant'
  | 'verification_status'
  | 'new_message'
  | 'withdrawal_completed'
  | 'system';

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Form Types
export interface CreateTaskForm {
  title: string;
  description: string;
  category: TaskCategory;
  location: string;
  scheduledDate: string;
  scheduledTime: string;
  estimatedDuration?: string;
  budget: number;
  pricingType: 'fixed' | 'hourly';
  photos?: FileList;
}

export interface VerificationForm {
  ktpImage: File;
  selfieImage: File;
}

export interface PaymentMethodForm {
  type: 'bank' | 'ewallet';
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  ewalletType?: 'gopay' | 'ovo' | 'dana' | 'shopeepay';
  ewalletNumber?: string;
}

export interface WithdrawalMethodForm {
  type: 'bank' | 'ewallet';
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  ewalletType?: 'gopay' | 'ovo' | 'dana' | 'shopeepay';
  ewalletNumber?: string;
}

export interface WithdrawalForm {
  amount: number;
}