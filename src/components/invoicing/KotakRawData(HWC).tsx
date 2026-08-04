import { useState, useEffect, useRef } from "react";
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
  wcdlAccountNo: string;
  dealerName: string;
  totalLimit: number;
  invoiceNumber: string;
  reverseFileRef: string;
  invoiceDate: string;
  disbursementDate: string;
  tranValueAmount: number;
  balanceOutstanding: number;
  dueDate: string;
  customerPaymentDate: string;
  overdueWithinCureInr: number;
  overdueWithinCureDays: number;
  overdueBeyondCureInr: number;
  overdueBeyondCureDays: number;
  location: string;
  distributorCode: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

interface CreditLimitData {
  id: string;
  dealerName: string;
  sanctionLimit: number;
  operativeLimit: number;
  utilisedLimit: number;
  overdue: number;
  dpd: number;
  odOutstanding: string;
  availableLimit: number;
  interest: number;
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
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(val);
}

function formatOD(val: any): string {
  if (val === "-" || val === "" || val === null || val === undefined) return "-";
  const num = Number(val);
  return isNaN(num) ? String(val) : formatCurrency(num);
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
    wcdlAccountNo: d.wcdl_account_no || "",
    dealerName: d.dealer_name || "",
    totalLimit: parseNumber(d.total_limit),
    invoiceNumber: d.invoice_number || "",
    reverseFileRef: d.reverse_file_ref || "",
    invoiceDate: d.invoice_date || "",
    disbursementDate: d.disbursement_date || "",
    tranValueAmount: parseNumber(d.transaction_amount),
    balanceOutstanding: parseNumber(d.balance_outstanding),
    dueDate: d.due_date || "",
    customerPaymentDate: d.customer_payment_date || "",
    overdueWithinCureInr: parseNumber(d.overdue_within_cure_amount),
    overdueWithinCureDays: parseNumber(d.overdue_within_cure_days),
    overdueBeyondCureInr: parseNumber(d.overdue_beyond_cure_amount),
    overdueBeyondCureDays: parseNumber(d.overdue_beyond_cure_days),
    location: d.location || "",
    distributorCode: d.distributor_code || "",
    createdAt: d.created_at || "",
    updatedAt: d.updated_at || "",
    createdBy: d.created_by || "",
    updatedBy: d.updated_by || "",
  };
}

function mapBackendToCreditLimit(d: any): CreditLimitData {
  return {
    id: d._id || d.id || d.dealer_name || crypto.randomUUID(),
    dealerName: d.dealer_name || "",
    sanctionLimit: parseNumber(d.sanction_limit),
    operativeLimit: parseNumber(d.operative_limit),
    utilisedLimit: parseNumber(d.utilised_limit),
    overdue: parseNumber(d.overdue),
    dpd: parseNumber(d.dpd),
    odOutstanding: d.od_outstanding || "",
    availableLimit: parseNumber(d.available_limit),
    interest: parseNumber(d.interest),
    distributorCode: d.distributor_code || d.distributorCode || "",
    createdAt: d.created_at || "",
    updatedAt: d.updated_at || "",
    createdBy: d.created_by || "",
    updatedBy: d.updated_by || "",
  };
}

