export type UserRole = 'member' | 'admin' | 'staff';

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: UserRole;
  membership_status: 'active' | 'inactive' | 'suspended';
  membership_start_date?: string;
  membership_end_date?: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfile extends User {
  avatar_url?: string;
  emergency_contact?: string;
  health_notes?: string;
}
