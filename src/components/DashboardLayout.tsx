import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isDemo } = useAuth();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          {isDemo && (
            <div className="bg-primary/10 border-b border-primary/20 px-4 py-1.5 flex items-center justify-center gap-2 text-xs text-primary shrink-0">
              <Sparkles className="h-3.5 w-3.5" />
              <span className="font-medium">Demo Mode</span>
              <span className="text-primary/70">— Showing sample data. Connect Supabase for live data.</span>
            </div>
          )}
          <header className="h-14 flex items-center border-b border-border px-4 shrink-0">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
          </header>
          <main className="flex-1 overflow-auto p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
