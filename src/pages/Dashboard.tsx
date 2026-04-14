import { useState, useEffect, useCallback } from "react";
import { Phone, Clock, TrendingUp, TrendingDown, RefreshCw, PhoneIncoming, PhoneOff, PhoneForwarded, Mic } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { fetchDashboardMetrics } from "@/lib/supabase";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

function pctChange(current: number, previous: number): string {
  if (previous === 0 && current === 0) return "0%";
  if (previous === 0) return "+100%";
  const pct = ((current - previous) / previous) * 100;
  return `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;
}

function MetricSkeleton() {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="h-4 w-28 animate-pulse rounded bg-muted" />
        <div className="h-4 w-4 animate-pulse rounded bg-muted" />
      </CardHeader>
      <CardContent>
        <div className="h-9 w-24 animate-pulse rounded bg-muted mb-2" />
        <div className="h-3 w-32 animate-pulse rounded bg-muted" />
      </CardContent>
    </Card>
  );
}

// ── Live Activity Feed ─────────────────────────────────────────────

type CallStatus = "ringing" | "in-progress" | "completed" | "missed";

interface LiveCall {
  id: string;
  callerName: string;
  callerNumber: string;
  status: CallStatus;
  startedAt: Date;
  duration: number; // seconds elapsed
  agent: string;
}

const STATUS_CONFIG: Record<CallStatus, { label: string; color: string; icon: typeof Phone; dotClass: string }> = {
  ringing: { label: "Ringing", color: "text-warning", icon: PhoneIncoming, dotClass: "bg-warning animate-pulse" },
  "in-progress": { label: "In Progress", color: "text-success", icon: Mic, dotClass: "bg-success animate-pulse" },
  completed: { label: "Completed", color: "text-muted-foreground", icon: PhoneForwarded, dotClass: "bg-muted-foreground" },
  missed: { label: "Missed", color: "text-destructive", icon: PhoneOff, dotClass: "bg-destructive" },
};

const DEMO_NAMES = ["Sarah Chen", "Marcus Webb", "Elena Torres", "James O'Brien", "Priya Patel", "Liam Nguyen", "Olivia Park", "Daniel Kim"];
const DEMO_NUMBERS = ["+61 400 111 222", "+61 412 333 444", "+1 555 987 6543", "+44 7911 123456", "+61 499 876 543", "+1 212 555 0198", "+61 403 555 666", "+1 310 555 7890"];
const DEMO_AGENTS = ["Sarah (Voice)", "Marcus (Voice)", "Elena (Voice)"];

function generateLiveCall(index: number): LiveCall {
  const statuses: CallStatus[] = ["ringing", "in-progress", "in-progress", "completed", "completed", "missed"];
  const status = statuses[index % statuses.length];
  const secondsAgo = Math.floor(Math.random() * 300) + 10;
  return {
    id: `live-${Date.now()}-${index}`,
    callerName: DEMO_NAMES[index % DEMO_NAMES.length],
    callerNumber: DEMO_NUMBERS[index % DEMO_NUMBERS.length],
    status,
    startedAt: new Date(Date.now() - secondsAgo * 1000),
    duration: status === "ringing" ? 0 : secondsAgo,
    agent: DEMO_AGENTS[index % DEMO_AGENTS.length],
  };
}

function formatDuration(seconds: number): string {
  if (seconds === 0) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function useSimulatedFeed() {
  const [calls, setCalls] = useState<LiveCall[]>(() =>
    Array.from({ length: 5 }, (_, i) => generateLiveCall(i))
  );

  const advanceState = useCallback(() => {
    setCalls((prev) => {
      const updated = prev.map((call) => {
        if (call.status === "ringing" && Math.random() > 0.5) {
          return { ...call, status: "in-progress" as CallStatus, duration: Math.floor(Math.random() * 20) + 5 };
        }
        if (call.status === "in-progress") {
          const newDuration = call.duration + 5;
          if (newDuration > 120 + Math.random() * 180) {
            return { ...call, status: "completed" as CallStatus, duration: newDuration };
          }
          return { ...call, duration: newDuration };
        }
        return call;
      });

      // Occasionally add a new incoming call
      if (Math.random() > 0.6 && updated.length < 8) {
        const newCall: LiveCall = {
          id: `live-${Date.now()}`,
          callerName: DEMO_NAMES[Math.floor(Math.random() * DEMO_NAMES.length)],
          callerNumber: DEMO_NUMBERS[Math.floor(Math.random() * DEMO_NUMBERS.length)],
          status: "ringing",
          startedAt: new Date(),
          duration: 0,
          agent: DEMO_AGENTS[Math.floor(Math.random() * DEMO_AGENTS.length)],
        };
        updated.unshift(newCall);
      }

      // Keep only the latest 6
      return updated.slice(0, 6);
    });
  }, []);

  useEffect(() => {
    const interval = setInterval(advanceState, 5000);
    return () => clearInterval(interval);
  }, [advanceState]);

  const activeCalls = calls.filter((c) => c.status === "ringing" || c.status === "in-progress").length;

  return { calls, activeCalls };
}

function LiveActivityFeed() {
  const { calls, activeCalls } = useSimulatedFeed();

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="font-display text-lg">Live Activity</CardTitle>
            {activeCalls > 0 && (
              <Badge variant="outline" className="gap-1.5 text-xs border-success/30 text-success">
                <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                {activeCalls} active
              </Badge>
            )}
          </div>
          <span className="text-xs text-muted-foreground">Auto-updating</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          <AnimatePresence mode="popLayout" initial={false}>
            {calls.map((call) => {
              const config = STATUS_CONFIG[call.status];
              const StatusIcon = config.icon;
              return (
                <motion.div
                  key={call.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary/50 transition-colors"
                >
                  {/* Status dot */}
                  <span className={`h-2 w-2 rounded-full shrink-0 ${config.dotClass}`} />

                  {/* Caller info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">{call.callerName}</span>
                      <span className="text-xs text-muted-foreground font-mono hidden sm:inline">{call.callerNumber}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <StatusIcon className={`h-3 w-3 ${config.color}`} />
                      <span className={config.color}>{config.label}</span>
                      <span>·</span>
                      <span>{call.agent}</span>
                    </div>
                  </div>

                  {/* Duration */}
                  <span className="text-xs font-mono text-muted-foreground tabular-nums shrink-0">
                    {formatDuration(call.duration)}
                  </span>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {calls.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Phone className="h-8 w-8 text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">No active calls right now</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Dashboard ──────────────────────────────────────────────────────

export default function Dashboard() {
  const {
    data: metrics,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["dashboard_metrics"],
    queryFn: fetchDashboardMetrics,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const callsTrend = metrics
    ? pctChange(metrics.callsThisWeek, metrics.callsLastWeek)
    : null;
  const minutesTrend = metrics
    ? pctChange(metrics.minutesThisWeek, metrics.minutesLastWeek)
    : null;
  const avgDuration = metrics && metrics.totalCalls > 0
    ? Math.round((metrics.totalMinutes / metrics.totalCalls) * 10) / 10
    : 0;

  const metricCards = metrics
    ? [
        {
          title: "Total Calls",
          value: metrics.totalCalls.toLocaleString(),
          change: callsTrend!,
          trend: (metrics.callsThisWeek >= metrics.callsLastWeek ? "up" : "down") as "up" | "down",
          icon: Phone,
        },
        {
          title: "Minutes Used",
          value: metrics.totalMinutes.toLocaleString(),
          change: minutesTrend!,
          trend: (metrics.minutesThisWeek >= metrics.minutesLastWeek ? "up" : "down") as "up" | "down",
          icon: Clock,
        },
        {
          title: "Avg Duration",
          value: `${avgDuration}m`,
          change: "",
          trend: "up" as "up" | "down",
          icon: Clock,
        },
        {
          title: "This Week",
          value: metrics.callsThisWeek.toLocaleString(),
          change: callsTrend!,
          trend: (metrics.callsThisWeek >= metrics.callsLastWeek ? "up" : "down") as "up" | "down",
          icon: TrendingUp,
        },
      ]
    : [];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Your AI receptionist at a glance.</p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Error banner */}
      {isError && (
        <motion.div variants={item}>
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            Failed to load metrics:{" "}
            {error instanceof Error ? error.message : "Unknown error"}
          </div>
        </motion.div>
      )}

      {/* Metric cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoading
          ? [0, 1, 2, 3].map((i) => (
              <motion.div key={i} variants={item}>
                <MetricSkeleton />
              </motion.div>
            ))
          : metricCards.map((m) => (
              <motion.div key={m.title} variants={item}>
                <Card className="bg-card border-border">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {m.title}
                    </CardTitle>
                    <m.icon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-display font-bold">{m.value}</div>
                    <div className="flex items-center gap-1 mt-1 text-xs">
                      {m.trend === "up" ? (
                        <TrendingUp className="h-3 w-3 text-success" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-destructive" />
                      )}
                      <span
                        className={
                          m.trend === "up" ? "text-success" : "text-destructive"
                        }
                      >
                        {m.change}
                      </span>
                      <span className="text-muted-foreground">vs last 7 days</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
      </div>

      {/* Chart + Live Feed side by side */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Chart — wider */}
        <motion.div variants={item} className="lg:col-span-3">
          <Card className="bg-card border-border h-full">
            <CardHeader>
              <CardTitle className="font-display text-lg">
                Call Volume — Last 7 Days
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                {isLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={metrics?.dailyCounts ?? []}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="hsl(var(--border))"
                      />
                      <XAxis
                        dataKey="day"
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        allowDecimals={false}
                        tickLine={false}
                        axisLine={false}
                        width={32}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          color: "hsl(var(--foreground))",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="calls"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={{ fill: "hsl(var(--primary))", r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
              {!isLoading && metrics?.totalCalls === 0 && (
                <p className="text-center text-sm text-muted-foreground mt-4">
                  No calls yet — connect your Vapi agent to start receiving data.
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Live Activity Feed — narrower */}
        <motion.div variants={item} className="lg:col-span-2">
          <LiveActivityFeed />
        </motion.div>
      </div>
    </motion.div>
  );
}
