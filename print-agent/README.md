# BRIN Print Agent

خدمة Node.js تعمل محلياً على جهاز الكاشير، تطبع تلقائياً على طابعتي المطبخ والعميل الحراريتين (USB أو شبكة) بمجرد ما يوصلها طلب من الكاشير أو المنيو الإلكتروني.

## المتطلبات

- Node.js 22+
- pnpm (نفس المستودع الأساسي)
- طابعتان حراريتان متوافقتان مع ESC/POS (Epson أو مثيلاتها)

## الإعداد

1. انسخ `.env.example` إلى `.env` واملأ `NEXT_PUBLIC_SUPABASE_URL` و`SUPABASE_SERVICE_ROLE_KEY` (نفس القيم المستخدمة بباقي التطبيقات).
2. عناوين الطابعتين **لا تُضبط هنا** — تُضبط من لوحة الإدارة (الإعدادات العامة → إعدادات الطباعة)، ويقرأها هذا التطبيق تلقائياً كل 15 ثانية. متغيرات `KITCHEN_PRINTER_INTERFACE`/`CUSTOMER_PRINTER_INTERFACE` بملف `.env` احتياطية فقط (تُستخدم قبل أول ضبط من لوحة الإدارة).

## التشغيل للتجربة

```bash
pnpm install
pnpm --filter @brin/print-agent dev
```

## التشغيل الدائم (خدمة تلقائية عند إعادة التشغيل)

1. انسخ المستودع لموقعه النهائي على جهاز الكاشير (مثال: `/opt/brin-system`).
2. أنشئ مستخدم مخصص عضو بمجموعة `lp` (للوصول لمنفذ الطابعة USB):
   ```bash
   sudo useradd --system --group lp --home-dir /opt/brin-system/print-agent brin-print-agent
   ```
3. حدّد المسار الفعلي لـ `pnpm`:
   ```bash
   which pnpm
   ```
   وعدّل `ExecStart` بملف `brin-print-agent.service` ليطابقه، وكذلك `WorkingDirectory` ليطابق مكان المستودع الفعلي.
4. انسخ ملف الخدمة وفعّله:
   ```bash
   sudo cp brin-print-agent.service /etc/systemd/system/
   sudo systemctl daemon-reload
   sudo systemctl enable --now brin-print-agent
   ```
5. للتحقق من الحالة والسجلات:
   ```bash
   sudo systemctl status brin-print-agent
   sudo journalctl -u brin-print-agent -f
   ```

بهذا الإعداد، الخدمة تشتغل تلقائياً عند إقلاع الجهاز، وتعيد التشغيل تلقائياً لو تعطّلت (`Restart=always`).
