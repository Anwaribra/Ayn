"use client";

import * as React from "react";
import { useState, useId } from "react";
import Link from "next/link";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Loader2, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { api } from "@/lib/api";
import { AynLogo } from "@/components/ayn-logo";
import { DarkCardNeuralBg } from "@/components/landing/dark-card-neural-bg";
import { useUiLanguage } from "@/lib/ui-language-context";

// Google Icon
const GoogleIcon = (props: React.ComponentProps<"svg">) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
);

// Filled GitHub Icon
const GithubIcon = (props: React.ComponentProps<"svg">) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
    </svg>
);

// Magnetic button wrapper
function Magnetic({ children }: { children: React.ReactNode }) {
    const [position, setPosition] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e: React.MouseEvent) => {
        const { clientX, clientY, currentTarget } = e;
        const { left, top, width, height } = currentTarget.getBoundingClientRect();
        const centerX = left + width / 2;
        const centerY = top + height / 2;
        setPosition({
            x: (clientX - centerX) * 0.1,
            y: (clientY - centerY) * 0.1,
        });
    };

    const handleMouseLeave = () => {
        setPosition({ x: 0, y: 0 });
    };

    return (
        <motion.div
            animate={{ x: position.x, y: position.y }}
            transition={{ type: "spring", stiffness: 200, damping: 18, mass: 0.12 }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="w-full"
        >
            {children}
        </motion.div>
    );
}

// Reusable Custom Floating Input with Ayn Colors
interface FloatingInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
}

const FloatingInput = React.forwardRef<HTMLInputElement, FloatingInputProps>(
    ({ className, label, ...props }, ref) => {
        const defaultId = useId();
        const id = props.id || defaultId;

        return (
            <div className="relative group w-full">
                <Input
                    id={id}
                    ref={ref}
                    className={cn(
                        "auth-glass-input peer h-14 w-full rounded-2xl border px-4 pt-5 pb-2 text-foreground outline-none transition-all duration-200 focus:border-primary/50 placeholder:text-transparent relative z-10 font-dmsans focus:ring-0",
                        className
                    )}
                    {...props}
                />
                <Label
                    htmlFor={id}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground transition-all duration-200 ease-out pointer-events-none z-20 peer-focus:top-2.5 peer-focus:-translate-y-0 peer-focus:text-[10px] peer-focus:tracking-[0.08em] peer-focus:uppercase peer-focus:text-primary peer-[:not(:placeholder-shown)]:top-2.5 peer-[:not(:placeholder-shown)]:-translate-y-0 peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:tracking-[0.08em] peer-[:not(:placeholder-shown)]:uppercase font-dmsans"
                >
                    {label}
                </Label>
            </div>
        );
    }
);
FloatingInput.displayName = "FloatingInput";

// Reusable Custom Floating Password Input with Visibility Toggle and Ayn Colors
interface FloatingPasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
}

const FloatingPasswordInput = React.forwardRef<HTMLInputElement, FloatingPasswordInputProps>(
    ({ className, label, ...props }, ref) => {
        const [showPassword, setShowPassword] = useState(false);
        const defaultId = useId();
        const id = props.id || defaultId;

        const togglePasswordVisibility = () => setShowPassword((prev) => !prev);

        return (
            <div className="relative group w-full">
                <Input
                    id={id}
                    type={showPassword ? "text" : "password"}
                    ref={ref}
                    className={cn(
                        "auth-glass-input peer pe-12 h-14 w-full rounded-2xl border px-4 pt-5 pb-2 text-foreground outline-none transition-all duration-200 focus:border-primary/50 placeholder:text-transparent relative z-10 font-dmsans focus:ring-0",
                        className
                    )}
                    {...props}
                />
                <Label
                    htmlFor={id}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground transition-all duration-200 ease-out pointer-events-none z-20 peer-focus:top-2.5 peer-focus:-translate-y-0 peer-focus:text-[10px] peer-focus:tracking-[0.08em] peer-focus:uppercase peer-focus:text-primary peer-[:not(:placeholder-shown)]:top-2.5 peer-[:not(:placeholder-shown)]:-translate-y-0 peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:tracking-[0.08em] peer-[:not(:placeholder-shown)]:uppercase font-dmsans"
                >
                    {label}
                </Label>
                <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute inset-y-0 end-0 z-20 flex h-full w-12 items-center justify-center rounded-2xl text-muted-foreground transition-all hover:bg-accent hover:text-foreground/90 focus-visible:outline-none"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                >
                    {showPassword ? (
                        <EyeOff className="h-4.5 w-4.5" aria-hidden="true" />
                    ) : (
                        <Eye className="h-4.5 w-4.5" aria-hidden="true" />
                    )}
                </button>
            </div>
        );
    }
);
FloatingPasswordInput.displayName = "FloatingPasswordInput";

