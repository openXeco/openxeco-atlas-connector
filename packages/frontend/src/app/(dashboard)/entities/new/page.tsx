'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { EntityFormWizard } from '@/components/entities/entity-form-wizard';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api';
import type { EntityFormData } from '@/types/entity';

export default function NewEntityPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: EntityFormData) => {
    setError(null);
    try {
      const response = await apiClient.post<{ data: { id: string } }>('/entities', data);
      router.push(`/entities/${response.data.id}`);
    } catch (err) {
      setError('Failed to create entity');
      throw err;
    }
  };

  const handleCancel = () => {
    router.push('/entities');
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
                onClick={() => router.push('/entities')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Create New Entity</h2>
                <p className="text-muted-foreground">
                  Add a new cluster entity to the system
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-6 rounded-md bg-destructive/10 p-4 text-sm text-destructive">
                {error}
              </div>
            )}

            <EntityFormWizard onSubmit={handleSubmit} onCancel={handleCancel} />
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
