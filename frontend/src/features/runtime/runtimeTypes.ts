export type AwarenessLoopState = {
  enabled?: boolean;
  interval_seconds?: number;
  started_at?: string | null;
  stopped_at?: string | null;
  last_capture_at?: string | null;
  last_error?: string | null;
  captures?: number;
  thread_alive?: boolean;
};

export type AwarenessSnapshot = {
  ok?: boolean;
  captured_at?: string;
  host?: string;
  os?: string;
  active_window?: {
    process_name?: string;
    window_title?: string;
    pid?: number;
    platform?: string;
    error?: string;
  };
  activity?: {
    category?: string;
    summary?: string;
    confidence?: number;
  };
  privacy?: {
    mode?: string;
    screenshots_saved?: boolean;
    ocr_enabled?: boolean;
    cloud_vision?: boolean;
  };
  processes?: Array<{ image?: string; pid?: string; memory?: string }>;
};

export type AwarenessStatus = {
  ok?: boolean;
  mode?: string;
  capture?: string;
  ocr?: string;
  screen_vision?: string;
  loop?: AwarenessLoopState;
  current?: {
    current?: {
      payload?: AwarenessSnapshot;
      summary?: string;
      app_name?: string;
      window_title?: string;
      created_at?: string;
    };
  };
};

export type RuntimeStatus = {
  ok?: boolean;
  primitives?: Record<string, {
    status?: string;
    facts?: number;
    events?: number;
    requests?: number;
    pending_approval?: number;
    approved?: number;
    executed?: number;
    agents?: number;
  }>;
  awareness_runtime?: AwarenessStatus;
  action_engine?: { tools?: unknown[] };
  workflow_runtime?: {
    workflows?: number;
    runs?: number;
    sidecars?: number;
    self_healing?: string;
    authority_gating?: string;
    nodes?: { count?: number };
  };
  goals?: number;
  workflow_nodes?: number;
  authority_gating?: string;
  local_first?: boolean;
};

export type Fact = {
  id: string;
  fact_text: string;
  source_type?: string;
  importance?: number;
  confidence?: number;
  created_at?: string;
  tags?: string[];
};

export type ActionRequest = {
  id: string;
  action_type: string;
  summary: string;
  risk: string;
  status: string;
  created_at?: string;
  result?: unknown;
};

export type Goal = {
  id: string;
  type: string;
  title: string;
  status: string;
  score?: number;
  due_date?: string | null;
};

export type Workflow = {
  id: string;
  name: string;
  description?: string;
  enabled?: boolean;
  trigger?: unknown;
  nodes?: unknown[];
  authority_policy?: string;
};

export type Sidecar = {
  id: string;
  machine_id: string;
  name: string;
  status: string;
  capabilities?: string[];
  last_seen_at?: string;
};

export type RuntimePanelData = {
  status?: RuntimeStatus;
  facts: Fact[];
  actions: ActionRequest[];
  goals: Goal[];
  workflows: Workflow[];
  sidecars: Sidecar[];
};

export type RuntimeCardMetric = {
  label: string;
  value: number;
  sub: string;
};