// Sign In Form
function SignInForm(props: {
    handleGoogle: () => void;
    handleGithub: () => void;
    handleEmail: (email: string, password: string) => void;
    loading: boolean;
    err: string | null;
    toggle: () => void;
}) {
    const [showEmailLogin, setShowEmailLogin] = useState(false);

    const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (props.loading) return;
        const data = new FormData(event.currentTarget);
        const email = data.get("email") as string;
        const password = data.get("password") as string;
        if (email && password) {
            props.handleEmail(email, password);
        }
    };

    return (
        <form
            onSubmit={onSubmit}
            autoComplete="on"
            className="flex flex-col gap-6 w-full font-dmsans"
            aria-describedby={props.err ? "auth-form-error" : undefined}
        >
            <div className="mt-1 flex flex-col gap-1 text-center">
                <h1 className="text-2xl font-semibold text-foreground tracking-[-0.03em] font-dmsans">Welcome back</h1>
                <p className="text-sm text-muted-foreground leading-relaxed font-dmsans">Sign in to continue to your dashboard</p>
            </div>

            {props.err && (
                <div id="auth-form-error" role="alert" className="auth-error rounded-xl p-3 text-sm text-center">
                    {props.err}
                </div>
            )}

            {!showEmailLogin ? (
                <>
                    <div className="flex flex-col gap-3">
                        <Magnetic>
                            <Button
                                variant="outline"
                                type="button"
                                onClick={props.handleGoogle}
                                aria-label="Continue with Google"
                                className="auth-glass-button group relative w-full h-11 overflow-hidden rounded-xl border text-foreground justify-center font-medium font-dmsans transition-all duration-200 hover:scale-[0.99] active:scale-[0.985]"
                            >
                                <GoogleIcon className="mr-2 h-4 w-4 transition-transform duration-300 group-hover:scale-105" />
                                Continue with Google
                            </Button>
                        </Magnetic>
                        <Magnetic>
                            <Button
                                variant="outline"
                                type="button"
                                onClick={props.handleGithub}
                                aria-label="Continue with GitHub"
                                className="auth-glass-button group relative w-full h-11 overflow-hidden rounded-xl border text-foreground justify-center font-medium font-dmsans transition-all duration-200 hover:scale-[0.99] active:scale-[0.985]"
                            >
                                <GithubIcon className="mr-2 h-4 w-4 text-foreground fill-foreground transition-transform duration-300 group-hover:scale-105" />
                                Continue with GitHub
                            </Button>
                        </Magnetic>
                    </div>

                    <div className="relative flex items-center gap-4 py-1 mt-1">
                    <span className="flex-1 border-t border-border" />
                    <span className="text-muted-foreground uppercase tracking-[0.2em] text-xs font-semibold whitespace-nowrap font-sans">Or</span>
                    <span className="flex-1 border-t border-border" />
                    </div>

                    <div className="text-center">
                        <button
                            type="button"
                            className="text-xs font-medium text-muted-foreground transition-colors"
                            onClick={() => setShowEmailLogin(true)}
                        >
                            Sign in with email and password instead
                        </button>
                    </div>
                </>
            ) : (
                <>
                    <div className="grid gap-4">
                        <FloatingInput
                            name="email"
                            type="email"
                            label="Email Address"
                            required
                            placeholder=" "
                        />
                        
                        <FloatingPasswordInput
                            name="password"
                            label="Password"
                            required
                            placeholder=" "
                        />
                        
                        <Button
                            type="submit"
                            className={cn(
                                "auth-cta-button relative overflow-hidden transition-all duration-200 h-12 rounded-xl bg-primary text-primary-foreground hover:bg-primary/95 active:scale-[0.98] font-semibold mt-2 font-dmsans shadow-sm",
                                props.loading ? "cursor-wait opacity-90" : "cursor-pointer"
                            )}
                        >
                            <AnimatePresence mode="wait">
                                {props.loading ? (
                                    <motion.div
                                        key="loading-spinner"
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        transition={{ duration: 0.15 }}
                                        className="flex items-center justify-center w-full h-full"
                                    >
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                    </motion.div>
                                ) : (
                                    <motion.span
                                        key="cta-text"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.15 }}
                                    >
                                        Sign In
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </Button>
                    </div>

                    <div className="text-center mt-1">
                        <button
                            type="button"
                            className="text-xs font-semibold text-muted-foreground transition-colors"
                            onClick={() => setShowEmailLogin(false)}
                        >
                            Back to social sign-in
                        </button>
                    </div>
                </>
            )}

            <div className="text-center text-sm text-muted-foreground mt-2">
                Don&apos;t have an account?{" "}
                <Link href="/signup/" className="font-semibold text-foreground hover:underline transition-colors">
                    Create account
                </Link>
            </div>
        </form>
    );
}

