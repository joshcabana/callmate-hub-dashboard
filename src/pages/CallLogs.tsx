import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, isAfter, isBefore, startOfDay, endOfDay } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { AlertCircle, Inbox, Download, Search, CalendarIcon, X, Filter } from "lucide-react";
import { fetchCallLogs, type CallLog } from "@/lib/supabase";
import { cn } from "@/lib/utils";

function exportToCSV(calls: CallLog[]) {
  const headers = ["Date", "Caller", "Caller Name", "Callback", "Intent", "Summary"];
  const rows = calls.map((c) => [
    format(new Date(c.created_at), "yyyy-MM-dd HH:mm"),
    c.caller_number || "Unknown",
    c.caller_name || "",
    c.callback_number || "",
    c.intent_detected || "",
    (c.summary || "").replace(/,/g, ";").replace(/\n/g, " "),
  ]);
  const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `callmate-logs-${format(new Date(), "yyyy-MM-dd")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function CallLogs() {
  const [selectedCall, setSelectedCall] = useState<CallLog | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [intentFilter, setIntentFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  const {
    data: calls = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["call_logs"],
    queryFn: fetchCallLogs,
    refetchInterval: 30_000,
  });

  // Extract unique intents for the filter dropdown
  const uniqueIntents = useMemo(() => {
    const intents = new Set<string>();
    calls.forEach((c) => {
      if (c.intent_detected) intents.add(c.intent_detected);
    });
    return Array.from(intents).sort();
  }, [calls]);

  // Apply filters
  const filteredCalls = useMemo(() => {
    return calls.filter((call) => {
      // Text search — matches caller name, number, or summary
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesName = call.caller_name?.toLowerCase().includes(q);
        const matchesNumber = call.caller_number?.toLowerCase().includes(q);
        const matchesSummary = call.summary?.toLowerCase().includes(q);
        if (!matchesName && !matchesNumber && !matchesSummary) return false;
      }

      // Intent filter
      if (intentFilter !== "all" && call.intent_detected !== intentFilter) {
        return false;
      }

      // Date range
      const callDate = new Date(call.created_at);
      if (dateFrom && isBefore(callDate, startOfDay(dateFrom))) return false;
      if (dateTo && isAfter(callDate, endOfDay(dateTo))) return false;

      return true;
    });
  }, [calls, searchQuery, intentFilter, dateFrom, dateTo]);

  const hasActiveFilters = searchQuery || intentFilter !== "all" || dateFrom || dateTo;

  const clearFilters = () => {
    setSearchQuery("");
    setIntentFilter("all");
    setDateFrom(undefined);
    setDateTo(undefined);
  };

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
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Call Logs</h1>
          <p className="text-muted-foreground mt-1">Review recent call activity and transcripts.</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => exportToCSV(filteredCalls)}
          className="gap-1.5"
        >
          <Download className="h-3.5 w-3.5" />
          Export CSV
        </Button>
      </div>

      {/* ── Filters ─────────────────────────────────────────────── */}
      <Card className="bg-card border-border">
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-col gap-3">
            {/* Search bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, number, or summary..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-secondary border-border"
              />
            </div>

            {/* Filter row */}
            <div className="flex flex-wrap items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground shrink-0" />

              {/* Intent filter */}
              <Select value={intentFilter} onValueChange={setIntentFilter}>
                <SelectTrigger className="w-[180px] bg-secondary border-border h-9 text-sm">
                  <SelectValue placeholder="All Intents" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="all">All Intents</SelectItem>
                  {uniqueIntents.map((intent) => (
                    <SelectItem key={intent} value={intent}>
                      {intent}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Date From */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "h-9 text-sm gap-1.5 bg-secondary border-border",
                      !dateFrom && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="h-3.5 w-3.5" />
                    {dateFrom ? format(dateFrom, "d MMM yyyy") : "From"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={setDateFrom}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>

              {/* Date To */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "h-9 text-sm gap-1.5 bg-secondary border-border",
                      !dateTo && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="h-3.5 w-3.5" />
                    {dateTo ? format(dateTo, "d MMM yyyy") : "To"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateTo}
                    onSelect={setDateTo}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>

              {/* Clear filters */}
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="h-9 text-xs text-muted-foreground hover:text-foreground gap-1"
                >
                  <X className="h-3.5 w-3.5" />
                  Clear filters
                </Button>
              )}

              {/* Result count */}
              <span className="ml-auto text-xs text-muted-foreground">
                {filteredCalls.length} of {calls.length} calls
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Results ─────────────────────────────────────────────── */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="font-display text-lg">
            {hasActiveFilters ? "Filtered Results" : "Recent Calls"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredCalls.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Search className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="font-display font-semibold">No matching calls</p>
              <p className="text-muted-foreground text-sm mt-1">
                Try adjusting your search or filters.
              </p>
              <Button variant="outline" size="sm" onClick={clearFilters} className="mt-4 gap-1.5">
                <X className="h-3.5 w-3.5" />
                Clear all filters
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Date</TableHead>
                  <TableHead className="text-muted-foreground">Caller</TableHead>
                  <TableHead className="text-muted-foreground hidden md:table-cell">Intent</TableHead>
                  <TableHead className="text-muted-foreground hidden lg:table-cell">Summary</TableHead>
                  <TableHead className="text-muted-foreground text-right">Transcript</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCalls.map((call) => (
                  <TableRow key={call.id} className="border-border">
                    <TableCell className="text-sm whitespace-nowrap">
                      {format(new Date(call.created_at), "d MMM yyyy, HH:mm")}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        {call.caller_name && (
                          <span className="text-sm font-medium">{call.caller_name}</span>
                        )}
                        <span className="font-mono text-xs text-muted-foreground">
                          {call.caller_number || "Unknown"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {call.intent_detected ? (
                        <Badge variant="outline" className="text-xs font-normal">
                          {call.intent_detected}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[280px] truncate hidden lg:table-cell">
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
                        {call.transcript ? "View" : "—"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedCall} onOpenChange={() => setSelectedCall(null)}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">
              Call Details — {selectedCall?.caller_name || selectedCall?.caller_number || "Unknown Caller"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex gap-4 text-muted-foreground text-xs mt-1">
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

          <Tabs defaultValue="transcript" className="mt-3">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="transcript">Transcript</TabsTrigger>
              <TabsTrigger value="extracted">Extracted Data</TabsTrigger>
            </TabsList>

            <TabsContent value="transcript" className="space-y-3 mt-3">
              {selectedCall?.summary && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                  <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">
                    AI Summary
                  </p>
                  <p className="text-foreground text-sm leading-relaxed">{selectedCall.summary}</p>
                </div>
              )}
              <div className="bg-secondary rounded-lg p-4 whitespace-pre-line text-sm text-foreground leading-relaxed max-h-[300px] overflow-auto">
                {selectedCall?.transcript || "No transcript available."}
              </div>
            </TabsContent>

            <TabsContent value="extracted" className="mt-3">
              <div className="space-y-3">
                {[
                  { label: "Caller Name", value: selectedCall?.caller_name },
                  { label: "Callback Number", value: selectedCall?.callback_number },
                  { label: "Intent Detected", value: selectedCall?.intent_detected },
                  { label: "Call ID", value: selectedCall?.call_id },
                ].map((field) => (
                  <div key={field.label} className="flex justify-between items-center border-b border-border pb-2">
                    <span className="text-sm text-muted-foreground">{field.label}</span>
                    <span className="text-sm font-medium font-mono">
                      {field.value || "—"}
                    </span>
                  </div>
                ))}
                {selectedCall?.recording_url && (
                  <div className="pt-2">
                    <a
                      href={selectedCall.recording_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      🎧 Listen to Recording
                    </a>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
