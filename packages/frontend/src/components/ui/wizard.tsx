'use client'

import React from 'react'
import { Check, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CardHeader, CardTitle, CardDescription, CardContent, Card } from '@/components/ui/card'

export type WizardStep = {
  id: string
  title: string
  description?: string
  content: React.ReactNode
}

type WizardProps = {
  steps?: WizardStep[]
  handleNextAction?: () => void
  handlePreviousAction?: () => void
  handleCancelAction?: () => void
  handleSubmitAction?: () => void
  startsFrom?: number
  isPending?: boolean
}

export function Wizard({
  steps = [
    {
      id: 'initial',
      title: 'Initial',
      description: 'Initial step for testing purposes',
      content: <div>Example of content</div>,
    },
  ],
  handleNextAction,
  handlePreviousAction,
  handleCancelAction,
  handleSubmitAction,
  startsFrom = 0,
  isPending = false,
}: WizardProps) {
  const [currentStep, setCurrentStep] = React.useState<number>(startsFrom <= steps.length ? startsFrom : 0)

  const step = steps[currentStep]

  const onNext = () => {
    if (currentStep === steps.length - 1) {
      if (handleSubmitAction) {
        handleSubmitAction()
      }
      return
    }

    setCurrentStep((s) => s + 1)

    if (handleNextAction) {
      handleNextAction()
    }
  }

  const onPrevious = () => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1)
      if (handlePreviousAction) {
        handlePreviousAction()
      }
    }
  }

  const onCancel = () => {
    if (handleCancelAction) {
      handleCancelAction()
    }
  }

  return (
    <div className='mx-auto max-w-4xl'>
      <div className='mb-8 flex items-center justify-between'>
        {steps.map((step, index) => (
          <div key={step.id} className='flex flex-1 items-center'>
            <div className='flex flex-col items-center'>
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                  index <= currentStep
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-muted bg-background text-muted-foreground'
                }`}
              >
                {index < currentStep ? <Check className='h-5 w-5' /> : <span>{index + 1}</span>}
              </div>
              <div className='mt-2 text-center'>
                <div className='text-sm font-medium'>{step.title}</div>
                <div className='text-xs text-muted-foreground'>{step.description}</div>
              </div>
            </div>
            {index < steps.length - 1 && (
              <div className={`mx-4 h-0.5 flex-1 ${index < currentStep ? 'bg-primary' : 'bg-muted'}`} />
            )}
          </div>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{step.title}</CardTitle>
          <CardDescription>{step.description}</CardDescription>
        </CardHeader>
        <CardContent className='space-y-6'>{step.content}</CardContent>
      </Card>
      <div className='mt-6 flex justify-between'>
        <div>
          {currentStep > 0 && (
            <Button type='button' variant='outline' onClick={onPrevious}>
              <ChevronLeft className='mr-2 h-4 w-4' />
              Previous
            </Button>
          )}
        </div>
        <div className='flex gap-2'>
          <Button type='button' variant='outline' onClick={onCancel}>
            Cancel
          </Button>
          {currentStep < steps.length - 1 ? (
            <Button type='button' onClick={onNext}>
              Next
              <ChevronRight className='ml-2 h-4 w-4' />
            </Button>
          ) : (
            <Button type='button' onClick={onNext} disabled={isPending}>
              {isPending ? 'Saving...' : 'Save'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
