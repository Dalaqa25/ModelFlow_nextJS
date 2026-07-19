export async function safeApiFetch(url, options = {}) {
  const response = await fetch(url, {
    credentials: 'include',
    redirect: 'manual',
    cache: 'no-store',
    ...options,
  });

  if (response.type === 'opaqueredirect' || (response.status >= 300 && response.status < 400)) {
    const location = response.headers.get('location');
    const error = new Error(`Unexpected redirect from ${url}`);
    error.status = response.status;
    error.location = location;
    throw error;
  }

  return response;
}
