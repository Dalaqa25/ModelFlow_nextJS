export function getInitial(displayName) {
  return displayName ? displayName.charAt(0).toUpperCase() : '?';
}

export function getAvatarColor(seed) {
  const colors = [
    'from-purple-500 to-indigo-500',
    'from-pink-500 to-rose-500',
    'from-blue-500 to-cyan-500',
    'from-amber-500 to-orange-500',
    'from-emerald-500 to-teal-500',
    'from-violet-500 to-fuchsia-500',
  ];
  const str = seed || 'user';
  const hash = str.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return colors[hash % colors.length];
}
