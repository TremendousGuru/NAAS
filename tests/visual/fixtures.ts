import { test as base, expect } from "@playwright/test";

export { expect };

export const test = base.extend({
  context: async ({ context, baseURL }, use) => {
    const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
    if (bypass) {
      if (!baseURL) throw new Error("A verified BASE_URL is required for protected preview tests.");
      const deployment = new URL(baseURL);
      if (deployment.protocol !== "https:" || deployment.username || deployment.password) {
        throw new Error("Vercel protection bypass requires a verified HTTPS deployment origin.");
      }

      const response = await context.request.get(deployment.origin, {
        headers: {
          "x-vercel-protection-bypass": bypass,
          "x-vercel-set-bypass-cookie": "true",
        },
        maxRedirects: 0,
      });
      const location = response.headers()["location"];
      if (location && new URL(location, deployment.origin).origin !== deployment.origin) {
        throw new Error("Vercel deployment authentication redirected outside the verified origin.");
      }

      const cookies = await context.cookies(deployment.origin);
      const authenticated = cookies.some(cookie =>
        cookie.name === "_vercel_jwt" &&
        cookie.secure &&
        cookie.domain.replace(/^\./, "") === deployment.hostname
      );
      if (response.status() >= 400 || !authenticated) {
        throw new Error("Vercel deployment authentication did not establish a scoped bypass cookie.");
      }
    }
    await use(context);
  },
});
