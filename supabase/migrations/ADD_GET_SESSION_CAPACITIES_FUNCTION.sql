-- Function to get session capacities with booking counts in a single query
-- This replaces the N+1 query pattern and improves performance significantly
CREATE OR REPLACE FUNCTION get_session_capacities(session_ids UUID[])
RETURNS TABLE (
  session_id UUID,
  capacity INTEGER,
  booked INTEGER,
  available INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cs.id AS session_id,
    COALESCE(cs.capacity, 0)::INTEGER AS capacity,
    COALESCE(COUNT(cb.id) FILTER (WHERE cb.status != 'cancelled'), 0)::INTEGER AS booked,
    GREATEST(0, COALESCE(cs.capacity, 0) - COALESCE(COUNT(cb.id) FILTER (WHERE cb.status != 'cancelled'), 0))::INTEGER AS available
  FROM class_sessions cs
  LEFT JOIN class_bookings cb ON cb.class_id = cs.id
  WHERE cs.id = ANY(session_ids)
  GROUP BY cs.id, cs.capacity;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_session_capacities(UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION get_session_capacities(UUID[]) TO service_role;

-- Add comment for documentation
COMMENT ON FUNCTION get_session_capacities(UUID[]) IS 
'Returns capacity information (total, booked, available) for multiple class sessions in a single query. Replaces N+1 query pattern.';

