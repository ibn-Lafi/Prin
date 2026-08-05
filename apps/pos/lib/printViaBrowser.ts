"use client";

// طباعة عادية عبر المتصفح (window.print) — بدون أي إقران جهاز أو تعريف خاص.
// تعتمد على أن الطابعة الحرارية مضبوطة أصلاً كطابعة نظام عادية بجهاز الكاشير
// (بالضبط مثل أي برنامج آخر يطبع عليها بنفس الجهاز). لطباعة صامتة بدون أي
// نافذة تأكيد، شغّل متصفح الكاشير بخيار "‎--kiosk-printing" وحدّد الطابعة
// الحرارية كطابعة افتراضية على نظام التشغيل — بدونه سيظهر مربع طباعة قياسي
// (اضغط طباعة) لكل فاتورة، وهو سلوك المتصفح الطبيعي ولا يمكن تفاديه بالكود.
export function printHtml(html: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.setAttribute("aria-hidden", "true");

    let settled = false;
    function settle() {
      if (settled) return;
      settled = true;
      clearTimeout(fallbackTimer);
      iframe.remove();
      resolve();
    }

    // شبكة أمان: بعض إعدادات المتصفح (خصوصاً --kiosk-printing ببعض الإصدارات)
    // لا تُطلق afterprint دائماً بشكل موثوق — بدون هذا المهلة، طباعة واحدة
    // معلّقة تمنع تسلسل الطباعة بالكامل (runOnPrinter) من الاستمرار لاحقاً.
    const fallbackTimer = setTimeout(settle, 15_000);

    iframe.onload = () => {
      try {
        const win = iframe.contentWindow;
        if (!win) throw new Error("تعذّر تحضير نافذة الطباعة");
        win.addEventListener("afterprint", settle);
        win.focus();
        win.print();
      } catch (err) {
        clearTimeout(fallbackTimer);
        iframe.remove();
        reject(err instanceof Error ? err : new Error(String(err)));
      }
    };

    document.body.appendChild(iframe);
    iframe.srcdoc = html;
  });
}
