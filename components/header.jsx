"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabaseClient";
import modalBg from "../public/assets/modalBG.png";
import emptyButton from "../public/assets/emptyButton.png";

import { Home, User, Trophy, LogOut } from "lucide-react";
export default function Header({ showLogo = false, showHamburger = false }) {
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
        <Link
          href='/'
          className='absolute top-4 left-4 z-50 block hover:cursor-pointer'>
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
        <div className='absolute top-1 right-4 z-50 '>
          {showHamburger ? (
            <button
              onClick={() => setOpenModal(true)}
              className='p-2 hover:cursor-pointer'>
              <Image
                src='/assets/hamburger.png'
                alt='Menu'
                width={28}
                height={28}
                className=''
              />
            </button>
          ) : (
            <button
              onClick={() => setOpenModal(true)}
              className='flex items-center gap-2 hover:cursor-pointer'>
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
          )}
        </div>
      )}

      {openModal && (
        <div className='fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center'>
          <div
            ref={modalRef}
            className='relative w-[380px] h-[480px] sm:w-[420px] sm:h-[500px]'>
            <Image
              src={modalBg}
              alt='Modal Background'
              fill
              className='absolute inset-0 object-contain z-[-1] pointer-events-none'
            />
            <div className='relative z-10 flex flex-col items-center justify-center h-full text-black text-center  px-6 pt-12'>
              <Link
                href='/'
                onClick={() => setOpenModal(false)}
                className='relative w-[200px] h-[60px] hover:scale-105 transition-transform'>
                <Image
                  src={emptyButton}
                  alt='Home'
                  fill
                  className='object-contain pointer-events-none'
                />
                <span className='absolute inset-0 flex items-center justify-center gap-2 font-bold text-black'>
                  <Home className='w-5 h-5' />
                  Home
                </span>
              </Link>
              <Link
                href={`/u/${user?.user_metadata?.user_name || "player"}`}
                onClick={() => setOpenModal(false)}
                className='relative w-[200px] h-[60px] hover:scale-105 transition-transform'>
                <Image
                  src={emptyButton}
                  alt='Profile'
                  fill
                  className='object-contain pointer-events-none'
                />
                <span className='absolute inset-0 flex items-center justify-center gap-2 font-bold text-black'>
                  <User className='w-5 h-5' />
                  Profile
                </span>
              </Link>
              <Link
                href='/leaderboard'
                onClick={() => setOpenModal(false)}
                className='relative w-[200px] h-[60px] hover:scale-105 transition-transform'>
                <Image
                  src={emptyButton}
                  alt='Leaderboards'
                  fill
                  className='object-contain pointer-events-none'
                />
                <span className='absolute inset-0 flex items-center justify-center gap-2 font-bold text-black'>
                  <Trophy className='w-5 h-5' />
                  Leaderboards
                </span>
              </Link>
              <button
                onClick={handleLogout}
                className='relative w-[200px] h-[60px] hover:scale-105 transition-transform'>
                <Image
                  src={emptyButton}
                  alt='Log Out'
                  fill
                  className='object-contain pointer-events-none'
                />
                <span className='absolute inset-0 flex items-center justify-center gap-2 font-bold text-red-600'>
                  <LogOut className='w-5 h-5' />
                  Log out
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
