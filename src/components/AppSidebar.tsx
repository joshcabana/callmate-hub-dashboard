import { LayoutDashboard, PhoneCall, Settings, CreditCard, LogOut } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const items = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Call Logs", url: "/call-logs", icon: PhoneCall },
  { title: "Agent Settings", url: "/agent-settings", icon: Settings },
  { title: "Billing", url: "/billing", icon: CreditCard },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const { user, signOut } = useAuth();
  const collapsed = state === "collapsed";
  const location = useLocation();

  const userEmail = user?.email || "user@callmate.ai";
  const initials = userEmail.substring(0, 2).toUpperCase();

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border h-full flex flex-col">
      <div className="p-4 flex items-center gap-3">
        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <PhoneCall className="h-4 w-4 text-primary-foreground" />
        </div>
        {!collapsed && (
          <span className="font-display text-lg font-semibold text-foreground tracking-tight">
            CallMate AI
          </span>
        )}
      </div>

      <SidebarContent className="mt-4 flex-grow">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                     <NavLink
                        to={item.url}
                        end={item.url === "/"}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground transition-colors hover:text-foreground hover:bg-secondary w-full"
                        activeClassName="bg-secondary text-primary font-medium"
                      >
                       <item.icon className="h-5 w-5 shrink-0" />
                       {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {!collapsed && (
        <div className="mt-auto p-4 border-t border-sidebar-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-xs font-medium text-foreground shrink-0">
                {initials}
              </div>
              <div className="flex flex-col truncate">
                <span className="text-sm font-medium text-foreground truncate">{userEmail}</span>
                <span className="text-xs text-muted-foreground truncate">Admin</span>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={signOut} title="Sign Out">
              <LogOut className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </Button>
          </div>
        </div>
      )}
    </Sidebar>
  );
}
