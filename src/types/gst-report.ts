export interface GstReportMeta {
  report_id: string;
  generated_at: string;
  requested_gstin: string;
}

export interface GstEntity {
  trade_name: string;
  legal_name: string;
  constitution: string;
  gstin: string;
  status: string;
  registration_date: string;
  gst_vintage: string;
  turnover_slab: string;
  address: string;
  state: string;
  pin: string;
  cin: string;
  tan: string;
  udyam: string;
  e_invoice: string;
  email: string;
  mobile: string;
  paid_up_capital: string;
}

export interface GstProprietor {
  role: string;
  name: string;
  pan: string;
  pan_vintage: string;
  mobile: string;
  mnrl: string;
  sim_vintage: string;
}

export interface GstIdentitySource {
  source: string;
  name_found: string;
  result: string;
}

export interface GstFilingRecord {
  period: string;
  fy: string;
  gstr1: string;
  gstr3b: string;
}

export interface GstRegistrationRecord {
  gstin: string;
  state: string;
  status: string;
}

export interface GstBureauOverview {
  rating: string;
  active_count: number;
  active_amount: number;
  dpd: number;
  write_off: number;
}

export interface GstFacilityRecord {
  lender: string;
  account_type: string;
  sanctioned: number | null;
  outstanding: number | null;
  emi: number | null;
  roi: number | null;
  next_emi_date: string | null;
  dpd_status: string;
}

export interface GstReportContent {
  report: GstReportMeta;
  entity: GstEntity;
  proprietor: GstProprietor;
  identity: GstIdentitySource[];
  gst_filings: GstFilingRecord[];
  registrations: GstRegistrationRecord[];
  epfo: any[];
  bureau: GstBureauOverview;
  facilities: GstFacilityRecord[];
}

export interface GstReportData {
  gstin: string;
  reference_id: string;
  report: GstReportContent;
  _id?: string;
}

export interface GstReportApiResponse {
  code: string;
  message: string;
  data: GstReportData;
}
