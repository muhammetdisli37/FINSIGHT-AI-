import { createClient } from "@/lib/supabase/server";
import { GeminiChatPanel } from "@/components/dashboard/GeminiChatPanel";
import { Card } from "@/components/ui/card";

export default async function Page() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-xl font-semibold text-white">AI Sohbet</h1>
      <Card className="min-h-[720px]">
        <GeminiChatPanel userId={user.id} />
      </Card>
    </div>
  );
}
