import { listTasks, listProjects } from "@/lib/store";
import { getSession } from "@/lib/session";
import { TasksClient } from "@/components/tasks/tasks-client";

export default async function TasksPage({
    searchParams,
}: {
    searchParams: Promise<{ projectId?: string }>;
}) {
    const session = await getSession();
    let { projectId } = await searchParams;
    const projects = await listProjects(session?.userId);

    // If user has exactly 1 project, auto-select it instead of showing "All Projects"
    if (!projectId && projects.length === 1) {
        projectId = projects[0].id;
    }

    const tasks = await listTasks(session?.userId, projectId);
    const activeProject = projectId ? projects.find((p) => p.id === projectId) : undefined;

    return (
        <TasksClient
            tasks={tasks}
            projects={projects}
            activeProjectId={projectId}
            activeProjectTitle={activeProject?.title}
        />
    );
}