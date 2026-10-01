"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, SpinnerGap } from "@phosphor-icons/react";
import { useActionState } from "react";
import { register } from "@/lib/actions";

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.07 5.07 0 0 1-2.2 3.31v2.77h3.56c2.08-1.92 3.28-4.74 3.28-8.09Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.77c-.99.66-2.24 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.49 12c0-.73.13-1.43.35-2.1V7.07H2.18A11 11 0 0 0 1 12c0 1.78.43 3.45 1.18 4.94l3.66-2.84Z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.58 10.58 0 0 0 12 1a11 11 0 0 0-9.82 6.06L5.84 9.9c.87-2.6 3.3-4.52 6.16-4.52Z" />
    </svg>
  );
}

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(register, undefined);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-6 sm:px-8">
      <div className="flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo-v2.png" alt="" width={28} height={28} />
          <span className="text-sm font-semibold">Numpux</span>
        </Link>
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft size={14} /> Back to home
        </Link>
      </div>

      <div className="flex flex-1 items-center justify-center py-12">
        <div className="w-full max-w-sm">
          <div className="mb-7">
            <h1 className="text-2xl font-semibold tracking-[-0.03em]">Create your account</h1>
            <p className="mt-2 text-sm text-muted-foreground">Set up your workspace and add your first project.</p>
          </div>

          <div className="border border-border bg-white p-6">
            <button type="button" onClick={() => { window.location.href = "/api/auth/google"; }} className="flex h-10 w-full items-center justify-center gap-2.5 rounded-md border border-input bg-white text-sm font-medium hover:bg-muted">
              <GoogleIcon /> Continue with Google
            </button>

            <div className="my-5 flex items-center gap-3 text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
              <span className="h-px flex-1 bg-border" /> or use email <span className="h-px flex-1 bg-border" />
            </div>

            <form action={formAction} className="space-y-4">
              <label className="block space-y-1.5 text-xs font-medium">
                <span>Full name</span>
                <input name="name" autoComplete="name" required placeholder="Your name" className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/15" />
              </label>
              <label className="block space-y-1.5 text-xs font-medium">
                <span>Email address</span>
                <input type="email" name="email" autoComplete="email" required placeholder="you@company.com" className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/15" />
              </label>
              <label className="block space-y-1.5 text-xs font-medium">
                <span>Password</span>
                <input type="password" name="password" autoComplete="new-password" minLength={6} required placeholder="At least 6 characters" className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/15" />
              </label>

              {state?.message && <p className="border border-red-200 bg-red-50 p-3 text-xs text-destructive">{state.message}</p>}

              <button type="submit" disabled={isPending} className="flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-60">
                {isPending && <SpinnerGap size={16} className="animate-spin" />}
                {isPending ? "Creating account…" : "Create account"}
              </button>
            </form>
          </div>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            Already have an account? <Link href="/login" className="font-medium text-primary hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
