"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { EnvelopeSimple, Lock, SpinnerGap, WarningCircle } from "@phosphor-icons/react";
import { Suspense, useActionState } from "react";
import { login } from "@/lib/actions";
import { AuthShell, GoogleMark } from "@/components/auth/auth-shell";

function LoginErrorBanner() {
  const error = useSearchParams().get("error");
  if (!error) return null;
  return <div className="mb-5 flex items-start gap-2 border-l-4 border-[#ffb000] bg-[#fff7df] p-3 text-xs text-[#674d00]"><WarningCircle size={16} className="mt-0.5 shrink-0" weight="fill" /><span>{error}</span></div>;
}

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(login, undefined);

  return (
    <AuthShell title="Welcome back" description="Sign in to continue with your projects and tasks.">
      <Suspense fallback={null}><LoginErrorBanner /></Suspense>

      <button type="button" onClick={() => { window.location.href = "/api/auth/google"; }} className="flex h-11 w-full items-center justify-center gap-2.5 rounded-lg border border-input bg-white text-xs font-medium text-foreground transition-colors hover:border-[#9cbce3] hover:bg-[#f8fbff]">
        <GoogleMark /> Continue with Google
      </button>

      <div className="my-6 flex items-center gap-3"><div className="h-px flex-1 bg-border" /><span className="text-[10px] text-muted-foreground">or use email</span><div className="h-px flex-1 bg-border" /></div>

      <form action={formAction} className="space-y-5">
        <Field label="Email address" icon={EnvelopeSimple}><input type="email" name="email" autoComplete="email" required placeholder="name@company.com" className="auth-input" /></Field>
        <Field label="Password" icon={Lock} trailing={<Link href="#" className="text-[11px] font-medium text-[#1677ff] hover:underline">Forgot password?</Link>}><input type="password" name="password" autoComplete="current-password" required placeholder="Enter your password" className="auth-input" /></Field>

        {state?.message && <p className="border-l-4 border-destructive bg-red-50 px-3 py-2.5 text-xs text-destructive">{state.message}</p>}

        <button type="submit" disabled={isPending} className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-xs font-semibold text-white transition-colors hover:bg-[#067a4b] disabled:cursor-not-allowed disabled:opacity-60">
          {isPending ? <><SpinnerGap className="h-4 w-4 animate-spin" /> Signing in...</> : "Sign in"}
        </button>
      </form>

      <p className="mt-7 text-center text-xs text-muted-foreground">New to Numpux? <Link href="/register" className="font-medium text-primary hover:underline">Create a free account</Link></p>
    </AuthShell>
  );
}

function Field({ label, icon: Icon, trailing, children }: { label: string; icon: typeof EnvelopeSimple; trailing?: React.ReactNode; children: React.ReactNode }) {
  return <label className="block"><span className="mb-2 flex items-center justify-between text-xs font-medium text-foreground"><span>{label}</span>{trailing}</span><span className="relative block"><Icon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />{children}</span></label>;
}
