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
import { isValidDDMMYYYY, formatToDDMMYYYY } from "@/utils/date-formatter";
import { Input } from "@/components/ui/input";

interface TransactionData {
  id: string;
  customerName: string;
  programName: string;
  programActivation: string;
  programExpiry: string;
  invoiceNo: string;
  loanStartDate: string;
  loanEndDate: string;
  invoiceDate: string;
  tenureDays: number;
  invoiceAmount: number;
  drawdownAmount: number;
  penalOutstanding: number;
  totalOutstanding: number;
  dpd: number;
  dpdRange: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

interface CreditLimitData {
  id: string;
  customerId: string;
  accountId: string;
  clientName: string;
  programId: string;
  programName: string;
  productName: string;
  sanctionLimit: number;
  maxActiveDrawdowns: number;
  utilizedLimit: number;
  availableLimit: number;
  limitSetupDate: string;
  expiryDate: string;
  adhocAvailableLimit: number;
  adhocActivationDate: string;
  adhocLineExpiryDate: string;
  status: string;
  rmName: string;
  distributorName?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

const sampleTransactions: TransactionData[] = [];
const sampleLimits: CreditLimitData[] = [];

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

function formatPercent(val: number): string {
  if (val === null || val === undefined) return "-";
  return `${val}%`;
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
    id: d._id || d.id || crypto.randomUUID(),
    customerName: d.customer_name || d.customerName || "",
    programName: d.program_name || d.programName || "",
    programActivation: d.program_activation || d.programActivation || "",
    programExpiry: d.program_expiry || d.programExpiry || "",
    invoiceNo: d.invoice_no || d.invoiceNo || "",
    loanStartDate: d.loan_start_date || d.loanStartDate || "",
    loanEndDate: d.loan_end_date || d.loanEndDate || "",
    invoiceDate: d.invoice_date || d.invoiceDate || "",
    tenureDays: parseNumber(d.tenure_days ?? d.tenureDays),
    invoiceAmount: parseNumber(d.invoice_amount ?? d.invoiceAmount),
    drawdownAmount: parseNumber(d.drawdown_amount ?? d.drawdownAmount),
    penalOutstanding: parseNumber(d.penal_outstanding ?? d.penalOutstanding),
    totalOutstanding: parseNumber(d.total_outstanding ?? d.totalOutstanding),
    dpd: parseNumber(d.dpd),
    dpdRange: d.dpd_range || d.dpdRange || "",
    createdAt: d.created_at || "",
    updatedAt: d.updated_at || "",
    createdBy: d.created_by || "",
    updatedBy: d.updated_by || "",
  };
}

function mapBackendToCreditLimit(d: any): CreditLimitData {
  return {
    id: d._id || d.id || crypto.randomUUID(),
    customerId: d.customer_id || d.customerId || "",
    accountId: d.account_id || d.accountId || "",
    clientName: d.client_name || d.clientName || "",
    programId: d.program_id || d.programId || "",
    programName: d.program_name || d.programName || "",
    productName: d.product_name || d.productName || "",
    sanctionLimit: parseNumber(d.sanction_limit ?? d.sanctionLimit),
    maxActiveDrawdowns: parseNumber(d.max_active_drawdowns ?? d.maxActiveDrawdowns),
    utilizedLimit: parseNumber(d.utilized_limit ?? d.utilizedLimit),
    availableLimit: parseNumber(d.available_limit ?? d.availableLimit),
    limitSetupDate: d.limit_setup_date || d.limitSetupDate || "",
    expiryDate: d.expiry_date || d.expiryDate || "",
    adhocAvailableLimit: parseNumber(d.adhoc_available_limit ?? d.adhocAvailableLimit),
    adhocActivationDate: d.adhoc_activation_date || d.adhocActivationDate || "",
    adhocLineExpiryDate: d.adhoc_line_expiry_date || d.adhocLineExpiryDate || "",
    status: d.status || "",
    rmName: d.rm_name || d.rmName || "",
    distributorName: d.distributor_name || d.distributorName || "",
    createdAt: d.created_at || "",
    updatedAt: d.updated_at || "",
    createdBy: d.created_by || "",
    updatedBy: d.updated_by || "",
  };
}

export function TCPLRawData() {
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
  const [filterCustomerName, setFilterCustomerName] = useState("");
  const [filterInvoiceNo, setFilterInvoiceNo] = useState("");
  const [filterInvoiceDate, setFilterInvoiceDate] = useState("");
  const [filterDpd, setFilterDpd] = useState("");

  // Credit Limit Filter states
  const [filterCreditClientName, setFilterCreditClientName] = useState("");
  const [filterCreditDistributorName, setFilterCreditDistributorName] = useState("");

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

      if (subTab === "transaction") {
        if (filterCustomerName) params.append("customer_name", filterCustomerName);
        if (filterInvoiceNo) params.append("invoice_no", filterInvoiceNo);
        if (filterInvoiceDate && isValidDDMMYYYY(filterInvoiceDate)) params.append("invoice_date", filterInvoiceDate.replace(/\//g, "-"));
        if (filterDpd) params.append("dpd", filterDpd);
      } else {
        if (filterCreditClientName) params.append("client_name", filterCreditClientName);
        if (filterCreditDistributorName) params.append("distributor_name", filterCreditDistributorName);
      }

      const url = `${ENV.VITE_BACKEND_BASE_URL}/invoice/tcpl/${endpoint}?${params.toString()}`;

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
        const rawList = json.data?.tcpl_transactions || [];
        setTransactions(rawList.map(mapBackendToTransaction));
      } else {
        const rawList = json.data?.tcpl_credits || [];
        setLimits(rawList.map(mapBackendToCreditLimit));
      }
    } catch (err: any) {
      console.error("Fetch error:", err);
      toast.error(err.message || "Failed to fetch TCPL records");
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
  }, [filterCustomerName, filterInvoiceNo, filterInvoiceDate, filterDpd]);

