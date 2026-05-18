import { createClient } from "@/lib/supabase/server";
import { DashboardHome } from "@/components/dashboard/DashboardHome";

export default async function Page() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return <DashboardHome userId={user.id} />;
}
