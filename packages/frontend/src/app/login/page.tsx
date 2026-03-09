'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/contexts/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LoginForm } from '@/components/auth/login-form'
import oxeLogo from '@/assets/openxeco-logo.svg'
import Image from 'next/image'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const { login } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)


  const formHandler = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (data: LoginFormData) => {
    setError(null)
    setIsLoading(true)

    try {
      await login(data.email, data.password)
    } catch (_err) {
      setError('Invalid email or password. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl">
            <Image src={oxeLogo} className="w-8/12 m-auto my-0 p-0" alt={'openXeco logo'} />
            ATLAS Connector
          </CardTitle>
          <CardDescription>Sign in to your account to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm error={error} isLoading={isLoading} formHandler={formHandler} onSubmit={onSubmit} />
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
