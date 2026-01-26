'use client';

import { User, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';

export function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-6">
      <div>
        <h1 className="text-lg font-semibold">Dashboard</h1>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground">
          <User className="h-5 w-5" />
          <span>{user?.email || 'Admin'}</span>
        </div>
        <button
          onClick={() => logout()}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        >
          <LogOut className="h-5 w-5" />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
}
