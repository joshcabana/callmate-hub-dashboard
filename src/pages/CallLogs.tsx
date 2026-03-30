import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { motion } from "framer-motion";

const calls = [
  { id: 1, date: "2024-03-28 14:32", caller: "+1 (415) 555-0142", duration: "3:24", status: "Completed" as const, transcript: "Hi, I'd like to schedule an appointment for next Tuesday at 2 PM.\n\nAgent: Of course! Let me check availability... I have an opening at 2:15 PM on Tuesday. Would that work?\n\nCaller: That's perfect, thank you!\n\nAgent: Great, you're all set. We'll send a confirmation to your phone." },
  { id: 2, date: "2024-03-28 13:17", caller: "+1 (628) 555-0198", duration: "1:45", status: "Completed" as const, transcript: "Hello, what are your business hours?\n\nAgent: We're open Monday through Friday, 9 AM to 6 PM, and Saturdays from 10 AM to 3 PM.\n\nCaller: Thanks!" },
  { id: 3, date: "2024-03-28 11:05", caller: "+1 (510) 555-0233", duration: "0:12", status: "Failed" as const, transcript: "Call disconnected before agent could respond." },
  { id: 4, date: "2024-03-27 16:48", caller: "+1 (925) 555-0177", duration: "5:02", status: "Completed" as const, transcript: "I need to reschedule my appointment from Friday to next Monday.\n\nAgent: Sure, I can help with that. Let me pull up your record... Found it. I have availability at 10 AM and 3 PM on Monday.\n\nCaller: 3 PM works.\n\nAgent: Done! Your appointment has been moved to Monday at 3 PM." },
  { id: 5, date: "2024-03-27 15:22", caller: "+1 (650) 555-0311", duration: "2:38", status: "Completed" as const, transcript: "Can I get a price quote for your premium package?\n\nAgent: Absolutely! Our premium package starts at $149/month and includes unlimited calls, priority support, and advanced analytics.\n\nCaller: That sounds great. I'll think about it." },
  { id: 6, date: "2024-03-27 10:11", caller: "+1 (408) 555-0099", duration: "0:08", status: "Failed" as const, transcript: "No audio detected. Call terminated." },
  { id: 7, date: "2024-03-26 17:30", caller: "+1 (707) 555-0265", duration: "4:15", status: "Completed" as const, transcript: "I have a complaint about my last visit. The waiting time was over 40 minutes.\n\nAgent: I'm really sorry to hear that. Let me flag this with our manager and we'll follow up with you within 24 hours.\n\nCaller: I appreciate that." },
];

export default function CallLogs() {
  const [selectedCall, setSelectedCall] = useState<typeof calls[0] | null>(null);

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Call Logs</h1>
        <p className="text-muted-foreground mt-1">Review recent call activity and transcripts.</p>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="font-display text-lg">Recent Calls</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">Date</TableHead>
                <TableHead className="text-muted-foreground">Caller</TableHead>
                <TableHead className="text-muted-foreground">Duration</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-muted-foreground text-right">Transcript</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {calls.map((call) => (
                <TableRow key={call.id} className="border-border">
                  <TableCell className="text-sm">{call.date}</TableCell>
                  <TableCell className="font-mono text-sm">{call.caller}</TableCell>
                  <TableCell className="text-sm">{call.duration}</TableCell>
                  <TableCell>
                    <Badge
                      variant={call.status === "Completed" ? "default" : "destructive"}
                      className={
                        call.status === "Completed"
                          ? "bg-success/15 text-success border-0 hover:bg-success/20"
                          : ""
                      }
                    >
                      {call.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedCall(call)}
                      className="text-primary hover:text-primary hover:bg-primary/10"
                    >
                      View Transcript
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!selectedCall} onOpenChange={() => setSelectedCall(null)}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">
              Call Transcript — {selectedCall?.caller}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-2 space-y-2 text-sm">
            <div className="flex gap-4 text-muted-foreground text-xs">
              <span>{selectedCall?.date}</span>
              <span>Duration: {selectedCall?.duration}</span>
            </div>
            <div className="bg-secondary rounded-lg p-4 whitespace-pre-line text-foreground leading-relaxed max-h-[300px] overflow-auto">
              {selectedCall?.transcript}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
