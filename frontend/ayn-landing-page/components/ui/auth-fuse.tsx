"use client";

import * as React from "react";
import { useState, useId } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, Shield, Brain, FileCheck, BarChart3, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AynLogo } from "@/components/ayn-logo";
import { supabase } from "@/lib/supabase";
import { api } from "@/lib/api";
import { log } from "@/lib/logger";
import { toast } from "sonner";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

// Password Input with visibility toggle
export interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
    ({ className, label, ...props }, ref) => {
        const id = useId();
        const [showPassword, setShowPassword] = useState(false);
        const togglePasswordVisibility = () => setShowPassword((prev) => !prev);

        return (
            <div className="grid w-full items-center gap-2">
                {label && <Label htmlFor={id} className="text-muted-foreground text-sm">{label}</Label>}
                <div className="relative">
                    <Input
                        id={id}
                        type={showPassword ? "text" : "password"}
                        className={cn(
                            "pe-10 h-11 rounded-lg border-border bg-card text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary",
                            className
                        )}
                        ref={ref}
                        {...props}
                    />
                    <button
                        type="button"
                        onClick={togglePasswordVisibility}
                        className="absolute inset-y-0 end-0 flex h-full w-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                        {showPassword ? (
                            <EyeOff className="h-4 w-4" aria-hidden="true" />
                        ) : (
                            <Eye className="h-4 w-4" aria-hidden="true" />
                        )}
                    </button>
                </div>
            </div>
        );
    }
);
PasswordInput.displayName = "PasswordInput";

// Google Icon
const GoogleIcon = (props: React.ComponentProps<"svg">) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
);


// Static benefit cards data for right panel
const benefits = [
    {
        icon: FileCheck,
        title: "115+ Real Standards",
        description: "ISO 21001, NCAAA, NAQAAE, ABET and more — fully mapped and ready to use.",
        color: "text-emerald-600",
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/20",
    },
    {
        icon: BarChart3,
        title: "AI-Powered Gap Analysis",
        description: "Instant compliance insights that identify exactly where you stand — and what to fix first.",
        color: "text-blue-600",
        bg: "bg-blue-500/10",
        border: "border-blue-500/20",
    },
    {
        icon: Brain,
        title: "Horus Brain Mode",
        description: "One conversation triggers evidence mapping, report generation, and compliance scoring.",
        color: "text-primary",
        bg: "bg-primary/10",
        border: "border-primary/20",
    },
];

// Sign In Form
function SignInForm(props: {
    handleGoogle: () => void;
    handleEmail: (email: string, password: string) => void;
    loading: boolean;
    err: string | null;
    toggle: () => void;
}) {
    const emailId = useId();
    const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const email = data.get("email") as string;
        const password = data.get("password") as string;
        if (email && password) {
            props.handleEmail(email, password);
        }
    };

    return (
        <motion.form
            onSubmit={onSubmit}
            autoComplete="on"
            className="flex flex-col gap-6 w-full max-w-[360px]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            aria-describedby={props.err ? "auth-form-error" : undefined}
        >
            <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-4 h-4" />
                Back to Home
            </Link>

            <div className="flex items-center justify-center gap-3">
                <AynLogo size="md" heroStyle />
            </div>

            <div className="flex flex-col gap-2 text-center">
                <h1 className="text-2xl font-semibold text-foreground">Welcome back</h1>
                <p className="text-sm text-muted-foreground">Sign in to continue to your dashboard</p>
            </div>

            {props.err && (
                <div id="auth-form-error" role="alert" className="rounded-lg border border-[#A83B42]/40 bg-[#A83B42]/10 p-3 text-sm text-[#C9424A]">
                    {props.err}
                </div>
            )}

            {/* Google OAuth — First for lowest friction */}
            <Button variant="outline" type="button" onClick={props.handleGoogle} disabled={props.loading} className="h-11 rounded-lg border-border bg-transparent hover:bg-muted transition-colors">
                <GoogleIcon className="mr-2 h-4 w-4" />
                Continue with Google
            </Button>

            <div className="relative text-center text-xs">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                </div>
                <span className="relative z-10 bg-background px-3 text-muted-foreground uppercase tracking-widest text-[10px]">Or sign in with email</span>
            </div>

            {/* Email / Password fields */}
            <div className="grid gap-4">
                <div className="grid gap-2">
                    <Label htmlFor={emailId} className="text-xs text-muted-foreground">Email</Label>
                    <Input id={emailId} name="email" type="email" required placeholder="you@example.com" className="h-11 rounded-lg border-border" aria-invalid={!!props.err} />
                </div>
                <div className="grid gap-2">
                    <Label className="text-xs text-muted-foreground">Password</Label>
                    <PasswordInput name="password" required placeholder="Password" aria-invalid={!!props.err} />
                </div>
                <Button type="submit" className="h-11 rounded-lg bg-primary hover:bg-primary/90 text-white font-medium" disabled={props.loading}>
                    {props.loading ? (
                        <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Signing in...
                        </div>
                    ) : "Sign In"}
                </Button>
            </div>

            <div className="text-center text-sm text-muted-foreground">
                Don&apos;t have an account?{" "}
                <button type="button" className="text-foreground hover:underline font-medium" onClick={props.toggle}>
                    Create account
                </button>
            </div>
        </motion.form>
    );
}

