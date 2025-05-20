export default function Toast({ message }) {
  return (
    <div className="fixed z-50 w-full sm:w-auto inset-0 sm:inset-auto sm:bottom-8 sm:left-1/2 sm:-translate-x-1/2 flex justify-center items-center sm:block px-4 py-4 sm:px-0  mt-[-40%]">
      <div className="bg-[#1e293b] text-white px-6 py-3 rounded-xl sm:rounded-full shadow-xl border border-yellow-400 animate-fade-in-out text-sm sm:text-base w-full sm:max-w-[90vw] text-center">
        ⚠️ {message}
      </div>
    </div>
  );
}
