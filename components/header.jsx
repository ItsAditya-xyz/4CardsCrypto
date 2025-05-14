"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabaseClient";

export default function Header() {
  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();

      console.log("user:", data?.user);
      setUser(data?.user || null);
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.refresh();
  };

  if (!user) return null;

  return (
    <div className="absolute top-4 right-4 z-50">
      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2"
        >
          <p className="font-medium text-gray-100 mb-2">
            GM, {user.user_metadata?.user_name || "Player"}
          </p>
          <Image
            src={user.user_metadata?.avatar_url || "/assets/default-avatar.png"}
            alt="Avatar"
            width={40}
            height={40}
            className="rounded-full border-2 border-white hover:opacity-90 transition"
          />
        </button>

        {open && (
          <div className="absolute right-0 mt-2 bg-white border rounded-md shadow-md p-3 text-sm min-w-[160px]">
            <button
              onClick={handleLogout}
              className="text-red-500 hover:underline"
            >
              Log out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
