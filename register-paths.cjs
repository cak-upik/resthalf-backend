// Runtime resolver for the "@/*" TypeScript path alias.
//
// `nest build` uses tsc, which does NOT rewrite path aliases — so compiled
// files keep `require("@/auth/jwt.guard")`, which Node can't resolve on its
// own. We map "@/*" -> "<this dir>/dist/*" before the app boots.
//
// Loaded via `node -r ./register-paths.cjs dist/main.js`.
const path = require("path");
const { register } = require("tsconfig-paths");

register({
  baseUrl: path.join(__dirname, "dist"),
  paths: { "@/*": ["*"] },
});
