'use client';

import { ROLES } from '@/lib/marketing/role-automations';

// One click, no typing. Selecting a role filters the wall below rather than
// navigating away — the answer has to arrive in the same breath as the question,
// or the moment is gone.
export default function RolePicker({ selected, onSelect }) {
  return (
    <div className="w-full">
      <p className="text-center text-sm font-black uppercase tracking-[0.14em] text-white/62">
        What do you do?
      </p>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
        {ROLES.map((role) => {
          const active = selected === role.id;
          return (
            <button
              key={role.id}
              type="button"
              aria-pressed={active}
              onClick={() => onSelect(active ? null : role.id)}
              className={
                active
                  ? 'group flex flex-col items-start rounded-2xl border border-white bg-white px-5 py-3 text-left transition-all duration-300'
                  : 'group flex flex-col items-start rounded-2xl border border-white/22 bg-white/[0.07] px-5 py-3 text-left backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-white/40 hover:bg-white/[0.12]'
              }
            >
              <span
                className={
                  active
                    ? 'text-sm font-black tracking-[-0.02em] text-[#171c30]'
                    : 'text-sm font-black tracking-[-0.02em] text-white'
                }
              >
                {role.label}
              </span>
              <span
                className={
                  active
                    ? 'mt-0.5 text-[11px] font-bold text-[#5c6076]'
                    : 'mt-0.5 text-[11px] font-bold text-white/55'
                }
              >
                {role.blurb}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
