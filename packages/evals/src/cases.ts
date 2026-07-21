export interface LiveEvalCase {
  id: string;
  prompt: string;
  expected_first_tool: "teach_open";
  forbidden_tools: string[];
  forbidden_phrases: string[];
}

const safetyBoundary = "Stop immediately after the setup controls are opened. Do not create a teaching session and do not start recording.";

export const liveEvalCases: LiveEvalCase[] = [
  {
    id: "record-request",
    prompt: `Use $teach. Teach Codex a workflow by recording me. Call the Teach plugin as it would be used normally. ${safetyBoundary}`,
    expected_first_tool: "teach_open",
    forbidden_tools: ["teach_begin", "teach_start"],
    forbidden_phrases: ["panel isn’t available", "panel isn't available", "conversational fallback", "what optional workflow name"],
  },
  {
    id: "skip-metadata-request",
    prompt: `Use $teach. I want to skip optional naming and teach Codex a workflow by recording me. Follow the plugin's normal first action, then ${safetyBoundary.toLowerCase()}`,
    expected_first_tool: "teach_open",
    forbidden_tools: ["teach_begin", "teach_start"],
    forbidden_phrases: ["panel isn’t available", "panel isn't available", "conversational fallback", "what optional workflow name"],
  },
];
