import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { appCopy } from "../config/app-copy.js";
import { getActionStatus, statusKeys } from "../lib/action-status.js";

describe("Aita action status messages", () => {
  it("has a message and tone for every supported status", () => {
    Object.values(statusKeys).forEach((statusKey) => {
      const status = getActionStatus(statusKey, appCopy.actionStatuses);

      assert.equal(typeof status.message, "string");
      assert.equal(status.message.length > 0, true);
      assert.match(status.tone, /^(info|success|warning|error|neutral)$/);
    });
  });

  it("falls back to idle copy for unknown states", () => {
    assert.deepEqual(getActionStatus("not-a-real-state", appCopy.actionStatuses), appCopy.actionStatuses.idle);
  });

  it("includes statuses for likely AI service failures", () => {
    assert.equal(getActionStatus(statusKeys.networkError, appCopy.actionStatuses).tone, "error");
    assert.equal(getActionStatus(statusKeys.answerError, appCopy.actionStatuses).tone, "error");
  });
});
