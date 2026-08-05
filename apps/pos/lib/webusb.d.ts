// تعريفات WebUSB مبسّطة يدوياً — غير مشمولة بمكتبة DOM القياسية بـ TypeScript
// (WebUSB معيار أقل استقراراً، غير مضمّن بـ lib.dom.d.ts). فقط الواجهات
// المستخدمة فعلياً بـ webUsbPrinter.ts، وليس السطح الكامل للمواصفة.

interface USBDeviceFilter {
  vendorId?: number;
  productId?: number;
  classCode?: number;
  subclassCode?: number;
  protocolCode?: number;
  serialNumber?: string;
}

interface USBDeviceRequestOptions {
  filters: USBDeviceFilter[];
}

interface USBEndpoint {
  endpointNumber: number;
  direction: "in" | "out";
  type: "bulk" | "interrupt" | "isochronous";
}

interface USBAlternateInterface {
  alternateSetting: number;
  interfaceClass: number;
  endpoints: USBEndpoint[];
}

interface USBInterface {
  interfaceNumber: number;
  alternate: USBAlternateInterface;
  alternates: USBAlternateInterface[];
}

interface USBConfiguration {
  configurationValue: number;
  interfaces: USBInterface[];
}

interface USBOutTransferResult {
  bytesWritten: number;
  status: "ok" | "stall" | "babble";
}

interface USBDevice {
  readonly opened: boolean;
  readonly productName?: string;
  readonly manufacturerName?: string;
  readonly vendorId: number;
  readonly productId: number;
  readonly configuration: USBConfiguration | null;
  readonly configurations: USBConfiguration[];
  open(): Promise<void>;
  close(): Promise<void>;
  selectConfiguration(configurationValue: number): Promise<void>;
  claimInterface(interfaceNumber: number): Promise<void>;
  releaseInterface(interfaceNumber: number): Promise<void>;
  transferOut(endpointNumber: number, data: Uint8Array): Promise<USBOutTransferResult>;
}

interface USBConnectionEvent extends Event {
  readonly device: USBDevice;
}

interface USB extends EventTarget {
  requestDevice(options: USBDeviceRequestOptions): Promise<USBDevice>;
  getDevices(): Promise<USBDevice[]>;
  addEventListener(
    type: "connect" | "disconnect",
    listener: (event: USBConnectionEvent) => void,
  ): void;
  removeEventListener(
    type: "connect" | "disconnect",
    listener: (event: USBConnectionEvent) => void,
  ): void;
}

interface Navigator {
  readonly usb?: USB;
}
