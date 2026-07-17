# Stage 1: Build
FROM oven/bun:1-alpine AS builder
WORKDIR /app

# Cài đặt dependencies
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Sao chép toàn bộ dự án
COPY . .

# Generate Prisma Client và build Next.js
RUN bun prisma generate
RUN bun run build

# Stage 2: Runner
FROM oven/bun:1-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./

# Đảm bảo thư mục upload tồn tại
RUN mkdir -p public/uploads

# Chạy migrations rồi start app
# LƯU Ý: Mọi thay đổi schema phải có migration file (bun prisma migrate dev --name <tên>)
CMD ["sh", "-c", "bun prisma migrate deploy && bun run start"]
