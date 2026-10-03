export interface AssistantToolSource {
  tool: string;
  query: string;
  timestamp: number;
  summary: string;
}

export interface AssistantContextHint {
  selectedFlightId?: string;
  selectedCallsign?: string;
  airportIcao?: string;
  currentRoute?: string;
}

export interface AssistantMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AssistantResponsePayload {
  text: string;
  sources: AssistantToolSource[];
  modelUsed: string;
  timestamp: number;
}
