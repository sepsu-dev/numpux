import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { availableProjectKey, projectKeyBase } from "./issue-keys";

describe("Jira-lite keys", () => {
  test("normalizes project titles", () => {
    assert.equal(projectKeyBase("Numpux Engine"), "NE");
    assert.equal(projectKeyBase("Payments"), "PAYMENTS");
    assert.equal(projectKeyBase("---"), "PRJ");
  });

  test("resolves keys case-insensitively", () => {
    assert.equal(availableProjectKey("Numpux Engine", ["ne", "NE2"]), "NE3");
  });
});