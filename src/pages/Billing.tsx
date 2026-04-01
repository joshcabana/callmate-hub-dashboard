import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Zap, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

export default function Billing() {
  const { business } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Hardcoded for now. In a real scenario, this is mapped from stripe_price_id or your DB
  const isPro = business?.subscription_status === "active";
  const usedMinutes = 521; // Placeholder until usage API is built
  const totalMinutes = isPro ? 10000 : 2000;
  const usagePercent = Math.round((usedMinutes / totalMinutes) * 100);

  const handleCheckout = async () => {
    if (!business) return;
    setIsLoading(true);

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          business_id: business.id,
          // If you have a real price ID, insert it here:
          // price_id: "price_1ABC123", 
        }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error("No checkout URL returned", data);
      }
    } catch (err) {
      console.error("Failed to initiate checkout", err);
    } finally {
      setIsLoading(false);
    }
  };

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
            <Badge variant={isPro ? "default" : "secondary"}>
              {isPro ? "Pro Plan" : business?.plan || "Starter"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="text-2xl font-display font-bold capitalize">
                {business?.subscription_status || "Free"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Period Ends</p>
              <p className="text-sm font-medium">
                {business?.subscription_current_period_end
                  ? new Date(business.subscription_current_period_end).toLocaleDateString()
                  : "N/A"}
              </p>
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
                {totalMinutes.toLocaleString()} minutes / month
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

      <Button
        size="lg"
        onClick={handleCheckout}
        disabled={isLoading || !business}
        className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 w-full"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <CreditCard className="h-4 w-4" />
        )}
        {isPro ? "Manage Billing via StripePortal" : "Upgrade to Pro"}
      </Button>
    </motion.div>
  );
}
