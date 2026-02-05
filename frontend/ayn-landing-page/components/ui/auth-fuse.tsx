"use client";

import * as React from "react";
import { useState, useId } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, Shield, Brain, FileCheck, BarChart3, Zap, Users, ArrowLeft, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AynLogo } from "@/components/ayn-logo";
import { getGoogleIdToken } from "@/lib/google-auth";
import { supabase } from "@/lib/supabase";
import { api } from "@/lib/api";
import RadialOrbitalTimeline from "@/components/ui/radial-orbital-timeline";

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

// Timeline Data
const horusTimelineData = [
    {
        id: 1,
        title: "AI Analysis",
        date: "Core Feature",
        content: "Intelligent assessment and gap analysis using Horus AI engine.",
        category: "Intelligence",
        icon: Brain,
        relatedIds: [2, 5],
        status: "completed" as const,
        energy: 100,
    },
    {
        id: 2,
        title: "Compliance",
        date: "Standards",
        content: "Full compliance with ISO 21001 & NAQAAE education standards.",
        category: "Standards",
        icon: FileCheck,
        relatedIds: [1, 3],
        status: "completed" as const,
        energy: 95,
    },
    {
        id: 3,
        title: "Evidence",
        date: "Management",
        content: "Centralized document repository with smart evidence mapping.",
        category: "Operations",
        icon: Shield,
        relatedIds: [2, 4],
        status: "completed" as const,
        energy: 90,
    },
    {
        id: 4,
        title: "Analytics",
        date: "Reporting",
        content: "Track progress and performance insights in real-time.",
        category: "Output",
        icon: BarChart3,
        relatedIds: [3, 5],
        status: "in-progress" as const,
        energy: 75,
    },
    {
        id: 5,
        title: "Flows",
        date: "Automation",
        content: "Streamlined review processes and automated notification systems.",
        category: "Efficiency",
        icon: Zap,
        relatedIds: [1, 4, 6],
        status: "in-progress" as const,
        energy: 60,
    },
    {
        id: 6,
        title: "Team",
        date: "Collaboration",
        content: "Role-based access control and seamless department collaboration.",
        category: "Users",
        icon: Users,
        relatedIds: [5],
        status: "pending" as const,
        energy: 40,
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
        >
            <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-4 h-4" />
                Back to Home
            </Link>

            <div className="flex items-center justify-center gap-3">
                <AynLogo size="md" />
                <span className="text-2xl font-light tracking-wider text-foreground">Ayn</span>
            </div>

            <div className="flex flex-col gap-2 text-center">
                <h1 className="text-2xl font-semibold text-foreground">Welcome back</h1>
                <p className="text-sm text-muted-foreground">Sign in to continue to your dashboard</p>
            </div>

            {props.err && (
                <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-500">
                    {props.err}
                </div>
            )}

            <div className="grid gap-4">
                <div className="grid gap-2">
                    <Label className="text-xs text-muted-foreground">Email</Label>
                    <Input name="email" type="email" required placeholder="Email" className="h-11 rounded-lg border-border" />
                </div>
                <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                        <Label className="text-xs text-muted-foreground">Password</Label>
                        <button type="button" className="text-[10px] text-muted-foreground hover:text-foreground">
                            Forgot password?
                        </button>
                    </div>
                    <PasswordInput name="password" required placeholder="Password" />
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

            <div className="relative text-center text-xs">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                </div>
                <span className="relative z-10 bg-background px-3 text-muted-foreground uppercase tracking-widest text-[10px]">Or continue with</span>
            </div>

            <Button variant="outline" type="button" onClick={props.handleGoogle} disabled={props.loading} className="h-11 rounded-lg border-border bg-transparent hover:bg-muted transition-colors">
                <GoogleIcon className="mr-2 h-4 w-4" />
                Continue with Google
            </Button>
        </motion.form>
    );
}

