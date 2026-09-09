import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import FollowListPage from "@/components/FollowListPage";

export default async function Following() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return <FollowListPage email={user.email ?? ""} userId={user.id} title="Takip edilenler" />;
}
