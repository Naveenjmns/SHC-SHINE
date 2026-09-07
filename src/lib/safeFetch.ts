/**
 * Safely parses JSON from a Fetch Response.
 * Prevents `SyntaxError: JSON.parse: unexpected end of data at line 1 column 1`
 * when a server returns an empty body, 204 No Content, HTML error, or connection reset.
 */
export async function safeJson<T = any>(res: Response, fallback: any = {}): Promise<T> {
  try {
    const text = await res.text();
    if (!text || !text.trim()) {
      return (fallback ?? {}) as T;
    }
    return JSON.parse(text) as T;
  } catch (error) {
    console.warn("Failed to parse JSON response safely:", error);
    return (fallback ?? {}) as T;
  }
}

