import { FaCheckCircle } from 'react-icons/fa';

export default function BasicTag() {
  return (
    <span className="flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold tracking-wide shadow-md bg-gradient-to-r from-gray-200 via-gray-100 to-white text-gray-700 border border-gray-300">
      <FaCheckCircle className="text-green-400 text-base" />
      Basic Plan
    </span>
  );
}
