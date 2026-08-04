import { useState, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type Invoice } from "@/types/master";
import { exportToCSV, exportToExcel, downloadCSVText } from "@/utils/importExport";
import { isValidDDMMYYYY, formatToDDMMYYYY } from "@/utils/date-formatter";
import { MasterToolbar } from "@/components/invoicing/MasterToolbar";
import { ENV, USERS_MAP } from "@/conf";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

const seedData: Invoice[] = [];

const statusColor: Record<string, string> = {
  Pending: "bg-yellow-100 text-yellow-800",
  Approved: "bg-blue-100 text-blue-800",
  Disbursed: "bg-purple-100 text-purple-800",
  Paid: "bg-green-100 text-green-800",
  Overdue: "bg-red-100 text-red-800",
};

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
    maximumFractionDigits: 0,
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

function mapBackendToInvoice(i: any): Invoice {
  return {
    id: i._id || i.id || i.invoice_no || crypto.randomUUID(),
    anchor: i.anchor || "",
    processedBy: i.processed_by || "",
    workingDate: i.working_date || "",
    invoiceReceivedDate: i.invoice_received_date || "",
    receivedTime: i.received_time || "",
    loanType: i.loan_type || "",
    lenderName: i.lender_name || "",
    distributorName: i.distributor_name || "",
    distributorCode: i.distributor_code || "",
    contactNumber: i.contact_number || "",
    emailId: i.email_id || "",
    himalayaCfa: i.himalaya_cfa || "",
    beneficiaryName: i.beneficiary_name || "",
    beneficiaryAccNo: i.beneficiary_a_c_no || "",
    bankName: i.bank_name || "",
    ifscCode: i.ifsc_code || "",
    branch: i.branch || "",
    invoiceNo: i.invoice_no || "",
    invoiceAmount: parseNumber(i.invoice_amount ?? 0),
    invoiceDate: i.invoice_date || "",
    loanAmount: parseNumber(i.loan_amount ?? 0),
    loanDisbursementDate: i.loan_disbursement_date || "",
    aging: i.aging || "",
    tenure: i.tenure !== undefined && i.tenure !== null ? i.tenure : "",
    utr: i.utr || "",
    status: i.status || "Pending",
    statusReason: i.status_reason || "",
    comments: i.comments || "",
    createdAt: i.created_at || "",
    updatedAt: i.updated_at || "",
    createdBy: i.created_by || "",
    updatedBy: i.updated_by || "",
  };
}

