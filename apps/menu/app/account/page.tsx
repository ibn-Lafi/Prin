import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabaseClient";

export default async function AccountPage() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col gap-4 px-4 py-8">
      <h1 className="text-xl font-bold">حسابي</h1>
      <p>مسجّل الدخول برقم: {user.phone}</p>
      <p className="text-sm text-gray-500">
        رصيد النقاط وسجل الطلبات والمكافآت — قادمة بخطوة لاحقة من نفس المرحلة.
      </p>
    </main>
  );
}
