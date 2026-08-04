import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { MasterToolbar } from "@/components/invoicing/MasterToolbar";
import { toast } from "sonner";
import { ENV, USERS_MAP } from "@/conf";
import { Loader2 } from "lucide-react";
import { exportToCSV, exportToExcel, downloadCSVText } from "@/utils/importExport";
import { Input } from "@/components/ui/input";
import { isValidDDMMYYYY, formatToDDMMYYYY } from "@/utils/date-formatter";

interface TransactionData {
  // id: string;
  // loanReferenceNumber: string;
  // trancheCreationMonth: string;
  // trancheCreationDate: string;
  // disbursementMonth: string;
  disbursementDate: string;
  // loanAccountNumber: string;
  anchorName: string;
  borrowerName: string;
  invoiceDate: string;
  invoiceNumber: string;
  invoiceAmount: number;
  // principalAmount: number;
  netDisbursementAmount: string;
  // eligibilityPercent: string;
  // disbursementUtr: string;
  // beneficiaryAccountName: string;
  // beneficiaryAccountNumber: string;
  // beneficiaryIfsc: string;
  dueDate: string;
  // trancheTenure: number;
  // interestType: string;
  // interestAndBorneBy: string;
  // interestPenalAccrual: number;
  // interestAccrual: number;
  // penalAccrual: number;
  // principalRepayment: number;
  // interestRepayment: number;
  // penalRepayment: number;
  // totalRepayment: number;
  // latestRepaymentDate: string;
  // principalOutstanding: number;
  // interestOutstanding: number;
  // penalOutstanding: number;
  totalOutstanding: number;
  // interestDpd: number;
  // interestDpdBucket: number;
  // trancheInterestStatus: string;
  // maturingDays: number;
  principalDpd: number;
  principalDpdBucket: number;
  // tranchePrincipalStatus: string;
  // principalOverdue: number;
  // trancheClosureDate: string;
  // trancheLevelDpd: number;
  // trancheLevelDpdBucket: number;
  // trancheFinalStatus: string;
  // totalOverdue: string;
  // borrowerRepaymentVirtualAccount: string;
  // anchorRepaymentVirtualAccount: string;
  // repaymentIfsc: string;
  // repaymentAccountType: string;
  // repaymentBankName: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

interface CreditLimitData {
  id: string;
  loanAccountNumber: string;
  borrowerName: string;
  sanctionedLimit: number;
  availableLimit: number;
  distributorCode?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

function parseNumber(val: any): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === "number") return val;
  const cleaned = String(val).replace(/,/g, "").trim();
  const num = Number(cleaned);
  return isNaN(num) ? 0 : num;
}

function formatCurrency(val: number): string {
  if (val === null || val === undefined) return "-";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(val);
}

function formatDateTime(val: any): string {
  if (!val) return "-";
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return String(val);
    return d.toLocaleString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(val);
  }
}

function formatUser(userId: any): string {
  if (!userId) return "-";
  return USERS_MAP[String(userId)] || String(userId);
}

