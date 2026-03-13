import React from 'react'
import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import { getUserInfo } from '@/data/auth'
import { LoginForm } from '@/components/auth/login-form'

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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getUserInfo()

  return (
    <html lang="en">
      <body className={inter.className}>
        {user ? (children) : <LoginForm />}
      </body>
    </html>
  )
}
