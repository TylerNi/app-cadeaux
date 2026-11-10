FROM node:24-trixie AS deps
WORKDIR /src
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM node:24-trixie AS build
WORKDIR /src
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build && test -f dist/schema.sql

FROM node:24-trixie-slim

WORKDIR /app
ENV NODE_ENV=production

COPY --from=deps /src/node_modules ./node_modules
COPY --from=build /src/dist ./dist
COPY public/ ./public/
COPY package.json ./package.json

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:8080/health').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "dist/index.js"]
