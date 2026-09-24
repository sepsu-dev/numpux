import { listProjects } from "@/lib/store";
import { getSession } from "@/lib/session";
import { ProjectsClient } from "@/components/projects/projects-client";

export default async function ProjectsPage() {
    const session = await getSession();
    const projects = await listProjects(session?.userId);
    return <ProjectsClient projects={projects} />;
}