export function InvoiceMaster() {
  const [rows, setRows] = useState<Invoice[]>(seedData);
  const [loading, setLoading] = useState(false);

  // Pagination states
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const limit = 10; // Backend default limit

  // Filter states
  const [filterAnchor, setFilterAnchor] = useState("");
  const [filterProcessedBy, setFilterProcessedBy] = useState("");
  const [filterWorkingDate, setFilterWorkingDate] = useState("");
  const [filterLenderName, setFilterLenderName] = useState("");
  const [filterDistributorName, setFilterDistributorName] = useState("");
  const [filterDistributorCode, setFilterDistributorCode] = useState("");
  const [filterInvoiceNo, setFilterInvoiceNo] = useState("");
  const [filterDisbursementDate, setFilterDisbursementDate] = useState("");
  const [filterUtr, setFilterUtr] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterStatusReason, setFilterStatusReason] = useState("");

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

  const [initialFetched, setInitialFetched] = useState(false);

  async function fetchInvoices(pageNumber: number, silent = false) {
    try {
      if (!silent) setLoading(true);

      const params = new URLSearchParams();
      params.append("page", String(pageNumber));
      if (filterAnchor) params.append("anchor", filterAnchor);
      if (filterProcessedBy) params.append("processed_by", filterProcessedBy);
      if (filterWorkingDate && isValidDDMMYYYY(filterWorkingDate)) params.append("working_date", filterWorkingDate.replace(/\//g, "-"));
      if (filterLenderName) params.append("lender_name", filterLenderName);
      if (filterDistributorName) params.append("distributor_name", filterDistributorName);
      if (filterDistributorCode) params.append("distributor_code", filterDistributorCode);
      if (filterInvoiceNo) params.append("invoice_no", filterInvoiceNo);
      if (filterDisbursementDate && isValidDDMMYYYY(filterDisbursementDate)) params.append("loan_disbursement_date", filterDisbursementDate.replace(/\//g, "-"));
      if (filterUtr) params.append("utr", filterUtr);
      if (filterStatus) params.append("status", filterStatus);
      if (filterStatusReason) params.append("status_reason", filterStatusReason);

      const res = await fetch(
        `${ENV.VITE_BACKEND_BASE_URL}/invoice?${params.toString()}`,
        {
          credentials: "include",
          cache: "no-store",
        }
      );
      if (!res.ok) throw new Error("Failed to fetch invoices");
      const json = await res.json();
      const rawList = json.data?.invoices || [];
      const pg = json.data?.page_info;

      setRows(rawList.map(mapBackendToInvoice));
      setTotalRecords(pg?.total_records || 0);

      // Calculate correct total pages on frontend since backend ceil(len(invoices) / limit) has a bug
      const computedTotalPages = Math.ceil((pg?.total_records || 0) / limit);
      setTotalPages(computedTotalPages || 1);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }

  const lastFiltersRef = useRef({
    filterAnchor,
    filterProcessedBy,
    filterWorkingDate,
    filterLenderName,
    filterDistributorName,
    filterDistributorCode,
    filterInvoiceNo,
    filterDisbursementDate,
    filterUtr,
    filterStatus,
    filterStatusReason
  });

  useEffect(() => {
    const currentFilters = {
      filterAnchor,
      filterProcessedBy,
      filterWorkingDate,
      filterLenderName,
      filterDistributorName,
      filterDistributorCode,
      filterInvoiceNo,
      filterDisbursementDate,
      filterUtr,
      filterStatus,
      filterStatusReason
    };

    const filtersChanged = JSON.stringify(lastFiltersRef.current) !== JSON.stringify(currentFilters);

    if (filtersChanged) {
      lastFiltersRef.current = currentFilters;
      if (page !== 1) {
        setPage(1);
        return;
      }
    }

    fetchInvoices(page, !initialFetched);
    if (!initialFetched) {
      setInitialFetched(true);
    }
  }, [
    page,
    filterAnchor,
    filterProcessedBy,
    filterWorkingDate,
    filterLenderName,
    filterDistributorName,
    filterDistributorCode,
    filterInvoiceNo,
    filterDisbursementDate,
    filterUtr,
    filterStatus,
    filterStatusReason
  ]);

  async function performUpload(file: File) {
    if (uploadLoading) return;
    try {
      setUploadLoading(true);
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(
        `${ENV.VITE_BACKEND_BASE_URL}/invoice/upload-invoice-file`,
        {
          method: "POST",
          body: formData,
          credentials: "include",
        }
      );

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
        created: data.total_rows_craeted || 0,
        updated: data.total_rows_updated || 0,
        failedCount: data.failed_rows?.length || 0,
        failedRows: data.failed_rows || [],
      });
      setShowSuccessModal(true);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Error uploading file.");
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
      if (filterAnchor) params.append("anchor", filterAnchor);
      if (filterProcessedBy) params.append("processed_by", filterProcessedBy);
      if (filterWorkingDate && isValidDDMMYYYY(filterWorkingDate)) params.append("working_date", filterWorkingDate.replace(/\//g, "-"));
      if (filterLenderName) params.append("lender_name", filterLenderName);
      if (filterDistributorName) params.append("distributor_name", filterDistributorName);
      if (filterDistributorCode) params.append("distributor_code", filterDistributorCode);
      if (filterInvoiceNo) params.append("invoice_no", filterInvoiceNo);
      if (filterDisbursementDate && isValidDDMMYYYY(filterDisbursementDate)) params.append("loan_disbursement_date", filterDisbursementDate.replace(/\//g, "-"));
      if (filterUtr) params.append("utr", filterUtr);
      if (filterStatus) params.append("status", filterStatus);
      if (filterStatusReason) params.append("status_reason", filterStatusReason);
      params.append("is_export", "true");

      const url = `${ENV.VITE_BACKEND_BASE_URL}/invoice?${params.toString()}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch export data");
      const csvText = await res.text();
      downloadCSVText(csvText, "invoice-master");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Export failed");
    } finally {
      setLoading(false);
    }
  }

  const filteredRows = rows;

  return (
    <div>
      <MasterToolbar
        title="Invoice Master"
        onImport={handleImport}
        onExportCSV={handleExport}
      />

      {/* Filters Section */}
      <div className="flex items-center gap-3 overflow-x-auto flex-nowrap mb-4 p-4 border rounded-2xl bg-white shadow-sm scrollbar-none">
        {/* Anchor Input */}
        <Input
          value={filterAnchor}
          onChange={(e) => setFilterAnchor(e.target.value)}
          placeholder="Anchor"
          className="w-36 h-9 text-xs rounded-md shrink-0"
        />

        {/* Processed By Input */}
        <Input
          value={filterProcessedBy}
          onChange={(e) => setFilterProcessedBy(e.target.value)}
          placeholder="Processed by"
          className="w-36 h-9 text-xs rounded-md shrink-0"
        />

        {/* Working Date Input */}
        <Input
          value={filterWorkingDate}
          onChange={(e) => setFilterWorkingDate(e.target.value)}
          placeholder="Working Date"
          className={`w-36 h-9 text-xs rounded-md shrink-0 ${
            filterWorkingDate && !isValidDDMMYYYY(filterWorkingDate)
              ? " bg-red-50/10"
              : ""
          }`}
        />

        {/* Lender Name Input */}
        <Input
          value={filterLenderName}
          onChange={(e) => setFilterLenderName(e.target.value)}
          placeholder="Lender Name"
          className="w-36 h-9 text-xs rounded-md shrink-0"
        />

        {/* Distributor Name Input */}
        <Input
          value={filterDistributorName}
          onChange={(e) => setFilterDistributorName(e.target.value)}
          placeholder="Distributor Name"
          className="w-44 h-9 text-xs rounded-md shrink-0"
        />

        {/* Distributor Code Input */}
        <Input
          value={filterDistributorCode}
          onChange={(e) => setFilterDistributorCode(e.target.value)}
          placeholder="Distributor Code"
          className="w-36 h-9 text-xs rounded-md shrink-0"
        />

        {/* Invoice No Input */}
        <Input
          value={filterInvoiceNo}
          onChange={(e) => setFilterInvoiceNo(e.target.value)}
          placeholder="Invoice No"
          className="w-36 h-9 text-xs rounded-md shrink-0"
        />

        {/* Loan Disbursement Date Input */}
        <Input
          value={filterDisbursementDate}
          onChange={(e) => setFilterDisbursementDate(e.target.value)}
          placeholder="Disbursement Date"
          className={`w-36 h-9 text-xs rounded-md shrink-0 ${
            filterDisbursementDate && !isValidDDMMYYYY(filterDisbursementDate)
              ? " bg-red-50/10"
              : ""
          }`}
        />

        {/* UTR Input */}
        <Input
          value={filterUtr}
          onChange={(e) => setFilterUtr(e.target.value)}
          placeholder="UTR"
          className="w-36 h-9 text-xs rounded-md shrink-0"
        />

        {/* Status Input */}
        <Input
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          placeholder="Status"
          className="w-32 h-9 text-xs rounded-md shrink-0"
        />

        {/* Status Reason Input */}
        <Input
          value={filterStatusReason}
          onChange={(e) => setFilterStatusReason(e.target.value)}
          placeholder="Status Reason"
          className="w-36 h-9 text-xs rounded-md shrink-0"
        />

        {/* Clear Filters Button */}
        {(filterAnchor || filterProcessedBy || filterWorkingDate || filterLenderName || filterDistributorName || filterDistributorCode || filterInvoiceNo || filterDisbursementDate || filterUtr || filterStatus || filterStatusReason) && (
          <button
            onClick={() => {
              setFilterAnchor("");
              setFilterProcessedBy("");
              setFilterWorkingDate("");
              setFilterLenderName("");
              setFilterDistributorName("");
              setFilterDistributorCode("");
              setFilterInvoiceNo("");
              setFilterDisbursementDate("");
              setFilterUtr("");
              setFilterStatus("");
              setFilterStatusReason("");
            }}
            className="ml-auto text-xs text-rose-600 hover:text-rose-700 font-semibold cursor-pointer shrink-0"
          >
            Clear Filters
          </button>
        )}
      </div>

      <div className="border rounded-md overflow-auto max-h-145 bg-white shadow-sm mt-4">
        <Table className="min-w-700">
          <TableHeader className="sticky top-0 z-10 bg-white shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
            <TableRow>
              <TableHead>Anchor</TableHead>
              <TableHead>Processed by</TableHead>
              <TableHead>Working Date</TableHead>
              <TableHead>Received Date</TableHead>
              <TableHead>Received Time</TableHead>
              <TableHead>Loan Type</TableHead>
              <TableHead>Lender</TableHead>
              <TableHead>Distributor Name</TableHead>
              <TableHead>Distributor Code</TableHead>
              <TableHead>Contact No</TableHead>
              <TableHead>Email ID</TableHead>
              <TableHead>Himalaya CFA</TableHead>
              <TableHead>Beneficiary Name</TableHead>
              <TableHead>Beneficiary A/c no</TableHead>
              <TableHead>Bank Name</TableHead>
              <TableHead>IFSC Code</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Invoice no</TableHead>
              <TableHead className="text-right">Invoice amount</TableHead>
              <TableHead>Invoice date</TableHead>
              <TableHead className="text-right">Loan Amount</TableHead>
              <TableHead>Disbursement Date</TableHead>
              <TableHead>Aging</TableHead>
              <TableHead className="text-right">Tenure (Days)</TableHead>
              <TableHead>UTR</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Status Reason</TableHead>
              <TableHead>Comments</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>Updated At</TableHead>
              <TableHead>Created By</TableHead>
              <TableHead>Updated By</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading || !initialFetched ? (
              <TableRow>
                <TableCell colSpan={32} className="text-center py-12">
                  <div className="flex items-center justify-center gap-2 text-slate-500">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Loading invoices...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={32} className="text-center text-muted-foreground py-8">
                  No invoices matching filters.
                </TableCell>
              </TableRow>
            ) : (
              filteredRows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-semibold">{row.anchor || "-"}</TableCell>
                  <TableCell>{row.processedBy || "-"}</TableCell>
                  <TableCell>{formatToDDMMYYYY(row.workingDate)}</TableCell>
                  <TableCell>{formatToDDMMYYYY(row.invoiceReceivedDate)}</TableCell>
                  <TableCell>{row.receivedTime || "-"}</TableCell>
                  <TableCell>{row.loanType || "-"}</TableCell>
                  <TableCell>{row.lenderName || "-"}</TableCell>
                  <TableCell className="font-medium text-slate-800">{row.distributorName || "-"}</TableCell>
                  <TableCell>{row.distributorCode || "-"}</TableCell>
                  <TableCell>{row.contactNumber || "-"}</TableCell>
                  <TableCell>{row.emailId || "-"}</TableCell>
                  <TableCell>{row.himalayaCfa || "-"}</TableCell>
                  <TableCell>{row.beneficiaryName || "-"}</TableCell>
                  <TableCell className="font-mono">{row.beneficiaryAccNo || "-"}</TableCell>
                  <TableCell>{row.bankName || "-"}</TableCell>
                  <TableCell className="font-mono">{row.ifscCode || "-"}</TableCell>
                  <TableCell>{row.branch || "-"}</TableCell>
                  <TableCell className="font-medium">{row.invoiceNo || "-"}</TableCell>
                  <TableCell className="text-right font-medium text-emerald-600">{formatCurrency(row.invoiceAmount)}</TableCell>
                  <TableCell>{formatToDDMMYYYY(row.invoiceDate)}</TableCell>
                  <TableCell className="text-right font-medium text-blue-600">{formatCurrency(row.loanAmount)}</TableCell>
                  <TableCell>{formatToDDMMYYYY(row.loanDisbursementDate)}</TableCell>
                  <TableCell>{row.aging || "-"}</TableCell>
                  <TableCell className="text-right">{row.tenure || "-"}</TableCell>
                  <TableCell className="font-mono">{row.utr || "-"}</TableCell>
                  <TableCell>
                    <Badge className={statusColor[row.status] || "bg-slate-100 text-slate-800"}>
                      {row.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{row.statusReason || "-"}</TableCell>
                  <TableCell className="max-w-50 truncate" title={row.comments}>{row.comments || "-"}</TableCell>
                  <TableCell className="text-xs text-slate-500 whitespace-nowrap">{formatDateTime(row.createdAt)}</TableCell>
                  <TableCell className="text-xs text-slate-500 whitespace-nowrap">{formatDateTime(row.updatedAt)}</TableCell>
                  <TableCell className="text-xs text-slate-500 whitespace-nowrap">{formatUser(row.createdBy)}</TableCell>
                  <TableCell className="text-xs text-slate-500 whitespace-nowrap">{formatUser(row.updatedBy)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

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
            <span className="text-sm font-semibold text-slate-700">Uploading and processing invoices...</span>
          </div>
        </div>
      )}

      {/* Success Dialog Modal with OK button */}
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
                if (page === 1) {
                  fetchInvoices(1);
                } else {
                  setPage(1);
                }
                toast.success(uploadResult.message);
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
