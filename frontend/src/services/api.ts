export type ApiError = {
  error: string;
};

async function parseJsonSafe(response: Response) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

export async function apiPost<TResponse>(path: string, body: unknown): Promise<TResponse> {
  const response = await fetch(`/api${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = (await parseJsonSafe(response)) as TResponse | ApiError | null;

  if (!response.ok) {
    const message = (data as ApiError | null)?.error || `Request failed (${response.status})`;
    throw new Error(message);
  }

  return data as TResponse;
}
