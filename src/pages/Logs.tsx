import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, Filter } from "lucide-react";
import { toast } from "sonner";

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
}

export default function Logs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [searchFilter, setSearchFilter] = useState<string>("");

  const fetchLogs = async () => {
    try {
      const fetchedLogs = await invoke<LogEntry[]>("get_logs");
      setLogs(fetchedLogs);
    } catch (error) {
      console.error("Failed to fetch logs:", error);
      toast.error(`Failed to fetch logs: ${error}`);
    }
  };

  const clearLogs = async () => {
    try {
      await invoke("clear_logs");
      setLogs([]);
      toast.success("Logs cleared successfully");
    } catch (error) {
      console.error("Failed to clear logs:", error);
      toast.error(`Failed to clear logs: ${error}`);
    }
  };

  useEffect(() => {
    fetchLogs();
    // Set up an interval to fetch logs every 2 seconds
    const interval = setInterval(fetchLogs, 2000);
    return () => clearInterval(interval);
  }, []);

  const getLogIcon = (level: string) => {
    switch (level.toLowerCase()) {
      case 'debug':
        return '🐛';
      case 'info':
        return 'ℹ';
      case 'warning':
        return '⚠️';
      case 'error':
        return '✗';
      default:
        return '•';
    }
  };

  const getLogColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'debug':
        return 'text-gray-500 dark:text-gray-400';
      case 'info':
        return 'text-blue-600 dark:text-blue-400';
      case 'warning':
        return 'text-yellow-500 dark:text-yellow-400';
      case 'error':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const filteredLogs = logs.filter(log => {
    // Priority-based level filtering
    const levelPriority: Record<string, number> = {
      'debug': 0,
      'info': 1,
      'warning': 2,
      'error': 3
    };
    
    const logLevel = log.level.toLowerCase();
    const selectedLevel = levelFilter.toLowerCase();
    
    const matchesLevel = levelFilter === "all" || 
      (levelPriority[logLevel] !== undefined && 
       levelPriority[selectedLevel] !== undefined &&
       levelPriority[logLevel] >= levelPriority[selectedLevel]);
    
    const matchesSearch = searchFilter === "" || 
      log.message.toLowerCase().includes(searchFilter.toLowerCase()) ||
      log.timestamp.toLowerCase().includes(searchFilter.toLowerCase());
    return matchesLevel && matchesSearch;
  });

  return (
    <div className="h-[calc(100vh-4.1rem)] flex flex-col p-6">
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-shrink-0 mb-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Application Logs</h1>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span className="text-sm font-medium">Filters:</span>
              </div>
              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="debug">Debug</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="Search logs..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-64"
              />
              <Button
                onClick={clearLogs}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Clear
              </Button>
            </div>
          </div>
        </div>
        <div className="flex-1 flex flex-col min-h-0">
          <div className="mb-4 text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">
            Showing {filteredLogs.length} of {logs.length} logs
          </div>
          <ScrollArea className="flex-1 w-full rounded-md border min-h-0">
            <div className="p-0">
              {logs.length === 0 ? (
                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                  No logs available. Try using the debugger to generate some logs.
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                  No logs match the current filters.
                </div>
              ) : (
                filteredLogs.slice().reverse().map((log, index) => (
                  <div key={index} className="flex items-start gap-2 px-3 py-2 border-b hover:bg-gray-50 dark:hover:bg-gray-900">
                    <div className="text-xs text-gray-500 dark:text-neutral-400 font-mono shrink-0 min-w-0">
                      {log.timestamp}
                    </div>
                    <div className={`text-sm ${getLogColor(log.level)} min-w-0 flex-1`}>
                      {log.message.match(/^[✓✗ℹ•]/) ? log.message : `${getLogIcon(log.level)} ${log.message}`}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
} 