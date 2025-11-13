import { useState, useEffect } from 'react';
import { AnalyticsData } from '@/types/analytics';

export const useAnalytics = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch analytics data from Lovable Cloud
    setLoading(false);
  }, []);

  return {
    data,
    loading,
  };
};
