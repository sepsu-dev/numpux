import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { createOAuthState, isValidOAuthState } from "./oauth-state";

describe("OAuth state", () => {
  test("creates unique URL-safe values", () => {
    const first = createOAuthState();
    const second = createOAuthState();

    assert.notEqual(first, second);
    assert.match(first, /^[A-Za-z0-9_-]{43}$/);
  });

  test("accepts only the matching non-empty value", () => {
    const state = createOAuthState();

    assert.equal(isValidOAuthState(state, state), true);
    assert.equal(isValidOAuthState(`${state}x`, state), false);
    assert.equal(isValidOAuthState(null, state), false);
    assert.equal(isValidOAuthState(state, undefined), false);
  });
});