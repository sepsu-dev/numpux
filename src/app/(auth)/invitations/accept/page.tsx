"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { CheckCircle, EnvelopeSimple, SpinnerGap, WarningCircle } from "@phosphor-icons/react";
import { apiFetch } from "@/lib/api-client";

type Invitation = {
  email: string;
  workspaceName: string;
  projectName: string | null;
  projectRole: string | null;
  inviterName: string;
  status: string;
  expiresAt: string;
};

function InvitationContent() {
  const token = useSearchParams().get("token") || "";
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!token) { setMessage("Invitation token is missing."); setLoading(false); return; }
    Promise.all([
      apiFetch(`/api/invitations?token=${encodeURIComponent(token)}`).then(async (response) => ({ response, body: await response.json() })),
      apiFetch("/api/auth/me").then((response) => response.ok).catch(() => false),
    ]).then(([invite, signedIn]) => {
      if (!invite.response.ok) setMessage(invite.body.message || "Invitation could not be loaded.");
      else setInvitation(invite.body.data);
      setAuthenticated(signedIn);
    }).finally(() => setLoading(false));
  }, [token]);

  const accept = async () => {
    setAccepting(true);
    const response = await apiFetch("/api/invitations", { method: "POST", body: JSON.stringify({ token }) });
    const body = await response.json();
    if (!response.ok) { setMessage(body.message || "Failed to accept invitation."); setAccepting(false); return; }
    window.location.href = body.data.projectId ? `/tasks/kanban?projectId=${body.data.projectId}` : "/projects";
  };

  if (loading) return <div className="flex items-center gap-2 text-sm text-muted-foreground"><SpinnerGap className="animate-spin" /> Loading invitation...</div>;

  const inactive = invitation && invitation.status !== "pending";
  const returnPath = `/invitations/accept?token=${encodeURIComponent(token)}`;
  return (
    <div className="w-full max-w-md rounded-xl border border-border bg-white p-7">
      <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><EnvelopeSimple size={22} weight="bold" /></div>
      <h1 className="text-xl font-bold tracking-tight">Project invitation</h1>
      {invitation && <div className="mt-4 space-y-3 rounded-lg border border-border bg-muted/20 p-4 text-sm">
        <p><span className="text-muted-foreground">Invited by:</span> <strong>{invitation.inviterName}</strong></p>
        <p><span className="text-muted-foreground">Workspace:</span> <strong>{invitation.workspaceName}</strong></p>
        {invitation.projectName && <p><span className="text-muted-foreground">Project:</span> <strong>{invitation.projectName}</strong></p>}
        <p><span className="text-muted-foreground">Role:</span> <strong className="capitalize">{invitation.projectRole || "Contributor"}</strong></p>
        <p className="text-xs text-muted-foreground">This invitation was sent to {invitation.email}.</p>
      </div>}
      {message && <div className="mt-4 flex gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700"><WarningCircle size={16} className="shrink-0" />{message}</div>}
      {inactive && <div className="mt-4 flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800"><WarningCircle size={16} />This invitation is {invitation.status}.</div>}
      {invitation && !inactive && <div className="mt-6">
        {authenticated ? (
          <button type="button" onClick={() => void accept()} disabled={accepting} className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-white disabled:opacity-60">
            {accepting ? <SpinnerGap size={16} className="animate-spin" /> : <CheckCircle size={16} />} {accepting ? "Accepting..." : "Accept invitation"}
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <Link href={`/login?next=${encodeURIComponent(returnPath)}`} className="flex h-10 items-center justify-center rounded-lg border border-border text-sm font-semibold">Sign in</Link>
            <Link href={`/register?invitation=${encodeURIComponent(token)}`} className="flex h-10 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-white">Create account</Link>
          </div>
        )}
      </div>}
    </div>
  );
}

export default function AcceptInvitationPage() {
  return <main className="flex min-h-screen items-center justify-center bg-muted/20 px-5"><Suspense fallback={<SpinnerGap className="animate-spin text-primary" />}><InvitationContent /></Suspense></main>;
}
