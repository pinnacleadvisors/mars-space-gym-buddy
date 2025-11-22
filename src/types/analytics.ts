export interface AnalyticsData {
  total_members: number;
  active_members: number;
  total_visits_today: number;
  total_bookings: number;
  total_rewards_claimed: number;
  popular_classes: ClassAnalytics[];
  visit_trends: VisitTrend[];
  membership_breakdown: MembershipBreakdown;
}

export interface ClassAnalytics {
  class_id: string;
  class_name: string;
  total_bookings: number;
  attendance_rate: number;
  category: string;
}

export interface VisitTrend {
  date: string;
  visit_count: number;
  unique_visitors: number;
}

export interface MembershipBreakdown {
  active: number;
  inactive: number;
  suspended: number;
}

export interface RevenueData {
  period: string;
  revenue: number;
  new_members: number;
  renewals: number;
}
