import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { getBootstrapAdminConfig, getDatabaseConfig, getOAuthConfig, getSessionConfig } from "./env";

describe("runtime configuration", () => {
  test("requires secure database and session configuration", () => {
    assert.throws(() => getDatabaseConfig({}), /DATABASE_URL/);
    assert.throws(() => getDatabaseConfig({ DATABASE_URL: "http://example.com" }), /protocol/);
    assert.throws(() => getSessionConfig({ JWT_SECRET: "short" }), /32 characters/);
    assert.equal(getDatabaseConfig({ DATABASE_URL: "postgresql://user:pass@db/app" }).DATABASE_URL, "postgresql://user:pass@db/app");
  });

  test("requires complete OAuth configuration", () => {
    assert.throws(() => getOAuthConfig({}), /APP_URL/);
    assert.equal(getOAuthConfig({ APP_URL: "https://app.example.com" }), null);
    assert.throws(() => getOAuthConfig({ APP_URL: "https://app.example.com", AUTH_GOOGLE_ID: "client" }), /configured together/);
    assert.equal(
      getOAuthConfig({ APP_URL: "https://app.example.com", AUTH_GOOGLE_ID: "client", AUTH_GOOGLE_SECRET: "secret" })?.appUrl.origin,
      "https://app.example.com"
    );
  });

  test("requires complete bootstrap admin configuration", () => {
    assert.equal(getBootstrapAdminConfig({}), null);
    assert.equal(getBootstrapAdminConfig({ BOOTSTRAP_ADMIN_NAME: "", BOOTSTRAP_ADMIN_EMAIL: "", BOOTSTRAP_ADMIN_PASSWORD: "" }), null);
    assert.throws(() => getBootstrapAdminConfig({ BOOTSTRAP_ADMIN_EMAIL: "admin@example.com" }), /configured together/);
    assert.equal(
      getBootstrapAdminConfig({
        BOOTSTRAP_ADMIN_NAME: "Admin",
        BOOTSTRAP_ADMIN_EMAIL: "ADMIN@example.com",
        BOOTSTRAP_ADMIN_PASSWORD: "a-secure-password",
      })?.email,
      "admin@example.com"
    );
  });
});