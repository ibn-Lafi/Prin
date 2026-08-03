import pkg from "node-thermal-printer";
import type { ThermalPrinter } from "node-thermal-printer";
import { config } from "./config";

const { ThermalPrinter: ThermalPrinterClass, PrinterTypes, CharacterSet } = pkg;

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

let printerInterface: string | null = config.printerInterfaceFallback;
let printer: ThermalPrinter | null = printerInterface ? buildPrinter(printerInterface) : null;

export function getPrinter(): ThermalPrinter | null {
  return printer;
}

/**
 * تُستدعى دورياً بعد قراءة إعدادات الطباعة من print_agent_status — تعيد بناء
 * كائن الطابعة فقط لو تغيّرت واجهتها فعلاً، تفادياً لإعادة اتصال بلا داعٍ كل
 * دورة استطلاع. القيمة null أو الفارغة من قاعدة البيانات ترجع للاحتياطي
 * (متغير البيئة المحلي) إن وُجد.
 */
export function configurePrinter(dbInterface: string | null): void {
  const resolved = dbInterface || config.printerInterfaceFallback;

  if (resolved && resolved !== printerInterface) {
    printerInterface = resolved;
    printer = buildPrinter(resolved);
    console.log(`[printers] تحديث واجهة الطابعة: ${resolved}`);
  } else if (!resolved && printerInterface) {
    printerInterface = null;
    printer = null;
    console.log("[printers] الطابعة غير مهيّأة (لا يوجد عنوان)");
  }
}