// Sign Up Form
function SignUpForm(props: {
    handleGoogle: () => void;
    handleEmail: (name: string, email: string, password: string) => void;
    loading: boolean;
    err: string | null;
    toggle: () => void;
}) {
    const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const name = data.get("name") as string;
        const email = data.get("email") as string;
        const password = data.get("password") as string;
        if (name && email && password) {
            props.handleEmail(name, email, password);
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
        >
            <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-4 h-4" />
                Back to Home
            </Link>

            <div className="flex items-center justify-center gap-3">
                <AynLogo size="md" />
                <span className="text-2xl font-light tracking-wider text-foreground">Ayn</span>
            </div>

            <div className="flex flex-col gap-2 text-center">
                <h1 className="text-2xl font-semibold text-foreground">Create your account</h1>
                <p className="text-sm text-muted-foreground">Get started with your quality journey</p>
            </div>

            {props.err && (
                <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-500">
                    {props.err}
                </div>
            )}

            <div className="grid gap-4">
                <div className="grid gap-2">
                    <Label className="text-xs text-muted-foreground">Full Name</Label>
                    <Input name="name" type="text" required placeholder="Full Name" className="h-11 rounded-lg border-border" />
                </div>
                <div className="grid gap-2">
                    <Label className="text-xs text-muted-foreground">Email</Label>
                    <Input name="email" type="email" required placeholder="Email" className="h-11 rounded-lg border-border" />
                </div>
                <div className="grid gap-2">
                    <Label className="text-xs text-muted-foreground">Password</Label>
                    <PasswordInput name="password" required placeholder="Password" />
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

            <div className="relative text-center text-xs">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                </div>
                <span className="relative z-10 bg-background px-3 text-muted-foreground uppercase tracking-widest text-[10px]">Or continue with</span>
            </div>

            <Button variant="outline" type="button" onClick={props.handleGoogle} disabled={props.loading} className="h-11 rounded-lg border-border bg-transparent hover:bg-muted transition-colors">
                <GoogleIcon className="mr-2 h-4 w-4" />
                Continue with Google
            </Button>
        </motion.form>
    );
}

export function AuthUI({ defaultMode = "signin" }: { defaultMode?: "signin" | "signup" }) {
    const [isSignIn, setIsSignIn] = useState(defaultMode === "signin");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    React.useEffect(() => {
        const checkSession = async () => {
            console.log('[Auth] Checking for Supabase session...');
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();

            if (sessionError) {
                console.error('[Auth] Session error:', sessionError);
                setError(sessionError.message);
                return;
            }

            if (session?.access_token) {
                console.log('[Auth] Supabase session found, syncing with backend...');
                setIsLoading(true);
                try {
                    const response = await api.syncWithSupabase(session.access_token);
                    console.log('[Auth] Sync successful:', response);

                    // Clear the session from Supabase so it doesn't trigger again
                    await supabase.auth.signOut();
                    console.log('[Auth] Supabase session cleared, redirecting to dashboard...');

                    router.push("/platform/dashboard");
                } catch (err) {
                    console.error("[Auth] Supabase sync error:", err);
                    setError(err instanceof Error ? err.message : "Authentication failed");
                } finally {
                    setIsLoading(false);
                }
            } else {
                console.log('[Auth] No active Supabase session');
            }
        };
        checkSession();
    }, [router]);

    const handleGoogleSignIn = async () => {
        setError(null);
        setIsLoading(true);
        console.log('[Auth] Starting Google Sign-In...');

        try {
            const redirectUrl = typeof window !== 'undefined'
                ? `${window.location.origin}/platform/login`
                : '';
            console.log('[Auth] Redirect URL:', redirectUrl);

            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: redirectUrl,
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                    }
                }
            });

            if (error) {
                console.error('[Auth] Google Sign-In error:', error);
                throw error;
            }

            console.log('[Auth] Google Sign-In initiated successfully:', data);
            // Redirect happens automatically
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
            await api.login(email, password);
            router.push("/platform/dashboard");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Login failed - Connection Error");
        } finally {
            setIsLoading(false);
        }
    };

    const onEmailSignUp = async (name: string, email: string, password: string) => {
        setError(null);
        setIsLoading(true);
        try {
            await api.register({ name, email, password, role: "TEACHER" });
            router.push("/platform/dashboard");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Signup failed - Connection Error");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex bg-background">
            <div className="flex w-full items-center justify-center p-8 md:w-1/2 overflow-y-auto">
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

            <div className="relative hidden w-1/2 bg-muted/30 md:flex flex-col justify-center p-12 lg:p-16 border-l border-border overflow-hidden">
                <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_center,hsla(var(--primary)/0.05)_0%,transparent_70%)]" />
                <div className="relative z-10 w-full h-full flex flex-col">
                    <div className="mb-8 text-center pt-8">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                            <Sparkles className="w-3.5 h-3.5 text-primary" />
                            <p className="text-primary text-[10px] uppercase tracking-[0.2em] font-bold">Horus Quality Engine</p>
                        </div>
                    </div>
                    <div className="flex-1 -mx-12">
                        <RadialOrbitalTimeline timelineData={horusTimelineData} />
                    </div>
                </div>
            </div>
        </div>
    );
}

export { PasswordInput };
