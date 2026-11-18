FROM node:22-bookworm-slim

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.26.1 --activate

COPY . .

RUN pnpm install --frozen-lockfile \
  && pnpm --filter @workspace/api-server run build \
  && pnpm install --prod --frozen-lockfile

ENV NODE_ENV=production

EXPOSE 8080

USER node

CMD ["node", "--enable-source-maps", "artifacts/api-server/dist/index.mjs"]
