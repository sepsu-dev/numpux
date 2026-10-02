import assert from "node:assert/strict";
import { test } from "node:test";
import { getPageTitle } from "./page-title";

test("menu routes use the approved page labels", () => {
  const labels = {
    "/dashboard": "Overview",
    "/tasks/backlog": "Backlog",
    "/tasks/kanban": "Board",
    "/workspace": "Workspaces",
    "/master/menus": "Navigation",
    "/master/user-privileges": "User Access",
    "/master/categories": "Project Categories",
    "/master/issue-types": "Issue Types",
    "/master/statuses": "Statuses",
    "/master/sections": "Navigation Sections",
    "/master/users": "Users",
  };

  for (const [route, label] of Object.entries(labels)) assert.equal(getPageTitle(route), label);
});