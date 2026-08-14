"use client";

import { useRouter } from "next/navigation";
import { createClient } from "../lib/supabase/client";

export default function LogoutButton() {
  const router = useRouter();

  async function logOut() {
    await createClient().auth.signOut();
    router.replace("/");
    router.refresh();
  }

  return <button className="logout-button" type="button" onClick={logOut}>Log out</button>;
}