function SignUpForm(props: {
    handleGoogle: () => void;
    handleEmail: (name: string, email: string, password: string, role?: string) => void;
    loading: boolean;
    err: string | null;
    toggle: () => void;
}) {
    const nameId = useId();
    const emailId = useId();
    const [selectedRole, setSelectedRole] = useState<string>("");

    const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const name = data.get("name") as string;
        const email = data.get("email") as string;
        const password = data.get("password") as string;
        if (name && email && password) {
            props.handleEmail(name, email, password, selectedRole || undefined);
        }
    };

    return (
        <motion.form
            onSubmit={onSubmit}
            autoComplete="on"
            className="flex flex-col gap-6 w-full max-w-[360px]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            aria-describedby={props.err ? "auth-form-error" : undefined}
        >
            <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-4 h-4" />
                Back to Home
            </Link>

            <div className="flex items-center justify-center gap-3">
                <AynLogo size="md" heroStyle />
            </div>

            <div className="flex flex-col gap-2 text-center">
                <h1 className="text-2xl font-semibold text-foreground">Create your account</h1>
                <p className="text-sm text-muted-foreground">Get started with your quality journey</p>
            </div>

            {props.err && (
                <div id="auth-form-error" role="alert" className="rounded-lg border border-[#A83B42]/40 bg-[#A83B42]/10 p-3 text-sm text-[#C9424A]">
                    {props.err}
                </div>
            )}

            {/* Google OAuth — First */}
            <Button variant="outline" type="button" onClick={props.handleGoogle} disabled={props.loading} className="h-11 rounded-lg border-border bg-transparent hover:bg-muted transition-colors">
                <GoogleIcon className="mr-2 h-4 w-4" />
                Continue with Google
            </Button>

            <div className="relative text-center text-xs">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                </div>
                <span className="relative z-10 bg-background px-3 text-muted-foreground uppercase tracking-widest text-[10px]">Or create with email</span>
            </div>

            <div className="grid gap-4">
                <div className="grid gap-2">
                    <Label htmlFor={nameId} className="text-xs text-muted-foreground">Full Name</Label>
                    <Input id={nameId} name="name" type="text" required placeholder="Full Name" className="h-11 rounded-lg border-border" aria-invalid={!!props.err} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor={emailId} className="text-xs text-muted-foreground">Email</Label>
                    <Input id={emailId} name="email" type="email" required placeholder="you@example.com" className="h-11 rounded-lg border-border" aria-invalid={!!props.err} />
                </div>
                <div className="grid gap-2">
                    <Label className="text-xs text-muted-foreground">Password <span className="text-muted-foreground/70 font-normal">(min 8 characters)</span></Label>
                    <PasswordInput name="password" required placeholder="Password" minLength={8} aria-invalid={!!props.err} />
                </div>
                <div className="grid gap-2">
                    <Label className="text-xs text-muted-foreground">Account Role <span className="text-muted-foreground/50 font-normal">(Optional)</span></Label>
                    <Select value={selectedRole} onValueChange={setSelectedRole}>
                        <SelectTrigger className="h-11 rounded-lg border-border bg-card text-foreground focus:border-primary focus:ring-1 focus:ring-primary">
                            <SelectValue placeholder="Select a role..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="STUDENT">Student</SelectItem>
                            <SelectItem value="UNIVERSITY">University</SelectItem>
                            <SelectItem value="INSTITUTION">Institution</SelectItem>
                            <SelectItem value="TEACHER">Teacher</SelectItem>
                            <SelectItem value="OTHER">Other</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <Button type="submit" className="h-11 rounded-lg bg-primary hover:bg-primary/90 text-white font-medium" disabled={props.loading}>
                    {props.loading ? (
                        <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Creating account...
                        </div>
                    ) : "Create Account"}
                </Button>
            </div>

            <div className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <button type="button" className="text-foreground hover:underline font-medium" onClick={props.toggle}>
                    Sign in
                </button>
            </div>
        </motion.form>
    );
}

