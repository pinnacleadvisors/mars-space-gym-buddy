import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

/**
 * Booking with class session details
 */
export interface BookingWithDetails {
  id: string;
  user_id: string;
  class_id: string;
  status: string;
  created_at: string;
  class_sessions: {
    id: string;
    name: string;
    instructor: string | null;
    start_time: string;
    end_time: string;
    capacity: number | null;
  } | null;
}

/**
 * Custom hook for managing class bookings
 * Handles fetching, creating, and cancelling bookings
 */
export const useBookings = (userId?: string) => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetches user bookings from database with class session details
   */
  const fetchBookings = useCallback(async (targetUserId?: string) => {
    try {
      setLoading(true);
      setError(null);

      const currentUserId = targetUserId || user?.id;
      if (!currentUserId) {
        setBookings([]);
        setLoading(false);
        return;
      }

      // Query bookings and join with class_sessions
      // class_bookings.class_id references class_sessions.id
      // Note: Supabase requires explicit foreign key relationship syntax
      const { data, error: fetchError } = await supabase
        .from('class_bookings')
        .select(`
          *,
          class_sessions(
            id,
            name,
            instructor,
            start_time,
            end_time,
            capacity
          )
        `)
        .eq('user_id', currentUserId)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setBookings((data as BookingWithDetails[]) || []);
    } catch (err: any) {
      console.error('Error fetching bookings:', err);
      setError(err.message || 'Failed to fetch bookings');
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  /**
   * Initializes bookings and sets up real-time subscription
   */
  useEffect(() => {
    const targetUserId = userId || user?.id;
    if (!targetUserId || targetUserId.trim() === '') {
      setLoading(false);
      return;
    }

    // Validate UUID format to prevent "invalid input syntax for type uuid" errors
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const trimmedUserId = targetUserId.trim();
    if (!uuidRegex.test(trimmedUserId)) {
      console.error("Invalid user ID format for bookings subscription:", trimmedUserId);
      setLoading(false);
      return;
    }

    // Fetch initial bookings
    fetchBookings(trimmedUserId);

    // Set up real-time subscription for booking updates
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let mounted = true;

    const setupSubscription = async () => {
      // Ensure we have a valid session first
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !mounted) {
        console.log("No session available for bookings subscription");
        return;
      }

      channel = supabase
        .channel(`bookings-changes-${trimmedUserId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'class_bookings',
            filter: `user_id=eq.${trimmedUserId}`, // Use trimmed and validated UUID
          },
          (payload) => {
            console.log('Booking change detected:', payload);
            // Refetch bookings when changes occur
            if (mounted) {
              fetchBookings(trimmedUserId);
            }
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log("Bookings subscription active");
          } else if (status === 'CHANNEL_ERROR') {
            console.error("Bookings subscription error");
          }
        });
    };

    setupSubscription();

    return () => {
      mounted = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [userId, user?.id, fetchBookings]);

  /**
   * Checks if user has valid membership
   */
  const checkMembership = useCallback(async (): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const { data, error: membershipError } = await supabase.rpc('has_valid_membership', {
        _user_id: user.id,
      });

      if (membershipError) {
        console.error('Error checking membership:', membershipError);
        return false;
      }

      return data === true;
    } catch (err) {
      console.error('Error checking membership:', err);
      return false;
    }
  }, [user?.id]);

  /**
   * Gets current booking count for a class session
   */
  const getBookingCount = useCallback(async (classId: string): Promise<number> => {
    try {
      const { count, error: countError } = await supabase
        .from('class_bookings')
        .select('*', { count: 'exact', head: true })
        .eq('class_id', classId)
        .eq('status', 'booked');

      if (countError) {
        console.error('Error getting booking count:', countError);
        return 0;
      }

      return count || 0;
    } catch (err) {
      console.error('Error getting booking count:', err);
      return 0;
    }
  }, []);

  /**
   * Checks if user already has a booking for a class session
   */
  const hasExistingBooking = useCallback(async (classId: string): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const { data, error: checkError } = await supabase
        .from('class_bookings')
        .select('id')
        .eq('user_id', user.id)
        .eq('class_id', classId)
        .in('status', ['booked', 'confirmed'])
        .limit(1)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking existing booking:', checkError);
        return false;
      }

      return data !== null;
    } catch (err) {
      console.error('Error checking existing booking:', err);
      return false;
    }
  }, [user?.id]);

  /**
   * Creates a new booking for a class session
   */
  const createBooking = useCallback(async (classId: string): Promise<{ success: boolean; error?: string }> => {
    if (!user?.id) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      // 1. Validate user has active membership
      const hasMembership = await checkMembership();
      if (!hasMembership) {
        return { success: false, error: 'You need an active membership to book classes' };
      }

      // 2. Check if user already has a booking for this class
      const existing = await hasExistingBooking(classId);
      if (existing) {
        return { success: false, error: 'You already have a booking for this class' };
      }

      // 3. Get class session details to check capacity
      const { data: classSession, error: classError } = await supabase
        .from('class_sessions')
        .select('capacity, start_time')
        .eq('id', classId)
        .single();

      if (classError || !classSession) {
        return { success: false, error: 'Class session not found' };
      }

      // 4. Check if class is in the past
      if (classSession.start_time && new Date(classSession.start_time) < new Date()) {
        return { success: false, error: 'Cannot book a class that has already started' };
      }

      // 5. Check capacity
      if (classSession.capacity) {
        const currentBookings = await getBookingCount(classId);
        if (currentBookings >= classSession.capacity) {
          return { success: false, error: 'This class is fully booked' };
        }
      }

      // 6. Create the booking
      const { data: booking, error: bookingError } = await supabase
        .from('class_bookings')
        .insert({
          user_id: user.id,
          class_id: classId,
          status: 'booked',
        })
        .select('*, class_sessions(id, name, instructor, start_time, end_time, capacity)')
        .single();

      if (bookingError) {
        throw bookingError;
      }

      // 7. Update local state
      setBookings((prev) => [booking as BookingWithDetails, ...prev]);

      return { success: true };
    } catch (err: any) {
      console.error('Error creating booking:', err);
      return { success: false, error: err.message || 'Failed to create booking' };
    }
  }, [user?.id, checkMembership, hasExistingBooking, getBookingCount]);

  /**
   * Cancels a booking
   */
  const cancelBooking = useCallback(async (bookingId: string): Promise<{ success: boolean; error?: string }> => {
    if (!user?.id) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      // 1. Get booking details
      const { data: booking, error: fetchError } = await supabase
        .from('class_bookings')
        .select('*, class_sessions(start_time)')
        .eq('id', bookingId)
        .eq('user_id', user.id)
        .single();

      if (fetchError || !booking) {
        return { success: false, error: 'Booking not found' };
      }

      // 2. Check if booking is already cancelled
      if (booking.status === 'cancelled') {
        return { success: false, error: 'Booking is already cancelled' };
      }

      // 3. Check cancellation policy (can't cancel within 24 hours)
      if (booking.class_sessions?.start_time) {
        const startTime = new Date(booking.class_sessions.start_time);
        const now = new Date();
        const hoursUntilClass = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60);

        if (hoursUntilClass < 24 && hoursUntilClass > 0) {
          return {
            success: false,
            error: 'Cannot cancel booking within 24 hours of class start time',
          };
        }

        // Can't cancel if class has already started
        if (hoursUntilClass <= 0) {
          return { success: false, error: 'Cannot cancel a class that has already started' };
        }
      }

      // 4. Update booking status to cancelled
      const { error: updateError } = await supabase
        .from('class_bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId)
        .eq('user_id', user.id);

      if (updateError) {
        throw updateError;
      }

      // 5. Update local state
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: 'cancelled' } : b))
      );

      return { success: true };
    } catch (err: any) {
      console.error('Error cancelling booking:', err);
      return { success: false, error: err.message || 'Failed to cancel booking' };
    }
  }, [user?.id]);

  /**
   * Refreshes bookings from server
   */
  const refreshBookings = useCallback(async () => {
    await fetchBookings(userId || user?.id);
  }, [userId, user?.id, fetchBookings]);

  return {
    bookings,
    loading,
    error,
    createBooking,
    cancelBooking,
    refreshBookings,
  };
};
