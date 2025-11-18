import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AnalyticsData, ClassAnalytics, VisitTrend, MembershipBreakdown, RevenueData } from '@/types/analytics';

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface AnalyticsFilters {
  dateRange?: DateRange;
}

/**
 * Custom hook for fetching analytics data
 */
export const useAnalytics = (filters?: AnalyticsFilters) => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);

  // Default date range: last 30 days
  const getDefaultDateRange = useCallback((): DateRange => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    return { startDate, endDate };
  }, []);

  const dateRange = filters?.dateRange || getDefaultDateRange();

  /**
   * Fetch member growth statistics
   */
  const fetchMemberGrowth = useCallback(async (): Promise<{
    totalMembers: number;
    activeMembers: number;
    growthThisMonth: number;
    growthPercentage: number;
  }> => {
    try {
      // Get total members (all profiles)
      const { count: totalCount, error: totalError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      if (totalError) throw totalError;

      // Get active members (members with active membership)
      const { data: activeMemberships, error: activeError } = await supabase
        .from('user_memberships')
        .select('user_id')
        .eq('status', 'active')
        .eq('payment_status', 'paid')
        .gte('end_date', new Date().toISOString());

      if (activeError) throw activeError;
      const activeMemberIds = new Set(activeMemberships?.map(m => m.user_id) || []);
      const activeMembers = activeMemberIds.size;

      // Calculate growth this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count: newMembersThisMonth, error: newMembersError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfMonth.toISOString());

      if (newMembersError) throw newMembersError;

      // Calculate growth percentage (vs last month)
      const startOfLastMonth = new Date(startOfMonth);
      startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);
      const endOfLastMonth = new Date(startOfMonth);
      endOfLastMonth.setMilliseconds(endOfLastMonth.getMilliseconds() - 1);

      const { count: newMembersLastMonth, error: lastMonthError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfLastMonth.toISOString())
        .lte('created_at', endOfLastMonth.toISOString());

      if (lastMonthError) throw lastMonthError;

      const growthPercentage = newMembersLastMonth && newMembersLastMonth > 0
        ? ((newMembersThisMonth || 0) - newMembersLastMonth) / newMembersLastMonth * 100
        : 0;

      return {
        totalMembers: totalCount || 0,
        activeMembers,
        growthThisMonth: newMembersThisMonth || 0,
        growthPercentage: Math.round(growthPercentage * 10) / 10,
      };
    } catch (err: any) {
      console.error('Error fetching member growth:', err);
      throw err;
    }
  }, []);

  /**
   * Calculate class attendance rates
   */
  const fetchClassAttendance = useCallback(async (): Promise<number> => {
    try {
      const { startDate, endDate } = dateRange;

      // Get all bookings in date range
      const { data: bookings, error: bookingsError } = await supabase
        .from('class_bookings')
        .select('*, class_sessions(start_time, end_time)')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .in('status', ['booked', 'confirmed']);

      if (bookingsError) throw bookingsError;

      if (!bookings || bookings.length === 0) {
        return 0;
      }

      // Get sessions that have already occurred
      const now = new Date();
      const completedSessions = bookings.filter(booking => {
        const session = booking.class_sessions as any;
        if (!session?.start_time) return false;
        return new Date(session.start_time) < now;
      });

      if (completedSessions.length === 0) {
        return 0;
      }

      // Count attended (status = 'attended' or check-in exists)
      const { data: attendedBookings, error: attendedError } = await supabase
        .from('class_bookings')
        .select('id')
        .in('id', completedSessions.map(b => b.id))
        .eq('status', 'attended');

      if (attendedError) throw attendedError;

      const attendedCount = attendedBookings?.length || 0;
      const attendanceRate = (attendedCount / completedSessions.length) * 100;

      return Math.round(attendanceRate * 10) / 10;
    } catch (err: any) {
      console.error('Error fetching class attendance:', err);
      return 0;
    }
  }, [dateRange]);

  /**
   * Get active user counts
   */
  const fetchActiveUsers = useCallback(async (): Promise<{
    thisWeek: number;
    thisMonth: number;
    total: number;
  }> => {
    try {
      const now = new Date();
      
      // This week (last 7 days)
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);

      const { data: weekCheckIns, error: weekError } = await supabase
        .from('check_ins')
        .select('user_id')
        .gte('check_in_time', weekAgo.toISOString());

      if (weekError) throw weekError;
      const weekUserIds = new Set(weekCheckIns?.map(c => c.user_id) || []);
      const thisWeek = weekUserIds.size;

      // This month
      const monthAgo = new Date(now);
      monthAgo.setMonth(monthAgo.getMonth() - 1);

      const { data: monthCheckIns, error: monthError } = await supabase
        .from('check_ins')
        .select('user_id')
        .gte('check_in_time', monthAgo.toISOString());

      if (monthError) throw monthError;
      const monthUserIds = new Set(monthCheckIns?.map(c => c.user_id) || []);
      const thisMonth = monthUserIds.size;

      // Total active members (with active membership)
      const { data: activeMemberships, error: activeError } = await supabase
        .from('user_memberships')
        .select('user_id')
        .eq('status', 'active')
        .eq('payment_status', 'paid')
        .gte('end_date', now.toISOString());

      if (activeError) throw activeError;
      const totalActiveIds = new Set(activeMemberships?.map(m => m.user_id) || []);
      const total = totalActiveIds.size;

      return { thisWeek, thisMonth, total };
    } catch (err: any) {
      console.error('Error fetching active users:', err);
      throw err;
    }
  }, []);

  /**
   * Fetch visit trends over time
   */
  const fetchVisitTrends = useCallback(async (): Promise<VisitTrend[]> => {
    try {
      const { startDate, endDate } = dateRange;

      const { data: checkIns, error: checkInsError } = await supabase
        .from('check_ins')
        .select('check_in_time, user_id')
        .gte('check_in_time', startDate.toISOString())
        .lte('check_in_time', endDate.toISOString())
        .order('check_in_time', { ascending: true });

      if (checkInsError) throw checkInsError;

      if (!checkIns || checkIns.length === 0) {
        return [];
      }

      // Group by date
      const trendsMap = new Map<string, { visitCount: number; uniqueVisitors: Set<string> }>();

      checkIns.forEach(checkIn => {
        const date = new Date(checkIn.check_in_time).toISOString().split('T')[0];
        if (!trendsMap.has(date)) {
          trendsMap.set(date, { visitCount: 0, uniqueVisitors: new Set() });
        }
        const trend = trendsMap.get(date)!;
        trend.visitCount++;
        trend.uniqueVisitors.add(checkIn.user_id);
      });

      // Convert to array and sort by date
      const trends: VisitTrend[] = Array.from(trendsMap.entries())
        .map(([date, data]) => ({
          date,
          visit_count: data.visitCount,
          unique_visitors: data.uniqueVisitors.size,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return trends;
    } catch (err: any) {
      console.error('Error fetching visit trends:', err);
      return [];
    }
  }, [dateRange]);

  /**
   * Get class popularity metrics
   */
  const fetchClassPopularity = useCallback(async (): Promise<ClassAnalytics[]> => {
    try {
      const { startDate, endDate } = dateRange;

      // Get all bookings in date range with session details
      const { data: bookings, error: bookingsError } = await supabase
        .from('class_bookings')
        .select('*, class_sessions(id, name, class_id, start_time)')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .in('status', ['booked', 'confirmed', 'attended']);

      if (bookingsError) throw bookingsError;

      if (!bookings || bookings.length === 0) {
        return [];
      }

      // Group by class (using class_id from session if available, otherwise use session name)
      const classMap = new Map<string, {
        classId: string;
        className: string;
        totalBookings: number;
        attendedCount: number;
        category: string;
      }>();

      bookings.forEach(booking => {
        const session = booking.class_sessions as any;
        const classId = session?.class_id || session?.id || 'unknown';
        const className = session?.name || 'Unknown Class';
        
        if (!classMap.has(classId)) {
          classMap.set(classId, {
            classId,
            className,
            totalBookings: 0,
            attendedCount: 0,
            category: 'General', // Default category
          });
        }

        const classData = classMap.get(classId)!;
        classData.totalBookings++;

        if (booking.status === 'attended') {
          classData.attendedCount++;
        }
      });

      // Get class details for categories
      const classIds = Array.from(classMap.keys()).filter(id => id !== 'unknown');
      if (classIds.length > 0) {
        const { data: classes, error: classesError } = await supabase
          .from('classes')
          .select('id, category')
          .in('id', classIds);

        if (!classesError && classes) {
          classes.forEach(cls => {
            const classData = classMap.get(cls.id);
            if (classData) {
              classData.category = cls.category || 'General';
            }
          });
        }
      }

      // Convert to array and calculate attendance rates
      const analytics: ClassAnalytics[] = Array.from(classMap.values())
        .map(classData => ({
          class_id: classData.classId,
          class_name: classData.className,
          total_bookings: classData.totalBookings,
          attendance_rate: classData.totalBookings > 0
            ? Math.round((classData.attendedCount / classData.totalBookings) * 100 * 10) / 10
            : 0,
          category: classData.category,
        }))
        .sort((a, b) => b.total_bookings - a.total_bookings); // Sort by popularity

      return analytics;
    } catch (err: any) {
      console.error('Error fetching class popularity:', err);
      return [];
    }
  }, [dateRange]);

  /**
   * Calculate revenue metrics
   */
  const fetchRevenueData = useCallback(async (): Promise<RevenueData[]> => {
    try {
      const { startDate, endDate } = dateRange;

      // Get all paid memberships in date range
      const { data: memberships, error: membershipsError } = await supabase
        .from('user_memberships')
        .select('*, memberships(price)')
        .eq('payment_status', 'paid')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (membershipsError) throw membershipsError;

      if (!memberships || memberships.length === 0) {
        return [];
      }

      // Group by period (monthly)
      const revenueMap = new Map<string, {
        revenue: number;
        newMembers: number;
        renewals: number;
      }>();

      memberships.forEach(membership => {
        const createdDate = new Date(membership.created_at);
        const period = `${createdDate.getFullYear()}-${String(createdDate.getMonth() + 1).padStart(2, '0')}`;
        
        if (!revenueMap.has(period)) {
          revenueMap.set(period, { revenue: 0, newMembers: 0, renewals: 0 });
        }

        const periodData = revenueMap.get(period)!;
        const price = (membership.memberships as any)?.price || 0;
        periodData.revenue += Number(price);

        // Check if this is a renewal (user had a previous membership)
        // For simplicity, we'll count as new if it's their first membership in the period
        // This is a simplified logic - you might want to improve this
        periodData.newMembers++;
      });

      // Convert to array
      const revenue: RevenueData[] = Array.from(revenueMap.entries())
        .map(([period, data]) => ({
          period,
          revenue: Math.round(data.revenue * 100) / 100,
          new_members: data.newMembers,
          renewals: data.renewals,
        }))
        .sort((a, b) => a.period.localeCompare(b.period));

      return revenue;
    } catch (err: any) {
      console.error('Error fetching revenue data:', err);
      return [];
    }
  }, [dateRange]);

  /**
   * Fetch membership breakdown
   */
  const fetchMembershipBreakdown = useCallback(async (): Promise<MembershipBreakdown> => {
    try {
      const now = new Date().toISOString();

      // Active memberships
      const { count: activeCount, error: activeError } = await supabase
        .from('user_memberships')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
        .eq('payment_status', 'paid')
        .gte('end_date', now);

      if (activeError) throw activeError;

      // Inactive/Expired memberships
      const { count: inactiveCount, error: inactiveError } = await supabase
        .from('user_memberships')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'expired')
        .or('end_date.lt.' + now);

      if (inactiveError) throw inactiveError;

      // Cancelled memberships
      const { count: cancelledCount, error: cancelledError } = await supabase
        .from('user_memberships')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'cancelled');

      if (cancelledError) throw cancelledError;

      return {
        active: activeCount || 0,
        inactive: inactiveCount || 0,
        suspended: cancelledCount || 0,
      };
    } catch (err: any) {
      console.error('Error fetching membership breakdown:', err);
      return { active: 0, inactive: 0, suspended: 0 };
    }
  }, []);

  /**
   * Fetch all analytics data
   */
  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all data in parallel
      const [
        memberGrowth,
        attendanceRate,
        activeUsers,
        visitTrends,
        classPopularity,
        membershipBreakdown,
        revenue,
      ] = await Promise.all([
        fetchMemberGrowth(),
        fetchClassAttendance(),
        fetchActiveUsers(),
        fetchVisitTrends(),
        fetchClassPopularity(),
        fetchMembershipBreakdown(),
        fetchRevenueData(),
      ]);

      // Get total visits today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { count: visitsToday, error: visitsError } = await supabase
        .from('check_ins')
        .select('*', { count: 'exact', head: true })
        .gte('check_in_time', today.toISOString())
        .lt('check_in_time', tomorrow.toISOString());

      if (visitsError) throw visitsError;

      // Get total bookings
      const { count: totalBookings, error: bookingsError } = await supabase
        .from('class_bookings')
        .select('*', { count: 'exact', head: true })
        .in('status', ['booked', 'confirmed']);

      if (bookingsError) throw bookingsError;

      const analyticsData: AnalyticsData = {
        total_members: memberGrowth.totalMembers,
        active_members: memberGrowth.activeMembers,
        total_visits_today: visitsToday || 0,
        total_bookings: totalBookings || 0,
        popular_classes: classPopularity,
        visit_trends: visitTrends,
        membership_breakdown: membershipBreakdown,
      };

      setData(analyticsData);
      setRevenueData(revenue);
    } catch (err: any) {
      console.error('Error fetching analytics:', err);
      setError(err.message || 'Failed to fetch analytics data');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [
    fetchMemberGrowth,
    fetchClassAttendance,
    fetchActiveUsers,
    fetchVisitTrends,
    fetchClassPopularity,
    fetchMembershipBreakdown,
    fetchRevenueData,
  ]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  /**
   * Refresh analytics data
   */
  const refresh = useCallback(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    data,
    revenueData,
    loading,
    error,
    refresh,
    // Expose individual fetch functions for granular updates
    fetchMemberGrowth,
    fetchClassAttendance,
    fetchActiveUsers,
    fetchVisitTrends,
    fetchClassPopularity,
    fetchRevenueData,
    fetchMembershipBreakdown,
  };
};
