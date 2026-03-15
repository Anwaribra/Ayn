"use client";

import * as React from "react";
import { useState, useId } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, ArrowLeft, FileCheck, BarChart3, Brain } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { api } from "@/lib/api";
import { log } from "@/lib/logger";

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

// Microsoft Icon
const MicrosoftIcon = (props: React.ComponentProps<"svg">) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 21 21" {...props}>
    <path fill="#f25022" d="M1 1h9v9H1z"/>
    <path fill="#00a4ef" d="M1 11h9v9H1z"/>
    <path fill="#7fba00" d="M11 1h9v9h-9z"/>
    <path fill="#ffb900" d="M11 11h9v9h-9z"/>
  </svg>
);


const featurePills = [
    { icon: FileCheck, label: "115+ Standards" },
    { icon: BarChart3, label: "AI Gap Analysis" },
    { icon: Brain, label: "Horus AI Agent" },
];

function BrowserMockup({ className }: { className?: string }) {
    return (
        <div className={cn("rounded-2xl overflow-hidden border border-white/[0.1] bg-[#0c0c1a]", className)}
            style={{ boxShadow: "0 25px 80px -12px rgba(0,0,0,.7), 0 8px 24px -8px rgba(0,0,0,.5), 0 0 0 1px rgba(255,255,255,.05)" }}>
            {/* Title bar */}
            <div className="flex items-center gap-2 px-4 h-10 bg-[#111127]/95 border-b border-white/[0.06]">
                <div className="flex items-center gap-[7px]">
                    <span className="w-3 h-3 rounded-full bg-[#ff5f57] shadow-[inset_0_-1px_2px_rgba(0,0,0,.2)]" />
                    <span className="w-3 h-3 rounded-full bg-[#febc2e] shadow-[inset_0_-1px_2px_rgba(0,0,0,.2)]" />
                    <span className="w-3 h-3 rounded-full bg-[#28c840] shadow-[inset_0_-1px_2px_rgba(0,0,0,.2)]" />
                </div>
                <div className="flex-1 flex justify-center">
                    <div className="flex items-center gap-2 px-4 py-1 rounded-md bg-white/[0.05] border border-white/[0.05] max-w-[260px] w-full">
                        <svg className="w-3 h-3 text-white/25 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                        <span className="text-[11px] text-white/35 font-medium tracking-wide truncate">ayn.vercel.app/platform/dashboard</span>
                    </div>
                </div>
                <div className="w-[52px]" />
            </div>
            {/* Screenshot */}
            <img
                src="/dashboard-preview.png"
                alt="Ayn Platform Dashboard"
                className="w-full h-auto block"
                loading="eager"
                draggable={false}
            />
        </div>
    );
}

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
                <span className="text-2xl font-bold tracking-tight text-foreground select-none">
                    Ayn
                </span>
            </div>

            <div className="flex flex-col gap-2 text-center">
                <h1 className="text-2xl font-semibold text-foreground">Welcome back</h1>
                <p className="text-sm text-muted-foreground">Sign in to continue to your dashboard</p>
            </div>

            {props.err && (
                <div id="auth-form-error" role="alert" className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                    {props.err}
                </div>
            )}

            <div className="flex flex-col gap-3">
                {/* Google OAuth */}
                <Button variant="outline" type="button" onClick={props.handleGoogle} disabled={props.loading} className="w-full h-11 rounded-lg border-black/10 bg-white text-foreground hover:bg-black/5 hover:text-black transition-colors justify-center font-medium">
                    <GoogleIcon className="mr-2 h-4 w-4" />
                    Continue with Google
                </Button>
                {/* Microsoft OAuth */}
                <Button variant="outline" type="button" disabled className="w-full h-11 rounded-lg border-black/10 bg-white text-foreground/50 cursor-not-allowed justify-center font-medium">
                    <MicrosoftIcon className="mr-2 h-4 w-4 opacity-50" />
                    Continue with Microsoft
                    <span className="ml-2 text-[9px] uppercase tracking-widest bg-black/5 px-1.5 py-0.5 rounded">Coming Soon</span>
                </Button>
            </div>

            <div className="relative text-center text-xs">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-black/10" />
                </div>
                <span className="relative z-10 px-3 text-muted-foreground bg-[#f5f5f3] uppercase tracking-widest text-[10px]">Or sign in with email</span>
            </div>

            {/* Email / Password fields */}
            <div className="grid gap-4 mt-2">
                <div className="relative group">
                    <Input id={emailId} name="email" type="email" required placeholder=" " className="peer h-14 rounded-xl border border-black/10 bg-white text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 pt-4 pb-2 px-4 transition-all" aria-invalid={!!props.err} disabled={props.loading} />
                    <Label htmlFor={emailId} className="absolute left-4 top-4 text-sm text-foreground/60 transition-all peer-focus:-top-1 peer-focus:text-xs peer-focus:text-primary peer-focus:bg-white peer-focus:px-1 peer-valid:-top-1 peer-valid:text-xs peer-valid:text-foreground/60 peer-valid:bg-white peer-valid:px-1 bg-transparent pointer-events-none rounded-sm">Email Address</Label>
                </div>
                <div className="relative group">
                    <PasswordInput name="password" required placeholder=" " className="peer h-14 rounded-xl border border-black/10 bg-white text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 pt-4 pb-2 px-4 transition-all" aria-invalid={!!props.err} disabled={props.loading} />
                    <Label className="absolute left-4 top-4 text-sm text-foreground/60 transition-all peer-focus:-top-1 peer-focus:text-xs peer-focus:text-primary peer-focus:bg-white peer-focus:px-1 peer-valid:-top-1 peer-valid:text-xs peer-valid:text-foreground/60 peer-valid:bg-white peer-valid:px-1 bg-transparent pointer-events-none rounded-sm z-10">Password</Label>
                </div>
                <Button type="submit" className="h-11 rounded-lg bg-[#111] hover:bg-black text-white font-semibold mt-2" disabled={props.loading}>
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
    const [password, setPassword] = useState("");

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
                <span className="text-2xl font-bold tracking-tight text-foreground select-none">
                    Ayn
                </span>
            </div>

            <div className="flex flex-col gap-2 text-center">
                <h1 className="text-2xl font-semibold text-foreground">Create your account</h1>
                <p className="text-sm text-muted-foreground">Get started with your quality journey</p>
            </div>

            {props.err && (
                <div id="auth-form-error" role="alert" className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                    {props.err}
                </div>
            )}

            <div className="flex flex-col gap-3">
                {/* Google OAuth */}
                <Button variant="outline" type="button" onClick={props.handleGoogle} disabled={props.loading} className="w-full h-11 rounded-lg border-black/10 bg-white text-foreground hover:bg-black/5 hover:text-black transition-colors justify-center font-medium">
                    <GoogleIcon className="mr-2 h-4 w-4" />
                    Continue with Google
                </Button>
                {/* Microsoft OAuth */}
                <Button variant="outline" type="button" disabled className="w-full h-11 rounded-lg border-black/10 bg-white text-foreground/50 cursor-not-allowed justify-center font-medium">
                    <MicrosoftIcon className="mr-2 h-4 w-4 opacity-50" />
                    Continue with Microsoft
                    <span className="ml-2 text-[9px] uppercase tracking-widest bg-black/5 px-1.5 py-0.5 rounded">Coming Soon</span>
                </Button>
            </div>

            <div className="relative text-center text-xs">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-black/10" />
                </div>
                <span className="relative z-10 px-3 text-muted-foreground bg-[#f5f5f3] uppercase tracking-widest text-[10px]">Or create with email</span>
            </div>

            <div className="grid gap-4 mt-2">
                <div className="relative group">
                    <Input id={nameId} name="name" type="text" required placeholder=" " className="peer h-14 rounded-xl border border-black/10 bg-white text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 pt-4 pb-2 px-4 transition-all" aria-invalid={!!props.err} disabled={props.loading} />
                    <Label htmlFor={nameId} className="absolute left-4 top-4 text-sm text-foreground/60 transition-all peer-focus:-top-1 peer-focus:text-xs peer-focus:text-primary peer-focus:bg-white peer-focus:px-1 peer-valid:-top-1 peer-valid:text-xs peer-valid:text-foreground/60 peer-valid:bg-white peer-valid:px-1 bg-transparent pointer-events-none rounded-sm">Full Name</Label>
                </div>
                <div className="relative group">
                    <Input id={emailId} name="email" type="email" required placeholder=" " className="peer h-14 rounded-xl border border-black/10 bg-white text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 pt-4 pb-2 px-4 transition-all" aria-invalid={!!props.err} disabled={props.loading} />
                    <Label htmlFor={emailId} className="absolute left-4 top-4 text-sm text-foreground/60 transition-all peer-focus:-top-1 peer-focus:text-xs peer-focus:text-primary peer-focus:bg-white peer-focus:px-1 peer-valid:-top-1 peer-valid:text-xs peer-valid:text-foreground/60 peer-valid:bg-white peer-valid:px-1 bg-transparent pointer-events-none rounded-sm">Email Address</Label>
                </div>
                <div className="relative group">
                    <PasswordInput
                        name="password"
                        required
                        placeholder=" "
                        minLength={8}
                        className="peer h-14 rounded-xl border border-black/10 bg-white text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 pt-4 pb-2 px-4 transition-all"
                        aria-invalid={!!props.err}
                        disabled={props.loading}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <Label className="absolute left-4 top-4 text-sm text-foreground/60 transition-all peer-focus:-top-1 peer-focus:text-xs peer-focus:text-primary peer-focus:bg-white peer-focus:px-1 peer-valid:-top-1 peer-valid:text-xs peer-valid:text-foreground/60 peer-valid:bg-white peer-valid:px-1 bg-transparent pointer-events-none rounded-sm z-10">Password</Label>
                    {password.length > 0 && (
                        <div className="flex flex-col gap-1 mt-1">
                            <div className="flex items-center gap-2 text-xs">
                                <div className={cn("w-3 h-3 rounded-full flex items-center justify-center border", password.length >= 8 ? "bg-emerald-500/20 text-emerald-600 border-emerald-500/30" : "bg-muted border-border")}>
                                    {password.length >= 8 && <svg className="w-2 h-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                                </div>
                                <span className={password.length >= 8 ? "text-emerald-600 font-medium" : "text-muted-foreground"}>At least 8 characters</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                                <div className={cn("w-3 h-3 rounded-full flex items-center justify-center border", /[A-Z]/.test(password) ? "bg-emerald-500/20 text-emerald-600 border-emerald-500/30" : "bg-muted border-border")}>
                                    {/[A-Z]/.test(password) && <svg className="w-2 h-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                                </div>
                                <span className={/[A-Z]/.test(password) ? "text-emerald-600 font-medium" : "text-muted-foreground"}>One uppercase letter</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                                <div className={cn("w-3 h-3 rounded-full flex items-center justify-center border", /[!@#$%^&*(),.?":{}|<>]/.test(password) ? "bg-emerald-500/20 text-emerald-600 border-emerald-500/30" : "bg-muted border-border")}>
                                    {/[!@#$%^&*(),.?":{}|<>]/.test(password) && <svg className="w-2 h-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                                </div>
                                <span className={/[!@#$%^&*(),.?":{}|<>]/.test(password) ? "text-emerald-600 font-medium" : "text-muted-foreground"}>One special character</span>
                            </div>
                        </div>
                    )}
                </div>
                <div className="grid gap-2">
                    <Label className="text-xs text-foreground/80">Account Role <span className="text-muted-foreground/50 font-normal">(Optional)</span></Label>
                    <div className="flex flex-wrap gap-2">
                        {[
                            { value: "STUDENT", label: "Student" },
                            { value: "UNIVERSITY", label: "University" },
                            { value: "INSTITUTION", label: "Institution" },
                            { value: "TEACHER", label: "Teacher" },
                            { value: "OTHER", label: "Other" },
                        ].map((role) => (
                            <button
                                key={role.value}
                                type="button"
                                disabled={props.loading}
                                onClick={() => setSelectedRole(role.value === selectedRole ? "" : role.value)}
                                className={cn(
                                    "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                                    selectedRole === role.value
                                        ? "bg-primary text-white border-primary"
                                        : "bg-white text-muted-foreground border-black/10 hover:border-black/30"
                                )}
                            >
                                {role.label}
                            </button>
                        ))}
                    </div>
                </div>
                <Button type="submit" className="h-11 rounded-lg bg-[#111] hover:bg-black text-white font-semibold mt-2" disabled={props.loading}>
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
        <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#f5f5f3]">
            {/* Mobile — compact tilted preview above form */}
            <div className="lg:hidden relative w-full bg-[#050810] pt-8 pb-5 overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_60%,rgba(59,130,246,0.12)_0%,transparent_65%)] pointer-events-none" />
                <div className="relative z-10 flex flex-col items-center px-8">
                    <p className="text-[11px] text-white/35 uppercase tracking-[0.15em] font-semibold mb-5">Platform Preview</p>
                    <div style={{ perspective: "600px" }} className="w-full max-w-xs">
                        <div style={{ transform: "rotateY(-8deg) rotateX(4deg)", transformOrigin: "30% center" }}>
                            <BrowserMockup />
                        </div>
                    </div>
                </div>
            </div>

            {/* Left — Form (generous 55-60% width) */}
            <div className="relative flex w-full items-center justify-center px-8 py-10 lg:px-16 lg:py-0 lg:w-[56%] xl:w-[54%] overflow-y-auto min-h-0 lg:min-h-screen">
                <div className="w-full max-w-[420px]">
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

            {/* Right — Product Showcase (Desktop) */}
            <div className="relative hidden lg:flex flex-1 flex-col items-center justify-center overflow-hidden bg-[#050810]">
                {/* Glow behind the mockup */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_55%_at_50%_55%,rgba(59,130,246,0.10)_0%,transparent_70%)] pointer-events-none" />
                <div className="absolute top-[30%] left-[25%] w-[350px] h-[350px] bg-blue-500/[0.06] rounded-full blur-[100px] pointer-events-none" />
                <div className="absolute bottom-[20%] right-[20%] w-[250px] h-[250px] bg-indigo-500/[0.04] rounded-full blur-[80px] pointer-events-none" />

                {/* Dot pattern */}
                <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{
                    backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)",
                    backgroundSize: "32px 32px",
                }} />

                <div className="relative z-10 flex flex-col items-center w-full max-w-lg xl:max-w-xl px-8">
                    {/* Headline */}
                    <motion.div
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="text-center mb-8"
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.05] border border-white/[0.07] mb-5">
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
                            </span>
                            <span className="text-white/45 text-[9px] uppercase tracking-[0.2em] font-semibold">Live Platform</span>
                        </div>
                        <h2 className="text-2xl xl:text-[28px] font-bold text-white leading-tight tracking-tight mb-2.5">
                            Quality compliance,<br />
                            <span className="bg-gradient-to-r from-blue-400 via-blue-500 to-indigo-400 bg-clip-text text-transparent">powered by AI.</span>
                        </h2>
                        <p className="text-[13px] text-white/35 leading-relaxed max-w-sm mx-auto">
                            Join institutions using Ayn to streamline their accreditation journey.
                        </p>
                    </motion.div>

                    {/* Tilted Browser Mockup — contained, floating */}
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        className="relative w-full"
                        style={{ perspective: "1200px" }}
                    >
                        <motion.div
                            animate={{ y: [0, -7, 0] }}
                            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                        >
                            <div style={{
                                transform: "rotateY(-10deg) rotateX(3deg)",
                                transformOrigin: "50% 50%",
                                transformStyle: "preserve-3d",
                            }}>
                                <BrowserMockup />
                            </div>
                        </motion.div>

                        {/* Shadow beneath mockup */}
                        <div className="absolute -bottom-4 left-[12%] right-[12%] h-12 rounded-[50%] pointer-events-none"
                            style={{
                                background: "radial-gradient(ellipse at 50% 0%, rgba(0,0,0,0.35) 0%, transparent 75%)",
                                filter: "blur(12px)",
                            }}
                        />
                    </motion.div>

                    {/* Feature pills */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.5 }}
                        className="flex items-center gap-2.5 mt-8"
                    >
                        {featurePills.map((pill) => (
                            <div
                                key={pill.label}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06]"
                            >
                                <pill.icon className="w-3 h-3 text-blue-400/60" />
                                <span className="text-[10px] text-white/40 font-medium">{pill.label}</span>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </div>
        </div>
    );
}

export { PasswordInput };
