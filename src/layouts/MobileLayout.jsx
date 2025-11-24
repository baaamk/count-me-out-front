export default function MobileLayout({ children }) {
  return (
    <div className="flex justify-center w-full min-h-screen bg-gray-100">
      <div className="w-full max-w-[420px] min-h-screen bg-white">
        {children}
      </div>
    </div>
  );
}