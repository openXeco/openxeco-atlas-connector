'use client'

import React from 'react'

interface MessageProps {
  message?: string
  success: boolean
  duration?: number
}

export function Message({ children, message, success, duration = 3 }: React.PropsWithChildren<MessageProps>) {
  const [isVisible, setIsVisible] = React.useState(true)

  React.useEffect(() => {
    if (duration === 99) {
      return
    }

    const timeout = setTimeout(() => {
      setIsVisible(false)
    }, duration * 1000)

    return () => clearTimeout(timeout)
  }, [duration])

  if (!isVisible) {
    return undefined
  }

  return (
    <div>
      {success ? (
        <div className='rounded-md bg-green-500/10 py-2 px-4 text-sm text-green-700'>{children || message}</div>
      ) : (
        <div className='rounded-md bg-destructive/10 py-2 px-4 text-sm text-destructive'>{children || message}</div>
      )}
    </div>
  )
}
