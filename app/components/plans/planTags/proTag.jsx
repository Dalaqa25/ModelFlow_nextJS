import { FaStar } from 'react-icons/fa';

export default function ProTag() {
  return (
    <span className="flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold tracking-wide shadow-md bg-gradient-to-r from-purple-300 via-purple-100 to-white text-purple-700 border border-purple-300">
      <FaStar className="text-yellow-400 text-base" />
      Pro Plan
    </span>
  );
}
