import { FaCrown } from 'react-icons/fa';

export default function EnterpriseTag() {
  return (
    <span className="flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold tracking-wide shadow-md bg-gradient-to-r from-yellow-200 via-yellow-100 to-white text-yellow-700 border border-yellow-300">
      <FaCrown className="text-yellow-500 text-base" />
      Enterprise Plan
    </span>
  );
}
