import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { updateBusiness } from "@/lib/supabase";
import { Save, Loader2 } from "lucide-react";

const voices = [
  { id: "sarah", name: "Sarah", desc: "Warm & professional" },
  { id: "marcus", name: "Marcus", desc: "Calm & authoritative" },
  { id: "elena", name: "Elena", desc: "Friendly & upbeat" },
  { id: "james", name: "James", desc: "Deep & reassuring" },
];

const DEFAULT_PROMPT = `You are a friendly and professional AI receptionist. Your primary goals are:

1. Answer questions about business hours, services, and pricing.
2. Schedule, reschedule, or cancel appointments.
3. Take messages for staff members.
4. Always be polite, concise, and helpful.

If you cannot help with a request, offer to transfer the caller to a human representative.`;

export default function AgentSettings() {
  const { business, refreshBusiness } = useAuth();

  // Derive initial state from the business record
  // We store these in the vapi_assistant_id and phone fields for MVP;
  // a proper schema would have dedicated columns. Using JSON in a settings field
  // is cleaner — but for now we persist what we can to the businesses table.
  const [businessName, setBusinessName] = useState(business?.name ?? "");
  const [phone, setPhone] = useState(business?.phone ?? "");
  const [vapiAssistantId, setVapiAssistantId] = useState(business?.vapi_assistant_id ?? "");
  const [twilioNumber, setTwilioNumber] = useState(business?.twilio_number ?? "");
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_PROMPT);
  const [voice, setVoice] = useState("sarah");
  const [sensitivity, setSensitivity] = useState([50]);
  const [saving, setSaving] = useState(false);

  // Sync business data into form on load
  useEffect(() => {
    if (business) {
      setBusinessName(business.name);
      setPhone(business.phone ?? "");
      setVapiAssistantId(business.vapi_assistant_id ?? "");
      setTwilioNumber(business.twilio_number ?? "");
    }
  }, [business]);

  const handleSave = async () => {
    if (!business) {
      toast.error("No business found. Please complete onboarding.");
      return;
    }

    setSaving(true);
    try {
      await updateBusiness(business.id, {
        name: businessName.trim() || business.name,
        phone: phone.trim() || null,
        vapi_assistant_id: vapiAssistantId.trim() || null,
        twilio_number: twilioNumber.trim() || null,
      });
      await refreshBusiness();
      toast.success("Settings saved successfully.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 max-w-2xl"
    >
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Agent Settings</h1>
        <p className="text-muted-foreground mt-1">Configure your AI voice agent's behaviour.</p>
      </div>

      {/* Business Details */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="font-display text-lg">Business Details</CardTitle>
          <CardDescription>
            Your business information used by the AI receptionist.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="business-name">Business Name</Label>
            <Input
              id="business-name"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="bg-secondary border-border"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="business-phone">Contact Phone</Label>
            <Input
              id="business-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+61 4xx xxx xxx"
              className="bg-secondary border-border"
            />
          </div>
        </CardContent>
      </Card>

      {/* Integration Settings */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="font-display text-lg">Integrations</CardTitle>
          <CardDescription>
            Connect your Vapi assistant and Twilio number.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="vapi-id">Vapi Assistant ID</Label>
            <Input
              id="vapi-id"
              value={vapiAssistantId}
              onChange={(e) => setVapiAssistantId(e.target.value)}
              placeholder="e.g. asst_..."
              className="bg-secondary border-border font-mono text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="twilio-number">Twilio Phone Number</Label>
            <Input
              id="twilio-number"
              value={twilioNumber}
              onChange={(e) => setTwilioNumber(e.target.value)}
              placeholder="+1 555 xxx xxxx"
              className="bg-secondary border-border font-mono text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* System Prompt */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="font-display text-lg">System Prompt</CardTitle>
          <CardDescription>
            Define how your AI agent should behave and respond to callers.{" "}
            <span className="text-amber-500 text-xs">
              Note: Update this directly in your Vapi dashboard to apply it live.
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            className="min-h-[200px] bg-secondary border-border text-foreground resize-none focus-visible:ring-primary"
          />
        </CardContent>
      </Card>

      {/* Voice */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="font-display text-lg">Voice Identity</CardTitle>
          <CardDescription>Choose the voice your agent will use on calls.</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={voice} onValueChange={setVoice}>
            <SelectTrigger className="bg-secondary border-border w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              {voices.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  <span className="font-medium">{v.name}</span>
                  <span className="text-muted-foreground ml-2 text-xs">— {v.desc}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Sensitivity */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="font-display text-lg">Interruption Sensitivity</CardTitle>
          <CardDescription>
            How quickly the agent pauses when the caller starts speaking.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Slider
            value={sensitivity}
            onValueChange={setSensitivity}
            max={100}
            step={1}
            className="[&_[role=slider]]:bg-primary [&_[role=slider]]:border-primary"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Low (waits longer)</span>
            <span className="text-foreground font-medium">{sensitivity[0]}%</span>
            <span>High (pauses instantly)</span>
          </div>
        </CardContent>
      </Card>

      <Button
        onClick={handleSave}
        disabled={saving}
        className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
      >
        {saving ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Save className="h-4 w-4" />
        )}
        {saving ? "Saving..." : "Save Settings"}
      </Button>
    </motion.div>
  );
}
