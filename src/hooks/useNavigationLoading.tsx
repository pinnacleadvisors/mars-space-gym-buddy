import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Hook to show loading state during navigation
 * Useful for showing a loading indicator when routes are changing
 */
export const useNavigationLoading = () => {
  const location = useLocation();
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    setIsNavigating(true);
    const timer = setTimeout(() => {
      setIsNavigating(false);
    }, 300); // Small delay to show loading state

    return () => clearTimeout(timer);
  }, [location.pathname]);

  return isNavigating;
};

/**
 * Component to show loading spinner during navigation
 */
export const NavigationLoadingIndicator = () => {
  const isNavigating = useNavigationLoading();

  if (!isNavigating) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <div className="h-1 bg-primary/20">
        <div className="h-full bg-primary animate-pulse" style={{ width: '100%' }} />
      </div>
    </div>
  );
};

