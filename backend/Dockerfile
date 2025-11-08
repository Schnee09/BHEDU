FROM node:18-alpine AS builder
WORKDIR /app

# Install deps (including devDependencies) to build
COPY package.json package-lock.json* pnpm-lock.yaml* ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app

# Install only production deps
COPY package.json package-lock.json* pnpm-lock.yaml* ./
RUN npm ci --production

# Copy built files
COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "dist/index.js"]
