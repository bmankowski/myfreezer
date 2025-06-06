import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      emailInput.addEventListener("focus", handleFocus);
    }
    if (passwordInput) {
      passwordInput.addEventListener("focus", handleFocus);
    }

    return () => {
      clearTimeout(timer);
      if (emailInput) {
        emailInput.removeEventListener("focus", handleFocus);
      }
      if (passwordInput) {
        passwordInput.removeEventListener("focus", handleFocus);
      }
    };
  }, [email, password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Get the actual form values in case React state is out of sync
    const formData = new FormData(e.target as HTMLFormElement);
    const emailValue = (formData.get("email") as string) || email;
    const passwordValue = (formData.get("password") as string) || password;

    console.log("🔐 Login attempt:", { email: emailValue });

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: emailValue, password: passwordValue }),
      });

      const data = await response.json();

      console.log("🔐 Login response:", { success: response.ok, data });

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      console.log("🔐 Login successful, session cookies set");

      toast.success("Login successful!");

      // Redirect to index
      window.location.href = "/";
    } catch (error) {
      const message = error instanceof Error ? error.message : "Login failed";
      console.error("🔐 Login error:", message);
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

  const handleGoogleLogin = () => {
    console.log("🔗 Initiating Google OAuth");
    // Redirect to Google OAuth endpoint
    window.location.href = "/api/auth/google";
  };

  // Check if we're running against local Supabase (Google OAuth not supported)
  // Local Supabase typically runs on localhost:54321
  const [isLocalSupabase, setIsLocalSupabase] = useState(false);

  useEffect(() => {
    // Check if we're on localhost and likely using local Supabase
    const checkLocalSupabase = () => {
      const isLocalhost = window.location.hostname === "localhost";
      const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
      const hasLocalSupabase = supabaseUrl?.includes("localhost") || supabaseUrl?.includes("54321");

      console.log("🔍 Checking Supabase environment:", {
        isLocalhost,
        supabaseUrl,
        hasLocalSupabase,
      });

      setIsLocalSupabase(isLocalhost && (hasLocalSupabase || !supabaseUrl?.includes("supabase.co")));
    };

    checkLocalSupabase();
  }, []);

  return (
    <div className="mt-8 space-y-6">
      {/* Google OAuth Button - Only show for remote Supabase */}
      {!isLocalSupabase && (
        <>
          <div>
            <Button
              type="button"
              onClick={handleGoogleLogin}
              variant="outline"
              className="w-full flex items-center justify-center space-x-2 border-gray-300 hover:bg-gray-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>Continue with Google</span>
            </Button>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">Or continue with email</span>
            </div>
          </div>
        </>
      )}

      {/* Local development notice */}
      {isLocalSupabase && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                <strong>Local Development:</strong> Google OAuth is only available with remote Supabase. Use
                email/password authentication for local testing.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Email/Password Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
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
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? "Signing in..." : "Sign in with Email"}
          </Button>
        </div>
      </form>

      <div className="text-center">
        <p className="text-sm text-gray-600">
          Don&apos;t have an account?{" "}
          <a href="/register" className="font-medium text-blue-600 hover:text-blue-500">
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
}