// Sign Up Form
function SignUpForm(props: {
    handleGoogle: () => void;
    handleGithub: () => void;
    handleEmail: (name: string, email: string, password: string, role?: string) => void;
    loading: boolean;
    err: string | null;
    toggle: () => void;
}) {
    const [selectedRole, setSelectedRole] = useState<string>("");

    const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (props.loading) return;
        const data = new FormData(event.currentTarget);
        const name = data.get("name") as string;
        const email = data.get("email") as string;
        const password = data.get("password") as string;
        if (name && email && password) {
            props.handleEmail(name, email, password, selectedRole || undefined);
        }
    };

    return (
        <form
            onSubmit={onSubmit}
            autoComplete="on"
            className="flex flex-col gap-6 w-full font-dmsans"
            aria-describedby={props.err ? "auth-form-error" : undefined}
        >
            <div className="mt-1 flex flex-col gap-1 text-center">
                <h1 className="text-2xl font-semibold text-foreground tracking-[-0.03em] font-dmsans">Create account</h1>
                <p className="text-sm text-muted-foreground leading-relaxed font-dmsans">Get started with your quality journey</p>
            </div>

            {props.err && (
                <div id="auth-form-error" role="alert" className="auth-error rounded-xl p-3 text-sm text-center">
                    {props.err}
                </div>
            )}

            <div className="grid gap-4">
                <FloatingInput
                    name="name"
                    type="text"
                    label="Full Name"
                    required
                    placeholder=" "
                />
                <FloatingInput
                    name="email"
                    type="email"
                    label="Email Address"
                    required
                    placeholder=" "
                />
                <FloatingPasswordInput
                    name="password"
                    label="Password"
                    required
                    placeholder=" "
                    minLength={8}
                />
                
                <div className="grid gap-2 mt-1 relative w-full">
                    <Label className="text-xs text-muted-foreground font-medium font-dmsans">Account Role <span className="text-muted-foreground font-normal">(Optional)</span></Label>
                    <div className="relative w-full">
                        <Select
                            value={selectedRole || "__skip__"}
                            onValueChange={(v) => setSelectedRole(v === "__skip__" ? "" : v)}
                            disabled={props.loading}
                        >
                            <SelectTrigger
                                className="auth-glass-input h-12 w-full rounded-xl border text-foreground/90 focus:ring-0 [&>span]:line-clamp-1 relative z-10 font-dmsans focus:border-primary/50 transition-all"
                            >
                                <SelectValue placeholder="Select your role" />
                            </SelectTrigger>
                            <SelectContent 
                                data-section-theme="dark"
                                className="auth-select-dropdown border-border z-[100] !opacity-100 font-dmsans !bg-popover !backdrop-blur-none"
                            >
                                <SelectItem 
                                    value="__skip__" 
                                    className="text-foreground/70 shadow-none cursor-pointer !border-0 !bg-transparent hover:!bg-accent focus:!bg-accent data-[highlighted]:!bg-accent data-[highlighted]:!text-foreground"
                                    
                                >
                                    Select your role
                                </SelectItem>
                                <SelectItem 
                                    value="STUDENT" 
                                    className="text-foreground/90 shadow-none cursor-pointer !border-0 !bg-transparent hover:!bg-accent focus:!bg-accent data-[highlighted]:!bg-accent data-[highlighted]:!text-foreground"
                                    
                                >
                                    Student
                                </SelectItem>
                                <SelectItem 
                                    value="UNIVERSITY" 
                                    className="text-foreground/90 shadow-none cursor-pointer !border-0 !bg-transparent hover:!bg-accent focus:!bg-accent data-[highlighted]:!bg-accent data-[highlighted]:!text-foreground"
                                    
                                >
                                    University
                                </SelectItem>
                                <SelectItem 
                                    value="INSTITUTION" 
                                    className="text-foreground/90 shadow-none cursor-pointer !border-0 !bg-transparent hover:!bg-accent focus:!bg-accent data-[highlighted]:!bg-accent data-[highlighted]:!text-foreground"
                                    
                                >
                                    Institution
                                </SelectItem>
                                <SelectItem 
                                    value="TEACHER" 
                                    className="text-foreground/90 shadow-none cursor-pointer !border-0 !bg-transparent hover:!bg-accent focus:!bg-accent data-[highlighted]:!bg-accent data-[highlighted]:!text-foreground"
                                    
                                >
                                    Teacher
                                </SelectItem>
                                <SelectItem 
                                    value="OTHER" 
                                    className="text-foreground/90 shadow-none cursor-pointer !border-0 !bg-transparent hover:!bg-accent focus:!bg-accent data-[highlighted]:!bg-accent data-[highlighted]:!text-foreground"
                                    
                                >
                                    Other
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <Button
                    type="submit"
                    className={cn(
                        "auth-cta-button relative overflow-hidden transition-all duration-200 h-12 rounded-xl bg-primary text-primary-foreground hover:bg-primary/95 active:scale-[0.98] font-semibold mt-2 font-dmsans shadow-sm",
                        props.loading ? "cursor-wait opacity-90" : "cursor-pointer"
                    )}
                >
                    <AnimatePresence mode="wait">
                        {props.loading ? (
                            <motion.div
                                key="loading-spinner"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ duration: 0.15 }}
                                className="flex items-center justify-center w-full h-full"
                            >
                                <Loader2 className="h-5 w-5 animate-spin" />
                            </motion.div>
                        ) : (
                            <motion.span
                                key="cta-text"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.15 }}
                            >
                                Create Account
                            </motion.span>
                        )}
                    </AnimatePresence>
                </Button>
            </div>

            <div className="text-center text-sm text-muted-foreground mt-2">
                Already have an account?{" "}
                <Link href="/login/" className="font-semibold text-foreground hover:underline transition-colors">
                    Sign in
                </Link>
            </div>
        </form>
    );
}

