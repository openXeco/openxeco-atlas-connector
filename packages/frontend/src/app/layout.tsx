import type { Metadata } from 'next'
import React from 'react'
import localFont from 'next/font/local'
import './globals.css'
import { AuthProvider } from '@/contexts/auth-context'

const inter = localFont({
  src: [
    {
      path: '../../public/fonts/InterVariable.woff2',
      style: 'normal',
    },
    {
      path: '../../public/fonts/InterVariable-latin-ext.woff2',
      style: 'normal',
    },
  ],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'ATLAS Connector',
  description: 'OpenXeco ATLAS Connector - Manage clusters with the ATLAS API',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
