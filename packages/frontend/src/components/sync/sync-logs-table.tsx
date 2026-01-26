'use client';

import { useState, useEffect } from 'react';
import { Calendar, Filter } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { apiClient } from '@/lib/api';

interface SyncLog {
  id: string;
  entityType: string;
  entityId: string | null;
  operation: string;
  status: string;
  details: any;
  createdAt: Date;
}

export function SyncLogsTable() {
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    operation: 'all',
    status: 'all',
  });

  const loadLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.operation !== 'all') params.append('operation', filters.operation);
      if (filters.status !== 'all') params.append('status', filters.status);

      const response = await apiClient.get<{ data: SyncLog[] }>(
        `/api/sync/logs?${params.toString()}`
      );
      setLogs(response.data);
    } catch (err) {
      console.error('Failed to load sync logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [filters]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-500/10 text-green-700';
      case 'failed':
        return 'bg-red-500/10 text-red-700';
      default:
        return 'bg-gray-500/10 text-gray-700';
    }
  };

  const getOperationIcon = (operation: string) => {
    switch (operation) {
      case 'push':
        return '↑';
      case 'pull':
        return '↓';
      case 'sync':
        return '⟳';
      default:
        return '•';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Sync History</CardTitle>
            <CardDescription>
              View all synchronization operations and their results
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={filters.operation}
              onValueChange={(value) => setFilters({ ...filters, operation: value })}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Operation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ops</SelectItem>
                <SelectItem value="push">Push</SelectItem>
                <SelectItem value="pull">Pull</SelectItem>
                <SelectItem value="sync">Sync</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.status}
              onValueChange={(value) => setFilters({ ...filters, status: value })}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="icon" onClick={loadLogs}>
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="text-muted-foreground">Loading logs...</div>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-2">
            <Calendar className="h-12 w-12 text-muted-foreground" />
            <div className="text-lg font-medium">No sync logs found</div>
            <p className="text-sm text-muted-foreground">
              Sync operations will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-lg">
                    {getOperationIcon(log.operation)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium capitalize">{log.operation}</span>
                      <Badge variant="secondary" className={getStatusColor(log.status)}>
                        {log.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {log.entityType} {log.entityId ? `• ${log.entityId.slice(0, 8)}...` : ''}
                    </div>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {new Date(log.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
