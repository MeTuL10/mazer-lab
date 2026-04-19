import { API_BASE_URL } from "./config";
import { parseErrorResponse } from "./error";

export async function runSimulation(payload) {
  const response = await fetch(`${API_BASE_URL}/api/simulate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const message = await parseErrorResponse(response, "Simulation request failed.");
    throw new Error(message);
  }

  return response.json();
}
