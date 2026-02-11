/**
 * Safely parse a fetch Response as JSON.
 * When the server returns plain text (e.g. "Internal Server Error"), res.json() throws.
 * This reads as text first and parses, avoiding SyntaxError and surfacing the real error.
 * @param {Response} res - fetch Response
 * @returns {Promise<object>} parsed JSON or {} for empty body
 */
export async function parseJsonResponse(res) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    if (!res.ok) throw new Error(text || res.statusText || 'Request failed');
    throw new Error('Invalid JSON response');
  }
}
