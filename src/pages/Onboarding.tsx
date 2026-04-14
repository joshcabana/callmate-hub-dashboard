import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { PhoneCall, Building2 } from "lucide-react";
import { toast } from "sonner";
import { createBusiness } from "@/lib/supabase";
import { motion } from "framer-motion";

export default function Onboarding() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Business name is required.");
      return;
    }

    setLoading(true);
    try {
      await createBusiness(name.trim(), phone.trim() || undefined);
      toast.success("Business created! Welcome to CallMate AI.");
      navigate("/app", { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create business.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="flex justify-center mb-8">
          <div className="bg-primary/10 p-4 rounded-2xl">
            <PhoneCall className="h-8 w-8 text-primary" />
          </div>
        </div>

        <Card className="bg-card border-border">
          <CardHeader className="text-center">
            <CardTitle className="font-display text-2xl">Set up your business</CardTitle>
            <CardDescription>
              Tell us a bit about your business to get started with CallMate AI.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="business-name" className="flex items-center gap-2">
                  <Building2 className="h-3.5 w-3.5" />
                  Business Name
                </Label>
                <Input
                  id="business-name"
                  placeholder="e.g. Smith's Plumbing"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoFocus
                  className="bg-secondary border-border"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="business-phone" className="flex items-center gap-2">
                  <PhoneCall className="h-3.5 w-3.5" />
                  Business Phone <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <Input
                  id="business-phone"
                  type="tel"
                  placeholder="+61 4xx xxx xxx"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="bg-secondary border-border"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-primary text-primary-foreground"
                disabled={loading}
              >
                {loading ? "Creating..." : "Get Started →"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-4">
          You can update these details anytime in settings.
        </p>
      </motion.div>
    </div>
  );
}
