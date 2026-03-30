import { Phone, Clock, Bot, TrendingUp, TrendingDown } from "lucide-react";
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

const metrics = [
  {
    title: "Total Calls",
    value: "2,847",
    change: "+12.5%",
    trend: "up" as const,
    icon: Phone,
  },
  {
    title: "Minutes Used",
    value: "1,284",
    change: "+8.2%",
    trend: "up" as const,
    icon: Clock,
  },
  {
    title: "Active Agents",
    value: "6",
    change: "-1",
    trend: "down" as const,
    icon: Bot,
  },
];

const chartData = [
  { day: "Mon", calls: 312 },
  { day: "Tue", calls: 428 },
  { day: "Wed", calls: 389 },
  { day: "Thu", calls: 502 },
  { day: "Fri", calls: 471 },
  { day: "Sat", calls: 258 },
  { day: "Sun", calls: 187 },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function Dashboard() {
  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Your AI receptionist at a glance.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {metrics.map((m) => (
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
                  <span className={m.trend === "up" ? "text-success" : "text-destructive"}>
                    {m.change}
                  </span>
                  <span className="text-muted-foreground">vs last week</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <motion.div variants={item}>
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="font-display text-lg">Call Volume — Last 7 Days</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 20% 16%)" />
                  <XAxis dataKey="day" stroke="hsl(215 20% 55%)" fontSize={12} />
                  <YAxis stroke="hsl(215 20% 55%)" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(222 44% 10%)",
                      border: "1px solid hsl(222 20% 16%)",
                      borderRadius: "8px",
                      color: "hsl(210 40% 93%)",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="calls"
                    stroke="hsl(173 80% 50%)"
                    strokeWidth={2}
                    dot={{ fill: "hsl(173 80% 50%)", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
