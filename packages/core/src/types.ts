export const teachStates = [
  "draft",
  "ready",
  "recording",
  "processing",
  "review",
  "published",
  "failed",
] as const;

export type TeachState = (typeof teachStates)[number];
export type Replayability = "replayable" | "assist_only" | "unsupported" | "unknown";
export type AlternativeVerification = "verified" | "testable" | "unverified";
export type NativeRecordingBackend = "gnome" | "macos" | "windows";
export type RecordingBackend = NativeRecordingBackend | "demo";

export interface AuthorizationReceipt {
  id: string;
  issued_at: string;
  expires_at: string;
  purpose: "user_directed_workflow_teaching";
  capture: {
    screen: true;
    microphone: false;
    raw_keystrokes: false;
    clipboard: false;
  };
}

export interface RecordingInfo {
  backend: RecordingBackend;
  path: string;
  started_at: string;
  stopped_at?: string;
  duration_ms?: number;
  frames_dir?: string;
  frame_count?: number;
}

export interface TeachSession {
  schema_version: 1;
  id: string;
  state: TeachState;
  name?: string;
  description?: string;
  created_at: string;
  updated_at: string;
  authorization?: AuthorizationReceipt;
  recording?: RecordingInfo;
  failure?: { code: string; message: string; at: string };
  analysis_path?: string;
  draft_skill_path?: string;
  published_skill?: { name: string; path: string; published_at: string };
}

export interface ProcessStep {
  order: number;
  title: string;
  instruction: string;
  software: string;
  required_capability: string;
  approval_required: boolean;
  verification: string;
}

export interface ProcessAlternative {
  name: string;
  description: string;
  changed_means: string;
  required_capabilities: string[];
  expected_benefit: string;
  risks: string[];
  equivalence_check: string;
  verification_status: AlternativeVerification;
}

export interface ProcessAnalysis {
  schema_version: 1;
  name: string;
  description: string;
  goal: string;
  category: string;
  output_contract: {
    artifact: string;
    success_criteria: string[];
    equivalence_verifier: string;
  };
  inputs: string[];
  outputs: string[];
  software_used: string[];
  duration_ms: number;
  steps: ProcessStep[];
  decision_points: string[];
  risks: string[];
  required_capabilities: string[];
  replayability: {
    status: Replayability;
    reasons: string[];
    missing_capabilities: string[];
  };
  alternatives: ProcessAlternative[];
  model: string;
  generated_at: string;
}

export interface TeachEvent {
  schema_version: 1;
  id: string;
  session_id: string;
  at: string;
  type: string;
  from_state?: TeachState;
  to_state?: TeachState;
  idempotency_key: string;
  metadata?: Record<string, string | number | boolean>;
}

export interface BeginInput {
  name?: string;
  description?: string;
}

export interface ReviewPatch {
  name?: string;
  description?: string;
  goal?: string;
  category?: string;
  steps?: ProcessStep[];
}
