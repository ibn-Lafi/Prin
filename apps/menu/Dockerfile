# يُبنى من جذر المستودع (Build Context = repo root) عشان يشوف packages/ المشتركة.
# على Railway: Dockerfile Path = apps/menu/Dockerfile ، Root Directory = / (جذر المستودع)
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
RUN pnpm --filter @brin/menu build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY --from=builder /repo/apps/menu/.next/standalone ./
COPY --from=builder /repo/apps/menu/.next/static ./apps/menu/.next/static
COPY --from=builder /repo/apps/menu/public ./apps/menu/public

EXPOSE 3000
CMD ["node", "apps/menu/server.js"]
