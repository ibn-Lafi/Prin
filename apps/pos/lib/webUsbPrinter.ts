"use client";

// طباعة مباشرة من متصفح الكاشير على طابعة ESC/POS متصلة بمنفذ USB — بدون أي
// برنامج منفصل يُثبَّت على الجهاز. بدون فلترة vendorId/productId مسبقة: نريد
// أي طابعة يختارها الكاشير بنفسه من نافذة الإذن، بدون قائمة أجهزة معروفة مسبقاً.
const USB_FILTERS: USBDeviceFilter[] = [];

// الحد الأقصى العملي لحجم كل transferOut — بعض التعريفات/الأنظمة لا تتعامل
// جيداً مع نقل ضخم دفعة واحدة، فنقسّم البايتات لدفعات أصغر.
const CHUNK_SIZE = 4096;

export function isWebUsbSupported(): boolean {
  return typeof navigator !== "undefined" && "usb" in navigator && navigator.usb !== undefined;
}

// الجهاز المقترن حالياً بهذا التبويب — حالة وحدة واحدة يشترك بها كل من صفحة
// إعدادات الطباعة (بعد الإقران) ومعالج مهام الطباعة (عند الطباعة الفعلية)،
// بما أنهما يعملان بنفس تحميل الصفحة بمتصفح الكاشير.
let currentDevice: USBDevice | null = null;

export function getCurrentDevice(): USBDevice | null {
  return currentDevice;
}

export function setCurrentDevice(device: USBDevice | null): void {
  currentDevice = device;
}

/** يجب استدعاؤها من معالج نقرة مباشر (بادرة مستخدم) — قيد أمان WebUSB، لا يمكن
 * استدعاؤها تلقائياً بدون تفاعل. تفتح نافذة اختيار جهاز USB بالمتصفح. */
export async function requestPrinterPairing(): Promise<USBDevice> {
  if (!isWebUsbSupported()) {
    throw new Error("هذا المتصفح لا يدعم WebUSB");
  }
  return navigator.usb!.requestDevice({ filters: USB_FILTERS });
}

/** يرجّع جهازاً مصرَّحاً له مسبقاً بدون أي نافذة اختيار جديدة — هذا ما يسمح
 * بإعادة الاتصال التلقائي بكل تحميل صفحة بعد أول إقران. */
export async function getPairedPrinter(): Promise<USBDevice | null> {
  if (!isWebUsbSupported()) return null;
  const devices = await navigator.usb!.getDevices();
  return devices[0] ?? null;
}

function findBulkOutEndpoint(device: USBDevice): { interfaceNumber: number; endpointNumber: number } | null {
  const configuration = device.configuration ?? device.configurations[0];
  if (!configuration) return null;

  for (const iface of configuration.interfaces) {
    for (const alt of iface.alternates) {
      const endpoint = alt.endpoints.find((e) => e.direction === "out" && e.type === "bulk");
      if (endpoint) {
        return { interfaceNumber: iface.interfaceNumber, endpointNumber: endpoint.endpointNumber };
      }
    }
  }
  return null;
}

async function ensureOpenAndClaimed(device: USBDevice): Promise<{ endpointNumber: number }> {
  if (!device.opened) {
    await device.open();
  }
  if (!device.configuration) {
    await device.selectConfiguration(1);
  }

  const found = findBulkOutEndpoint(device);
  if (!found) {
    throw new Error("تعذّر العثور على منفذ إخراج USB متوافق بهذه الطابعة");
  }

  await device.claimInterface(found.interfaceNumber);
  return { endpointNumber: found.endpointNumber };
}

export async function printBytes(bytes: Uint8Array): Promise<void> {
  const device = currentDevice;
  if (!device) {
    throw new Error("لا توجد طابعة USB متصلة بهذا الجهاز");
  }

  const { endpointNumber } = await ensureOpenAndClaimed(device);

  for (let offset = 0; offset < bytes.length; offset += CHUNK_SIZE) {
    const chunk = bytes.subarray(offset, offset + CHUNK_SIZE);
    const result = await device.transferOut(endpointNumber, chunk);
    if (result.status !== "ok") {
      throw new Error(`فشل إرسال بيانات الطباعة (${result.status})`);
    }
  }
}

export function onConnectionChange(listener: (connected: boolean) => void): () => void {
  if (!isWebUsbSupported()) return () => {};

  const onConnect = () => listener(true);
  const onDisconnect = () => listener(false);

  navigator.usb!.addEventListener("connect", onConnect);
  navigator.usb!.addEventListener("disconnect", onDisconnect);

  return () => {
    navigator.usb!.removeEventListener("connect", onConnect);
    navigator.usb!.removeEventListener("disconnect", onDisconnect);
  };
}

// تسلسل الطباعة داخل التبويب — يضمن عدم تداخل طباعة فاتورتين (مطبخ ثم عميل)
// لو وصلتا بنفس اللحظة تقريباً، لأن كلتيهما تكتبان على نفس منفذ USB الفعلي.
let printQueue: Promise<void> = Promise.resolve();

export function runOnPrinter(task: () => Promise<void>): Promise<void> {
  const result = printQueue.then(task, task);
  printQueue = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}
