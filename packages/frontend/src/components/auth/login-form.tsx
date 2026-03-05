import { AlertCircle } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { UseFormReturn } from 'react-hook-form'
import { LoginFormData } from '@/lib/auth'

type LoginFormProps = {
  error: string | null
  isLoading: boolean
  formHandler: UseFormReturn<LoginFormData>
  onSubmit: (data: LoginFormData) => Promise<void>
}

export const LoginForm = ({
  error,
  isLoading,
  formHandler: {
    register,
    formState: { errors },
    handleSubmit,
  },
  onSubmit = async (data: LoginFormData) => console.log(data),
}: LoginFormProps) => {
  return (
    <form method="POST" onSubmit={handleSubmit(onSubmit)} className={'space-y-4'}>
      {error && (
        <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="admin@atlas-connector.local"
          {...register('email')}
          disabled={isLoading}
        />
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="Enter your password"
          {...register('password')}
          disabled={isLoading}
        />
        {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Signing in...' : 'Sign in'}
      </Button>
    </form>
  )
}
