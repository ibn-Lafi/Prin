# BRIN — نظام المطعم (منيو إلكتروني + كاشير + ولاء + لوحة إدارة)

المرجع الرسمي الوحيد للمواصفات: [`docs/SPEC.md`](./docs/SPEC.md)

## البنية

```
brin-system/
├── apps/
│   ├── menu/          # موقع المنيو الإلكتروني (عام)
│   ├── pos/           # موقع الكاشير (محمي بـ PIN)
│   └── admin/         # لوحة الإدارة (محمي بصلاحية مدير)
├── packages/
│   ├── database/      # عميل Supabase + الأنواع المولّدة من قاعدة البيانات
│   ├── ui/             # مكونات واجهة مشتركة
│   ├── config/         # ثوابت مشتركة (هوية بصرية، إعدادات عامة)
│   └── utils/          # دوال مساعدة مشتركة
├── print-agent/         # تطبيق Node.js محلي يعمل على جهاز الكاشير
├── supabase/
│   ├── migrations/      # ملفات SQL مرقّمة زمنياً
│   └── seed.sql
├── .env.example
└── turbo.json
```

## المتطلبات

- Node.js >= 22
- pnpm 10.x (`corepack enable` أو `npm i -g pnpm`)
- Supabase CLI (لتشغيل قاعدة البيانات محلياً)

## البدء

```bash
pnpm install
cp .env.example .env.local   # ثم املأ القيم الفعلية
pnpm dev
```

## أوامر شائعة

| الأمر             | الوصف                                 |
| ----------------- | ------------------------------------- |
| `pnpm dev`        | تشغيل كل التطبيقات محلياً (Turborepo) |
| `pnpm build`      | بناء كل التطبيقات                     |
| `pnpm lint`       | فحص الكود بكل الحزم                   |
| `pnpm type-check` | التحقق من الأنواع بكل الحزم           |

## النشر (Railway)

كل تطبيق (`menu`/`pos`/`admin`) له `Dockerfile` خاص يُبنى من **جذر المستودع** (عشان يشوف `packages/` المشتركة) — لا تستخدم Root Directory على مستوى `apps/<app>` مباشرة، لأنه بيكسر روابط pnpm workspace.

لكل خدمة على Railway (3 خدمات، كل وحدة تشتغل من نفس مستودع GitHub):

1. **Settings → Source**: اربطها بنفس المستودع
2. **Settings → Build**:
   - Root Directory: `/` (جذر المستودع — اتركه فاضي أو `.`)
   - Dockerfile Path: `apps/menu/Dockerfile` (أو `apps/pos/Dockerfile` / `apps/admin/Dockerfile` حسب الخدمة)
3. **Settings → Variables**: أضف نفس متغيرات `.env.local` (على الأقل `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, ولموقع المنيو أيضاً `AUTHENTICA_API_KEY` و`AUTHENTICA_BASE_URL`)
4. **Settings → Networking**: فعّل Public Domain، وتأكد المنفذ يطابق `PORT` بالـ Dockerfile (3000 للمنيو، 3001 للكاشير، 3002 للإدارة)

القيم اللي أولها `NEXT_PUBLIC_` لازم تكون متاحة **وقت البناء** (مو بس وقت التشغيل) — الـ Dockerfile معدّ لهذا عبر `ARG`، وRailway يمرّرها تلقائياً من متغيرات الخدمة لو كانت الأسماء مطابقة.

## حالة المشروع

المرحلة الحالية: **المرحلة 2 — موقع المنيو الإلكتروني + Authentica** مكتملة. جاهزين للمرحلة 3 (موقع الكاشير).
