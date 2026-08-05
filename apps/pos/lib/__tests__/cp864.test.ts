import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import fs from "node:fs";
import { encodeCp864 } from "../cp864";

test("ASCII passes through unchanged", () => {
  const bytes = encodeCp864("ABC 123");
  assert.deepEqual(Array.from(bytes), [0x41, 0x42, 0x43, 0x20, 0x31, 0x32, 0x33]);
});

test("out-of-table character falls back to '?'", () => {
  const bytes = encodeCp864("€"); // غير موجود بجدول CP864
  assert.deepEqual(Array.from(bytes), [0x3f]);
});

test("matches the vendored iconv-lite CP864 table byte-for-byte", () => {
  // يقارن مباشرة بمصدر الجدول الأصلي (iconv-lite بمخزن pnpm) — نفس الفحص
  // الذي استُخدم وقت توليد cp864.ts، كضمان دائم ضد أي تعديل يدوي يكسر
  // التطابق البايتي. يُتجاهل بصمت لو تعذّر إيجاد الحزمة (تبعية غير مباشرة،
  // قد لا تكون بمخزن pnpm بكل بيئة) — لا يمثّل فشل هذا التحميل خللاً بالكود.
  let cp864Chars: string | null = null;
  try {
    const pnpmStore = "/home/user/Prin/node_modules/.pnpm";
    const match = fs.readdirSync(pnpmStore).find((name) => name.startsWith("iconv-lite@"));
    if (!match) return;
    const require = createRequire(import.meta.url);
    const data = require(`${pnpmStore}/${match}/node_modules/iconv-lite/encodings/sbcs-data-generated.js`);
    cp864Chars = data.cp864.chars as string;
  } catch {
    return;
  }

  const table: string = cp864Chars;
  for (let byte = 0; byte < 256; byte++) {
    const expectedChar: string = table[byte]!;
    if (expectedChar === "�") continue; // خانات غير معرّفة، لا فك تشفير فريد لها
    const bytes = encodeCp864(expectedChar);
    assert.equal(bytes[0], byte, `byte ${byte} (char ${JSON.stringify(expectedChar)})`);
  }
});
