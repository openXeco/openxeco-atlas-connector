'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, RefreshCw, Search } from 'lucide-react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { EntityDataTable } from '@/components/entities/entity-data-table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiClient } from '@/lib/api';
import type { Entity, EntityListParams } from '@/types/entity';

export default function EntitiesPage() {
  const router = useRouter();
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, _setFilters] = useState<EntityListParams>({
    page: 1,
    limit: 10,
  });

  const loadEntities = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.status) params.append('status', filters.status);
      if (filters.syncStatus) params.append('syncStatus', filters.syncStatus);

      const response = await apiClient.get<{ data: Entity[] }>(
        `/api/entities?${params.toString()}`
      );
      setEntities(response.data);
    } catch (_err) {
      setError('Failed to load entities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEntities();
  }, [filters]);

  const handleCreateNew = () => {
    router.push('/entities/new');
  };

  const handleRefresh = () => {
    loadEntities();
  };

  const handleViewEntity = (id: string) => {
    router.push(`/entities/${id}`);
  };

  const handleEditEntity = (id: string) => {
    router.push(`/entities/${id}/edit`);
  };

  const handleDeleteEntity = async (id: string) => {
    if (!confirm('Are you sure you want to delete this entity?')) return;

    try {
      await apiClient.delete(`/api/entities/${id}`);
      await loadEntities();
    } catch (_err) {
      setError('Failed to delete entity');
    }
  };

  const filteredEntities = entities.filter((entity) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      entity.name.toLowerCase().includes(query) || entity.description?.toLowerCase().includes(query)
    );
  });

  return (
    <ProtectedRoute>
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex flex-1 flex-col">
          <Header />
          <main className="flex-1 overflow-auto bg-muted/30 p-6">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Entities</h2>
                <p className="text-muted-foreground">Manage cluster entities and sync with ATLAS</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={handleRefresh} disabled={loading}>
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
                <Button onClick={handleCreateNew} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Entity
                </Button>
              </div>
            </div>

            {error && (
              <div className="mb-6 rounded-md bg-destructive/10 p-4 text-sm text-destructive">
                {error}
              </div>
            )}

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>All Entities</CardTitle>
                    <CardDescription>{filteredEntities.length} entities found</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Search entities..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-64 pl-9"
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <EntityDataTable
                  data={filteredEntities}
                  loading={loading}
                  onView={handleViewEntity}
                  onEdit={handleEditEntity}
                  onDelete={handleDeleteEntity}
                />
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
