import { redirect } from "next/navigation";

export default async function TasksPage({
    searchParams,
}: {
    searchParams: Promise<{ projectId?: string }>;
}) {
    const { projectId } = await searchParams;
    redirect(projectId ? `/tasks/backlog?projectId=${encodeURIComponent(projectId)}` : "/tasks/backlog");
}