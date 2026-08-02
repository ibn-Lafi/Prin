import { PrinterSettingsView } from "@/components/PrinterSettingsView";

export default function PrinterSettingsPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <h1 className="text-2xl font-bold">إعدادات الطباعة</h1>
      <PrinterSettingsView />
    </div>
  );
}
