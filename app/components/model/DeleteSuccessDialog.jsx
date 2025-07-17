import { Fragment, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';

export default function DeleteSuccessDialog({ isOpen, onClose, message = 'Model deleted successfully!' }) {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose && onClose();
      }, 2000); // Auto-close after 2 seconds
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500/30 backdrop-blur-xl bg-opacity-40 transition-opacity" />
        </Transition.Child>
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="bg-white rounded-xl shadow-xl p-8 flex flex-col items-center gap-4">
              {/* Animated Tick */}
              <svg className="w-16 h-16 text-purple-500 animate-tick-pop" viewBox="0 0 52 52">
                <circle className="text-green-100" cx="26" cy="26" r="25" fill="currentColor" />
                <path className="tick" fill="none" stroke="#22c55e" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" d="M14 27l7 7 16-16" />
              </svg>
              <div className="text-lg font-semibold text-purple-700 text-center">{message}</div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
        <style jsx>{`
          .animate-tick-pop {
            animation: tickPop 0.5s cubic-bezier(0.23, 1, 0.32, 1);
          }
          @keyframes tickPop {
            0% { transform: scale(0); }
            80% { transform: scale(1.2); }
            100% { transform: scale(1); }
          }
        `}</style>
      </Dialog>
    </Transition.Root>
  );
} 