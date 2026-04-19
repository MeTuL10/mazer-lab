import { API_BASE_URL } from "./config";

export async function fetchModels() {
  const response = await fetch(`${API_BASE_URL}/api/models`);
  if (!response.ok) {
    throw new Error("Failed to fetch model list.");
  }
  return response.json();
}
