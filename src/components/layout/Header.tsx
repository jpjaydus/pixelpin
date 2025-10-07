'use client';

import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import { LogOut, User } from 'lucide-react';

export function Header() {
  const { data: session } = useSession();

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  return (
    <header className="bg-white border-b border-neutral-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-neutral-900">PixelPin</h1>
        </div>

        <div className="flex items-center space-x-4">
          {session?.user && (
            <>
              <div className="flex items-center space-x-2 text-sm text-neutral-600">
                <User className="h-4 w-4" />
                <span>{session.user.name || session.user.email}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}