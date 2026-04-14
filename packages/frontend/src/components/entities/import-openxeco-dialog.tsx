/**
 * @TODO
 */

'use client'

import { useState } from 'react'
import { Download, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { apiClient } from '@/lib/api'
import type { EntityFormData } from '@/types'

interface ImportResult {
  data: {
    entity: Partial<EntityFormData>
    questionsCount: number
    answersCount: number
  }
  warnings: string[]
  errors: string[]
  unmappedAnswers: string[]
  message: string
}

interface ImportOpenXecoDialogProps {
  onImport: (data: Partial<EntityFormData>) => void
}

export function ImportOpenXecoDialog({ onImport }: ImportOpenXecoDialogProps) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ImportResult | null>(null)

  const handleImport = async () => {
    if (!email || !password) {
      setError('Please enter your email and password')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await apiClient.post<ImportResult>('/api/import/openxeco', {
        email,
        password,
      })

      setResult(response)

      // If successful with no errors, apply the data
      if (response.errors.length === 0 && response.data.entity) {
        onImport(response.data.entity)
        // Keep dialog open to show warnings if any
        if (response.warnings.length === 0) {
          setOpen(false)
          resetForm()
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import data')
    } finally {
      setLoading(false)
    }
  }

  const handleApplyWithWarnings = () => {
    if (result?.data.entity) {
      onImport(result.data.entity)
      setOpen(false)
      resetForm()
    }
  }

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setError(null)
    setResult(null)
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      resetForm()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant='outline' size='sm'>
          <Download className='mr-2 h-4 w-4' />
          Import from cybersecurity.lu
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Import from cybersecurity.lu</DialogTitle>
          <DialogDescription>
            Enter your cybersecurity.lu credentials to import your ECCC registration form data. Your credentials are
            only used for this import and are not stored.
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <Label htmlFor='openxeco-email'>Email</Label>
              <Input
                id='openxeco-email'
                type='email'
                placeholder='your@email.com'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='openxeco-password'>Password</Label>
              <Input
                id='openxeco-password'
                type='password'
                placeholder='Your password'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>

            {error && (
              <div className='flex items-center gap-2 text-sm text-destructive'>
                <AlertCircle className='h-4 w-4' />
                {error}
              </div>
            )}
          </div>
        ) : (
          <div className='space-y-4 py-4'>
            {result.errors.length === 0 ? (
              <div className='flex items-center gap-2 text-sm text-green-600'>
                <CheckCircle className='h-4 w-4' />
                <span>
                  Successfully imported {result.data.answersCount} answers from {result.data.questionsCount} questions
                </span>
              </div>
            ) : (
              <div className='space-y-2'>
                <div className='flex items-center gap-2 text-sm text-destructive'>
                  <AlertCircle className='h-4 w-4' />
                  <span>Import completed with errors:</span>
                </div>
                <ul className='text-sm text-destructive list-disc pl-6 space-y-1'>
                  {result.errors.map((err, i) => (
                    <li
                      key={`error_${
                        // biome-ignore lint/suspicious/noArrayIndexKey: i is ok with error_
                        i
                      }`}
                    >
                      {err}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.warnings.length > 0 && (
              <div className='space-y-2'>
                <div className='flex items-center gap-2 text-sm text-yellow-600'>
                  <AlertCircle className='h-4 w-4' />
                  <span>Warnings ({result.warnings.length}):</span>
                </div>
                <ul className='text-sm text-muted-foreground list-disc pl-6 space-y-1 max-h-32 overflow-y-auto'>
                  {result.warnings.map((warn, i) => (
                    <li
                      key={`warning_${
                        // biome-ignore lint/suspicious/noArrayIndexKey: i is ok with warning_
                        i
                      }`}
                    >
                      {warn}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.unmappedAnswers.length > 0 && (
              <div className='text-xs text-muted-foreground'>
                {result.unmappedAnswers.length} answers were not mapped to form fields
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {!result ? (
            <>
              <Button variant='outline' onClick={() => handleOpenChange(false)} disabled={loading}>
                Cancel
              </Button>
              <Button onClick={handleImport} disabled={loading}>
                {loading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                {loading ? 'Importing...' : 'Import'}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant='outline'
                onClick={() => {
                  setResult(null)
                  setEmail('')
                  setPassword('')
                }}
              >
                Try Again
              </Button>
              {result.warnings.length > 0 && result.errors.length === 0 && (
                <Button onClick={handleApplyWithWarnings}>Apply Anyway</Button>
              )}
              {result.errors.length === 0 && result.warnings.length === 0 && (
                <Button onClick={() => handleOpenChange(false)}>Done</Button>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
