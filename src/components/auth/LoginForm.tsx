import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  // Handle browser autofill by checking the actual input values
  useEffect(() => {
    const checkAutofill = () => {
      if (emailRef.current && emailRef.current.value !== email) {
        setEmail(emailRef.current.value);
      }
      if (passwordRef.current && passwordRef.current.value !== password) {
        setPassword(passwordRef.current.value);
      }
    };

    // Check for autofill after a short delay
    const timer = setTimeout(checkAutofill, 100);
    
    // Also check on focus events
    const handleFocus = () => {
      setTimeout(checkAutofill, 0);
    };

    const emailInput = emailRef.current;
    const passwordInput = passwordRef.current;

    if (emailInput) {
      emailInput.addEventListener('focus', handleFocus);
    }
    if (passwordInput) {
      passwordInput.addEventListener('focus', handleFocus);
    }

    return () => {
      clearTimeout(timer);
      if (emailInput) {
        emailInput.removeEventListener('focus', handleFocus);
      }
      if (passwordInput) {
        passwordInput.removeEventListener('focus', handleFocus);
      }
    };
  }, [email, password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Get the actual form values in case React state is out of sync
    const formData = new FormData(e.target as HTMLFormElement);
    const emailValue = formData.get('email') as string || email;
    const passwordValue = formData.get('password') as string || password;

    console.log('🔐 Login attempt:', { email: emailValue });

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: emailValue, password: passwordValue }),
      });

      const data = await response.json();

      console.log('🔐 Login response:', { success: response.ok, data });

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Store the tokens in localStorage
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      localStorage.setItem('user', JSON.stringify(data.user));

      console.log('🔐 Login successful, tokens stored');

      toast.success('Login successful!');
      
      // Redirect to dashboard
      window.location.href = '/';
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      console.error('🔐 Login error:', message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="email">Email address</Label>
          <Input
            ref={emailRef}
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={handleEmailChange}
            className="mt-1"
            placeholder="Enter your email"
          />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            ref={passwordRef}
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={handlePasswordChange}
            className="mt-1"
            placeholder="Enter your password"
          />
        </div>
      </div>

      <div>
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? 'Signing in...' : 'Sign in'}
        </Button>
      </div>

      <div className="text-center">
        <p className="text-sm text-gray-600">
          Don't have an account?{' '}
          <a href="/register" className="font-medium text-blue-600 hover:text-blue-500">
            Sign up
          </a>
        </p>
      </div>
    </form>
  );
} 