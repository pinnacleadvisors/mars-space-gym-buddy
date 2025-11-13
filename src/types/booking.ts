export interface Booking {
  id: string;
  user_id: string;
  class_schedule_id: string;
  status: 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  booked_at: string;
  cancelled_at?: string;
  created_at: string;
  updated_at: string;
}

export interface BookingWithDetails extends Booking {
  user_name?: string;
  class_name?: string;
  scheduled_date?: string;
  start_time?: string;
}
