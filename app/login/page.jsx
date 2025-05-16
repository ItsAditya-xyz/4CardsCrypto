"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabaseClient";
import Image from "next/image";

export default function LoginPage() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      const currentUser = data?.user || null;
      setUser(currentUser);

      if (currentUser) {
        const pendingGameId = localStorage.getItem("pendingGameId");
        if (pendingGameId) {
          localStorage.removeItem("pendingGameId");
          router.push(`/game/${pendingGameId}`);
        } else {
          router.push("/"); // fallback if no pending room
        }
      }
    };

    checkUser();
  }, [router]);

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "twitter",
      options: {
        redirectTo: `${location.origin}/login`,
      },
    });
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center text-white"
      style={{
        backgroundImage: "url(/assets/background.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <Image
        src="/assets/logo.png"
        alt="Logo"
        width={240}
        height={120}
        className="mb-8"
      />
      <p className="text-lg text-center mb-6 max-w-md text-green-100">
        Log in with Twitter to join your game room!
      </p>
      <button onClick={handleLogin} className="mt-3">
        <Image
          src="/assets/loginwithTwitter.png"
          alt="Login with Twitter"
          width={300}
          height={80}
          className="transition-all duration-200 ease-in-out hover:scale-105 hover:-translate-y-1 hover:opacity-90 hover:cursor-pointer"
        />
      </button>
    </div>
  );
}
