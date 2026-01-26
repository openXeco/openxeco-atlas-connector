'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { EntityFormWizard } from '@/components/entities/entity-form-wizard';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api';
import type { Entity, EntityFormData } from '@/types/entity';

export default function EditEntityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [entity, setEntity] = useState<Entity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadEntity = async () => {
      try {
        const response = await apiClient.get<{ data: Entity }>(
          `/api/entities/${resolvedParams.id}`
        );
        setEntity(response.data);
      } catch (err) {
        setError('Failed to load entity');
      } finally {
        setLoading(false);
      }
    };
    loadEntity();
  }, [resolvedParams.id]);

  const handleSubmit = async (data: EntityFormData) => {
    setError(null);
    try {
      await apiClient.patch(`/api/entities/${resolvedParams.id}`, data);
      router.push(`/entities/${resolvedParams.id}`);
    } catch (err) {
      setError('Failed to update entity');
      throw err;
    }
  };

  const handleCancel = () => {
    router.push(`/entities/${resolvedParams.id}`);
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="flex h-screen">
          <Sidebar />
          <div className="flex flex-1 flex-col">
            <Header />
            <main className="flex flex-1 items-center justify-center">
              <div className="text-muted-foreground">Loading entity...</div>
            </main>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!entity) {
    return (
      <ProtectedRoute>
        <div className="flex h-screen">
          <Sidebar />
          <div className="flex flex-1 flex-col">
            <Header />
            <main className="flex flex-1 items-center justify-center">
              <div className="text-center">
                <h2 className="text-2xl font-bold">Entity not found</h2>
                <Button onClick={() => router.push('/entities')} className="mt-4">
                  Back to Entities
                </Button>
              </div>
            </main>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const initialData: Partial<EntityFormData> = {
    name: entity.name,
    description: entity.description || undefined,
    website: entity.website || undefined,
    logoUrl: entity.logoUrl || undefined,
    address: entity.address || undefined,
    latitude: entity.latitude ? parseFloat(entity.latitude) : undefined,
    longitude: entity.longitude ? parseFloat(entity.longitude) : undefined,
    countryId: entity.countryId || undefined,
    clusterTypeId: entity.clusterTypeId || undefined,
    legalStatusId: entity.legalStatusId || undefined,
    organizationTypeId: entity.organizationTypeId || undefined,
  };

  return (
    <ProtectedRoute>
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex flex-1 flex-col">
          <Header />
          <main className="flex-1 overflow-auto bg-muted/30 p-6">
            <div className="mb-6 flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push(`/entities/${resolvedParams.id}`)}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Edit Entity</h2>
                <p className="text-muted-foreground">Update entity information</p>
              </div>
            </div>

            {error && (
              <div className="mb-6 rounded-md bg-destructive/10 p-4 text-sm text-destructive">
                {error}
              </div>
            )}

            <EntityFormWizard
              initialData={initialData}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
            />
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
