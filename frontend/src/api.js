const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

function toWebSocketBaseUrl(httpBaseUrl) {
  if (httpBaseUrl.startsWith("https://")) {
    return `wss://${httpBaseUrl.slice("https://".length)}`;
  }
  if (httpBaseUrl.startsWith("http://")) {
    return `ws://${httpBaseUrl.slice("http://".length)}`;
  }
  return httpBaseUrl;
}

const WS_BASE_URL = toWebSocketBaseUrl(API_BASE_URL);

export async function fetchModels() {
  const response = await fetch(`${API_BASE_URL}/api/models`);
  if (!response.ok) {
    throw new Error("Failed to fetch model list.");
  }
  return response.json();
}

export async function runSimulation(payload) {
  const response = await fetch(`${API_BASE_URL}/api/simulate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message = errorBody.detail || "Simulation request failed.";
    throw new Error(message);
  }

  return response.json();
}

export function runSimulationStream(payload, handlers = {}) {
  const { onStarted, onProgress } = handlers;
  const socketUrl = `${WS_BASE_URL}/ws/simulate`;

  return new Promise((resolve, reject) => {
    const ws = new WebSocket(socketUrl);
    let isSettled = false;

    function fail(error) {
      if (isSettled) {
        return;
      }
      isSettled = true;
      reject(error instanceof Error ? error : new Error("Training stream failed."));
      try {
        ws.close();
      } catch {
        // no-op
      }
    }

    ws.onopen = () => {
      ws.send(JSON.stringify(payload));
    };

    ws.onmessage = (event) => {
      let message;
      try {
        message = JSON.parse(event.data);
      } catch {
        fail(new Error("Received malformed message from training stream."));
        return;
      }

      if (message.type === "started") {
        onStarted?.(message);
        return;
      }

      if (message.type === "progress") {
        onProgress?.(message);
        return;
      }

      if (message.type === "completed") {
        if (isSettled) {
          return;
        }
        isSettled = true;
        resolve(message.result);
        ws.close();
        return;
      }

      if (message.type === "error") {
        fail(new Error(message.detail || "Simulation stream failed."));
      }
    };

    ws.onerror = () => {
      fail(new Error("Unable to connect to simulation stream."));
    };

    ws.onclose = () => {
      if (!isSettled) {
        fail(new Error("Simulation stream closed before completion."));
      }
    };
  });
}
