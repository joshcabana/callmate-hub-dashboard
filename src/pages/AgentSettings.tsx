import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion } from "framer-motion";
import { toast } from "sonner";

const voices = [
  { id: "sarah", name: "Sarah", desc: "Warm & professional" },
  { id: "marcus", name: "Marcus", desc: "Calm & authoritative" },
  { id: "elena", name: "Elena", desc: "Friendly & upbeat" },
  { id: "james", name: "James", desc: "Deep & reassuring" },
];

export default function AgentSettings() {
  const [systemPrompt, setSystemPrompt] = useState(
    `You are a friendly and professional AI receptionist for a medical clinic. Your primary goals are:\n\n1. Answer questions about business hours, services, and pricing.\n2. Schedule, reschedule, or cancel appointments.\n3. Take messages for staff members.\n4. Always be polite, concise, and helpful.\n\nIf you cannot help with a request, offer to transfer the caller to a human representative.`
  );
  const [voice, setVoice] = useState("sarah");
  const [sensitivity, setSensitivity] = useState([50]);

  const handleSave = () => {
    toast.success("Agent settings saved successfully.");
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 max-w-2xl">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Agent Settings</h1>
        <p className="text-muted-foreground mt-1">Configure your AI voice agent's behavior.</p>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="font-display text-lg">System Prompt</CardTitle>
          <CardDescription>
            Define how your AI agent should behave and respond to callers.
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

      <Button onClick={handleSave} className="bg-primary text-primary-foreground hover:bg-primary/90">
        Save Settings
      </Button>
    </motion.div>
  );
}
