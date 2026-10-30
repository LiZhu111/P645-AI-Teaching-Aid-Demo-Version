import test from "node:test";
import assert from "node:assert/strict";
import { createMockUser, matchesMockCredentials, normalizeEmail, validateRegistration } from "../lib/auth.js";

test("normalises mock account emails", () => {
  assert.equal(normalizeEmail("  LEARNER@example.com "), "learner@example.com");
});

test("validates and creates a mock learner account", () => {
  const form = { name: "Jordan Lee", email: "Jordan@example.com", password: "secret1", confirmPassword: "secret1" };
  assert.equal(validateRegistration(form), "");
  assert.deepEqual(createMockUser(form), { name: "Jordan Lee", email: "jordan@example.com", password: "secret1", role: "Learner" });
});

test("rejects short or mismatched registration passwords", () => {
  assert.equal(validateRegistration({ name: "Jordan", email: "jordan@example.com", password: "123", confirmPassword: "123" }), "Your password must contain at least 6 characters.");
  assert.equal(validateRegistration({ name: "Jordan", email: "jordan@example.com", password: "secret1", confirmPassword: "secret2" }), "The passwords do not match.");
});

test("matches login credentials against the mock account", () => {
  const user = createMockUser({ name: "Jordan", email: "Jordan@example.com", password: "secret1" });
  assert.equal(matchesMockCredentials(user, { email: "JORDAN@example.com", password: "secret1" }), true);
  assert.equal(matchesMockCredentials(user, { email: "JORDAN@example.com", password: "wrong" }), false);
});
