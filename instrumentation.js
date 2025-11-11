// Next.js instrumentation hook - runs once on the server at startup
// Use this to ensure SSR has safe localStorage/sessionStorage shims
import './lib/ssr-storage-shim';

export async function register() {
  // nothing else needed; importing the shim sets it up
}