export function AuthUI({ defaultMode = "signin" }: { defaultMode?: "signin" | "signup" }) {
    const { isArabic } = useUiLanguage();
    const logoVariant = "on-dark";
    const [isSignIn, setIsSignIn] = useState(defaultMode === "signin");
    const [isLoading, setIsLoading] = useState(false);
    const prefersReducedMotion = useReducedMotion();
    const [error, setError] = useState<string | null>(null);

    React.useEffect(() => {
        if (!supabase) return;
        const client = supabase;
        let hasProcessed = false;
        
        const { data: { subscription } } = client.auth.onAuthStateChange(async (event, session) => {
            if (event === "SIGNED_IN" && session?.access_token && !hasProcessed) {
                hasProcessed = true;
                setIsLoading(true);
                setError(null);
                try {
                    await api.syncWithSupabase(session.access_token);
                    await client.auth.signOut();
                    const redirectPath = sessionStorage.getItem("redirectAfterLogin");
                    sessionStorage.removeItem("redirectAfterLogin");
                    window.location.href = redirectPath || "/platform/dashboard";
                } catch (err) {
                    setError(err instanceof Error ? err.message : "Authentication failed");
                    setIsLoading(false);
                    hasProcessed = false;
                }
            }
        });
        return () => subscription.unsubscribe();
    }, []);

    const handleGoogleSignIn = async () => {
        if (!supabase) {
            setError("Google sign-in is temporarily unavailable.");
            return;
        }
        const client = supabase;
        setError(null);
        setIsLoading(true);
        try {
            const redirectPath = isSignIn ? "/login/" : "/signup/";
            const { error } = await client.auth.signInWithOAuth({
                provider: "google",
                options: { redirectTo: `${window.location.origin}${redirectPath}` },
            });
            if (error) throw error;
        } catch (err) {
            setError(err instanceof Error ? err.message : "Google sign-in failed");
            setIsLoading(false);
        }
    };

    const handleGithubSignIn = async () => {
        if (!supabase) {
            setError("GitHub sign-in is temporarily unavailable.");
            return;
        }
        const client = supabase;
        setError(null);
        setIsLoading(true);
        try {
            const redirectPath = isSignIn ? "/login/" : "/signup/";
            const { error } = await client.auth.signInWithOAuth({
                provider: "github",
                options: { redirectTo: `${window.location.origin}${redirectPath}` },
            });
            if (error) throw error;
        } catch (err) {
            setError(err instanceof Error ? err.message : "GitHub sign-in failed");
            setIsLoading(false);
        }
    };

    const onEmailSignIn = async (email: string, password: string) => {
        setError(null);
        setIsLoading(true);
        try {
            const response = await api.login(email, password);
            localStorage.setItem("access_token", response.access_token);
            localStorage.setItem("user", JSON.stringify(response.user));
            const redirectPath = sessionStorage.getItem("redirectAfterLogin");
            sessionStorage.removeItem("redirectAfterLogin");
            window.location.href = redirectPath || "/platform/dashboard";
        } catch (err) {
            setError(err instanceof Error ? err.message : "Login failed - Invalid credentials");
            setIsLoading(false);
        }
    };

    const onEmailSignUp = async (name: string, email: string, password: string, role?: string) => {
        setError(null);
        setIsLoading(true);
        try {
            const response = await api.register({ name, email, password, role });
            localStorage.setItem("access_token", response.access_token);
            localStorage.setItem("user", JSON.stringify(response.user));
            window.location.href = "/onboarding";
        } catch (err) {
            setError(err instanceof Error ? err.message : "Signup failed - Please try again");
            setIsLoading(false);
        }
    };

        return (
            <div className="relative min-h-screen w-full overflow-hidden" style={{ backgroundColor: "transparent" }}>
                <div
                    className="min-h-screen relative flex min-h-screen w-full flex-col bg-[#0A0A0A]"
                    data-section-theme="dark"
                >
                    <DarkCardNeuralBg />
                    <div className="dark-card-edge-glow" aria-hidden="true" />

                {/* Back — top of card, standard UX placement */}
                <div className="relative z-20 mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 pt-5 sm:px-8 lg:px-12 lg:pt-6">
                        <Link
                            href="/"
                            className="inline-flex min-h-11 min-w-11 items-center gap-2 rounded-lg px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground"
                            aria-label="Back to home"
                        >
                            <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
                            <span className="hidden sm:inline">Back to home</span>
                            <span className="sm:hidden">Back</span>
                        </Link>
                        <AynLogo size="nav" withGlow={false} variant={logoVariant} isArabic={isArabic} className="lg:hidden" />
                    </div>

                <div className="relative z-10 mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col items-center justify-center px-4 pb-10 pt-2 sm:px-8 lg:px-12 lg:pb-12 xl:px-16">
                    <motion.div
                        layout
                        initial={prefersReducedMotion ? false : { opacity: 0, y: 16, scale: 0.99 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                        className={cn(
                            "auth-glass-card relative w-full overflow-hidden rounded-[28px] md:rounded-[32px]",
                            !isSignIn && "auth-glass-card-signup"
                        )}
                    >
                        <div className="relative z-10 flex flex-col lg:flex-row lg:items-stretch">
                            {/* LEFT: Branding (desktop) */}
                            <div className="hidden lg:flex lg:flex-1 lg:flex-col lg:justify-center lg:border-r lg:border-border p-8 xl:p-10 font-dmsans">
                                <AynLogo size="nav" withGlow={false} variant={logoVariant} isArabic={isArabic} className="mb-6 justify-start" />

                                <h2 className="mb-4 text-4xl font-semibold leading-tight tracking-[-0.03em] text-foreground">
                                    AI-Powered Quality Assurance & Compliance Excellence
                                </h2>

                                <p className="mb-8 text-sm leading-relaxed text-muted-foreground">
                                    Powered by the Horus Engine to seamlessly align institutional curriculums, assessments, and document evidence with ISO 21001 and NAQAAE standards.
                                </p>

                                <div className="flex flex-col gap-6">
                                    <div className="flex items-start gap-4">
                                        <div className="auth-chip mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
                                            <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-semibold text-foreground">Automated Standards Compliance</h4>
                                            <p className="mt-0.5 text-xs text-muted-foreground">Validate compliance and prepare academic files for audits in minutes rather than months.</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <div className="auth-chip mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
                                            <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-semibold text-foreground">Horus AI Gap Analysis</h4>
                                            <p className="mt-0.5 text-xs text-muted-foreground">Identify structural and informational gaps in courses, programs, and specifications instantly.</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <div className="auth-chip mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
                                            <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-semibold text-foreground">Actionable Analytics</h4>
                                            <p className="mt-0.5 text-xs text-muted-foreground">Track institutional performance, course completion indexes, and upload progress via interactive reports.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT: Auth form */}
                            <div className={cn(
                                "flex w-full flex-1 items-center justify-center p-8 sm:p-9 lg:p-10",
                                isSignIn ? "lg:max-w-[440px]" : "lg:max-w-[480px]"
                            )}>
                                <AnimatePresence mode="wait">
                                    {isSignIn ? (
                                        <motion.div
                                            key="signin-form"
                                            initial={{ opacity: 0, y: 15 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -15 }}
                                            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                                            className="w-full max-w-[92vw] sm:max-w-[420px]"
                                        >
                                            <SignInForm
                                                handleGoogle={handleGoogleSignIn}
                                                handleGithub={handleGithubSignIn}
                                                handleEmail={onEmailSignIn}
                                                loading={isLoading}
                                                err={error}
                                                toggle={() => setIsSignIn(false)}
                                            />
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="signup-form"
                                            initial={{ opacity: 0, y: 15 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -15 }}
                                            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                                            className="w-full max-w-[92vw] sm:max-w-[460px]"
                                        >
                                            <SignUpForm
                                                handleGoogle={handleGoogleSignIn}
                                                handleGithub={handleGithubSignIn}
                                                handleEmail={onEmailSignUp}
                                                loading={isLoading}
                                                err={error}
                                                toggle={() => setIsSignIn(true)}
                                            />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
