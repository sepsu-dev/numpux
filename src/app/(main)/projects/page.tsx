import { listProjects } from "@/lib/store";
import { ProjectsClient } from "@/components/projects/projects-client";

export default function ProjectsPage() {
    const projects = listProjects();
    return <ProjectsClient projects={projects} />;
}