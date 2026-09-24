import { initDb } from "@/db";
import { getOptionalAuthUser, validateAdminAuth } from "@/lib/api-auth";
import {
  badRequestResponse,
  errorResponse,
  internalServerErrorResponse,
  successResponse,
} from "@/lib/response";
import {
  updatePrivilegeSchema,
  updateMenuSchema,
  createMenuSchema,
  createProjectGroupSchema,
  createSectionSchema,
  updateSectionSchema,
} from "./schema";
import {
  findMasterMenus,
  findUserGroups,
  findUserPrivileges,
  findAllowedMenusByRole,
  setGroupMenuPrivilege,
  createMasterMenu,
  updateMasterMenu,
  deleteMasterMenu,
  findProjectGroups,
  findProjectPrivileges,
  setProjectGroupMenuPrivilege,
  findAllowedMenusByProjectRole,
  createProjectGroup,
  deleteProjectGroup,
  findMasterSections,
  createMasterSection,
  updateMasterSection,
  deleteMasterSection,
} from "./query";

export async function GET(request: Request) {
  try {
    await initDb();
    const authUser = await getOptionalAuthUser(request);
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode");

    // Mode "my-menus": return allowed menus and sections for currently logged-in user
    if (mode === "my-menus") {
      const role = authUser?.role || "user";
      const [menus, dbSections] = await Promise.all([
        findAllowedMenusByRole(role),
        findMasterSections(),
      ]);
      return successResponse({
        menus,
        sections: dbSections.map((s) => s.name),
      });
    }

    // Mode "project-menus": return allowed menus for a specific project member role
    if (mode === "project-menus") {
      const projectRole = searchParams.get("role") || "member";
      const menus = await findAllowedMenusByProjectRole(projectRole);
      return successResponse(menus);
    }

    // Default: full privilege management data (master menus, user groups, project groups, matrices, sections)
    const [menus, groups, privileges, projectGroups, projectPrivileges, sections] = await Promise.all([
      findMasterMenus(),
      findUserGroups(),
      findUserPrivileges(),
      findProjectGroups(),
      findProjectPrivileges(),
      findMasterSections(),
    ]);

    return successResponse({
      menus,
      groups,
      privileges,
      projectGroups,
      projectPrivileges,
      sections,
    });
  } catch (error) {
    console.error("GET /api/privileges error:", error);
    return internalServerErrorResponse("Failed to fetch privileges data");
  }
}

export async function POST(request: Request) {
  const auth = await validateAdminAuth(request);
  if (!auth.isValid) {
    return errorResponse(auth.error || "Unauthorized", auth.statusCode || 401);
  }

  // Only admin account can manage privileges
  if (auth.user?.role !== "admin") {
    return errorResponse("Forbidden. Only administrators can configure privileges.", 403);
  }

  try {
    await initDb();
    const body = await request.json();

    // Check if managing master sections
    if (body.type === "create_section") {
      const parsed = createSectionSchema.safeParse(body);
      if (!parsed.success) {
        return badRequestResponse("Invalid section data", parsed.error.flatten().fieldErrors);
      }
      const newSec = await createMasterSection(parsed.data);
      if (!newSec) {
        return badRequestResponse("Section with this name already exists");
      }
      return successResponse(newSec, "Section created successfully");
    }

    if (body.type === "update_section") {
      const parsed = updateSectionSchema.safeParse(body);
      if (!parsed.success) {
        return badRequestResponse("Invalid section data", parsed.error.flatten().fieldErrors);
      }
      await updateMasterSection(parsed.data.id, {
        name: parsed.data.name,
        sortOrder: parsed.data.sortOrder,
      });
      return successResponse(null, "Section updated successfully");
    }

    if (body.type === "delete_section") {
      if (!body.id || typeof body.id !== "string") {
        return badRequestResponse("Section ID is required");
      }
      const ok = await deleteMasterSection(body.id);
      if (!ok) {
        return badRequestResponse("Failed to delete section");
      }
      return successResponse(null, "Section deleted successfully");
    }

    // Check if creating a new menu
    if (body.type === "create_menu") {
      const parsed = createMenuSchema.safeParse(body);
      if (!parsed.success) {
        return badRequestResponse("Invalid menu data", parsed.error.flatten().fieldErrors);
      }
      const newMenu = await createMasterMenu(parsed.data);
      if (!newMenu) {
        return badRequestResponse("Menu with this code or name already exists");
      }
      return successResponse(newMenu, "Menu created successfully");
    }

    // Check if deleting a menu
    if (body.type === "delete_menu") {
      if (!body.id || typeof body.id !== "string") {
        return badRequestResponse("Menu ID is required");
      }
      const ok = await deleteMasterMenu(body.id);
      if (!ok) {
        return badRequestResponse("Failed to delete menu");
      }
      return successResponse(null, "Menu deleted successfully");
    }

    // Check if updating menu details
    if (body.type === "menu") {
      const parsedMenu = updateMenuSchema.safeParse(body);
      if (!parsedMenu.success) {
        return badRequestResponse("Invalid menu data", parsedMenu.error.flatten().fieldErrors);
      }
      await updateMasterMenu(parsedMenu.data.id, {
        name: parsedMenu.data.name,
        path: parsedMenu.data.path,
        icon: parsedMenu.data.icon,
        section: parsedMenu.data.section,
        parentId: parsedMenu.data.parentId,
        isActive: parsedMenu.data.isActive,
        sortOrder: parsedMenu.data.sortOrder,
      });
      return successResponse(null, "Menu updated successfully");
    }

    // Check if creating a new project group
    if (body.type === "create_project_group") {
      const parsed = createProjectGroupSchema.safeParse(body);
      if (!parsed.success) {
        return badRequestResponse("Invalid project group data", parsed.error.flatten().fieldErrors);
      }
      const newGroup = await createProjectGroup(parsed.data);
      if (!newGroup) {
        return badRequestResponse("Project group with this name already exists");
      }
      return successResponse(newGroup, "Project group created successfully");
    }

    // Check if deleting a custom project group
    if (body.type === "delete_project_group") {
      if (!body.id || typeof body.id !== "string") {
        return badRequestResponse("Project group ID is required");
      }
      const ok = await deleteProjectGroup(body.id);
      if (!ok) {
        return badRequestResponse("Cannot delete this project group (system default or not found)");
      }
      return successResponse(null, "Project group deleted successfully");
    }

    // Check if toggling project group privilege
    if (body.type === "project") {
      const parsed = updatePrivilegeSchema.safeParse(body);
      if (!parsed.success) {
        return badRequestResponse("Invalid project privilege input", parsed.error.flatten().fieldErrors);
      }
      const { groupName, menuId, canView } = parsed.data;
      const ok = await setProjectGroupMenuPrivilege(groupName, menuId, canView);
      if (!ok) {
        return badRequestResponse("Project group not found");
      }
      return successResponse({ groupName, menuId, canView }, "Project privilege updated successfully");
    }

    // Otherwise toggle user group privilege
    const parsed = updatePrivilegeSchema.safeParse(body);
    if (!parsed.success) {
      return badRequestResponse("Invalid privilege input", parsed.error.flatten().fieldErrors);
    }

    const { groupName, menuId, canView } = parsed.data;
    const ok = await setGroupMenuPrivilege(groupName, menuId, canView);
    if (!ok) {
      return badRequestResponse("User group not found");
    }

    return successResponse({ groupName, menuId, canView }, "User privilege updated successfully");
  } catch (error) {
    console.error("POST /api/privileges error:", error);
    return internalServerErrorResponse("Failed to save privilege setting");
  }
}
