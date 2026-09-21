import { listTasks, listProjects } from "@/lib/store";
import { TasksClient } from "@/components/tasks/tasks-client";

export default async function TasksPage({
    searchParams,
}: {
    searchParams: Promise<{ projectId?: string }>;
}) {
    const { projectId } = await searchParams;
    const tasks = listTasks(projectId);
    const projects = listProjects();
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