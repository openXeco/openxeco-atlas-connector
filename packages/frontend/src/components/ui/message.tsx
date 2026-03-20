'use client'

import { useEffect, useState } from 'react'

interface MessageProps {
  message: string
  success: boolean
  duration?: number
}

export function Message({ message, success, duration = 3 }: MessageProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
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
        <div className='rounded-md bg-green-500/10 py-2 px-4 text-sm text-green-700'>{message}</div>
      ) : (
        <div className='rounded-md bg-destructive/10 py-2 px-4 text-sm text-destructive'>{message}</div>
      )}
    </div>
  )
}
