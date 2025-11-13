export interface GymClass {
  id: string;
  name: string;
  description: string;
  instructor_name: string;
  duration_minutes: number;
  max_capacity: number;
  current_bookings: number;
  category: 'yoga' | 'strength' | 'cardio' | 'hiit' | 'cycling' | 'other';
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  image_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClassSchedule {
  id: string;
  class_id: string;
  class_details?: GymClass;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  room_name?: string;
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  created_at: string;
}
