import { Phone, Clock, TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { motion } from "framer-motion";
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
          ? [0, 1].map((i) => (
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

      {/* Chart */}
      <motion.div variants={item}>
        <Card className="bg-card border-border">
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
    </motion.div>
  );
}
