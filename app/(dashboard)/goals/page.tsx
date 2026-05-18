import { createClient } from "@/lib/supabase/server";
import { GoalsScreen } from "@/components/dashboard/GoalsScreen";

export default async function Page() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return <GoalsScreen userId={user.id} />;
}
