import { WS_BASE_URL } from "./config";

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
