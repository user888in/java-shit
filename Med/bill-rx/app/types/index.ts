export type ConfidenceLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export type IssueType =
  | 'DUPLICATE'
  | 'UPCODING'
  | 'UNBUNDLING'
  | 'MATH_ERROR'
  | 'NETWORK_MISMATCH'
  | 'MISSING_ADJUSTMENT'
  | 'EXCESSIVE_PRICING'
  | 'OTHER';

export interface Issue {
  id: string;
  type: IssueType;
  confidence: ConfidenceLevel;
  explanation: string;
  evidence: string[]; // e.g., "Line item X and Y have same CPT code on same date"
  savingsPotential?: number;
}

export interface BillLineItem {
  id: string;
  date?: string;
  code?: string; // CPT / HCPCS
  description: string;
  quantity: number;
  amountBilled: number;
  amountAllowed?: number;
  providerNetworkStatus?: 'IN' | 'OUT';
}

export interface Bill {
  id: string;
  fileName: string;
  uploadDate: string;
  providerName?: string;
  patientName?: string;
  billDate?: string;
  totalBilled?: number;
  lineItems: BillLineItem[];
  rawText?: string; // Debugging / Audit
}

export type AppState = 'UPLOAD' | 'PROCESSING' | 'REVIEW' | 'DISPUTE_READY';
