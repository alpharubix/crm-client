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
  id: string;
  sno: number;
  clientName: string;
  invoiceNumber: string;
  invoiceDate: string;
  sanctionAmount: number;
  principalAmount: number;
  interestAmount: number;
  totalOutstanding: number;
  dueDate: string;
  dpd: number;
  agreementNo: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

interface CreditLimitData {
  id: string;
  srNo: number;
  lanNo: string;
  customerName: string;
  accountLimit: number;
  limitUtilization: number;
  limitAvailable: number;
  limitUtilizedPercent: number;
  dealExpiryDate: string;
  beneficiaryName: string;
  beneficiaryAccountNo: string;
  dpd: number;
  principalOverdue: number;
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
    id: d._id || d.id || d.invoice_number || crypto.randomUUID(),
    sno: parseNumber(d.sno),
    clientName: d.client_name || "",
    invoiceNumber: d.invoice_number || "",
    invoiceDate: d.invoice_date || "",
    sanctionAmount: parseNumber(d.sanction_amount),
    principalAmount: parseNumber(d.principal_amount),
    interestAmount: parseNumber(d.interest_amount),
    totalOutstanding: parseNumber(d.total_outstanding),
    dueDate: d.due_date || "",
    dpd: parseNumber(d.dpd),
    agreementNo: d.agreement_no || "",
    createdAt: d.created_at || "",
    updatedAt: d.updated_at || "",
    createdBy: d.created_by || "",
    updatedBy: d.updated_by || "",
  };
}

function mapBackendToCreditLimit(d: any): CreditLimitData {
  return {
    id: d._id || d.id || crypto.randomUUID(),
    srNo: parseNumber(d.sr_no || d.srNo),
    lanNo: d.lan_no || d.lanNo || "",
    customerName: d.customer_name || d.customerName || "",
    accountLimit: parseNumber(d.account_limit || d.accountLimit),
    limitUtilization: parseNumber(d.limit_utilization_utilized_amount || d.limitUtilization),
    limitAvailable: parseNumber(d.limit_available || d.limitAvailable),
    limitUtilizedPercent: parseNumber(d.limit_utilized_in_percentage || d.limitUtilizedPercent),
    dealExpiryDate: d.deal_expiry_date || d.dealExpiryDate || "",
    beneficiaryName: d.beneficiary_name || d.beneficiaryName || "",
    beneficiaryAccountNo: d.beneficiary_account_no || d.beneficiaryAccountNo || "",
    dpd: parseNumber(d.dpd),
    principalOverdue: parseNumber(d.principal_overdue || d.principalOverdue),
    distributorCode: d.distributor_code || d.distributorCode || "",
    createdAt: d.created_at || "",
    updatedAt: d.updated_at || "",
    createdBy: d.created_by || "",
    updatedBy: d.updated_by || "",
  };
}

