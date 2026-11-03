// Run against a configured, running local app: npm run dev, then npm run test:routing.
// Override the origin with TAPAULAHH_TEST_URL to also check a production build.
import assert from "node:assert/strict";
import { test } from "node:test";

const origin = process.env.TAPAULAHH_TEST_URL || "http://localhost:3000";

async function request(path, cookie) {
  return fetch(new URL(path, origin), {
    redirect: "manual",
    headers: cookie ? { cookie } : undefined,
    signal: AbortSignal.timeout(30_000),
  });
}

for (const [path, locale, cookie] of [
  ["/", "ms"],
  ["/pasar", "ms"],
  ["/kedai", "ms"],
  ["/cari?q=burger", "ms"],
  ["/en", "en"],
  ["/en/pasar", "en"],
  ["/en/kedai", "en"],
  ["/en/search?q=burger", "en"],
  ["/pasar?map=1", "ms", "tapau_locale=ms"],
  ["/en/pasar", "en", "tapau_locale=ms"],
  ["/pasar", "ms", "tapau_locale=unknown"],
]) {
  test(`${path} renders ${locale}${cookie ? ` (${cookie})` : ""} without redirecting`, async () => {
    const response = await request(path, cookie);
    assert.equal(
      response.status,
      200,
      `Unexpected redirect/error: ${response.headers.get("location")}`,
    );
    assert.equal(response.headers.get("location"), null);
    assert.match(
      await response.text(),
      new RegExp(`<html[^>]*\\blang="${locale}"`),
    );
  });
}

for (const [path, cookie, destination] of [
  ["/ms/pasar?map=1", undefined, "/pasar?map=1"],
  ["/pasar?map=1", "tapau_locale=en", "/en/pasar?map=1"],
  ["/cari?q=burger", "tapau_locale=en", "/en/search?q=burger"],
]) {
  test(`${path} redirects once to ${destination}`, async () => {
    const response = await request(path, cookie);
    assert.equal(response.status, 307);
    const location = response.headers.get("location");
    assert.ok(location);
    assert.equal(
      new URL(location, origin).pathname + new URL(location, origin).search,
      destination,
    );
    const next = await request(destination, cookie);
    assert.equal(next.status, 200, "Redirect must end on a page, not loop");
    await next.body?.cancel();
  });
}
