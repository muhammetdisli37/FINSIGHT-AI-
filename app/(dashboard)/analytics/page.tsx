import { createClient } from "@/lib/supabase/server";
import { AnalyticsScreen } from "@/components/dashboard/AnalyticsScreen";

export default async function Page() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return <AnalyticsScreen userId={user.id} />;
}
