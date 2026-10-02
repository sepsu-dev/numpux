export async function apiFetch(input: string | URL | Request, init?: RequestInit): Promise<Response> {
  return fetch(input, init);
}
