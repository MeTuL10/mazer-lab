export async function parseErrorResponse(response, fallbackMessage) {
  const errorBody = await response.json().catch(() => ({}));
  return errorBody.detail || fallbackMessage;
}