export function HeroRawData() {
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
  const [filterClientName, setFilterClientName] = useState("");
  const [filterInvoiceNumber, setFilterInvoiceNumber] = useState("");
  const [filterInvoiceDate, setFilterInvoiceDate] = useState("");
  const [filterDpd, setFilterDpd] = useState("");

  // Credit Limit Filter states
  const [filterCreditCustomerName, setFilterCreditCustomerName] = useState("");
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
        if (filterClientName) params.append("client_name", filterClientName);
        if (filterInvoiceNumber) params.append("invoice_number", filterInvoiceNumber);
        if (filterInvoiceDate && isValidDDMMYYYY(filterInvoiceDate)) params.append("invoice_date", filterInvoiceDate.replace(/\//g, "-"));
        if (filterDpd) params.append("dpd", filterDpd);
      } else {
        if (filterCreditCustomerName) params.append("customer_name", filterCreditCustomerName);
        if (filterCreditDistributorCode) params.append("distributor_code", filterCreditDistributorCode);
      }

      const url = `${ENV.VITE_BACKEND_BASE_URL}/invoice/hero/${endpoint}?${params.toString()}`;

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
        const rawList = json.data?.hero_transactions || [];
        setTransactions(rawList.map(mapBackendToTransaction));
      } else {
        const rawList = json.data?.hero_credits || [];
        setLimits(rawList.map(mapBackendToCreditLimit));
      }
    } catch (err: any) {
      console.error("Fetch error:", err);
      toast.error(err.message || "Failed to fetch Hero records");
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
  }, [filterClientName, filterInvoiceNumber, filterInvoiceDate, filterDpd]);

  // Reset page to 1 when limit filters change
  useEffect(() => {
    if (activeSubTab === "limit") {
      setPage(1);
    }
  }, [filterCreditCustomerName, filterCreditDistributorCode]);

  useEffect(() => {
    fetchData(activeSubTab, page, !initialFetched);
    if (!initialFetched) {
      setInitialFetched(true);
    }
  }, [
    activeSubTab,
    page,
    filterClientName,
    filterInvoiceNumber,
    filterInvoiceDate,
    filterDpd,
    filterCreditCustomerName,
    filterCreditDistributorCode
  ]);

  async function performUpload(file: File) {
    if (uploadLoading) return;
    try {
      setUploadLoading(true);
      const formData = new FormData();
      formData.append("file", file);

      const endpoint = activeSubTab === "transaction" ? "transaction" : "credit";
      const url = `${ENV.VITE_BACKEND_BASE_URL}/invoice/hero/${endpoint}`;

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
        if (filterClientName) params.append("client_name", filterClientName);
        if (filterInvoiceNumber) params.append("invoice_number", filterInvoiceNumber);
        if (filterInvoiceDate && isValidDDMMYYYY(filterInvoiceDate)) params.append("invoice_date", filterInvoiceDate.replace(/\//g, "-"));
        if (filterDpd) params.append("dpd", filterDpd);
      } else {
        if (filterCreditCustomerName) params.append("customer_name", filterCreditCustomerName);
        if (filterCreditDistributorCode) params.append("distributor_code", filterCreditDistributorCode);
      }
      params.append("is_export", "true");

      const endpoint = activeSubTab === "transaction" ? "transaction" : "credit";
      const url = `${ENV.VITE_BACKEND_BASE_URL}/invoice/hero/${endpoint}?${params.toString()}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error(`Failed to fetch export ${activeSubTab} data`);
      const csvText = await res.text();
      const fileLabel = activeSubTab === "transaction" ? "hero-transactions" : "hero-limits";
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
        title="HERO RAW DATA"
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
          {/* Client Name Input */}
          <Input
            value={filterClientName}
            onChange={(e) => setFilterClientName(e.target.value)}
            placeholder="Client Name"
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

          {/* DPD Input */}
          <Input
            value={filterDpd}
            onChange={(e) => setFilterDpd(e.target.value)}
            placeholder="DPD"
            className="w-32 h-9 text-xs rounded-md shrink-0"
          />

          {/* Clear Filters Button */}
          {(filterClientName || filterInvoiceNumber || filterInvoiceDate || filterDpd) && (
            <button
              onClick={() => {
                setFilterClientName("");
                setFilterInvoiceNumber("");
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
          {/* Customer Name Input */}
          <Input
            value={filterCreditCustomerName}
            onChange={(e) => setFilterCreditCustomerName(e.target.value)}
            placeholder="Customer Name"
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
          {(filterCreditCustomerName || filterCreditDistributorCode) && (
            <button
              onClick={() => {
                setFilterCreditCustomerName("");
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
          <Table className="min-w-600">
            <TableHeader className="sticky top-0 z-10 bg-white shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
              <TableRow>
                <TableHead className="w-16">SNO</TableHead>
                <TableHead>Client Name</TableHead>
                <TableHead>Invoice Number</TableHead>
                <TableHead>Invoice Date</TableHead>
                <TableHead className="text-right">Sanction Amount</TableHead>
                <TableHead className="text-right">Principal Amount</TableHead>
                <TableHead className="text-right">Interest Amount</TableHead>
                <TableHead className="text-right">Total Outstanding</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead className="text-right">DPD</TableHead>
                <TableHead>Agreement No</TableHead>
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
                  <TableRow key={tx.id}>
                    <TableCell>{tx.sno}</TableCell>
                    <TableCell className="font-semibold text-slate-800">{tx.clientName}</TableCell>
                    <TableCell className="font-mono">{tx.invoiceNumber}</TableCell>
                    <TableCell>{formatToDDMMYYYY(tx.invoiceDate)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(tx.sanctionAmount)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(tx.principalAmount)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(tx.interestAmount)}</TableCell>
                    <TableCell className="text-right font-semibold text-rose-600">{formatCurrency(tx.totalOutstanding)}</TableCell>
                    <TableCell>{formatToDDMMYYYY(tx.dueDate)}</TableCell>
                    <TableCell className="text-right">{tx.dpd}</TableCell>
                    <TableCell className="font-mono">{tx.agreementNo}</TableCell>
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
          <Table className="min-w-700">
            <TableHeader className="sticky top-0 z-10 bg-white shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
              <TableRow>
                <TableHead className="w-16">Sr. No</TableHead>
                <TableHead>LAN No</TableHead>
                <TableHead>Customer Name</TableHead>
                <TableHead>Distributor Code</TableHead>
                <TableHead className="text-right">Account Limit</TableHead>
                <TableHead className="text-right">Limit Utilization (Utilized amount)</TableHead>
                <TableHead className="text-right">Limit Available</TableHead>
                <TableHead className="text-right">Limit Utilized (%)</TableHead>
                <TableHead>Deal Expiry Date</TableHead>
                <TableHead>Beneficiary Name</TableHead>
                <TableHead>Beneficiary Account No</TableHead>
                <TableHead className="text-right">DPD</TableHead>
                <TableHead className="text-right">Principal Overdue</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Updated At</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead>Updated By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={16} className="text-center py-12">
                    <div className="flex items-center justify-center gap-2 text-slate-500">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Loading limits...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredLimits.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={17} className="text-center text-muted-foreground py-8">
                    No limits matching filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredLimits.map((lim) => (
                  <TableRow key={lim.id}>
                    <TableCell>{lim.srNo}</TableCell>
                    <TableCell className="font-mono">{lim.lanNo}</TableCell>
                    <TableCell className="font-semibold text-slate-800">{lim.customerName}</TableCell>
                    <TableCell className="font-mono">{lim.distributorCode || "-"}</TableCell>
                    <TableCell className="text-right text-emerald-600 font-medium">{formatCurrency(lim.accountLimit)}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(lim.limitUtilization)}</TableCell>
                    <TableCell className="text-right text-blue-600 font-medium">{formatCurrency(lim.limitAvailable)}</TableCell>
                    <TableCell className="text-right">{lim.limitUtilizedPercent}%</TableCell>
                    <TableCell>{formatToDDMMYYYY(lim.dealExpiryDate)}</TableCell>
                    <TableCell>{lim.beneficiaryName}</TableCell>
                    <TableCell className="font-mono">{lim.beneficiaryAccountNo}</TableCell>
                    <TableCell className="text-right">{lim.dpd}</TableCell>
                    <TableCell className="text-right text-rose-500 font-medium">{formatCurrency(lim.principalOverdue)}</TableCell>
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
            <span className="text-sm font-semibold text-slate-700">Uploading and processing Hero file...</span>
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
