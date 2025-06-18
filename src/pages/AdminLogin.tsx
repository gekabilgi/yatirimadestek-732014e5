
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Lock, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import MainNavbar from '@/components/MainNavbar';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const { signIn, user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect if already authenticated as admin
    if (!loading && user && isAdmin) {
      navigate('/admin');
    }
  }, [user, isAdmin, loading, navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const redirectUrl = `${window.location.origin}/admin/login`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl
        }
      });
      
      if (error) {
        toast.error(error.message || 'Sign up failed');
      } else {
        toast.success('Account created successfully! Please check your email to verify your account, then contact an administrator to grant admin privileges.');
        setIsSignUp(false);
      }
    } catch (error: any) {
      toast.error(error.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSignUp) {
      return handleSignUp(e);
    }
    
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    
    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        if (error.message === 'Access denied. Admin privileges required.') {
          toast.error('Access denied. Only administrators can log in here.');
        } else if (error.message === 'Invalid login credentials') {
          toast.error('Invalid email or password');
        } else {
          toast.error(error.message || 'Login failed');
        }
      } else {
        toast.success('Login successful!');
        navigate('/admin');
      }
    } catch (error: any) {
      toast.error(error.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <MainNavbar />
        <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 64px)' }}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <MainNavbar />
      <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 64px)' }}>
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <Lock className="h-6 w-6 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl text-center">
              {isSignUp ? 'Admin Sign Up' : 'Admin Login'}
            </CardTitle>
            <p className="text-sm text-center text-gray-600">
              {isSignUp 
                ? 'Create an account (admin privileges will be granted separately)'
                : 'Enter your credentials to access the admin dashboard'
              }
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                    disabled={isLoading}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9"
                    disabled={isLoading}
                  />
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {isSignUp ? 'Creating account...' : 'Signing in...'}
                  </>
                ) : (
                  isSignUp ? 'Create Account' : 'Sign In'
                )}
              </Button>
            </form>
            
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm text-primary hover:underline"
                disabled={isLoading}
              >
                {isSignUp 
                  ? 'Already have an account? Sign in' 
                  : 'Need an account? Sign up'
                }
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminLogin;
