export interface Order {
  id: string;
  customer: string;
  customerPhone: string;
  customerEmail: string;
  service: string;
  date: string;
  time: string;
  address: string;
  status: "pending" | "confirmed" | "in_progress" | "completed" | "cancelled";
  amount: number;
  note?: string;
  workerName: string;
  createdAt?: string;
  startTime?: string;
  workTime: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  orders: number;
  status: "active" | "inactive" | "banned";
  joinDate: string;
  totalSpent: number;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: string;
  status: "active" | "inactive";
  bookings: number;
}

export interface Tasker {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  services: string[];
  rating: number;
  completedJobs: number;
  status: "pending" | "active" | "inactive" | "banned";
  joinDate: string;
  address: string;
  idCard: string;
  verified: boolean;
  earnings: number;
  provinceId: string;
  wardId: string;
}

export interface ServiceFormData {
  name: string;
  description: string;
  price: string;
  duration: string;
  status: "active" | "inactive";
}

export interface ConfirmAction {
  type: string;
  id: string;
  action: string;
}

// API Types
export interface AdminListResponse<T> {
  data: T[];
  total?: number;
  page?: number;
}

export interface ApiService {
  _id?: string;
  id?: string;
  name?: string;
  description?: string;
  price?: number;
  pricePerHour?: number;
  estimatedTime?: number;
  isActive?: boolean;
  bookings?: number;
}

export interface ApiUser {
  _id?: string;
  id?: string;
  fullName?: string;
  name?: string;
  email?: string;
  phone?: string;
  status?: string;
  avatar?: string;
  role?: string;
  isEmailVerified?: boolean;
  orders?: number;
  isAvailable?: boolean;
  skills?: Array<string | ApiService>;
  rating?: number;
  totalJobs?: number;
  completedJobs?: number;
  createdAt?: string;
  totalSpent?: number;
  earnings?: number;
  address?: string;
  idCard?: string;
  provinceId?: string;
  wardId?: string;
}

export interface ApiOrder {
  _id?: string;
  id?: string;
  customer?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerId?: ApiUser | string;
  tasker?: string | { name?: string; fullName?: string; phone?: string };
  taskerId?: ApiUser | string;
  service?: string;
  serviceId?: string;
  serviceSnapshot?: { name?: string };
  startTime?: string;
  endTime?: string;
  scheduleTime?: string;
  createdAt?: string;
  address?: string;
  addressDetail?: string;
  status?: string;
  totalPrice?: number;
  amount?: number;
  note?: string;
}
