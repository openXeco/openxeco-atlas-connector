'use client'

import { useState, useEffect } from 'react'
import { Eye, EyeOff, RefreshCw, CheckCircle, XCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { apiClient } from '@/lib/api'

interface AtlasSettingsResponse {
  baseUrl: string
  apiKeyConfigured: boolean
  username: string
  passwordConfigured: boolean
}

interface AtlasFormState {
  baseUrl: string
  apiKey: string
  username: string
  password: string
}

export function AtlasApiTab() {
  const [settings, setSettings] = useState<AtlasFormState>({
    baseUrl: '',
    apiKey: '',
    username: '',
    password: '',
  })
  const [configStatus, setConfigStatus] = useState({
    apiKeyConfigured: false,
    passwordConfigured: false,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  // Visibility toggles
  const [showApiKey, setShowApiKey] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const loadSettings = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await apiClient.get<{ data: AtlasSettingsResponse }>('/api/settings/atlas')
      setSettings({
        baseUrl: response.data.baseUrl,
        apiKey: '',
        username: response.data.username,
        password: '',
      })
      setConfigStatus({
        apiKeyConfigured: response.data.apiKeyConfigured,
        passwordConfigured: response.data.passwordConfigured,
      })
    } catch (_err) {
      setError('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: TODO
  useEffect(() => {
    loadSettings()
  }, [])

  const handleChange = (field: keyof AtlasFormState, value: string) => {
    setSettings((prev) => ({ ...prev, [field]: value }))
    setTestResult(null)
    setSuccess(null)
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      // Only send fields that were actually filled in
      // Empty apiKey/password means "keep current value"
      const payload: Record<string, string> = {}
      if (settings.baseUrl) payload.baseUrl = settings.baseUrl
      if (settings.username) payload.username = settings.username
      if (settings.apiKey) payload.apiKey = settings.apiKey
      if (settings.password) payload.password = settings.password

      await apiClient.patch('/api/settings/atlas', payload)
      setSuccess('Settings saved successfully')

      // Update config status if new values were provided
      if (settings.apiKey) {
        setConfigStatus((prev) => ({ ...prev, apiKeyConfigured: true }))
        setSettings((prev) => ({ ...prev, apiKey: '' }))
      }
      if (settings.password) {
        setConfigStatus((prev) => ({ ...prev, passwordConfigured: true }))
        setSettings((prev) => ({ ...prev, password: '' }))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleTestConnection = async () => {
    setTesting(true)
    setTestResult(null)
    setError(null)

    try {
      // Send current form values for testing — backend falls back to stored values for empty fields
      const response = await apiClient.post<{ success: boolean; message: string }>('/api/settings/atlas/test', settings)
      setTestResult(response)
    } catch (err) {
      setTestResult({
        success: false,
        message: err instanceof Error ? err.message : 'Connection test failed',
      })
    } finally {
      setTesting(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className='py-8 text-center text-muted-foreground'>Loading settings...</CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>ATLAS API Configuration</CardTitle>
        <CardDescription>Configure the connection to the European Cybersecurity ATLAS API</CardDescription>
      </CardHeader>
      <CardContent className='space-y-6'>
        {error && <div className='rounded-md bg-destructive/10 p-4 text-sm text-destructive'>{error}</div>}

        {success && <div className='rounded-md bg-green-500/10 p-4 text-sm text-green-600'>{success}</div>}

        <div className='grid gap-4'>
          <div className='grid gap-2'>
            <Label htmlFor='baseUrl'>Base URL</Label>
            <Input
              id='baseUrl'
              type='url'
              value={settings.baseUrl}
              onChange={(e) => handleChange('baseUrl', e.target.value)}
              placeholder='https://api.atlas.example.com/jsonapi'
            />
          </div>

          <div className='grid gap-2'>
            <Label htmlFor='apiKey'>API Key</Label>
            <div className='relative'>
              <Input
                id='apiKey'
                type={showApiKey ? 'text' : 'password'}
                value={settings.apiKey}
                onChange={(e) => handleChange('apiKey', e.target.value)}
                placeholder={
                  configStatus.apiKeyConfigured ? 'Configured (leave blank to keep current)' : 'Enter API key'
                }
                className='pr-10'
              />
              <Button
                type='button'
                variant='ghost'
                size='icon'
                className='absolute right-0 top-0 h-full px-3'
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
              </Button>
            </div>
          </div>

          <div className='grid gap-2'>
            <Label htmlFor='username'>Username</Label>
            <Input
              id='username'
              type='text'
              value={settings.username}
              onChange={(e) => handleChange('username', e.target.value)}
              placeholder='Enter username'
            />
          </div>

          <div className='grid gap-2'>
            <Label htmlFor='password'>Password</Label>
            <div className='relative'>
              <Input
                id='password'
                type={showPassword ? 'text' : 'password'}
                value={settings.password}
                onChange={(e) => handleChange('password', e.target.value)}
                placeholder={
                  configStatus.passwordConfigured ? 'Configured (leave blank to keep current)' : 'Enter password'
                }
                className='pr-10'
              />
              <Button
                type='button'
                variant='ghost'
                size='icon'
                className='absolute right-0 top-0 h-full px-3'
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
              </Button>
            </div>
          </div>
        </div>

        {testResult && (
          <div
            className={`flex items-center gap-2 rounded-md p-4 text-sm ${
              testResult.success ? 'bg-green-500/10 text-green-600' : 'bg-destructive/10 text-destructive'
            }`}
          >
            {testResult.success ? <CheckCircle className='h-4 w-4' /> : <XCircle className='h-4 w-4' />}
            {testResult.message}
          </div>
        )}

        <div className='flex items-center gap-2'>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
          <Button variant='outline' onClick={handleTestConnection} disabled={testing} className='gap-2'>
            {testing ? <RefreshCw className='h-4 w-4 animate-spin' /> : <RefreshCw className='h-4 w-4' />}
            Test Connection
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
