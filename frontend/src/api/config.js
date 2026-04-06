import { API_DEFAULT_BASE_URL } from "../constants";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || API_DEFAULT_BASE_URL;

export function toWebSocketBaseUrl(httpBaseUrl) {
  if (httpBaseUrl.startsWith("https://")) {
    return `wss://${httpBaseUrl.slice("https://".length)}`;
  }
  if (httpBaseUrl.startsWith("http://")) {
    return `ws://${httpBaseUrl.slice("http://".length)}`;
  }
  return httpBaseUrl;
}

export const WS_BASE_URL = toWebSocketBaseUrl(API_BASE_URL);
