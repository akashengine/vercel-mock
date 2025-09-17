export type Candidate = {
  roll_no?: string;
  name?: string;
  [key: string]: any;
};

export type Analysis = {
  summary?: string;
  structuredData?: Record<string, string>;
  successEvaluation?: { overallRating?: string; justification?: string } | string;
};

export type CallObject = {
  id: string;
  assistantId?: string;
  startedAt?: string;
  endedAt?: string | null;
  analysis?: Analysis;
  artifact?: any;
};
