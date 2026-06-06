# syntax=docker/dockerfile:1
#
# Resthalf backend — NestJS 11 + Yarn 4 + TypeORM (PostgreSQL) + Redis.
# Multi-stage build producing a lean linux/amd64 image for Railway.
#
# Notes:
#  - Debian "bookworm-slim" (glibc) is used instead of Alpine (musl) so the
#    native `bcrypt` addon resolves a prebuilt binary / compiles cleanly.
#  - Yarn is provided by Corepack, pinned via package.json "packageManager".
#  - We force the node-modules linker for the image (the repo uses Yarn PnP for
#    local dev) so the runtime is a plain `node dist/main.js` with no PnP loader.

# ---- Base: Node 20 + pinned Yarn via Corepack ----
FROM node:20-bookworm-slim AS base
ENV YARN_NODE_LINKER=node-modules
WORKDIR /app
RUN corepack enable

# ---- deps: install ALL dependencies (incl. dev) needed to build ----
FROM base AS deps
# Toolchain for native addons (bcrypt) when no prebuilt binary matches.
RUN apt-get update \
 && apt-get install -y --no-install-recommends python3 make g++ \
 && rm -rf /var/lib/apt/lists/*
COPY package.json yarn.lock ./
RUN yarn install --immutable

# ---- build: compile TypeScript -> dist/ ----
FROM deps AS build
COPY . .
RUN yarn build

# ---- runner: minimal runtime image ----
FROM base AS runner
ENV NODE_ENV=production
# The app reads process.env.PORT (Railway injects it); 3001 is the local default.
ENV PORT=3001

# node_modules still contains tsconfig-paths (needed by register-paths.cjs at
# runtime) and the compiled bcrypt binary; both stages share the same glibc.
COPY --from=deps --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node package.json register-paths.cjs ./

EXPOSE 3001
USER node
CMD ["node", "-r", "./register-paths.cjs", "dist/main.js"]