  // Reset page to 1 when limit filters change
  useEffect(() => {
    if (activeSubTab === "limit") {
      setPage(1);
    }
  }, [filterCreditClientName, filterCreditDistributorName]);

  useEffect(() => {
    fetchData(activeSubTab, page, !initialFetched);
    if (!initialFetched) {
      setInitialFetched(true);
    }
  }, [
    activeSubTab,
    page,
    filterCustomerName,
    filterInvoiceNo,
    filterInvoiceDate,
    filterDpd,
    filterCreditClientName,
    filterCreditDistributorName
  ]);

  async function performUpload(file: File) {
    if (uploadLoading) return;
    try {
      setUploadLoading(true);
      const formData = new FormData();
      formData.append("file", file);

      const endpoint = activeSubTab === "transaction" ? "transaction" : "credit";
      const url = `${ENV.VITE_BACKEND_BASE_URL}/invoice/tcpl/${endpoint}`;

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
        if (filterCustomerName) params.append("customer_name", filterCustomerName);
        if (filterInvoiceNo) params.append("invoice_no", filterInvoiceNo);
        if (filterInvoiceDate && isValidDDMMYYYY(filterInvoiceDate)) params.append("invoice_date", filterInvoiceDate.replace(/\//g, "-"));
        if (filterDpd) params.append("dpd", filterDpd);
      } else {
        if (filterCreditClientName) params.append("client_name", filterCreditClientName);
        if (filterCreditDistributorName) params.append("distributor_name", filterCreditDistributorName);
      }
      params.append("is_export", "true");

      const endpoint = activeSubTab === "transaction" ? "transaction" : "credit";
      const url = `${ENV.VITE_BACKEND_BASE_URL}/invoice/tcpl/${endpoint}?${params.toString()}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error(`Failed to fetch export ${activeSubTab} data`);
      const csvText = await res.text();
      const fileLabel = activeSubTab === "transaction" ? "tcpl-transactions" : "tcpl-limits";
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
        title="TCPL RAW DATA"
        onImport={handleImport}
        onExportCSV={handleExport}
      />

      <div className="border-b border-slate-200 mb-6 bg-white mt-4">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleTabChange("transaction")}
            className={`px-5 py-3 text-sm font-semibold transition-all duration-200 border-b-[3px] -mb-px ${
              activeSubTab === "transaction"
                ? "bg-blue-50/75 text-blue-600 border-blue-600"
                : "text-slate-500 hover:text-slate-800 bg-transparent border-transparent"
            }`}
          >
            Transaction Data
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("limit")}
            className={`px-5 py-3 text-sm font-semibold transition-all duration-200 border-b-[3px] -mb-px ${
              activeSubTab === "limit"
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
          {/* Customer Name Input */}
          <Input
            value={filterCustomerName}
            onChange={(e) => setFilterCustomerName(e.target.value)}
            placeholder="Customer Name"
            className="w-44 h-9 text-xs rounded-md shrink-0"
          />

          {/* Invoice No Input */}
          <Input
            value={filterInvoiceNo}
            onChange={(e) => setFilterInvoiceNo(e.target.value)}
            placeholder="Invoice No"
            className="w-36 h-9 text-xs rounded-md shrink-0"
          />

          {/* Invoice Date Input */}
          <Input
            value={filterInvoiceDate}
            onChange={(e) => setFilterInvoiceDate(e.target.value)}
            placeholder="Invoice Date"
            className={`w-36 h-9 text-xs rounded-md shrink-0 ${
              filterInvoiceDate && !isValidDDMMYYYY(filterInvoiceDate)
                ? "border-red-500 focus-visible:ring-red-500 text-red-600 bg-red-50/10"
                : ""
            }`}
          />

          {/* DPD Input */}
          <Input
            value={filterDpd}
            onChange={(e) => setFilterDpd(e.target.value)}
            placeholder="DPD"
            className="w-32 h-9 text-xs rounded-md shrink-0"
          />

          {/* Clear Filters Button */}
          {(filterCustomerName || filterInvoiceNo || filterInvoiceDate || filterDpd) && (
            <button
              onClick={() => {
                setFilterCustomerName("");
                setFilterInvoiceNo("");
                setFilterInvoiceDate("");
                setFilterDpd("");
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
          {/* Client Name Input */}
          <Input
            value={filterCreditClientName}
            onChange={(e) => setFilterCreditClientName(e.target.value)}
            placeholder="Client Name"
            className="w-44 h-9 text-xs rounded-md shrink-0"
          />

          {/* Distributor Name Input */}
          <Input
            value={filterCreditDistributorName}
            onChange={(e) => setFilterCreditDistributorName(e.target.value)}
            placeholder="Distributor Name"
            className="w-44 h-9 text-xs rounded-md shrink-0"
          />

          {/* Clear Filters Button */}
          {(filterCreditClientName || filterCreditDistributorName) && (
            <button
              onClick={() => {
                setFilterCreditClientName("");
                setFilterCreditDistributorName("");
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

                <TableHead>Customer Name</TableHead>
                <TableHead>Program Name</TableHead>
                <TableHead>Program Activation</TableHead>
                <TableHead>Program Expiry</TableHead>
                <TableHead>Invoice No</TableHead>
                <TableHead>Loan Start Date</TableHead>
                <TableHead>Loan End Date</TableHead>
                <TableHead>Invoice Date</TableHead>
                <TableHead className="text-center">Tenure Days</TableHead>
                <TableHead className="text-right">Invoice Amount</TableHead>
                <TableHead className="text-right">Drawdown Amount</TableHead>
                <TableHead className="text-right">Penal Outstanding</TableHead>
                <TableHead className="text-right">Total Outstanding</TableHead>
                <TableHead className="text-right">DPD</TableHead>
                <TableHead>DPD RANGE</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Updated At</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead>Updated By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={78} className="text-center py-12">
                    <div className="flex items-center justify-center gap-2 text-slate-500">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Loading transactions...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={78} className="text-center text-muted-foreground py-8">
                    No transactions matching filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredTransactions.map((tx) => (
                  <TableRow key={tx.id}>  
                    <TableCell className="font-semibold">{tx.customerName}</TableCell>
                    <TableCell>{tx.programName}</TableCell>
                    <TableCell>{formatToDDMMYYYY(tx.programActivation)}</TableCell>
                    <TableCell>{formatToDDMMYYYY(tx.programExpiry)}</TableCell>
                    <TableCell className="font-mono">{tx.invoiceNo}</TableCell>
                    <TableCell>{formatToDDMMYYYY(tx.loanStartDate)}</TableCell>
                    <TableCell>{formatToDDMMYYYY(tx.loanEndDate)}</TableCell>
                    <TableCell>{formatToDDMMYYYY(tx.invoiceDate)}</TableCell>
                    <TableCell className="text-center">{tx.tenureDays}</TableCell>
                    <TableCell className="text-right">{formatCurrency(tx.invoiceAmount)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(tx.drawdownAmount)}</TableCell>     
                    <TableCell className="text-right">{formatCurrency(tx.penalOutstanding)}</TableCell>
                    <TableCell className="text-right font-semibold text-rose-600">{formatCurrency(tx.totalOutstanding)}</TableCell>
                    <TableCell className="text-center">{tx.dpd}</TableCell>
                    <TableCell>{tx.dpdRange}</TableCell>
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
          <Table className="min-w-600">
            <TableHeader className="sticky top-0 z-10 bg-white shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
              <TableRow>
                <TableHead>Customer ID</TableHead>
                <TableHead>Account ID</TableHead>
                <TableHead>Client Name</TableHead>
                <TableHead>Distributor Name</TableHead>
                <TableHead>Program ID</TableHead>
                <TableHead>Program Name</TableHead>
                <TableHead>Product Name</TableHead>
                <TableHead className="text-right">Sanction Limit</TableHead>
                <TableHead className="text-right">Max Active Drawdowns</TableHead>
                <TableHead className="text-right">Utilized Limit</TableHead>
                <TableHead className="text-right">Available Limit</TableHead>
                <TableHead>Limit Setup Date</TableHead>
                <TableHead>Expiry Date</TableHead>
                <TableHead className="text-right">Adhoc Available Limit</TableHead>
                <TableHead>Adhoc Activation Date</TableHead>
                <TableHead>Adhoc Line Expiry Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>RM Name</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Updated At</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead>Updated By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={21} className="text-center py-12">
                    <div className="flex items-center justify-center gap-2 text-slate-500">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Loading limits...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredLimits.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={22} className="text-center text-muted-foreground py-8">
                    No limits matching filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredLimits.map((lim) => (
                  <TableRow key={lim.id}>
                    <TableCell className="font-mono">{lim.customerId}</TableCell>
                    <TableCell className="font-mono">{lim.accountId}</TableCell>
                    <TableCell className="font-semibold text-slate-800">{lim.clientName}</TableCell>
                    <TableCell>{lim.distributorName || "-"}</TableCell>
                    <TableCell className="font-mono">{lim.programId}</TableCell>
                    <TableCell>{lim.programName}</TableCell>
                    <TableCell>{lim.productName}</TableCell>
                    <TableCell className="text-right text-emerald-600 font-medium">{formatCurrency(lim.sanctionLimit)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(lim.maxActiveDrawdowns)}</TableCell>
                    <TableCell className="text-right text-blue-600 font-medium">{formatCurrency(lim.utilizedLimit)}</TableCell>
                    <TableCell className="text-right text-slate-700 font-medium">{formatCurrency(lim.availableLimit)}</TableCell>
                    <TableCell>{formatToDDMMYYYY(lim.limitSetupDate)}</TableCell>
                    <TableCell>{formatToDDMMYYYY(lim.expiryDate)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(lim.adhocAvailableLimit)}</TableCell>
                    <TableCell>{formatToDDMMYYYY(lim.adhocActivationDate)}</TableCell>
                    <TableCell>{formatToDDMMYYYY(lim.adhocLineExpiryDate)}</TableCell>
                    <TableCell>{lim.status}</TableCell>
                    <TableCell>{lim.rmName}</TableCell>
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
            <span className="text-sm font-semibold text-slate-700">Uploading and processing TCPL file...</span>
          </div>
        </div>
      )}

      {/* Success/Error Dialog Modal */}
      {showSuccessModal && uploadResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 p-6 w-110 max-w-full mx-4 transform scale-100 transition-all">
            {uploadResult.failedCount > 0 ? (
              <div className="flex items-center gap-3 mb-4 text-rose-600">
                <div className="p-2 bg-rose-50 rounded-full">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  {uploadResult.created === 0 && uploadResult.updated === 0
                    ? uploadResult.message
                    : "Upload Completed with Errors"}
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
