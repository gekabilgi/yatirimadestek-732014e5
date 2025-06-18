
import React from 'react';
import { Calculator, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Header = () => {
  // Mock authentication state - in a real app, this would come from your auth context
  const isAuthenticated = false; // Change this to test different states
  const userName = "Kullanıcı"; // Mock user name

  const handleLogin = () => {
    // TODO: Implement login functionality
    console.log('Login clicked');
  };

  const handleLogout = () => {
    // TODO: Implement logout functionality
    console.log('Logout clicked');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <a className="mr-6 flex items-center space-x-2" href="/">
            <Calculator className="h-6 w-6" />
            <span className="hidden font-bold sm:inline-block">
              YatırımaDestek
            </span>
          </a>
        </div>
        
        <div className="flex flex-1 items-center justify-end space-x-2">
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground hidden sm:inline">
                Hoş geldiniz, {userName}
              </span>
              <Button variant="outline" onClick={handleLogout} className="inline-flex items-center gap-2">
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline-flex">Çıkış Yap</span>
              </Button>
            </div>
          ) : (
            <Button variant="outline" onClick={handleLogin} className="inline-flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline-flex">Giriş Yap</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
