"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Header from "@/components/header";
import Loader from "@/components/loader";

export default function UserProfilePage() {
  const { username } = useParams();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`/api/get-user-by-name?username=${username}`);
        const data = await res.json();
        setUserData(data);
      } catch (err) {
        console.error("Failed to fetch user data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [username]);

  const formatDateTime = (iso) =>
    new Date(iso).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className='min-h-screen relative text-white px-4 py-6 overflow-x-hidden'>
      {/* Background */}
      <div className='absolute inset-0 z-0'>
        <Image
          src='/assets/background.png'
          alt='bg'
          fill
          className='object-cover pointer-events-none'
        />
      </div>

      <Header showLogo={true} showHamburger={true} />

      <main className='relative z-10 max-w-xl mx-auto mt-20'>
        {loading ? (
         <Loader/>
        ) : !userData ? (
          <p className='text-center text-red-400'>User not found.</p>
        ) : (
          <div className='bg-[#1e293b] border border-yellow-500/30 rounded-2xl p-6 shadow-xl text-center space-y-4'>
            <a
              href={`https://x.com/${userData.user_name}`}
              target='_blank'
              rel='noopener noreferrer'
              className='inline-block'
            >
              <div className='relative w-28 h-28 mx-auto'>
                <Image
                  src={userData.avatar_url}
                  alt='avatar'
                  fill
                  className='rounded-full object-cover border-4 border-yellow-400 hover:opacity-90 transition'
                />
              </div>
            </a>

            <a
              href={`https://x.com/${userData.user_name}`}
              target='_blank'
              rel='noopener noreferrer'
              className='block text-2xl font-bold text-yellow-300 hover:underline'
            >
              @{userData.user_name}
            </a>

            {userData.full_name && (
              <p className='text-white/80 text-sm'>{userData.full_name}</p>
            )}

            <div className='grid grid-cols-2 gap-4 text-sm text-white/80'>
              <div className='bg-[#334155] rounded-lg p-3'>
                <p className='text-xs text-gray-400 mb-1'>Points</p>
                <p className='text-lg text-yellow-400 font-bold'>
                  {userData.points}
                </p>
              </div>

              <div className='bg-[#334155] rounded-lg p-3'>
                <p className='text-xs text-gray-400 mb-1'>Games Won</p>
                <p className='text-lg text-green-400 font-bold'>
                  {userData.games_won}
                </p>
              </div>

              <div className='bg-[#334155] rounded-lg p-3 col-span-2'>
                <p className='text-xs text-gray-400 mb-1'>Joined</p>
                <p className='text-sm'>{formatDateTime(userData.created_at)}</p>
              </div>

              <div className='bg-[#334155] rounded-lg p-3 col-span-2'>
                <p className='text-xs text-gray-400 mb-1'>Last Login</p>
                <p className='text-sm'>{formatDateTime(userData.last_login)}</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
