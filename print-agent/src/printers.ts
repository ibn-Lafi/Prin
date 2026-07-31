import pkg from "node-thermal-printer";
import { config } from "./config";

const { ThermalPrinter, PrinterTypes, CharacterSet } = pkg;

function buildPrinter(printerInterface: string) {
  return new ThermalPrinter({
    type: PrinterTypes.EPSON,
    interface: printerInterface,
    width: 42,
    characterSet: CharacterSet.PC864_ARABIC,
    removeSpecialCharacters: false,
    options: { timeout: 3000 },
  });
}

export const kitchenPrinter = buildPrinter(config.kitchenPrinterInterface);
export const customerPrinter = buildPrinter(config.customerPrinterInterface);
