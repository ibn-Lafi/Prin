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

let kitchenInterface: string | null = config.kitchenPrinterInterfaceFallback;
let customerInterface: string | null = config.customerPrinterInterfaceFallback;
let kitchenPrinter: ThermalPrinter | null = kitchenInterface ? buildPrinter(kitchenInterface) : null;
let customerPrinter: ThermalPrinter | null = customerInterface ? buildPrinter(customerInterface) : null;

export function getKitchenPrinter(): ThermalPrinter | null {
  return kitchenPrinter;
}

export function getCustomerPrinter(): ThermalPrinter | null {
  return customerPrinter;
}

/**
 * تُستدعى دورياً بعد قراءة إعدادات الطباعة من restaurant_settings — تعيد بناء
 * كائن الطابعة فقط لو تغيّرت واجهتها فعلاً، تفادياً لإعادة اتصال بلا داعٍ كل
 * دورة استطلاع. القيمة null أو الفارغة من قاعدة البيانات ترجع للاحتياطي
 * (متغير البيئة المحلي) إن وُجد.
 */
export function configurePrinters(
  dbKitchenInterface: string | null,
  dbCustomerInterface: string | null,
): void {
  const resolvedKitchen = dbKitchenInterface || config.kitchenPrinterInterfaceFallback;
  const resolvedCustomer = dbCustomerInterface || config.customerPrinterInterfaceFallback;

  if (resolvedKitchen && resolvedKitchen !== kitchenInterface) {
    kitchenInterface = resolvedKitchen;
    kitchenPrinter = buildPrinter(resolvedKitchen);
    console.log(`[printers] تحديث واجهة طابعة المطبخ: ${resolvedKitchen}`);
  } else if (!resolvedKitchen && kitchenInterface) {
    kitchenInterface = null;
    kitchenPrinter = null;
    console.log("[printers] طابعة المطبخ غير مهيّأة (لا يوجد عنوان)");
  }

  if (resolvedCustomer && resolvedCustomer !== customerInterface) {
    customerInterface = resolvedCustomer;
    customerPrinter = buildPrinter(resolvedCustomer);
    console.log(`[printers] تحديث واجهة طابعة العميل: ${resolvedCustomer}`);
  } else if (!resolvedCustomer && customerInterface) {
    customerInterface = null;
    customerPrinter = null;
    console.log("[printers] طابعة العميل غير مهيّأة (لا يوجد عنوان)");
  }
}
