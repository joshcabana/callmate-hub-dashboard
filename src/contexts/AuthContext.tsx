import { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase, fetchBusiness, isDemoMode, type Business } from "@/lib/supabase";

type AuthContextType = {
  session: Session | null;
  user: User | null;
  business: Business | null;
  isLoading: boolean;
  needsOnboarding: boolean;
  isDemo: boolean;
  refreshBusiness: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  business: null,
  isLoading: true,
  needsOnboarding: false,
  isDemo: false,
  refreshBusiness: async () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

// Fake session/user for demo mode
const DEMO_USER = { id: "demo-user-001", email: "demo@callmate.ai" } as User;
const DEMO_SESSION = { user: DEMO_USER, access_token: "demo" } as Session;

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(isDemoMode ? DEMO_SESSION : null);
  const [user, setUser] = useState<User | null>(isDemoMode ? DEMO_USER : null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadBusiness = async () => {
    try {
      const biz = await fetchBusiness();
      setBusiness(biz);
    } catch {
      setBusiness(null);
    }
  };

  const refreshBusiness = async () => {
    await loadBusiness();
  };

  useEffect(() => {
    if (isDemoMode) {
      // In demo mode, load demo business immediately
      loadBusiness().then(() => setIsLoading(false));
      return;
    }

    // Initial session load
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await loadBusiness();
      }
      setIsLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await loadBusiness();
        } else {
          setBusiness(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    if (!isDemoMode) {
      await supabase.auth.signOut();
    }
    setBusiness(null);
  };

  const needsOnboarding = !!user && !isLoading && business === null;

  return (
    <AuthContext.Provider
      value={{ session, user, business, isLoading, needsOnboarding, isDemo: isDemoMode, refreshBusiness, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
};
