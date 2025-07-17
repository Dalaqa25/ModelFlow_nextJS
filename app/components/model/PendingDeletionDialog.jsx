import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';

export default function PendingDeletionDialog({ isOpen, onClose, message = 'This model has been purchased by users. It will be deleted in 3 days. Notification emails have been sent.' }) {
  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-400"
          enterFrom="opacity-0 translate-y-4 scale-95"
          enterTo="opacity-100 translate-y-0 scale-100"
          leave="ease-in duration-300"
          leaveFrom="opacity-100 translate-y-0 scale-100"
          leaveTo="opacity-0 translate-y-4 scale-95"
        >
          <div className="fixed inset-0 bg-blue-200/40 backdrop-blur-sm transition-opacity" />
        </Transition.Child>
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-400"
            enterFrom="opacity-0 scale-90"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-300"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-90"
          >
            <Dialog.Panel className="bg-white rounded-2xl shadow-2xl p-10 flex flex-col items-center gap-6 border-2 border-blue-200 max-w-sm w-full animate-fade-in">
              {/* Info/Clock Icon */}
              <div className="bg-blue-100 rounded-full p-4 mb-2 shadow-md">
                <svg className="w-20 h-20 text-blue-500 animate-info-pop" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <circle cx="12" cy="12" r="10" strokeWidth="2" stroke="currentColor" fill="#dbeafe" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3" />
                </svg>
              </div>
              <div className="text-xl font-bold text-blue-700 text-center leading-snug">
                {message}
              </div>
              <button
                className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg font-semibold shadow hover:bg-blue-600 transition-colors"
                onClick={onClose}
                autoFocus
              >
                OK
              </button>
            </Dialog.Panel>
          </Transition.Child>
        </div>
        <style jsx>{`
          .animate-info-pop {
            animation: infoPop 0.5s cubic-bezier(0.23, 1, 0.32, 1);
          }
          @keyframes infoPop {
            0% { transform: scale(0); }
            80% { transform: scale(1.2); }
            100% { transform: scale(1); }
          }
          .animate-fade-in {
            animation: fadeIn 0.3s ease;
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
          }
        `}</style>
      </Dialog>
    </Transition.Root>
  );
} 