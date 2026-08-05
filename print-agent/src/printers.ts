import fs from "node:fs";
import path from "node:path";
import pkg from "node-thermal-printer";
import type { ThermalPrinter } from "node-thermal-printer";
import { config } from "./config";

const { ThermalPrinter: ThermalPrinterClass, PrinterTypes, CharacterSet } = pkg;

// مسار منافذ USB الخام القياسي بلينكس لطابعات ESC/POS الحرارية (تعريف
// usblp بالنواة) — لا يتطلب تعريف أي عنوان يدوي من الكاشير، توصيل الطابعة
// بمنفذ USB يكفي.
const USB_PRINTER_DIR = "/dev/usb";

function buildPrinter(printerInterface: string): ThermalPrinter {
  return new ThermalPrinterClass({
    type: PrinterTypes.EPSON,
    interface: printerInterface,
    width: 42,
    characterSet: CharacterSet.PC864_ARABIC,
    removeSpecialCharacters: false,
    options: { timeout: 3000 },
  });
}

function detectUsbPrinterInterface(): string | null {
  try {
    const device = fs
      .readdirSync(USB_PRINTER_DIR)
      .filter((name) => /^lp\d+$/.test(name))
      .sort()[0];
    return device ? path.join(USB_PRINTER_DIR, device) : null;
  } catch {
    return null;
  }
}

let printerInterface: string | null = detectUsbPrinterInterface() ?? config.printerInterfaceFallback;
let printer: ThermalPrinter | null = printerInterface ? buildPrinter(printerInterface) : null;

export function getPrinter(): ThermalPrinter | null {
  return printer;
}

/**
 * تُستدعى دورياً — تعيد فحص منافذ USB المتصلة وتبني كائن الطابعة تلقائياً،
 * فقط لو تغيّرت واجهتها فعلاً (طابعة اتصلت أو انفصلت)، تفادياً لإعادة اتصال
 * بلا داعٍ كل دورة استطلاع. PRINTER_INTERFACE بمتغيرات البيئة يبقى احتياطياً
 * فقط لو ما فيه طابعة USB مكتشفة (مثل طابعة شبكة tcp://).
 */
export function configurePrinter(): void {
  const resolved = detectUsbPrinterInterface() ?? config.printerInterfaceFallback;

  if (resolved && resolved !== printerInterface) {
    printerInterface = resolved;
    printer = buildPrinter(resolved);
    console.log(`[printers] طابعة USB مكتشفة: ${resolved}`);
  } else if (!resolved && printerInterface) {
    printerInterface = null;
    printer = null;
    console.log("[printers] لا توجد طابعة USB متصلة");
  }
}
