"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Stethoscope, Lock, Mail, AlertCircle, ArrowLeft } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

/** Inline sign-in screen displayed at `/dashboard` until a staff member authenticates. */
export function DashboardLoginView() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email.trim(), password);
      toast.success("Signed In Successfully", {
        description: "Loading your role-based dashboard...",
      });
    } catch (err: unknown) {
      const msg =
        (err instanceof Error && err.message) ||
        "Invalid credentials. Please verify your email and password.";
      setError(msg);
      toast.error("Sign In Failed", { description: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-muted/40 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 text-primary font-bold text-xl">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Stethoscope className="h-6 w-6" />
            </div>
            <span className="text-foreground">
              Doctor<span className="text-primary">Pro</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Dashboard Sign In
          </h1>
          <p className="text-xs text-muted-foreground">
            Sign in with your administrator, doctor, or assistant credentials
          </p>
        </div>

        <Card className="rounded-2xl border-border/80 shadow-lg">
          <CardContent className="p-6 md:p-8 space-y-4">
            {error && (
              <div
                className={`flex items-start gap-2.5 p-3.5 text-xs rounded-xl border ${
                  error.toLowerCase().includes("pending")
                    ? "bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-200 border-amber-300"
                    : "bg-destructive/10 text-destructive border-destructive/20"
                }`}
              >
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block">
                    {error.toLowerCase().includes("pending")
                      ? "Approval Required"
                      : "Authentication Notice"}
                  </span>
                  <span>{error}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="dashboard-login-email" className="text-xs">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="dashboard-login-email"
                    type="email"
                    placeholder="you@doctorpro.com"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-9 h-11 rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="dashboard-login-password" className="text-xs">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="dashboard-login-password"
                    type="password"
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-9 h-11 rounded-xl"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-primary hover:bg-primary/90 rounded-xl font-semibold text-sm shadow-sm"
              >
                {loading ? "Authenticating..." : "Sign In to Dashboard"}
              </Button>

              <div className="pt-3 border-t text-center space-y-1">
                <p className="text-xs text-muted-foreground">
                  Are you a practicing Doctor or Consultant?
                </p>
                <Link
                  href="/doctor/register"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
                >
                  <Stethoscope className="h-3.5 w-3.5" /> Register Your Practice & Profile Here →
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="text-center">
          <Button asChild variant="ghost" size="sm" className="text-xs text-muted-foreground">
            <Link href="/">
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back to Public Website
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
