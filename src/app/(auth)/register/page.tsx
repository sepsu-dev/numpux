"use client";

import Link from "next/link";
import { EnvelopeSimple, Lock, SpinnerGap, User } from "@phosphor-icons/react";
import { useActionState } from "react";
import { register } from "@/lib/actions";
import { AuthShell, GoogleMark } from "@/components/auth/auth-shell";

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(register, undefined);

  return (
    <AuthShell title="Start simple" description="A calm place for your own projects or a small team.">
      <button type="button" onClick={() => { window.location.href = "/api/auth/google"; }} className="flex h-11 w-full items-center justify-center gap-2.5 rounded-lg border border-input bg-white text-xs font-medium text-foreground transition-colors hover:border-[#9cbce3] hover:bg-[#f8fbff]">
        <GoogleMark /> Sign up with Google
      </button>

      <div className="my-6 flex items-center gap-3"><div className="h-px flex-1 bg-border" /><span className="text-[10px] text-muted-foreground">or use email</span><div className="h-px flex-1 bg-border" /></div>

      <form action={formAction} className="space-y-4">
        <Field label="Your name" icon={User}><input name="name" autoComplete="name" required placeholder="Enter your name" className="auth-input" /></Field>
        <Field label="Email address" icon={EnvelopeSimple}><input type="email" name="email" autoComplete="email" required placeholder="name@example.com" className="auth-input" /></Field>
        <Field label="Password" icon={Lock}><input type="password" name="password" autoComplete="new-password" required minLength={8} placeholder="At least 8 characters" className="auth-input" /></Field>

        {state?.message && <p className="border-l-4 border-destructive bg-red-50 px-3 py-2.5 text-xs text-destructive">{state.message}</p>}

        <button type="submit" disabled={isPending} className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-xs font-semibold text-white transition-colors hover:bg-[#067a4b] disabled:cursor-not-allowed disabled:opacity-60">
          {isPending ? <><SpinnerGap className="h-4 w-4 animate-spin" /> Creating account...</> : "Create account"}
        </button>
      </form>

      <p className="mt-5 text-center text-xs text-muted-foreground">Already have an account? <Link href="/login" className="font-medium text-primary hover:underline">Sign in</Link></p>
    </AuthShell>
  );
}

function Field({ label, icon: Icon, children }: { label: string; icon: typeof User; children: React.ReactNode }) {
  return <label className="block"><span className="mb-2 block text-xs font-medium text-foreground">{label}</span><span className="relative block"><Icon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />{children}</span></label>;
}
