import { createClient } from "@/lib/supabase/server";
import { TransactionsScreen } from "@/components/transactions/TransactionsScreen";

export default async function Page() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return <TransactionsScreen userId={user.id} />;
}
