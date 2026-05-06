import { GeneralTab } from '@/components/settings/general-tab'

export const dynamic = 'force-dynamic'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { UsersTab } from '@/components/settings/users-tab'
import { Badge } from '@/components/ui/badge'

export default async function SettingsPage() {
  return (
    <>
      <div className='mb-8'>
        <h2 className='text-2xl font-bold tracking-tight'>Settings</h2>
        <p className='text-muted-foreground'>Manage users, API configuration, and application settings</p>
        <Badge className={'my-4'} variant='outline'>
          &ldquo;ATLAS API&rdquo; and &ldquo;General&rdquo; tabs available soon...
        </Badge>
      </div>

      <Tabs defaultValue='users' className='space-y-6'>
        <TabsList>
          <TabsTrigger value='users'>Users</TabsTrigger>
          <TabsTrigger value='general' disabled={false}>
            General
          </TabsTrigger>
          <TabsTrigger value='atlas' disabled={true}>
            ATLAS API
          </TabsTrigger>
        </TabsList>

        <TabsContent value='users'>
          <UsersTab />
        </TabsContent>

        <TabsContent value='general'>
          <GeneralTab />
        </TabsContent>

        <TabsContent value='atlas'>
          <>Coming soon...</>
        </TabsContent>
      </Tabs>
    </>
  )
}
