import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
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
import { AlertCircle, Inbox } from "lucide-react";
import { fetchCallLogs, type CallLog } from "@/lib/supabase";

export default function CallLogs() {
  const [selectedCall, setSelectedCall] = useState<CallLog | null>(null);

  const {
    data: calls = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["call_logs"],
    queryFn: fetchCallLogs,
    refetchInterval: 30_000, // Auto-refresh every 30 seconds
  });

  // ── Loading Skeleton ───────────────────────────────────────────
  if (isLoading) {
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
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="h-4 w-36 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-16 animate-pulse rounded bg-muted" />
                  <div className="ml-auto h-8 w-28 animate-pulse rounded bg-muted" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // ── Error State ────────────────────────────────────────────────
  if (isError) {
    return (
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Call Logs</h1>
          <p className="text-muted-foreground mt-1">Review recent call activity and transcripts.</p>
        </div>
        <Card className="bg-destructive/10 border-destructive/30">
          <CardContent className="flex items-center gap-3 pt-6">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
            <div>
              <p className="font-medium text-destructive">Failed to load call logs</p>
              <p className="text-sm text-muted-foreground mt-1">
                {error instanceof Error ? error.message : "An unexpected error occurred. Please try again."}
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // ── Empty State ────────────────────────────────────────────────
  if (calls.length === 0) {
    return (
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Call Logs</h1>
          <p className="text-muted-foreground mt-1">Review recent call activity and transcripts.</p>
        </div>
        <Card className="bg-card border-border">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Inbox className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="font-display font-semibold text-lg">No calls yet</p>
            <p className="text-muted-foreground text-sm mt-1 max-w-sm">
              When your AI receptionist takes its first call, the transcript and summary will appear here automatically.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // ── Data Table ─────────────────────────────────────────────────
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
                <TableHead className="text-muted-foreground">Summary</TableHead>
                <TableHead className="text-muted-foreground text-right">Transcript</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {calls.map((call) => (
                <TableRow key={call.id} className="border-border">
                  <TableCell className="text-sm whitespace-nowrap">
                    {format(new Date(call.created_at), "d MMM yyyy, HH:mm")}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {call.caller_number || "Unknown"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[300px] truncate">
                    {call.summary || "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedCall(call)}
                      className="text-primary hover:text-primary hover:bg-primary/10"
                      disabled={!call.transcript}
                    >
                      {call.transcript ? "View Transcript" : "No Transcript"}
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
              Call Transcript — {selectedCall?.caller_number || "Unknown Caller"}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-2 space-y-3 text-sm">
            <div className="flex gap-4 text-muted-foreground text-xs">
              <span>
                {selectedCall?.created_at
                  ? format(new Date(selectedCall.created_at), "d MMM yyyy, HH:mm")
                  : ""}
              </span>
              {selectedCall?.intent_detected && (
                <Badge variant="outline" className="text-xs">
                  {selectedCall.intent_detected}
                </Badge>
              )}
            </div>

            {selectedCall?.summary && (
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">
                  AI Summary
                </p>
                <p className="text-foreground leading-relaxed">{selectedCall.summary}</p>
              </div>
            )}

            <div className="bg-secondary rounded-lg p-4 whitespace-pre-line text-foreground leading-relaxed max-h-[300px] overflow-auto">
              {selectedCall?.transcript || "No transcript available."}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