function mapBackendToTransaction(d: any): TransactionData {
  return {
    // id: d._id || d.id || d.loan_account_number || crypto.randomUUID(),
    // loanReferenceNumber: d.loan_reference_number || "",
    // trancheCreationMonth: d.tranche_creation_month || "",
    // trancheCreationDate: d.tranche_creation_date || "",
    // disbursementMonth: d.disbursement_month || "",
    disbursementDate: d.disbursement_date || "",
    // loanAccountNumber: d.loan_account_number || "",
    anchorName: d.anchor_name || "",
    borrowerName: d.borrower_name || "",
    invoiceDate: d.invoice_date || "",
    invoiceNumber: d.invoice_number || "",
    invoiceAmount: parseNumber(d.invoice_amount_in_rs || d.invoice_amount),
    // principalAmount: parseNumber(d.principal_amount_in_rs || d.principal_amount),
    netDisbursementAmount: d.net_disbursement_amount_in_rs || d.net_disbursement_amount || "",
    // eligibilityPercent: d.eligibility || d.eligibility_percent || "",
    // disbursementUtr: d.disbursement_utr || "",
    // beneficiaryAccountName: d.beneficiary_account_name || "",
    // beneficiaryAccountNumber: d.beneficiary_account_number || "",
    // beneficiaryIfsc: d.beneficiary_ifsc || "",
    dueDate: d.due_date || "",
    // trancheTenure: parseNumber(d.tranche_tenure_in_days || d.tranche_tenure),
    // interestType: d.interest_type || "",
    // interestAndBorneBy: d.interest_and_borne_by || "",
    // interestPenalAccrual: parseNumber(d.interest_penal_accrual_till_date_in_rs || d.interest_penal_accrual),
    // interestAccrual: parseNumber(d.interest_accrual_till_date_in_rs || d.interest_accrual),
    // penalAccrual: parseNumber(d.penal_accrual_till_date_in_rs || d.penal_accrual),
    // principalRepayment: parseNumber(d.principal_repayment_in_rs || d.principal_repayment),
    // interestRepayment: parseNumber(d.interest_repayment_in_rs || d.interest_repayment),
    // penalRepayment: parseNumber(d.penal_repayment_in_rs || d.penal_repayment),
    // totalRepayment: parseNumber(d.total_repayment_in_rs || d.total_repayment),
    // latestRepaymentDate: d.latest_repayment_date || "",
    // principalOutstanding: parseNumber(d.principal_outstanding_in_rs || d.principal_outstanding),
    // interestOutstanding: parseNumber(d.interest_outstanding_in_rs || d.interest_outstanding),
    // penalOutstanding: parseNumber(d.penal_outstanding_in_rs || d.penal_outstanding),
    totalOutstanding: parseNumber(d.total_outstanding_in_rs || d.total_outstanding),
    // interestDpd: parseNumber(d.interest_dpd),
    // interestDpdBucket: parseNumber(d.interest_dpd_bucket),
    // trancheInterestStatus: d.tranche_interest_status || "",
    // maturingDays: parseNumber(d.maturing_days),
    principalDpd: parseNumber(d.principal_dpd),
    principalDpdBucket: parseNumber(d.principal_dpd_bucket),
    // tranchePrincipalStatus: d.tranche_principal_status || "",
    // principalOverdue: parseNumber(d.principal_overdue_in_rs || d.principal_overdue),
    // trancheClosureDate: d.tranche_closure_date || "",
    //trancheLevelDpd: parseNumber(d.tranche_level_dpd),
    //trancheLevelDpdBucket: parseNumber(d.tranche_level_dpd_bucket),
    //trancheFinalStatus: d.tranche_final_status || "",
    //totalOverdue: d.total_overdue_in_rs || d.total_overdue || "",
    //borrowerRepaymentVirtualAccount: d.borrower_repayment_virtual_account_number || d.borrower_repayment_virtual_account || "",
    //anchorRepaymentVirtualAccount: d.anchor_repayment_virtual_account_number || d.anchor_repayment_virtual_account || "",
    //repaymentIfsc: d.repayment_ifsc || "",
    //repaymentAccountType: d.repayment_account_type || "",
    //repaymentBankName: d.repayment_bank_name || "", 
    createdAt: d.created_at || "",
    updatedAt: d.updated_at || "",
    createdBy: d.created_by || "",
    updatedBy: d.updated_by || "",
  };
}

function mapBackendToCreditLimit(d: any): CreditLimitData {
  return {
    id: d._id || d.id || crypto.randomUUID(),
    loanAccountNumber: d.loan_account_number || "",
    borrowerName: d.borrower_name || "",
    sanctionedLimit: parseNumber(d.sanctioned_limit || d.sanction_limit),
    availableLimit: parseNumber(d.available_limit),
    distributorCode: d.distributor_code || d.distributorCode || "",
    createdAt: d.created_at || "",
    updatedAt: d.updated_at || "",
    createdBy: d.created_by || "",
    updatedBy: d.updated_by || "",
  };
}