export function KotakRawDataHWC() {
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

  // Filter states
  const [filterDealerName, setFilterDealerName] = useState("");
  const [filterInvoiceDate, setFilterInvoiceDate] = useState("");
  const [filterInvoiceNumber, setFilterInvoiceNumber] = useState("");
  const [filterDisbursementDate, setFilterDisbursementDate] = useState("");
  const [filterOverdueWithinCureInr, setFilterOverdueWithinCureInr] = useState("");
  const [filterOverdueBeyondCureInr, setFilterOverdueBeyondCureInr] = useState("");

  // Credit Limit Filter states
  const [filterCreditDealerName, setFilterCreditDealerName] = useState("");
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

      if (subTab === "transaction") {
        if (filterDealerName) params.append("dealer_name", filterDealerName);
        if (filterInvoiceDate && isValidDDMMYYYY(filterInvoiceDate)) params.append("invoice_date", filterInvoiceDate.replace(/\//g, "-"));
        if (filterInvoiceNumber) params.append("invoice_number", filterInvoiceNumber);
        if (filterDisbursementDate && isValidDDMMYYYY(filterDisbursementDate)) params.append("disbursement_date", filterDisbursementDate.replace(/\//g, "-"));
        if (filterOverdueWithinCureInr) params.append("overdue_within_cure_inr", filterOverdueWithinCureInr);
        if (filterOverdueBeyondCureInr) params.append("overdue_beyond_cure_inr", filterOverdueBeyondCureInr);
      } else {
        if (filterCreditDealerName) params.append("dealer_name", filterCreditDealerName);
        if (filterCreditDistributorCode) params.append("distributor_code", filterCreditDistributorCode);
      }

      const url = `${ENV.VITE_BACKEND_BASE_URL}/invoice/kotak-hwc/${endpoint}?${params.toString()}`;

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
        const rawList = json.data?.kotak_hwc_transactions || [];
        setTransactions(rawList.map(mapBackendToTransaction));
      } else {
        const rawList = json.data?.kotak_hwc_credits || [];
        setLimits(rawList.map(mapBackendToCreditLimit));
      }
    } catch (err: any) {
      console.error("Fetch error:", err);
      toast.error(err.message || "Failed to fetch Kotak HWC records");
    } finally {
      setLoading(false);
    }
  }

  const handleTabChange = (tab: "transaction" | "limit") => {
    setActiveSubTab(tab);
    setPage(1);
  };

  const lastFiltersRef = useRef({
    activeSubTab,
    filterDealerName,
    filterInvoiceDate,
    filterInvoiceNumber,
    filterDisbursementDate,
    filterOverdueWithinCureInr,
    filterOverdueBeyondCureInr,
    filterCreditDealerName,
    filterCreditDistributorCode
  });

  useEffect(() => {
    const currentFilters = {
      activeSubTab,
      filterDealerName,
      filterInvoiceDate,
      filterInvoiceNumber,
      filterDisbursementDate,
      filterOverdueWithinCureInr,
      filterOverdueBeyondCureInr,
      filterCreditDealerName,
      filterCreditDistributorCode
    };

    const filtersChanged = JSON.stringify(lastFiltersRef.current) !== JSON.stringify(currentFilters);

    if (filtersChanged) {
      lastFiltersRef.current = currentFilters;
      if (page !== 1) {
        setPage(1);
        return;
      }
    }

    fetchData(activeSubTab, page, !initialFetched);
    if (!initialFetched) {
      setInitialFetched(true);
    }
  }, [
    activeSubTab,
    page,
    filterDealerName,
    filterInvoiceDate,
    filterInvoiceNumber,
    filterDisbursementDate,
    filterOverdueWithinCureInr,
    filterOverdueBeyondCureInr,
    filterCreditDealerName,
    filterCreditDistributorCode
  ]);

  async function performUpload(file: File) {
    if (uploadLoading) return;
    try {
      setUploadLoading(true);
      const formData = new FormData();
      formData.append("file", file);

      const endpoint = activeSubTab === "transaction" ? "transaction" : "credit";
      const url = `${ENV.VITE_BACKEND_BASE_URL}/invoice/kotak-hwc/${endpoint}`;

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
        if (filterDealerName) params.append("dealer_name", filterDealerName);
        if (filterInvoiceDate && isValidDDMMYYYY(filterInvoiceDate)) params.append("invoice_date", filterInvoiceDate.replace(/\//g, "-"));
        if (filterInvoiceNumber) params.append("invoice_number", filterInvoiceNumber);
        if (filterDisbursementDate && isValidDDMMYYYY(filterDisbursementDate)) params.append("disbursement_date", filterDisbursementDate.replace(/\//g, "-"));
        if (filterOverdueWithinCureInr) params.append("overdue_within_cure_inr", filterOverdueWithinCureInr);
        if (filterOverdueBeyondCureInr) params.append("overdue_beyond_cure_inr", filterOverdueBeyondCureInr);
      } else {
        if (filterCreditDealerName) params.append("dealer_name", filterCreditDealerName);
        if (filterCreditDistributorCode) params.append("distributor_code", filterCreditDistributorCode);
      }
      params.append("is_export", "true");

      const endpoint = activeSubTab === "transaction" ? "transaction" : "credit";
      const url = `${ENV.VITE_BACKEND_BASE_URL}/invoice/kotak-hwc/${endpoint}?${params.toString()}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error(`Failed to fetch export ${activeSubTab} data`);
      const csvText = await res.text();
      const fileLabel = activeSubTab === "transaction" ? "kotak-hwc-transactions" : "kotak-hwc-limits";
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
        title="Kotak Raw Data (HWC)"
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
          {/* Dealer Name Input */}
          <Input
            value={filterDealerName}
            onChange={(e) => setFilterDealerName(e.target.value)}
            placeholder="Dealer Name"
            className="w-44 h-9 text-xs rounded-md shrink-0"
          />

          {/* Invoice Date Input */}
          <Input
            value={filterInvoiceDate}
            onChange={(e) => setFilterInvoiceDate(e.target.value)}
            placeholder="Invoice Date (ID)"
            className={`w-36 h-9 text-xs rounded-md shrink-0 ${
              filterInvoiceDate && !isValidDDMMYYYY(filterInvoiceDate)
            }`}
          />

          {/* Invoice Number Input */}
          <Input
            value={filterInvoiceNumber}
            onChange={(e) => setFilterInvoiceNumber(e.target.value)}
            placeholder="Invoice Number"
            className="w-36 h-9 text-xs rounded-md shrink-0"
          />

          {/* Disbursement Date Input */}
          <Input
            value={filterDisbursementDate}
            onChange={(e) => setFilterDisbursementDate(e.target.value)}
            placeholder="Disbursement Date"
            className={`w-36 h-9 text-xs rounded-md shrink-0 ${
              filterDisbursementDate && !isValidDDMMYYYY(filterDisbursementDate)
            }`}
          />

          {/* Overdue Within Cure - INR Input */}
          <Input
            value={filterOverdueWithinCureInr}
            onChange={(e) => setFilterOverdueWithinCureInr(e.target.value)}
            placeholder="Overdue Within Cure (INR)"
            className="w-48 h-9 text-xs rounded-md shrink-0"
          />

          {/* Overdue Beyond Cure - INR Input */}
          <Input
            value={filterOverdueBeyondCureInr}
            onChange={(e) => setFilterOverdueBeyondCureInr(e.target.value)}
            placeholder="Overdue Beyond Cure (INR)"
            className="w-48 h-9 text-xs rounded-md shrink-0"
          />

          {/* Clear Filters Button */}
          {(filterDealerName || filterInvoiceDate || filterInvoiceNumber || filterDisbursementDate || filterOverdueWithinCureInr || filterOverdueBeyondCureInr) && (
            <button
              onClick={() => {
                setFilterDealerName("");
                setFilterInvoiceDate("");
                setFilterInvoiceNumber("");
                setFilterDisbursementDate("");
                setFilterOverdueWithinCureInr("");
                setFilterOverdueBeyondCureInr("");
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
          {/* Dealer Name Input */}
          <Input
            value={filterCreditDealerName}
            onChange={(e) => setFilterCreditDealerName(e.target.value)}
            placeholder="Dealer Name"
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
          {(filterCreditDealerName || filterCreditDistributorCode) && (
            <button
              onClick={() => {
                setFilterCreditDealerName("");
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
          <Table className="min-w-650">
            <TableHeader className="sticky top-0 z-10 bg-white shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
              <TableRow>
                <TableHead>WCDL Account No</TableHead>
                <TableHead>Dealer Name</TableHead>
                <TableHead className="text-right">Total Limit</TableHead>
                <TableHead>Invoice Number</TableHead>
                <TableHead>Reverse File Ref.</TableHead>
                <TableHead>Invoice Date(ID)</TableHead>
                <TableHead>Disbursement Date</TableHead>
                <TableHead className="text-right">Tran/Value Amount</TableHead>
                <TableHead className="text-right">Balance Outstanding - INR</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Customer Payment Date</TableHead>
                <TableHead className="text-right">Overdue Within Cure - INR</TableHead>
                <TableHead className="text-right">Overdue Within Cure - Days</TableHead>
                <TableHead className="text-right">Overdue Beyond Cure - INR</TableHead>
                <TableHead className="text-right">Overdue Beyond Cure - Days</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Distributor Code</TableHead>
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
                      <span>Loading transactions...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={21} className="text-center text-muted-foreground py-8">
                    No transactions matching filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredTransactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="font-medium font-mono text-slate-800">{tx.wcdlAccountNo}</TableCell>
                    <TableCell className="font-semibold">{tx.dealerName}</TableCell>
                    <TableCell className="text-right text-emerald-600 font-medium">{formatCurrency(tx.totalLimit)}</TableCell>
                    <TableCell className="font-mono">{tx.invoiceNumber}</TableCell>
                    <TableCell>{tx.reverseFileRef}</TableCell>
                    <TableCell>{formatToDDMMYYYY(tx.invoiceDate)}</TableCell>
                    <TableCell>{formatToDDMMYYYY(tx.disbursementDate)}</TableCell>
                    <TableCell className="text-right font-medium text-blue-600">{formatCurrency(tx.tranValueAmount)}</TableCell>
                    <TableCell className="text-right font-medium text-rose-500">{formatCurrency(tx.balanceOutstanding)}</TableCell>
                    <TableCell>{formatToDDMMYYYY(tx.dueDate)}</TableCell>
                    <TableCell>{formatToDDMMYYYY(tx.customerPaymentDate)}</TableCell>
                    <TableCell className="text-center">{formatCurrency(tx.overdueWithinCureInr)}</TableCell>
                    <TableCell className="text-center">{tx.overdueWithinCureDays}</TableCell>
                    <TableCell className="text-center">{formatCurrency(tx.overdueBeyondCureInr)}</TableCell>
                    <TableCell className="text-center">{tx.overdueBeyondCureDays}</TableCell>
                    <TableCell>{tx.location}</TableCell>
                    <TableCell className="font-mono">{tx.distributorCode}</TableCell>
                    <TableCell className="text-slate-500 text-xs whitespace-nowrap">{formatDateTime(tx.createdAt)}</TableCell>
                    <TableCell className="text-slate-500 text-xs whitespace-nowrap">{formatDateTime(tx.updatedAt)}</TableCell>
                    <TableCell className="text-slate-500 text-xs">{formatUser(tx.createdBy)}</TableCell>
                    <TableCell className="text-slate-500 text-xs">{formatUser(tx.updatedBy)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TabsContent>

        {/* Table 2: Credit Limit */}
        <TabsContent value="limit" className="border rounded-md overflow-auto max-h-145 bg-white shadow-sm">
          <Table className="min-w-400">
            <TableHeader className="sticky top-0 z-10 bg-white shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
              <TableRow>
                <TableHead>Dealer Name</TableHead>
                <TableHead>Distributor Code</TableHead>
                <TableHead className="text-right">Sanction Limit</TableHead>
                <TableHead className="text-right">Operative Limit</TableHead>
                <TableHead className="text-right">Utilised Limit</TableHead>
                <TableHead className="text-right">Overdue</TableHead>
                <TableHead className="text-right">DPD</TableHead>
                <TableHead className="text-right">OD Outstanding</TableHead>
                <TableHead className="text-right">Available Limit</TableHead>
                <TableHead className="text-right">Interest</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Updated At</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead>Updated By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={14} className="text-center py-12">
                    <div className="flex items-center justify-center gap-2 text-slate-500">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Loading limits...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredLimits.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={14} className="text-center text-muted-foreground py-8">
                    No limits matching filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredLimits.map((lim) => (
                  <TableRow key={lim.id}>
                    <TableCell className="font-semibold text-slate-800">{lim.dealerName}</TableCell>
                    <TableCell className="font-mono">{lim.distributorCode || "-"}</TableCell>
                    <TableCell className="text-right text-emerald-600 font-medium">{formatCurrency(lim.sanctionLimit)}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(lim.operativeLimit)}</TableCell>
                    <TableCell className="text-right text-blue-600 font-medium">{formatCurrency(lim.utilisedLimit)}</TableCell>
                    <TableCell className="text-right text-rose-500 font-medium">{formatCurrency(lim.overdue)}</TableCell>
                    <TableCell className="text-right">{lim.dpd}</TableCell>
                    <TableCell className="text-right">{formatOD(lim.odOutstanding)}</TableCell>
                    <TableCell className="text-right text-slate-700 font-medium">{formatCurrency(lim.availableLimit)}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(lim.interest)}</TableCell>
                    <TableCell className="text-slate-500 text-xs whitespace-nowrap">{formatDateTime(lim.createdAt)}</TableCell>
                    <TableCell className="text-slate-500 text-xs whitespace-nowrap">{formatDateTime(lim.updatedAt)}</TableCell>
                    <TableCell className="text-slate-500 text-xs">{formatUser(lim.createdBy)}</TableCell>
                    <TableCell className="text-slate-500 text-xs">{formatUser(lim.updatedBy)}</TableCell>
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
            <span className="text-sm font-semibold text-slate-700">Uploading and processing Kotak HWC file...</span>
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
                  if (page === 1) {
                    fetchData(activeSubTab, 1, false);
                  } else {
                    setPage(1);
                  }
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
