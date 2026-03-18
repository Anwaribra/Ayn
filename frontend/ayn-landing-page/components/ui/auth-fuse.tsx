"use client";

import * as React from "react";
import { useState, useId } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Eye, EyeOff, Loader2, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
                <div className="relative">
                    <Input
                        id={id}
                        type={showPassword ? "text" : "password"}
                        className={cn(
                            "auth-glass-input peer pe-10 h-11 rounded-xl border-white/12 bg-transparent text-foreground placeholder:text-transparent focus:border-primary focus:ring-0",
                            className
                        )}
                        ref={ref}
                        {...props}
                    />
                    {label && (
                        <Label
                            htmlFor={id}
                            className="auth-floating-label pointer-events-none absolute left-4 top-4 z-10 rounded-md px-1.5 text-sm transition-all peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-primary peer-focus:px-1.5 peer-[&:not(:placeholder-shown)]:-top-2.5 peer-[&:not(:placeholder-shown)]:text-xs peer-[&:not(:placeholder-shown)]:text-white/80 peer-[&:not(:placeholder-shown)]:px-1.5"
                        >
                            {label}
                        </Label>
                    )}
                    <button
                        type="button"
                        onClick={togglePasswordVisibility}
                        className="absolute inset-y-0 end-0 flex h-full w-10 items-center justify-center text-white/60 transition-colors hover:text-white focus-visible:outline-none"
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
            <Link href="/" className="auth-back-link inline-flex items-center gap-2 text-sm text-white/84 hover:text-white">
                <ArrowLeft className="w-4 h-4" />
                Back to Home
            </Link>

            <div className="flex items-center justify-center gap-3">
                <span className="auth-logo-gradient select-none text-2xl font-bold tracking-tight text-white">
                    Ayn
                </span>
            </div>

            <div className="flex flex-col gap-2 text-center">
                <h1 className="text-2xl font-semibold text-white">Welcome back</h1>
                <p className="text-sm text-white/72">Sign in to continue to your dashboard</p>
            </div>

            {props.err && (
                <div id="auth-form-error" role="alert" className="auth-error rounded-xl p-3 text-sm">
                    {props.err}
                </div>
            )}

            <div className="flex flex-col gap-3">
                {/* Google OAuth */}
                <Button variant="outline" type="button" onClick={props.handleGoogle} disabled={props.loading} className="auth-glass-button w-full h-11 rounded-xl border-white/12 text-white transition-colors justify-center font-medium">
                    <GoogleIcon className="mr-2 h-4 w-4" />
                    Continue with Google
                </Button>
                {/* Microsoft OAuth */}
                <Button variant="outline" type="button" disabled className="auth-glass-button auth-microsoft-btn w-full h-11 rounded-xl text-white/72 cursor-not-allowed justify-center font-medium opacity-80">
                    <MicrosoftIcon className="mr-2 h-4 w-4 opacity-70" />
                    Continue with Microsoft
                    <span className="ml-2 auth-coming-soon">Coming Soon</span>
                </Button>
            </div>

            <div className="relative text-center text-xs">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t auth-divider-line" />
                </div>
                <span className="auth-divider-pill relative z-10 rounded-full px-3 text-xs font-medium uppercase tracking-widest text-white/78">Or sign in with email</span>
            </div>

            {/* Email / Password fields */}
            <div className="grid gap-4 mt-2">
                <div className="relative group">
                    <Input id={emailId} name="email" type="email" required placeholder=" " className="auth-glass-input peer h-14 rounded-xl text-white focus:border-primary focus:ring-0 pt-4 pb-2 px-4 transition-all" aria-invalid={!!props.err} disabled={props.loading} />
                    <Label htmlFor={emailId} className="auth-floating-label absolute left-4 top-4 rounded-md px-1.5 text-sm transition-all peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-primary peer-focus:px-1.5 peer-valid:-top-2.5 peer-valid:text-xs peer-valid:text-white/80 peer-valid:px-1.5 pointer-events-none">Email Address</Label>
                </div>
                <div className="relative group">
                    <PasswordInput name="password" label="Password" required placeholder=" " className="h-14 rounded-xl text-white pt-4 pb-2 px-4 transition-all" aria-invalid={!!props.err} disabled={props.loading} />
                </div>
                <Button type="submit" className="auth-cta-button h-11 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-semibold mt-2" disabled={props.loading}>
                    {props.loading ? (
                        <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Signing in...
                        </div>
                    ) : "Sign In"}
                </Button>
            </div>

            <div className="text-center text-sm text-white/72">
                Don&apos;t have an account?{" "}
                <button type="button" className="font-medium text-white hover:underline" onClick={props.toggle}>
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

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.06, delayChildren: 0.1 },
        },
    };
    const itemVariants = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } };

    return (
        <motion.form
            onSubmit={onSubmit}
            autoComplete="on"
            className="flex flex-col gap-6 w-full max-w-[360px]"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            aria-describedby={props.err ? "auth-form-error" : undefined}
        >
            <motion.div variants={itemVariants}>
                <Link href="/" className="auth-back-link inline-flex items-center gap-2 text-sm text-white/84 hover:text-white">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Home
                </Link>
            </motion.div>

            <motion.div variants={itemVariants} className="flex items-center justify-center gap-3">
                <span className="auth-logo-gradient select-none text-2xl font-bold tracking-tight text-white">
                    Ayn
                </span>
            </motion.div>

            <motion.div variants={itemVariants} className="flex flex-col gap-2 text-center">
                <h1 className="text-2xl font-semibold text-white">Create your account</h1>
                <p className="text-sm text-white/72">Get started with your quality journey</p>
            </motion.div>

            {props.err && (
                <motion.div variants={itemVariants} id="auth-form-error" role="alert" className="auth-error rounded-xl p-3 text-sm">
                    {props.err}
                </motion.div>
            )}

            <motion.div variants={itemVariants} className="flex flex-col gap-3">
                {/* Google OAuth */}
                <Button variant="outline" type="button" onClick={props.handleGoogle} disabled={props.loading} className="auth-glass-button w-full h-11 rounded-xl border-white/12 text-white transition-colors justify-center font-medium">
                    <GoogleIcon className="mr-2 h-4 w-4" />
                    Continue with Google
                </Button>
                {/* Microsoft OAuth */}
                <Button variant="outline" type="button" disabled className="auth-glass-button auth-microsoft-btn w-full h-11 rounded-xl text-white/72 cursor-not-allowed justify-center font-medium opacity-80">
                    <MicrosoftIcon className="mr-2 h-4 w-4 opacity-70" />
                    Continue with Microsoft
                    <span className="ml-2 auth-coming-soon">Coming Soon</span>
                </Button>
            </motion.div>

            <motion.div variants={itemVariants} className="relative text-center text-xs">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t auth-divider-line" />
                </div>
                <span className="auth-divider-pill relative z-10 rounded-full px-3 text-xs font-medium uppercase tracking-widest text-white/78">Or create with email</span>
            </motion.div>

            <motion.div variants={itemVariants} className="grid gap-4 mt-2">
                <div className="relative group">
                    <Input id={nameId} name="name" type="text" required placeholder=" " className="auth-glass-input peer h-14 rounded-xl text-white focus:border-primary focus:ring-0 pt-4 pb-2 px-4 transition-all" aria-invalid={!!props.err} disabled={props.loading} />
                    <Label htmlFor={nameId} className="auth-floating-label absolute left-4 top-4 rounded-md px-1.5 text-sm transition-all peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-primary peer-focus:px-1.5 peer-valid:-top-2.5 peer-valid:text-xs peer-valid:text-white/80 peer-valid:px-1.5 pointer-events-none">Full Name</Label>
                </div>
                <div className="relative group">
                    <Input id={emailId} name="email" type="email" required placeholder=" " className="auth-glass-input peer h-14 rounded-xl text-white focus:border-primary focus:ring-0 pt-4 pb-2 px-4 transition-all" aria-invalid={!!props.err} disabled={props.loading} />
                    <Label htmlFor={emailId} className="auth-floating-label absolute left-4 top-4 rounded-md px-1.5 text-sm transition-all peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-primary peer-focus:px-1.5 peer-valid:-top-2.5 peer-valid:text-xs peer-valid:text-white/80 peer-valid:px-1.5 pointer-events-none">Email Address</Label>
                </div>
                <div className="relative group">
                    <PasswordInput
                        name="password"
                        label="Password"
                        required
                        placeholder=" "
                        minLength={8}
                        className="h-14 rounded-xl text-white pt-4 pb-2 px-4 transition-all"
                        aria-invalid={!!props.err}
                        disabled={props.loading}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    {password.length > 0 && (
                        <div className="auth-password-rules mt-1 flex flex-col gap-1.5">
                            <div className="flex items-center gap-2 text-xs">
                                <div className={cn("auth-rule-dot flex h-3 w-3 items-center justify-center rounded-full border", password.length >= 8 ? "bg-emerald-500/20 text-emerald-600 border-emerald-500/30" : "")}>
                                    {password.length >= 8 && <svg className="w-2 h-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                                </div>
                                <span className={password.length >= 8 ? "text-emerald-400 font-medium" : "text-white/72"}>At least 8 characters</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                                <div className={cn("auth-rule-dot flex h-3 w-3 items-center justify-center rounded-full border", /[A-Z]/.test(password) ? "bg-emerald-500/20 text-emerald-600 border-emerald-500/30" : "")}>
                                    {/[A-Z]/.test(password) && <svg className="w-2 h-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                                </div>
                                <span className={/[A-Z]/.test(password) ? "text-emerald-400 font-medium" : "text-white/72"}>One uppercase letter</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                                <div className={cn("auth-rule-dot flex h-3 w-3 items-center justify-center rounded-full border", /[!@#$%^&*(),.?":{}|<>]/.test(password) ? "bg-emerald-500/20 text-emerald-600 border-emerald-500/30" : "")}>
                                    {/[!@#$%^&*(),.?":{}|<>]/.test(password) && <svg className="w-2 h-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                                </div>
                                <span className={/[!@#$%^&*(),.?":{}|<>]/.test(password) ? "text-emerald-400 font-medium" : "text-white/72"}>One special character</span>
                            </div>
                        </div>
                    )}
                </div>
                <div className="grid gap-2">
                    <Label className="text-sm text-white/90">Account Role <span className="text-white/65 font-normal">(Optional)</span></Label>
                    <Select value={selectedRole || "__skip__"} onValueChange={(v) => setSelectedRole(v === "__skip__" ? "" : v)} disabled={props.loading}>
                        <SelectTrigger className="auth-glass-input h-12 w-full rounded-xl border-white/12 text-white/90 focus:ring-0 [&>span]:line-clamp-1">
                            <SelectValue placeholder="Select your role" />
                        </SelectTrigger>
                        <SelectContent className="dark auth-select-dropdown">
                            <SelectItem value="__skip__" className="border-transparent text-white/72 shadow-none data-[highlighted]:border-transparent data-[highlighted]:bg-white/6 data-[highlighted]:shadow-none focus:bg-white/6 focus:text-white">
                                Select your role
                            </SelectItem>
                            <SelectItem value="STUDENT" className="border-transparent text-white/90 shadow-none data-[highlighted]:border-transparent data-[highlighted]:bg-white/6 data-[highlighted]:shadow-none focus:bg-white/6 focus:text-white">Student</SelectItem>
                            <SelectItem value="UNIVERSITY" className="border-transparent text-white/90 shadow-none data-[highlighted]:border-transparent data-[highlighted]:bg-white/6 data-[highlighted]:shadow-none focus:bg-white/6 focus:text-white">University</SelectItem>
                            <SelectItem value="INSTITUTION" className="border-transparent text-white/90 shadow-none data-[highlighted]:border-transparent data-[highlighted]:bg-white/6 data-[highlighted]:shadow-none focus:bg-white/6 focus:text-white">Institution</SelectItem>
                            <SelectItem value="TEACHER" className="border-transparent text-white/90 shadow-none data-[highlighted]:border-transparent data-[highlighted]:bg-white/6 data-[highlighted]:shadow-none focus:bg-white/6 focus:text-white">Teacher</SelectItem>
                            <SelectItem value="OTHER" className="border-transparent text-white/90 shadow-none data-[highlighted]:border-transparent data-[highlighted]:bg-white/6 data-[highlighted]:shadow-none focus:bg-white/6 focus:text-white">Other</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <Button type="submit" className="auth-cta-button h-11 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-semibold mt-2" disabled={props.loading}>
                    {props.loading ? (
                        <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Creating account...
                        </div>
                    ) : "Create Account"}
                </Button>
            </motion.div>

            <motion.div variants={itemVariants} className="text-center text-sm text-white/72">
                Already have an account?{" "}
                <button type="button" className="font-medium text-white hover:underline" onClick={props.toggle}>
                    Sign in
                </button>
            </motion.div>
        </motion.form>
    );
}

export function AuthUI({ defaultMode = "signin" }: { defaultMode?: "signin" | "signup" }) {
    const [isSignIn, setIsSignIn] = useState(defaultMode === "signin");
    const isSignUp = !isSignIn;
    const [isLoading, setIsLoading] = useState(false);
    const prefersReducedMotion = useReducedMotion();
    const [error, setError] = useState<string | null>(null);

    // Listen for Supabase auth state changes (handles OAuth redirects)
    React.useEffect(() => {
        let hasProcessed = false;
        log("[Auth] Setting up auth state listener...");
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === "SIGNED_IN" && session?.access_token && !hasProcessed) {
                hasProcessed = true;
                log("[Auth] User signed in via OAuth, syncing with backend...");
                setIsLoading(true);
                setError(null);
                try {
                    await api.syncWithSupabase(session.access_token);
                    log("[Auth] Sync successful, clearing Supabase session...");
                    await supabase.auth.signOut();
                    const redirectPath = sessionStorage.getItem("redirectAfterLogin");
                    sessionStorage.removeItem("redirectAfterLogin");
                    window.location.href = redirectPath || "/platform/dashboard";
                } catch (err) {
                    console.error("[Auth] Sync failed:", err);
                    setError(err instanceof Error ? err.message : "Authentication failed");
                    setIsLoading(false);
                    hasProcessed = false;
                }
            }
        });
        return () => subscription.unsubscribe();
    }, []);

    const handleGoogleSignIn = async () => {
        setError(null);
        setIsLoading(true);
        log("[Auth] Starting Supabase Google OAuth...");
        try {
            const redirectPath = isSignIn ? "/login" : "/signup";
            const { error } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: { redirectTo: `${window.location.origin}${redirectPath}` },
            });
            if (error) throw error;
            log("[Auth] Redirecting to Google...");
        } catch (err) {
            console.error("[Auth] Google Sign-In failed:", err);
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
        <div className="dark relative min-h-screen w-full overflow-hidden bg-background">
            {/* Full-screen dashboard background */}
            <div className="absolute inset-0">
                <img
                    src="/dashboard-preview.png"
                    alt=""
                    className="auth-bg-image w-full h-full object-cover object-top"
                    draggable={false}
                    aria-hidden="true"
                />
                {/* Softer blur + dim overlay */}
                <div className="absolute inset-0 auth-backdrop" />
                {/* Subtle color tint */}
                <div className="absolute inset-0 auth-tint" />
                {/* Ambient orbs for depth */}
                <div className="auth-orb auth-orb-1" />
                <div className="auth-orb auth-orb-2" />
                <div className="auth-orb auth-orb-3" />
            </div>

            {/* Liquid glass form card — centered */}
            <div className="relative z-10 flex min-h-screen items-center justify-center p-4 sm:p-6">
                <motion.div
                    initial={prefersReducedMotion ? false : { opacity: 0, y: 20, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className={cn(
                        "auth-glass-card w-full rounded-3xl p-8 sm:p-10 relative",
                        isSignUp ? "max-w-[500px] auth-glass-card-signup" : "max-w-[460px]"
                    )}
                >
                    <div className="pointer-events-none absolute -top-24 left-1/2 h-24 w-2/3 -translate-x-1/2 rounded-full auth-card-highlight blur-2xl" />
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
                </motion.div>
            </div>
        </div>
    );
}

export { PasswordInput };
