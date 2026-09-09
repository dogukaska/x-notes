import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CategoryPage from "@/components/CategoryPage";

export default async function CategoryRoute({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return <CategoryPage email={user.email ?? ""} userId={user.id} username={username} />;
}
