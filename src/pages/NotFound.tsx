import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { getBasePath } from "@/lib/utils/pathUtils";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // If accessing /mars-space-gym-buddy/ in development, redirect to root
    const basePath = getBasePath();
    if (location.pathname === '/mars-space-gym-buddy/' || location.pathname.startsWith('/mars-space-gym-buddy/')) {
      // Check if we're in development (basePath should be empty)
      if (basePath === '' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.includes('localhost'))) {
        // Redirect to root path in development
        const cleanPath = location.pathname.replace('/mars-space-gym-buddy', '') || '/';
        navigate(cleanPath, { replace: true });
        return;
      }
    }

    // Only log in development, not on every render
    if (import.meta.env.DEV) {
      console.warn("404: Route not found:", location.pathname);
    }
  }, [location.pathname, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted p-4">
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-bold">404</h1>
        <p className="text-xl text-muted-foreground">Oops! Page not found</p>
        <p className="text-sm text-muted-foreground">
          The route <code className="bg-muted px-2 py-1 rounded">{location.pathname}</code> does not exist.
        </p>
        <div className="flex gap-4 justify-center">
          <Button onClick={() => navigate("/")} variant="default">
          Return to Home
          </Button>
          <Button onClick={() => navigate(-1)} variant="outline">
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
