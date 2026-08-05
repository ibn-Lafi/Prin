// جدول ترميز CP864 (عربي) — منسوخ حرفياً (256 خانة بالضبط) من مكتبة iconv-lite
// (MIT) عبر سكربت لمرة واحدة قرأ:
// node_modules/iconv-lite/encodings/sbcs-data-generated.js -> data.cp864.chars
// نفس المصدر الذي يعتمده print-agent القديم (عبر node-thermal-printer)، فالنتيجة
// مطابقة بايت-بايت. لا نُحزّم مكتبة iconv-lite نفسها بالمتصفح (تعتمد على Buffer
// وتحميل ديناميكي، غير مناسبة لحزمة عميل لمجرد جدول بيانات ثابت). الفهرس بهذا
// النص = البايت (0-255)، القيمة = الحرف اليونيكودي المطابق له بالطابعة.
const CP864_CHARS =
  "\u0000\u0001\u0002\u0003\u0004\u0005\u0006\u0007\u0008\u0009\u000a\u000b\u000c\u000d\u000e\u000f\u0010\u0011\u0012\u0013\u0014\u0015\u0016\u0017\u0018\u0019\u001a\u001b\u001c\u001d\u001e\u001f !\"#$\u066a&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~\u007f\u00b0\u00b7\u2219\u221a\u2592\u2500\u2502\u253c\u2524\u252c\u251c\u2534\u2510\u250c\u2514\u2518\u03b2\u221e\u03c6\u00b1\u00bd\u00bc\u2248\u00ab\u00bb\ufef7\ufef8\ufffd\ufffd\ufefb\ufefc\ufffd\u00a0\u00ad\ufe82\u00a3\u00a4\ufe84\ufffd\ufffd\ufe8e\ufe8f\ufe95\ufe99\u060c\ufe9d\ufea1\ufea5\u0660\u0661\u0662\u0663\u0664\u0665\u0666\u0667\u0668\u0669\ufed1\u061b\ufeb1\ufeb5\ufeb9\u061f\u00a2\ufe80\ufe81\ufe83\ufe85\ufeca\ufe8b\ufe8d\ufe91\ufe93\ufe97\ufe9b\ufe9f\ufea3\ufea7\ufea9\ufeab\ufead\ufeaf\ufeb3\ufeb7\ufebb\ufebf\ufec1\ufec5\ufecb\ufecf\u00a6\u00ac\u00f7\u00d7\ufec9\u0640\ufed3\ufed7\ufedb\ufedf\ufee3\ufee7\ufeeb\ufeed\ufeef\ufef3\ufebd\ufecc\ufece\ufecd\ufee1\ufe7d\u0651\ufee5\ufee9\ufeec\ufef0\ufef2\ufed0\ufed5\ufef5\ufef6\ufedd\ufed9\ufef1\u25a0\ufffd";

const FALLBACK_BYTE = 0x3f; // '?' — نفس سلوك node-thermal-printer عند فشل الترميز

const encodeMap = new Map<number, number>();
for (let i = 0; i < CP864_CHARS.length; i++) {
  const code = CP864_CHARS.charCodeAt(i);
  if (!encodeMap.has(code)) encodeMap.set(code, i);
}

export function encodeCp864(text: string): Uint8Array {
  const bytes = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i++) {
    bytes[i] = encodeMap.get(text.charCodeAt(i)) ?? FALLBACK_BYTE;
  }
  return bytes;
}
