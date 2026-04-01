import { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase, fetchBusiness, type Business } from "@/lib/supabase";

type AuthContextType = {
  session: Session | null;
  user: User | null;
  business: Business | null;
  isLoading: boolean;
  needsOnboarding: boolean;
  refreshBusiness: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  business: null,
  isLoading: true,
  needsOnboarding: false,
  refreshBusiness: async () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
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
    await supabase.auth.signOut();
    setBusiness(null);
  };

  const needsOnboarding = !!user && !isLoading && business === null;

  return (
    <AuthContext.Provider
      value={{ session, user, business, isLoading, needsOnboarding, refreshBusiness, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
};
