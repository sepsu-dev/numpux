"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { EnvelopeSimple, Lock, SpinnerGap, ArrowLeft, WarningCircle } from "@phosphor-icons/react";
import { useActionState, Suspense } from "react";
import { login } from "@/lib/actions";

function LoginErrorBanner() {
    const searchParams = useSearchParams();
    const error = searchParams.get("error");
    if (!error) return null;

    return (
        <div className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs flex items-start gap-2 text-left">
            <WarningCircle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
        </div>
    );
}

export default function LoginPage() {
    const [state, formAction, isPending] = useActionState(login, undefined);

    return (
        <div className="min-h-screen bg-background flex flex-col relative">
            <div className="absolute top-6 left-6">
                <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back to Home
                </Link>
            </div>

            <div className="flex-1 flex flex-col justify-center items-center px-4 py-12">
                <div className="w-full max-w-[380px]">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold text-foreground tracking-tight">
                            Sign in to <span className="lowercase font-bold">numpux</span>
                        </h1>
                        <p className="text-xs text-muted-foreground mt-1.5">Enter your email and password to access your workspace</p>
                    </div>

                    <div className="bg-card rounded-xl border border-border/80 p-6 shadow-2xs">
                        <Suspense fallback={null}>
                            <LoginErrorBanner />
                        </Suspense>

                        {/* Google Sign In Button */}
                        <button
                            type="button"
                            onClick={() => {
                                // Placeholder for Google OAuth provider integration
                                window.location.href = "/api/auth/google";
                            }}
                            className="w-full py-2.5 px-3 rounded-lg border border-border bg-background hover:bg-muted/50 text-foreground font-medium text-xs flex items-center justify-center gap-2.5 cursor-pointer transition-colors shadow-2xs"
                        >
                            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                                />
                                <path
                                    fill="#EA4335"
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                                />
                            </svg>
                            <span>Continue with Google</span>
                        </button>

                        <div className="relative my-4">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-border/80" />
                            </div>
                            <div className="relative flex justify-center text-[10px] uppercase">
                                <span className="bg-card px-2 text-muted-foreground">or continue with email</span>
                            </div>
                        </div>

                        <form action={formAction} className="space-y-4">
                            <div className="space-y-1.5 text-left">
                                 <label className="text-xs font-medium text-foreground">Email</label>
                                 <div className="relative">
                                     <EnvelopeSimple className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                     <input
                                         type="email"
                                         name="email"
                                         required
                                         placeholder="name@company.com"
                                         className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-xs text-foreground placeholder:text-muted-foreground/60 transition-colors"
                                     />
                                 </div>
                            </div>

                            <div className="space-y-1.5 text-left">
                                <div className="flex justify-between items-center">
                                    <label className="text-xs font-medium text-foreground">Password</label>
                                    <Link href="#" className="text-xs text-muted-foreground hover:text-primary transition-colors">Forgot?</Link>
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <input
                                         type="password"
                                         name="password"
                                         required
                                         placeholder="••••••••"
                                         className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-xs text-foreground placeholder:text-muted-foreground/60 transition-colors"
                                    />
                                </div>
                            </div>

                            {state?.message && (
                                <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
                                    {state.message}
                                </p>
                            )}

                            <button
                                type="submit"
                                disabled={isPending}
                                className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-xs disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer transition-all hover:bg-primary/90 active:scale-98 shadow-2xs mt-2"
                            >
                                {isPending ? (
                                    <>
                                        <SpinnerGap className="w-3.5 h-3.5 animate-spin" />
                                        Signing in...
                                    </>
                                ) : (
                                    "Sign In"
                                )}
                            </button>
                        </form>
                    </div>

                    <p className="mt-5 text-center text-xs text-muted-foreground">
                        Don't have an account?{" "}
                        <Link href="/register" className="font-semibold text-primary hover:underline underline-offset-4">
                            Sign up free
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}