FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
# Use BuildKit npm cache mount so partial downloads survive retries across build runs.
# On first run this may need multiple attempts if Docker's VM network resets mid-download;
# subsequent runs use the cache and complete quickly.
RUN --mount=type=cache,target=/root/.npm \
    npm install \
    --prefer-offline \
    --fetch-retry-mintimeout=20000 \
    --fetch-retry-maxtimeout=120000 \
    --fetch-retries=10 \
    --maxsockets=5

FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN --network=host npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.ts ./next.config.ts

EXPOSE 3000

CMD ["npm", "start"]
