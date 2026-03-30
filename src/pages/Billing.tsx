import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Zap } from "lucide-react";
import { motion } from "framer-motion";

export default function Billing() {
  const usedMinutes = 1284;
  const totalMinutes = 2000;
  const usagePercent = Math.round((usedMinutes / totalMinutes) * 100);

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 max-w-2xl">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Billing</h1>
        <p className="text-muted-foreground mt-1">Manage your subscription and usage.</p>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-display text-lg">Current Plan</CardTitle>
              <CardDescription>Your active subscription details.</CardDescription>
            </div>
            <Badge className="bg-primary/15 text-primary border-0 text-sm px-3 py-1">
              Pro
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Monthly Price</p>
              <p className="text-2xl font-display font-bold">$49<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Billing Cycle</p>
              <p className="text-sm font-medium">Renews April 15, 2024</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Minutes Used</span>
              <span className="font-medium">{usedMinutes.toLocaleString()} / {totalMinutes.toLocaleString()}</span>
            </div>
            <Progress value={usagePercent} className="h-2 bg-secondary [&>div]:bg-primary" />
            <p className="text-xs text-muted-foreground">
              {(totalMinutes - usedMinutes).toLocaleString()} minutes remaining this cycle
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium">Plan Includes</h4>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Zap className="h-3.5 w-3.5 text-primary" />
                2,000 minutes / month
              </li>
              <li className="flex items-center gap-2">
                <Zap className="h-3.5 w-3.5 text-primary" />
                Up to 10 active agents
              </li>
              <li className="flex items-center gap-2">
                <Zap className="h-3.5 w-3.5 text-primary" />
                Call recording & transcripts
              </li>
              <li className="flex items-center gap-2">
                <Zap className="h-3.5 w-3.5 text-primary" />
                Priority support
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 w-full">
        <CreditCard className="h-4 w-4" />
        Upgrade / Manage Billing via Stripe
      </Button>
    </motion.div>
  );
}
