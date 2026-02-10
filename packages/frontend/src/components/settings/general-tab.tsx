'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { apiClient } from '@/lib/api'

interface GeneralSettings {
  appName: string
  autoSyncOnPublish: boolean
  syncConflictResolution: 'manual' | 'local_wins' | 'remote_wins'
}

export function GeneralTab() {
  const [settings, setSettings] = useState<GeneralSettings>({
    appName: 'ATLAS Connector',
    autoSyncOnPublish: false,
    syncConflictResolution: 'manual',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const loadSettings = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await apiClient.get<{ data: GeneralSettings }>('/api/settings/general')
      setSettings(response.data)
    } catch (_err) {
      setError('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSettings()
  }, [])

  const handleChange = <K extends keyof GeneralSettings>(field: K, value: GeneralSettings[K]) => {
    setSettings((prev) => ({ ...prev, [field]: value }))
    setSuccess(null)
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      await apiClient.patch('/api/settings/general', settings)
      setSuccess('Settings saved successfully')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">Loading settings...</CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>General Settings</CardTitle>
        <CardDescription>Configure general application behavior and preferences</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}

        {success && <div className="rounded-md bg-green-500/10 p-4 text-sm text-green-600">{success}</div>}

        <div className="grid gap-6">
          <div className="grid gap-2">
            <Label htmlFor="appName">Application Name</Label>
            <Input
              id="appName"
              type="text"
              value={settings.appName}
              onChange={(e) => handleChange('appName', e.target.value)}
              placeholder="ATLAS Connector"
            />
            <p className="text-sm text-muted-foreground">Displayed in the header and browser title</p>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="autoSync">Auto-sync on Publish</Label>
              <p className="text-sm text-muted-foreground">
                Automatically sync entities to ATLAS when status changes to published
              </p>
            </div>
            <Switch
              id="autoSync"
              checked={settings.autoSyncOnPublish}
              onCheckedChange={(checked) => handleChange('autoSyncOnPublish', checked)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="conflictResolution">Sync Conflict Resolution</Label>
            <Select
              value={settings.syncConflictResolution}
              onValueChange={(value) =>
                handleChange('syncConflictResolution', value as GeneralSettings['syncConflictResolution'])
              }
            >
              <SelectTrigger id="conflictResolution">
                <SelectValue placeholder="Select resolution strategy" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Manual - Review each conflict</SelectItem>
                <SelectItem value="local_wins">Local Wins - Keep local changes</SelectItem>
                <SelectItem value="remote_wins">Remote Wins - Accept remote changes</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              How to handle conflicts when local and remote data differ during sync
            </p>
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </CardContent>
    </Card>
  )
}
