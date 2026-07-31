import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`متغير البيئة "${name}" مفقود — تأكد من ضبط print-agent/.env`);
  }
  return value;
}

export const config = {
  supabaseUrl: required("NEXT_PUBLIC_SUPABASE_URL"),
  supabaseServiceRoleKey: required("SUPABASE_SERVICE_ROLE_KEY"),
  kitchenPrinterInterface: required("KITCHEN_PRINTER_INTERFACE"),
  customerPrinterInterface: required("CUSTOMER_PRINTER_INTERFACE"),
};
