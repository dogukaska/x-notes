import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProfilePage from "@/components/ProfilePage";

export default async function Profile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <ProfilePage
      email={user.email ?? ""}
      userId={user.id}
      joinedAt={user.created_at}
    />
  );
}
