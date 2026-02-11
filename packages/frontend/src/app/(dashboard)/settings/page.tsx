'use client'

import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { UsersTab } from '@/components/settings/users-tab'
import { AtlasApiTab } from '@/components/settings/atlas-api-tab'
import { GeneralTab } from '@/components/settings/general-tab'

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex flex-1 flex-col">
          <Header />
          <main className="flex-1 overflow-auto bg-muted/30 p-6">
            <div className="mb-8">
              <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
              <p className="text-muted-foreground">Manage users, API configuration, and application settings</p>
            </div>

            <Tabs defaultValue="users" className="space-y-6">
              <TabsList>
                <TabsTrigger value="users">Users</TabsTrigger>
                <TabsTrigger value="atlas">ATLAS API</TabsTrigger>
                <TabsTrigger value="general">General</TabsTrigger>
              </TabsList>

              <TabsContent value="users">
                <UsersTab />
              </TabsContent>

              <TabsContent value="atlas">
                <AtlasApiTab />
              </TabsContent>

              <TabsContent value="general">
                <GeneralTab />
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
