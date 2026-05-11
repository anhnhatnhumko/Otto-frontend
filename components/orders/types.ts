export interface Order {
  _id: string;
  service: string;
  status: string;
  date: string;
  time: string;
  address: string;
  price: number;
  rating?: number;
  review?: string;
  startTime: string;
  endTime: string;
  
  tasker?: {
    name: string;
    avatar?: string;
    rating: number;
    completedJobs: number;
    phone?: string;
  };

  cancelReason?: string;
}