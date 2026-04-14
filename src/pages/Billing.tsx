import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Zap, Loader2, TrendingUp, Shield, Headphones } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { fetchDashboardMetrics, supabase, isDemoMode } from "@/lib/supabase";
import { toast } from "sonner";

// ── Pricing Tiers ────────────────────────────────────────────────────────
const TIERS = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "/mo",
    minutes: 50,
    perMinute: null,
    features: [
      "50 minutes / month",
      "Basic data extraction",
      "Call transcripts",
      "1 AI agent",
    ],
    cta: "Current Plan",
    highlighted: false,
  },
  {
    id: "starter",
    name: "Starter",
    price: "$49",
    period: "/mo",
    minutes: 2000,
    perMinute: "$0.09",
    features: [
      "2,000 minutes / month",
      "Zero-error extraction",
      "SMS lead alerts",
      "5 AI agents",
      "Email support",
    ],
    cta: "Upgrade to Starter",
    highlighted: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: "$199",
    period: "/mo",
    minutes: 10000,
    perMinute: "$0.07",
    features: [
      "10,000 minutes / month",
      "Custom voice accents",
      "Priority support",
      "Unlimited agents",
      "Self-learning analytics",
      "CSV data export",
    ],
    cta: "Upgrade to Pro",
    highlighted: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Custom",
    period: "",
    minutes: Infinity,
    perMinute: "Custom",
    features: [
      "Unlimited minutes",
      "HIPAA/SOC2 roadmap",
      "CRM integrations",
      "Dedicated account manager",
      "Custom SLA",
    ],
    cta: "Contact Sales",
    highlighted: false,
  },
] as const;

function getTierForBusiness(subscriptionStatus: string | null, plan: string | null) {
  if (subscriptionStatus === "active") {
    if (plan === "pro") return TIERS[2];
    return TIERS[1]; // default active = starter
  }
  return TIERS[0]; // free
}

export default function Billing() {
  const { business } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingTier, setLoadingTier] = useState<string | null>(null);

  const { data: metrics } = useQuery({
    queryKey: ["dashboard_metrics"],
    queryFn: fetchDashboardMetrics,
    staleTime: 30_000,
  });

  const currentTier = getTierForBusiness(
    business?.subscription_status ?? null,
    business?.plan ?? null
  );
  const usedMinutes = metrics?.totalMinutes ?? 0;
  const totalMinutes = currentTier.minutes === Infinity ? 99999 : currentTier.minutes;
  const usagePercent = totalMinutes > 0 ? Math.min(Math.round((usedMinutes / totalMinutes) * 100), 100) : 0;

  const handleCheckout = async (tierId: string) => {
    if (!business) return;
    if (tierId === "enterprise") {
      window.open("mailto:sales@callmate.ai?subject=Enterprise%20Inquiry", "_blank");
      return;
    }
    if (tierId === "free") return;

    if (isDemoMode) {
      toast.info("Stripe checkout is disabled in demo mode.");
      return;
    }

    setIsLoading(true);
    setLoadingTier(tierId);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error("You must be logged in to manage billing.");
        return;
      }

      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ business_id: business.id, tier: tierId }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.error || "Failed to create checkout session.");
      }
    } catch (err) {
      console.error("Failed to initiate checkout", err);
      toast.error("Network error. Please try again.");
    } finally {
      setIsLoading(false);
      setLoadingTier(null);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Billing</h1>
        <p className="text-muted-foreground mt-1">Manage your subscription, usage, and invoices.</p>
      </div>

      {/* Usage Card */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-display text-lg">Current Usage</CardTitle>
              <CardDescription>
                {currentTier.name} plan — {business?.subscription_status === "active" ? "Active" : "Free tier"}
              </CardDescription>
            </div>
            <Badge variant={business?.subscription_status === "active" ? "default" : "secondary"}>
              {currentTier.name}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Minutes Used</p>
              <p className="text-2xl font-display font-bold">
                {usedMinutes.toLocaleString()}
                <span className="text-sm font-normal text-muted-foreground">
                  {" "}/ {currentTier.minutes === Infinity ? "∞" : totalMinutes.toLocaleString()}
                </span>
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
          <div className="space-y-2">
            <Progress value={usagePercent} className="h-2 bg-secondary [&>div]:bg-primary" />
            {usagePercent >= 80 && usagePercent < 100 && (
              <div className="flex items-center gap-2 text-xs text-amber-500">
                <TrendingUp className="h-3.5 w-3.5" />
                You're at {usagePercent}% of your plan — consider upgrading for uninterrupted service.
              </div>
            )}
            {usagePercent >= 100 && (
              <div className="flex items-center gap-2 text-xs text-destructive">
                <TrendingUp className="h-3.5 w-3.5" />
                You've hit your plan limit. Upgrade now to keep your agents running.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pricing Grid */}
      <div>
        <h2 className="font-display text-lg font-semibold mb-4">Choose Your Plan</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {TIERS.map((tier) => {
            const isCurrent = tier.id === currentTier.id;
            return (
              <Card
                key={tier.id}
                className={`bg-card border-border relative transition-all ${
                  tier.highlighted
                    ? "ring-2 ring-primary shadow-lg shadow-primary/10"
                    : ""
                }`}
              >
                {tier.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground text-xs px-3">
                      Most Popular
                    </Badge>
                  </div>
                )}
                <CardHeader className="pb-3">
                  <CardTitle className="font-display text-base">{tier.name}</CardTitle>
                  <div className="mt-2">
                    <span className="text-3xl font-display font-bold">{tier.price}</span>
                    <span className="text-sm text-muted-foreground">{tier.period}</span>
                    {tier.perMinute && (
                      <p className="text-xs text-muted-foreground mt-1">
                        + {tier.perMinute}/min overage
                      </p>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <Zap className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`w-full gap-2 ${
                      tier.highlighted
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : ""
                    }`}
                    variant={tier.highlighted ? "default" : "outline"}
                    disabled={isCurrent || (isLoading && loadingTier !== tier.id)}
                    onClick={() => handleCheckout(tier.id)}
                  >
                    {isLoading && loadingTier === tier.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isCurrent ? (
                      "Current Plan"
                    ) : tier.id === "enterprise" ? (
                      <>
                        <Headphones className="h-4 w-4" />
                        Contact Sales
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4" />
                        {tier.cta}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Trust Signals */}
      <div className="flex flex-wrap items-center gap-6 text-xs text-muted-foreground border-t border-border pt-6">
        <div className="flex items-center gap-1.5">
          <Shield className="h-4 w-4" />
          Money-back guarantee on first 500 minutes
        </div>
        <div className="flex items-center gap-1.5">
          <Zap className="h-4 w-4" />
          More calls = smarter agents (self-learning AI)
        </div>
        <div className="flex items-center gap-1.5">
          <CreditCard className="h-4 w-4" />
          Powered by Stripe — PCI Level 1 certified
        </div>
      </div>

      {/* Manage existing subscription */}
      {business?.subscription_status === "active" && (
        <Button
          variant="outline"
          size="lg"
          onClick={() => handleCheckout(currentTier.id)}
          disabled={isLoading}
          className="w-full gap-2"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CreditCard className="h-4 w-4" />
          )}
          Manage Subscription via Stripe Portal
        </Button>
      )}
    </motion.div>
  );
}
