// Where the visitor was heading when they hit the sign-in wall.
//
// Choosing an automation and creating an account are two separate moments, and
// the second one used to erase the first. The auth dialog is mounted in the
// navbar and opened by a global event that carries no payload, so by the time
// the account existed nothing remembered which automation had been clicked —
// people landed back on the list and had to go find their thing a second time.
//
// sessionStorage rather than React state or a query param: the dialog lives far
// from whatever dispatched the event, and the code-entry step means the visitor
// leaves for their inbox and comes back. sessionStorage survives that; component
// state above the dialog would not survive the refresh that follows sign-in.

const KEY = 'modelgrow:pending-destination';

// Only same-origin paths. This value ends up in router.push(), so anything that
// could be steered elsewhere is an open redirect — `//evil.com` is a protocol
// relative URL, not a path, which is why the second character is checked too.
function isInternalPath(value) {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//');
}

export function setPendingDestination(path) {
  if (typeof window === 'undefined' || !isInternalPath(path)) return;
  try {
    window.sessionStorage.setItem(KEY, path);
  } catch {
    // Private browsing and storage-blocked contexts: losing the destination
    // costs one extra click, so it is not worth failing the sign-in over.
  }
}

// Reading consumes it. A destination is good for exactly one sign-in — left in
// place it would hijack an unrelated one later in the same tab.
export function takePendingDestination() {
  if (typeof window === 'undefined') return null;
  try {
    const value = window.sessionStorage.getItem(KEY);
    window.sessionStorage.removeItem(KEY);
    return isInternalPath(value) ? value : null;
  } catch {
    return null;
  }
}
