# يُبنى من جذر المستودع (Build Context = repo root) عشان يشوف packages/ المشتركة.
# على Railway: Dockerfile Path = apps/admin/Dockerfile ، Root Directory = / (جذر المستودع)
FROM node:22-slim AS base
RUN corepack enable

FROM base AS builder
WORKDIR /repo
COPY . .

ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @brin/admin build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3002
COPY --from=builder /repo/apps/admin/.next/standalone ./
COPY --from=builder /repo/apps/admin/.next/static ./apps/admin/.next/static
COPY --from=builder /repo/apps/admin/public ./apps/admin/public

EXPOSE 3002
CMD ["node", "apps/admin/server.js"]
