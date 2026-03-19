'use client'

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import Image from 'next/image'
import oxeLogo from '@/assets/openxeco-logo.svg'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useActionState, useEffect } from 'react'
import { login } from '@/app/actions/auth'
import { AlertCircle } from 'lucide-react'
import { redirect } from 'next/navigation'

export const LoginForm = () => {
  const [state, formAction, pending] = useActionState(login, undefined)

  useEffect(() => {
    if (state?.success === true) {
      redirect('/')
    }
  }, [state])

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl">
            <Image src={oxeLogo} className="w-8/12 m-auto my-0 p-0" alt={'openXeco logo'} loading={'eager'} />
            ATLAS Connector
          </CardTitle>
          <CardDescription>Sign in to your account to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className={'space-y-4'}>
            {!state?.success && state?.error && (
              <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span>{state.error}</span>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@atlas-connector.local"
                defaultValue={state?.email}
                name={'email'}
                disabled={pending}
                required={true}
              />
              {!state?.success && state?.fieldErrors?.email && (
                <p className="text-sm text-destructive">{state?.fieldErrors.email.join(' ')}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                name={'password'}
                disabled={pending}
                required={true}
              />
              {!state?.success && state?.fieldErrors?.password && (
                <p className="text-sm text-destructive">{state?.fieldErrors.password.join(' ')}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? 'Signing in...' : 'Sign-in'}
            </Button>
          </form>
          {process.env.NODE_ENV !== 'production' ? (
            <div className="mt-6 text-center text-sm text-muted-foreground">
              <p>Default credentials:</p>
              <p className="font-mono">admin@atlas-connector.local / admin123456</p>
            </div>
          ) : undefined}
        </CardContent>
      </Card>
    </div>
  )
}
