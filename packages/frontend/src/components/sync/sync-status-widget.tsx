'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowUpCircle, ArrowDownCircle, AlertTriangle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api';
import type { Entity } from '@/types/entity';

interface SyncStatusWidgetProps {
  onRefresh?: () => void;
}

export function SyncStatusWidget({ onRefresh }: SyncStatusWidgetProps) {
  const router = useRouter();
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);

  const loadEntities = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get<{ data: Entity[] }>('/api/entities?limit=100');
      setEntities(response.data);
    } catch (err) {
      console.error('Failed to load entities:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEntities();
  }, []);

  const localEntities = entities.filter((e) => e.syncStatus === 'local');
  const conflictEntities = entities.filter((e) => e.syncStatus === 'conflict');
  const failedEntities = entities.filter((e) => e.syncStatus === 'failed');

  const handleViewEntity = (id: string) => {
    router.push(`/entities/${id}`);
  };

  const getSyncStatusColor = (syncStatus: string) => {
    switch (syncStatus) {
      case 'synced':
        return 'bg-green-500/10 text-green-700';
      case 'local':
        return 'bg-gray-500/10 text-gray-700';
      case 'conflict':
        return 'bg-orange-500/10 text-orange-700';
      case 'failed':
        return 'bg-red-500/10 text-red-700';
      default:
        return 'bg-gray-500/10 text-gray-700';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex h-64 items-center justify-center">
          <div className="text-muted-foreground">Loading sync status...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {localEntities.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ArrowUpCircle className="h-5 w-5 text-yellow-600" />
                  Local Entities ({localEntities.length})
                </CardTitle>
                <CardDescription>
                  These entities have not been synced to ATLAS yet
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {localEntities.slice(0, 5).map((entity) => (
                <div
                  key={entity.id}
                  className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent"
                >
                  <div className="flex-1">
                    <div className="font-medium">{entity.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Created {new Date(entity.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className={getSyncStatusColor(entity.syncStatus)}>
                      {entity.syncStatus}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewEntity(entity.id)}
                    >
                      View
                    </Button>
                  </div>
                </div>
              ))}
              {localEntities.length > 5 && (
                <div className="pt-2 text-center text-sm text-muted-foreground">
                  And {localEntities.length - 5} more...
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {conflictEntities.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  Conflicts ({conflictEntities.length})
                </CardTitle>
                <CardDescription>
                  These entities have conflicts that need to be resolved
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {conflictEntities.map((entity) => (
                <div
                  key={entity.id}
                  className="flex items-center justify-between rounded-lg border border-orange-200 bg-orange-50/50 p-3"
                >
                  <div className="flex-1">
                    <div className="font-medium">{entity.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Last updated {new Date(entity.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className={getSyncStatusColor(entity.syncStatus)}>
                      {entity.syncStatus}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewEntity(entity.id)}
                    >
                      Resolve
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {failedEntities.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  Failed Syncs ({failedEntities.length})
                </CardTitle>
                <CardDescription>
                  These entities failed to sync with ATLAS
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {failedEntities.map((entity) => (
                <div
                  key={entity.id}
                  className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50/50 p-3"
                >
                  <div className="flex-1">
                    <div className="font-medium">{entity.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Last sync attempt {entity.lastSyncedAt ? new Date(entity.lastSyncedAt).toLocaleDateString() : 'Never'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className={getSyncStatusColor(entity.syncStatus)}>
                      {entity.syncStatus}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewEntity(entity.id)}
                    >
                      Retry
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {localEntities.length === 0 && conflictEntities.length === 0 && failedEntities.length === 0 && (
        <Card>
          <CardContent className="flex h-64 flex-col items-center justify-center gap-2">
            <CheckCircle className="h-12 w-12 text-green-600" />
            <div className="text-lg font-medium">All entities are synced!</div>
            <p className="text-sm text-muted-foreground">
              There are no pending syncs, conflicts, or failures
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
