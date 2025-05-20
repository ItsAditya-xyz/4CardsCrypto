"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabaseClient";

import modalBg from "../public/assets/modalBg.png";

export default function Header({ showLogo = false }) {
  const modalRef = useRef();
  const [user, setUser] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        setOpenModal(false);
      }
    };

    if (openModal) {
      document.addEventListener("mousedown", handleOutsideClick);
    }

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [openModal]);

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user || null);
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.refresh();
    setOpenModal(false);
  };

  return (
    <>
      {showLogo && (
        <Link href='/' className='absolute top-4 left-4 z-50 block'>
          <Image
            src='/assets/logo.png'
            alt='Logo'
            width={100}
            height={100}
            className='hover:opacity-90 transition'
          />
        </Link>
      )}

      {user && (
        <div className='absolute top-4 right-4 z-50'>
          <button
            onClick={() => setOpenModal(true)}
            className='flex items-center gap-2'>
            <p className='font-medium text-gray-100 mb-2'>
              GM, {user.user_metadata?.user_name || "Player"}
            </p>
            <Image
              src={
                user.user_metadata?.avatar_url || "/assets/default-avatar.png"
              }
              alt='Avatar'
              width={40}
              height={40}
              className='rounded-full border-2 border-white hover:opacity-90 transition'
            />
          </button>
        </div>
      )}

     {openModal && (
  <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center">
    <div ref={modalRef} className="relative w-[380px] h-[480px] sm:w-[420px] sm:h-[500px]">
      <Image
        src={modalBg}
        alt="Modal Background"
        fill
        className="absolute inset-0 object-contain z-[-1] pointer-events-none"
      />
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-black text-center space-y-5 px-6 pt-12">
      

        <Link
          href="/"
          onClick={() => setOpenModal(false)}
          className="hover:underline font-bold"
        >
          Home
        </Link>
        <Link
          href="/profile"
          onClick={() => setOpenModal(false)}
          className="hover:underline font-bold"
        >
          Profile
        </Link>
        <Link
          href="/leaderboard"
          onClick={() => setOpenModal(false)}
          className="hover:underline font-bold"
        >
          Leaderboards
        </Link>

        <button
          onClick={handleLogout}
          className="text-red-600 hover:text-red-700 font-semibold"
        >
          Log out
        </button>

       
      </div>
    </div>
  </div>
)}
    </>
  );
}
