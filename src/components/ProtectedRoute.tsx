import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, isLoading, needsOnboarding } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex bg-background items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Authenticated but no business yet — route to onboarding
  if (needsOnboarding && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}
