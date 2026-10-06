import { test, beforeEach, afterEach, mock } from "node:test";
import assert from "node:assert/strict";
import {
  apiRequest,
  ApiError,
  extractAuth,
  restoreSession,
  tokenStore,
  userStore,
} from "../src/lib/api.ts";

const patient = { id: "patient-1", name: "Patient", email: "patient@example.com", role: "Patient" };
beforeEach(() => {
  const storage = new Map();
  globalThis.window = {
    localStorage: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
      removeItem: (key) => storage.delete(key),
    },
  };
});
afterEach(() => {
  mock.restoreAll();
  delete globalThis.window;
});

test("plain-text rate limit errors preserve HTTP status and message", async () => {
  mock.method(
    globalThis,
    "fetch",
    async () => new Response("Too many login attempts", { status: 429 }),
  );
  await assert.rejects(
    apiRequest("/api/auth/login"),
    (error) =>
      error instanceof ApiError &&
      error.status === 429 &&
      error.message === "Too many login attempts",
  );
});

test("malformed success responses produce a controlled API error", async () => {
  mock.method(
    globalThis,
    "fetch",
    async () => new Response("<html>Unexpected proxy response</html>"),
  );
  await assert.rejects(
    apiRequest("/api/auth/me"),
    (error) => error instanceof ApiError && /invalid response/.test(error.message),
  );
});

test("session refresh reads data.user and updates the cached profile", async () => {
  tokenStore.set("token");
  userStore.set({ ...patient, name: "Old name" });
  mock.method(globalThis, "fetch", async (url, init) => {
    assert.equal(init.headers.Authorization, "Bearer token");
    return Response.json({ success: true, data: { user: patient } });
  });
  assert.deepEqual(await restoreSession(), patient);
  assert.deepEqual(userStore.get(), patient);
});

test("expired and inactive sessions clear both token and cached user", async () => {
  for (const status of [401, 403]) {
    tokenStore.set("token");
    userStore.set(patient);
    const fetchMock = mock.method(globalThis, "fetch", async () =>
      Response.json({ message: "Unauthorized" }, { status }),
    );
    assert.equal(await restoreSession(), null);
    assert.equal(tokenStore.get(), null);
    assert.equal(userStore.get(), null);
    fetchMock.mock.restore();
  }
});

test("a cached user without a token is discarded", async () => {
  userStore.set(patient);
  assert.equal(await restoreSession(), null);
  assert.equal(userStore.get(), null);
});

test("network outages preserve the existing cached session", async () => {
  tokenStore.set("token");
  userStore.set(patient);
  mock.method(globalThis, "fetch", async () => {
    throw new TypeError("Network unavailable");
  });
  assert.deepEqual(await restoreSession(), patient);
  assert.equal(tokenStore.get(), "token");
});

test("invalid authentication payloads cannot be persisted", () => {
  assert.throws(() => extractAuth({ data: { token: "token", user: { role: "Root" } } }), ApiError);
  assert.throws(() => extractAuth({ data: { user: patient } }), ApiError);
  assert.deepEqual(extractAuth({ data: { token: "token", user: patient } }), {
    token: "token",
    user: patient,
  });
});

test("registration errors retain specific field messages for the form", async () => {
  mock.method(globalThis, "fetch", async () =>
    Response.json(
      {
        message: "Validation failed",
        errors: [
          { field: "phone", message: "Phone must be 10 digits" },
          { field: "shiftEnd", message: "Shift end must be later than shift start" },
          { field: "phone", message: "Another phone error" },
          { field: "password", message: 42 },
          null,
        ],
      },
      { status: 400 },
    ),
  );
  await assert.rejects(apiRequest("/api/auth/register"), (error) => {
    assert.ok(error instanceof ApiError);
    assert.equal(error.status, 400);
    assert.deepEqual(error.fieldErrors, {
      phone: "Phone must be 10 digits",
      shiftEnd: "Shift end must be later than shift start",
    });
    return true;
  });
});