export function MuthootRawData() {
  const [activeSubTab, setActiveSubTab] = useState<"transaction" | "limit">("transaction");
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [limits, setLimits] = useState<CreditLimitData[]>([]);
  const [loading, setLoading] = useState(false);

  // Pagination states
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const limit = 10;
  const [initialFetched, setInitialFetched] = useState(false);

  // Filter states (transaction)
  const [filterBorrowerName, setFilterBorrowerName] = useState("");
  const [filterInvoiceNumber, setFilterInvoiceNumber] = useState("");
  const [filterInvoiceDate, setFilterInvoiceDate] = useState("");
  const [filterPrincipalDpd, setFilterPrincipalDpd] = useState("");

  // Credit Limit Filter states
  const [filterCreditBorrowerName, setFilterCreditBorrowerName] = useState("");
  const [filterCreditDistributorCode, setFilterCreditDistributorCode] = useState("");

  // File upload state
  const [uploadLoading, setUploadLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    message: string;
    created: number;
    updated: number;
    failedCount: number;
    failedRows: any[];
  } | null>(null);

  async function fetchData(subTab: "transaction" | "limit", pageNumber: number, silent = false) {
    try {
      if (!silent) setLoading(true);
      const endpoint = subTab === "transaction" ? "transaction" : "credit";

      const params = new URLSearchParams();
      params.append("page", String(pageNumber));
      params.append("_t", String(Date.now()));

      if (subTab === "transaction") {
        if (filterBorrowerName) params.append("borrower_name", filterBorrowerName);
        if (filterInvoiceNumber) params.append("invoice_number", filterInvoiceNumber);
        if (filterInvoiceDate && isValidDDMMYYYY(filterInvoiceDate)) params.append("invoice_date", filterInvoiceDate.replace(/\//g, "-"));
        if (filterPrincipalDpd) params.append("principal_dpd", filterPrincipalDpd);
      } else {
        if (filterCreditBorrowerName) params.append("borrower_name", filterCreditBorrowerName);
        if (filterCreditDistributorCode) params.append("distributor_code", filterCreditDistributorCode);
      }

      const url = `${ENV.VITE_BACKEND_BASE_URL}/invoice/muthoot/${endpoint}?${params.toString()}`;

      const res = await fetch(url, {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`Failed to fetch ${subTab} data`);
      const json = await res.json();
      const pg = json.data?.page_info;

      setTotalRecords(pg?.total_records || 0);
      const computedTotalPages = Math.ceil((pg?.total_records || 0) / limit);
      setTotalPages(computedTotalPages || 1);

      if (subTab === "transaction") {
        const rawList = json.data?.muthoot_transactions || [];
        setTransactions(rawList.map(mapBackendToTransaction));
      } else {
        const rawList = json.data?.muthoot_credits || [];
        setLimits(rawList.map(mapBackendToCreditLimit));
      }
    } catch (err: any) {
      console.error("Fetch error:", err);
      toast.error(err.message || "Failed to fetch Muthoot records");
    } finally {
      setLoading(false);
    }
  }

  const handleTabChange = (tab: "transaction" | "limit") => {
    setActiveSubTab(tab);
    setPage(1);
  };

  // Reset page to 1 when transaction filters change
  useEffect(() => {
    if (activeSubTab === "transaction") {
      setPage(1);
    }
  }, [filterBorrowerName, filterInvoiceNumber, filterInvoiceDate, filterPrincipalDpd]);

  // Reset page to 1 when limit filters change
  useEffect(() => {
    if (activeSubTab === "limit") {
      setPage(1);
    }
  }, [filterCreditBorrowerName, filterCreditDistributorCode]);

  useEffect(() => {
    fetchData(activeSubTab, page, !initialFetched);
    if (!initialFetched) {
      setInitialFetched(true);
    }
  }, [
    activeSubTab,
    page,
    filterBorrowerName,
    filterInvoiceNumber,
    filterInvoiceDate,
    filterPrincipalDpd,
    filterCreditBorrowerName,
    filterCreditDistributorCode
  ]);

  async function performUpload(file: File) {
    if (uploadLoading) return;
    try {
      setUploadLoading(true);
      const formData = new FormData();
      formData.append("file", file);

      const endpoint = activeSubTab === "transaction" ? "transaction" : "credit";
      const url = `${ENV.VITE_BACKEND_BASE_URL}/invoice/muthoot/${endpoint}`;

      const res = await fetch(url, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        let errDetails = "Server responded with an error status.";
        if (data.data && Array.isArray(data.data)) {
          errDetails = "Mismatched headers: " + data.data.join(", ");
        } else if (data.error) {
          errDetails = data.error;
        }

        setUploadResult({
          message: data.message || "Failed to upload file",
          created: 0,
          updated: 0,
          failedCount: 1,
          failedRows: [
            {
              row_number: "Validation Error",
              empty_fields: [errDetails],
            }
          ],
        });
        setShowSuccessModal(true);
        return;
      }

      setUploadResult({
        message: data.message || "Upload Complete",
        created: data.total_rows_created ?? data.total_rows_craeted ?? 0,
        updated: data.total_rows_updated ?? 0,
        failedCount: data.failed_rows?.length || 0,
        failedRows: data.failed_rows || [],
      });
      setShowSuccessModal(true);
    } catch (err: any) {
      console.error(err);
      setUploadResult({
        message: err.message || "Error uploading file.",
        created: 0,
        updated: 0,
        failedCount: 1,
        failedRows: [
          {
            row_number: "Network Error",
            empty_fields: [err.message || "Unable to reach server. Please check your network connection."],
          }
        ],
      });
      setShowSuccessModal(true);
    } finally {
      setUploadLoading(false);
    }
  }

  async function handleImport(file: File) {
    await performUpload(file);
  }

  async function handleExport() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (activeSubTab === "transaction") {
        if (filterBorrowerName) params.append("borrower_name", filterBorrowerName);
        if (filterInvoiceNumber) params.append("invoice_number", filterInvoiceNumber);
        if (filterInvoiceDate && isValidDDMMYYYY(filterInvoiceDate)) params.append("invoice_date", filterInvoiceDate.replace(/\//g, "-"));
        if (filterPrincipalDpd) params.append("principal_dpd", filterPrincipalDpd);
      } else {
        if (filterCreditBorrowerName) params.append("borrower_name", filterCreditBorrowerName);
        if (filterCreditDistributorCode) params.append("distributor_code", filterCreditDistributorCode);
      }
      params.append("is_export", "true");

      const endpoint = activeSubTab === "transaction" ? "transaction" : "credit";
      const url = `${ENV.VITE_BACKEND_BASE_URL}/invoice/muthoot/${endpoint}?${params.toString()}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error(`Failed to fetch export ${activeSubTab} data`);
      const csvText = await res.text();
      const fileLabel = activeSubTab === "transaction" ? "muthoot-transactions" : "muthoot-limits";
      downloadCSVText(csvText, fileLabel);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Export failed");
    } finally {
      setLoading(false);
    }
  }

  const filteredTransactions = transactions;

  const filteredLimits = limits;

  return (
    <div className="relative">
      <MasterToolbar
        title="Muthoot Raw Data"
        onImport={handleImport}
        onExportCSV={handleExport}
      />

      <div className="border-b border-slate-200 mb-6 bg-white mt-4">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleTabChange("transaction")}
            className={`px-5 py-3 text-sm font-semibold transition-all duration-200 border-b-[3px] -mb-px ${activeSubTab === "transaction"
                ? "bg-blue-50/75 text-blue-600 border-blue-600"
                : "text-slate-500 hover:text-slate-800 bg-transparent border-transparent"
              }`}
          >
            Transaction Data
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("limit")}
            className={`px-5 py-3 text-sm font-semibold transition-all duration-200 border-b-[3px] -mb-px ${activeSubTab === "limit"
                ? "bg-blue-50/75 text-blue-600 border-blue-600"
                : "text-slate-500 hover:text-slate-800 bg-transparent border-transparent"
              }`}
          >
            Credit Limit
          </button>
        </div>
      </div>

      {activeSubTab === "transaction" && (
        <div className="flex items-center gap-3 overflow-x-auto flex-nowrap mb-4 p-4 border rounded-2xl bg-white shadow-sm scrollbar-none">
          {/* Borrower Name Input */}
          <Input
            value={filterBorrowerName}
            onChange={(e) => setFilterBorrowerName(e.target.value)}
            placeholder="Borrower Name"
            className="w-44 h-9 text-xs rounded-md shrink-0"
          />

          {/* Invoice Number Input */}
          <Input
            value={filterInvoiceNumber}
            onChange={(e) => setFilterInvoiceNumber(e.target.value)}
            placeholder="Invoice Number"
            className="w-36 h-9 text-xs rounded-md shrink-0"
          />

          {/* Invoice Date Input */}
          <Input
            value={filterInvoiceDate}
            onChange={(e) => setFilterInvoiceDate(e.target.value)}
            placeholder="Invoice Date"
            className={`w-36 h-9 text-xs rounded-md shrink-0 ${
              filterInvoiceDate && !isValidDDMMYYYY(filterInvoiceDate)
            }`}
          />

          {/* Principal DPD Input */}
          <Input
            value={filterPrincipalDpd}
            onChange={(e) => setFilterPrincipalDpd(e.target.value)}
            placeholder="Principal DPD"
            className="w-32 h-9 text-xs rounded-md shrink-0"
          />

          {/* Clear Filters Button */}
          {(filterBorrowerName || filterInvoiceNumber || filterInvoiceDate || filterPrincipalDpd) && (
            <button
              onClick={() => {
                setFilterBorrowerName("");
                setFilterInvoiceNumber("");
                setFilterInvoiceDate("");
                setFilterPrincipalDpd("");
              }}
              className="ml-auto text-xs text-rose-600 hover:text-rose-700 font-semibold cursor-pointer shrink-0"
            >
              Clear Filters
            </button>
          )}
        </div>
      )}

      {activeSubTab === "limit" && (
        <div className="flex items-center gap-3 overflow-x-auto flex-nowrap mb-4 p-4 border rounded-2xl bg-white shadow-sm scrollbar-none">
          {/* Borrower Name Input */}
          <Input
            value={filterCreditBorrowerName}
            onChange={(e) => setFilterCreditBorrowerName(e.target.value)}
            placeholder="Borrower Name"
            className="w-44 h-9 text-xs rounded-md shrink-0"
          />

          {/* Distributor Code Input */}
          <Input
            value={filterCreditDistributorCode}
            onChange={(e) => setFilterCreditDistributorCode(e.target.value)}
            placeholder="Distributor Code"
            className="w-44 h-9 text-xs rounded-md shrink-0"
          />

          {/* Clear Filters Button */}
          {(filterCreditBorrowerName || filterCreditDistributorCode) && (
            <button
              onClick={() => {
                setFilterCreditBorrowerName("");
                setFilterCreditDistributorCode("");
              }}
              className="ml-auto text-xs text-rose-600 hover:text-rose-700 font-semibold cursor-pointer shrink-0"
            >
              Clear Filters
            </button>
          )}
        </div>
      )}

      <Tabs value={activeSubTab} className="w-full">
        {/* Table 1: Transaction Data */}
        <TabsContent value="transaction" className="border rounded-md overflow-auto max-h-145 bg-white shadow-sm">
          <Table className="min-w-1000">
            <TableHeader className="sticky top-0 z-10 bg-white shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
              <TableRow>
                <TableHead>Disbursement Date</TableHead>
                <TableHead>Anchor Name</TableHead>
                <TableHead>Borrower Name</TableHead>
                <TableHead>Invoice Date</TableHead>
                <TableHead>Invoice Number</TableHead>
                <TableHead className="text-right">Invoice Amount (Rs.)</TableHead>
                <TableHead>Net Disbursement Amount (Rs.)</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead className="text-right font-semibold text-rose-600">Total Outstanding (Rs.)</TableHead>
                <TableHead className="text-right">Principal DPD</TableHead>
                <TableHead className="text-right">Principal DPD Bucket</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Updated At</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead>Updated By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={15} className="text-center py-12">
                    <div className="flex items-center justify-center gap-2 text-slate-500">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Loading transactions...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={15} className="text-center text-muted-foreground py-8">
                    No transactions matching filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredTransactions.map((tx) => (
                  <TableRow key={tx.disbursementDate + tx.invoiceNumber}> 
                    <TableCell>{formatToDDMMYYYY(tx.disbursementDate)}</TableCell>
                    <TableCell className="text-zinc-700">{tx.anchorName}</TableCell>
                    <TableCell className="font-semibold">{tx.borrowerName}</TableCell>
                    <TableCell>{formatToDDMMYYYY(tx.invoiceDate)}</TableCell>
                    <TableCell className="font-mono">{tx.invoiceNumber}</TableCell>
                    <TableCell className="text-right">{formatCurrency(tx.invoiceAmount)}</TableCell>
                    <TableCell>{tx.netDisbursementAmount || "-"}</TableCell>
                    <TableCell>{formatToDDMMYYYY(tx.dueDate)}</TableCell>
                    <TableCell className="text-right font-semibold text-rose-600">{formatCurrency(tx.totalOutstanding)}</TableCell>
                    <TableCell className="text-right">{tx.principalDpd}</TableCell>
                    <TableCell className="text-right">{tx.principalDpdBucket}</TableCell>
                    <TableCell className="text-xs text-slate-500 whitespace-nowrap">{formatDateTime(tx.createdAt)}</TableCell>
                    <TableCell className="text-xs text-slate-500 whitespace-nowrap">{formatDateTime(tx.updatedAt)}</TableCell>
                    <TableCell className="text-xs text-slate-500 font-mono">{formatUser(tx.createdBy)}</TableCell>
                    <TableCell className="text-xs text-slate-500 font-mono">{formatUser(tx.updatedBy)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TabsContent>

        {/* Table 2: Credit Limit */}
        <TabsContent value="limit" className="border rounded-md overflow-auto max-h-145 bg-white shadow-sm">
          <Table className="min-w-500">
            <TableHeader className="sticky top-0 z-10 bg-white shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
              <TableRow>
                <TableHead>Loan Account Number</TableHead>
                <TableHead>Borrower Name</TableHead>
                <TableHead>Distributor Code</TableHead>
                <TableHead className="text-right">Sanctioned Limit</TableHead>
                <TableHead className="text-right">Available Limit</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Updated At</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead>Updated By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12">
                    <div className="flex items-center justify-center gap-2 text-slate-500">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Loading limits...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredLimits.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                    No limits matching filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredLimits.map((lim) => (
                  <TableRow key={lim.id}>
                    <TableCell className="font-mono">{lim.loanAccountNumber}</TableCell>
                    <TableCell className="font-semibold text-slate-800">{lim.borrowerName}</TableCell>
                    <TableCell className="font-mono">{lim.distributorCode || "-"}</TableCell>
                    <TableCell className="text-right text-emerald-600 font-medium">{formatCurrency(lim.sanctionedLimit)}</TableCell>
                    <TableCell className="text-right text-blue-600 font-medium">{formatCurrency(lim.availableLimit)}</TableCell>
                    <TableCell className="text-xs text-slate-500 whitespace-nowrap">{formatDateTime(lim.createdAt)}</TableCell>
                    <TableCell className="text-xs text-slate-500 whitespace-nowrap">{formatDateTime(lim.updatedAt)}</TableCell>
                    <TableCell className="text-xs text-slate-500 font-mono">{formatUser(lim.createdBy)}</TableCell>
                    <TableCell className="text-xs text-slate-500 font-mono">{formatUser(lim.updatedBy)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>

      {/* Pagination controls */}
      <div className="flex items-center justify-between border border-slate-200 bg-white px-4 py-3 mt-4 sm:px-6 rounded-md shadow-xs">
        <div className="flex flex-1 justify-between sm:hidden">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
            className="relative inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            Previous
          </button>
          <button
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            disabled={page === totalPages}
            className="relative ml-3 inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            Next
          </button>
        </div>
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-slate-700">
              Showing <span className="font-medium">{totalRecords === 0 ? 0 : (page - 1) * limit + 1}</span> to{" "}
              <span className="font-medium">{Math.min(page * limit, totalRecords)}</span> of{" "}
              <span className="font-medium">{totalRecords}</span> results
            </p>
          </div>
          <div>
            <nav className="isolate inline-flex -space-x-px rounded-md shadow-xs" aria-label="Pagination">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="relative inline-flex items-center rounded-l-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <span className="sr-only">Previous</span>
                &larr;
              </button>
              <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-slate-900 ring-1 ring-inset ring-slate-300 focus:outline-offset-0">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page === totalPages}
                className="relative inline-flex items-center rounded-r-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <span className="sr-only">Next</span>
                &rarr;
              </button>
            </nav>
          </div>
        </div>
      </div>

      {/* Uploading progress overlay */}
      {uploadLoading && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="text-sm font-semibold text-slate-700">Uploading and processing Muthoot file...</span>
          </div>
        </div>
      )}

      {/* Success/Error Dialog Modal */}
      {showSuccessModal && uploadResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 p-6 w-110 max-w-full mx-4 transform scale-100 transition-all">
            {uploadResult.created === 0 && uploadResult.updated === 0 ? (
              <div className="flex items-center gap-3 mb-4 text-red-600">
                <div className="p-2 bg-rose-50 rounded-full">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  {uploadResult.message}
                </h3>
              </div>
            ) : (
              <div className="flex items-center gap-3 mb-4 text-emerald-600">
                <div className="p-2 bg-emerald-50 rounded-full">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-slate-900">{uploadResult.message}</h3>
              </div>
            )}

            <div className="space-y-2.5 text-sm text-slate-600 mb-4">
              <div className="flex justify-between border-b pb-1">
                <span>Created:</span>
                <span className="font-semibold text-emerald-600">{uploadResult.created} rows</span>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span>Updated:</span>
                <span className="font-semibold text-blue-600">{uploadResult.updated} rows</span>
              </div>
              <div className="flex justify-between">
                <span>Errors / Incomplete:</span>
                <span className="font-semibold text-red-500">{uploadResult.failedCount} rows</span>
              </div>
            </div>

            {uploadResult.failedRows && uploadResult.failedRows.length > 0 && (
              <div className="mt-4 mb-6">
                <p className="text-xs font-semibold text-red-600 mb-2">Error Details:</p>
                <div className="max-h-40 overflow-y-auto border border-red-100 rounded-lg p-2.5 bg-red-50/30 space-y-1.5">
                  {uploadResult.failedRows.map((err: any, idx: number) => {
                    const isSystemError = isNaN(Number(err.row_number));
                    return (
                      <div key={idx} className="text-[11px] text-red-800 leading-normal">
                        <span className="font-semibold">
                          {isSystemError ? err.row_number : `Row ${err.row_number}`}:
                        </span>{" "}
                        {isSystemError ? (
                          <span>{err.empty_fields?.[0] || "System error"}</span>
                        ) : (
                          <>
                            Missing fields:{" "}
                            <span className="font-mono bg-red-100/50 px-1 py-0.5 rounded text-[10px]">
                              {err.empty_fields?.join(", ") || "Unknown fields"}
                            </span>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <button
              onClick={() => {
                setShowSuccessModal(false);
                if (uploadResult.failedCount === 0) {
                  setPage(1);
                  fetchData(activeSubTab, 1, false);
                  toast.success(uploadResult.message);
                } else {
                  toast.error("Upload has validation errors. Correct them and try again.");
                }
              }}
              className="w-full bg-slate-900 text-white rounded-lg py-2.5 font-semibold text-sm hover:bg-slate-800 transition-colors shadow-sm focus:outline-none cursor-pointer"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
