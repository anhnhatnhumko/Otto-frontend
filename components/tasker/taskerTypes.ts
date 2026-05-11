export interface Job {
  id: string;
  service: string;
  customer: string;
  phone: string;
  address: string;
  date: string;
  time: string;
  price: number;
  status:
  | "SEARCHING"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "WAITING_CONFIRMATION"
  | "COMPLETED"
  | "CANCELLED"
  | "TIMEOUT";
  notes?: string;
  rating?: number;
  review?: string;
  isNew?: boolean;
  scheduleTime?: string;
  endTime?: string;
  offerExpiresAt?: string;
  unreadMessages?: number;
}
