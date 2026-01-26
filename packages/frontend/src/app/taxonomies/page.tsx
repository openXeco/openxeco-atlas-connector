'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, Database, Clock, ChevronRight } from 'lucide-react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api';
import { TAXONOMY_TYPES, type TaxonomyTypeInfo } from '@/types/taxonomy';

interface TaxonomyStats {
  type: string;
  count: number;
}

export default function TaxonomiesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);

  const loadStats = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const counts: Record<string, number> = {};
      
      for (const taxonomyType of TAXONOMY_TYPES) {
        try {
          const response = await apiClient.get<{ data: unknown[]; meta: { count: number } }>(
            `/api/taxonomies/${taxonomyType.type}`
          );
          counts[taxonomyType.type] = response.meta?.count || response.data?.length || 0;
        } catch (err) {
          counts[taxonomyType.type] = 0;
        }
      }
      
      setStats(counts);
    } catch (err) {
      setError('Failed to load taxonomy statistics');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncAll = async () => {
    setSyncing(true);
    setError(null);
    
    try {
      await apiClient.post('/api/taxonomies/sync', {});
      await loadStats();
    } catch (err) {
      setError('Failed to sync taxonomies from ATLAS');
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const totalTerms = Object.values(stats).reduce((sum, count) => sum + count, 0);

  return (
    <ProtectedRoute>
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex flex-1 flex-col">
          <Header />
          <main className="flex-1 overflow-auto bg-muted/30 p-6">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Taxonomies</h2>
                <p className="text-muted-foreground">
                  Manage taxonomy terms from ATLAS API
                </p>
              </div>
              <Button
                onClick={handleSyncAll}
                disabled={syncing || loading}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Syncing...' : 'Sync All from ATLAS'}
              </Button>
            </div>

            {error && (
              <div className="mb-6 rounded-md bg-destructive/10 p-4 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="mb-6 grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Types</CardTitle>
                  <Database className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{TAXONOMY_TYPES.length}</div>
                  <p className="text-xs text-muted-foreground">Taxonomy categories</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Terms</CardTitle>
                  <Database className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {loading ? '...' : totalTerms.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">Across all types</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Last Sync</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">Recently</div>
                  <p className="text-xs text-muted-foreground">From ATLAS API</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {TAXONOMY_TYPES.map((taxonomyType) => (
                <Card
                  key={taxonomyType.type}
                  className="cursor-pointer transition-colors hover:bg-accent"
                  onClick={() => router.push(`/taxonomies/${taxonomyType.type}`)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{taxonomyType.label}</CardTitle>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <CardDescription className="text-sm">
                      {taxonomyType.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Terms:</span>
                      <span className="text-lg font-semibold">
                        {loading ? '...' : (stats[taxonomyType.type] || 0).toLocaleString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