export function AuthUI({ defaultMode = "signin" }: { defaultMode?: "signin" | "signup" }) {
    const [isSignIn, setIsSignIn] = useState(defaultMode === "signin");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Listen for Supabase auth state changes (handles OAuth redirects)
    React.useEffect(() => {
        let hasProcessed = false;

        log('[Auth] Setting up auth state listener...');

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            log('[Auth] Auth state changed:', event, session?.user?.email);

            if (event === 'SIGNED_IN' && session?.access_token && !hasProcessed) {
                hasProcessed = true;
                log('[Auth] User signed in via OAuth, syncing with backend...');
                setIsLoading(true);
                setError(null);

                try {
                    await api.syncWithSupabase(session.access_token);
                    log('[Auth] Sync successful, clearing Supabase session...');
                    await supabase.auth.signOut();
                    const redirectPath = sessionStorage.getItem("redirectAfterLogin");
                    sessionStorage.removeItem("redirectAfterLogin");
                    log('[Auth] Redirecting to:', redirectPath || "/platform/dashboard");
                    window.location.href = redirectPath || "/platform/dashboard";
                } catch (err) {
                    console.error('[Auth] Sync failed:', err);
                    setError(err instanceof Error ? err.message : "Authentication failed");
                    setIsLoading(false);
                    hasProcessed = false;
                }
            }
        });

        return () => {
            log('[Auth] Cleaning up auth state listener');
            subscription.unsubscribe();
        };
    }, []);


    const handleGoogleSignIn = async () => {
        setError(null);
        setIsLoading(true);
        log('[Auth] Starting Supabase Google OAuth...');

        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/login`,
                }
            });

            if (error) {
                console.error('[Auth] Supabase OAuth error:', error);
                throw error;
            }

            log('[Auth] Redirecting to Google...');
        } catch (err) {
            console.error('[Auth] Google Sign-In failed:', err);
            setError(err instanceof Error ? err.message : "Google sign-in failed");
            setIsLoading(false);
        }
    };

    const onEmailSignIn = async (email: string, password: string) => {
        setError(null);
        setIsLoading(true);
        try {
            const response = await api.login(email, password);
            log('[Auth] Email login successful:', response.user.email);
            localStorage.setItem("access_token", response.access_token);
            localStorage.setItem("user", JSON.stringify(response.user));
            const redirectPath = sessionStorage.getItem("redirectAfterLogin");
            sessionStorage.removeItem("redirectAfterLogin");
            window.location.href = redirectPath || "/platform/dashboard";
        } catch (err) {
            setError(err instanceof Error ? err.message : "Login failed - Connection Error");
        } finally {
            setIsLoading(false);
        }
    };

    const onEmailSignUp = async (name: string, email: string, password: string, role?: string) => {
        setError(null);
        setIsLoading(true);
        try {
            const response = await api.register({ name, email, password, role });
            log('[Auth] Email signup successful:', response.user.email);
            localStorage.setItem("access_token", response.access_token);
            localStorage.setItem("user", JSON.stringify(response.user));
            const redirectPath = sessionStorage.getItem("redirectAfterLogin");
            sessionStorage.removeItem("redirectAfterLogin");
            window.location.href = redirectPath || "/platform/dashboard";
        } catch (err) {
            setError(err instanceof Error ? err.message : "Signup failed - Connection Error");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex bg-background">
            {/* Left — Form */}
            <div className="flex w-full items-center justify-center p-6 md:w-1/2 md:p-[var(--spacing-content)] overflow-y-auto">
                <div className="w-full max-w-[400px]">
                    {isSignIn ? (
                        <SignInForm
                            handleGoogle={handleGoogleSignIn}
                            handleEmail={onEmailSignIn}
                            loading={isLoading}
                            err={error}
                            toggle={() => setIsSignIn(false)}
                        />
                    ) : (
                        <SignUpForm
                            handleGoogle={handleGoogleSignIn}
                            handleEmail={onEmailSignUp}
                            loading={isLoading}
                            err={error}
                            toggle={() => setIsSignIn(true)}
                        />
                    )}
                </div>
            </div>

            {/* Right — Static Benefit Cards (Liquid Glass) */}
            <div className="relative hidden w-1/2 md:flex flex-col justify-center p-12 lg:p-16 border-l border-border overflow-hidden bg-muted/20">
                {/* Subtle background glow */}
                <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_center,hsl(var(--primary)/0.06)_0%,transparent_70%)] pointer-events-none" />
                <div className="absolute -top-32 -right-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
                <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

                <div className="relative z-10">
                    {/* Header */}
                    <div className="mb-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-4">
                            <Shield className="w-3.5 h-3.5 text-primary" />
                            <span className="text-primary text-[10px] uppercase tracking-[0.2em] font-bold">Ayn Platform</span>
                        </div>
                        <h2 className="text-2xl font-bold text-foreground mb-2">
                            Quality compliance,<br />
                            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">powered by AI.</span>
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Join institutions already using Ayn to streamline their accreditation journey.
                        </p>
                    </div>

                    {/* 3 Static Benefit Cards — Liquid Glass */}
                    <div className="space-y-4">
                        {benefits.map((benefit, i) => (
                            <motion.div
                                key={benefit.title}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.4, delay: i * 0.1 }}
                                className="group flex items-start gap-4 p-5 rounded-2xl bg-white/60 backdrop-blur-[16px] border border-white/40 shadow-lg hover:shadow-xl hover:scale-[1.01] hover:border-white/60 transition-all duration-300"
                            >
                                <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border", benefit.bg, benefit.border)}>
                                    <benefit.icon className={cn("w-5 h-5", benefit.color)} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-foreground mb-1">{benefit.title}</h3>
                                    <p className="text-xs text-muted-foreground leading-relaxed">{benefit.description}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export { PasswordInput };
