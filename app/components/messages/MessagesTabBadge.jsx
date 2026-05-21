export default function MessagesTabBadge({ count }) {
  if (!count || count <= 0) return null;
  return (
    <span className="ml-1.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold inline-flex items-center justify-center">
      {count > 9 ? '9+' : count}
    </span>
  );
}
