import { useState, useEffect, useRef } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MasterToolbar } from "@/components/invoicing/MasterToolbar";
import { toast } from "sonner";
import { ENV } from "@/conf";
import { Loader2 } from "lucide-react";
import { exportToCSV, exportToExcel, downloadCSVText } from "@/utils/importExport";
import { formatToDDMMYYYY } from "@/utils/date-formatter";
import { Input } from "@/components/ui/input";

interface RepositoryData {
  id: string;
  sno: number;
  companyName: string;
  distributorCode: string;
  city: string;
  state: string;
  lender: string;
  sanctionLimit: number;
  operativeLimit: number;
  utilisedLimit: number;
  availableLimit: number;
  limitExpiry: string;
  overdue: number;
  fundingType: string;
  billingStatus: string;
  anchorId: string;
  distributorPhone: string;
  distributorEmail: string;
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

export function ConsolitatedLimitData() {
  const [rows, setRows] = useState<RepositoryData[]>([]);
  const [loading, setLoading] = useState(false);

  // Pagination states
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const limit = 10;
  const [initialFetched, setInitialFetched] = useState(false);

  // Filter states
  const [filterCompanyName, setFilterCompanyName] = useState("");
  const [filterDistributorCode, setFilterDistributorCode] = useState("");
  const [filterState, setFilterState] = useState("");
  const [filterLender, setFilterLender] = useState("");
  const [filterAnchorId, setFilterAnchorId] = useState("");
  const [filterBillingStatus, setFilterBillingStatus] = useState("");

  // File upload state for Consolidated Limit Report import
  const [uploadLoading, setUploadLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    message: string;
    created: number;
    updated: number;
    failedCount: number;
    failedRows: any[];
  } | null>(null);

  async function fetchConsolidatedLimits(pageNumber: number, silent = false) {
    try {
      if (!silent) setLoading(true);

      const params = new URLSearchParams();
      params.append("page", String(pageNumber));
      if (filterCompanyName) params.append("company_name", filterCompanyName);
      if (filterDistributorCode) params.append("distributor_code", filterDistributorCode);
      if (filterState) params.append("state", filterState);
      if (filterLender) params.append("lender", filterLender);
      if (filterAnchorId) params.append("anchor_id", filterAnchorId);
      if (filterBillingStatus) params.append("billing_status", filterBillingStatus);

      const url = `${ENV.VITE_BACKEND_BASE_URL}/invoice/consolidated-limit-report?${params.toString()}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch consolidated limits list");
      const json = await res.json();
      
      const distributors = json.data?.consolidated_limit_report || json.data?.consolidated_limits || json.data?.distributors || [];
      const pg = json.data?.page_info;

      setTotalRecords(pg?.total_records || 0);
      const computedTotalPages = Math.ceil((pg?.total_records || 0) / limit);
      setTotalPages(computedTotalPages || 1);

      // Map distributors to RepositoryData
      const mapped = distributors.map((d: any, idx: number) => ({
        id: d._id || d.id || d.distributor_code || crypto.randomUUID(),
        sno: (pageNumber - 1) * limit + idx + 1,
        companyName: d.distributor_name || d.company_name || "",
        distributorCode: d.distributor_code || "",
        city: d.city || "",
        state: d.state || "",
        lender: d.lender || "-",
        sanctionLimit: parseNumber(d.sanction_limit || d.sanctionLimit),
        operativeLimit: parseNumber(d.operative_limit || d.operativeLimit),
        utilisedLimit: parseNumber(d.utilised_limit || d.utilisedLimit),
        availableLimit: parseNumber(d.available_limit || d.availableLimit),
        limitExpiry: d.limit_expiry || d.limitExpiry || "-",
        overdue: parseNumber(d.overdue),
        fundingType: d.distribution_type || d.funding_type || d.fundingType || "-",
        billingStatus: d.billing_status || d.billingStatus || "-",
        anchorId: d.anchor || d.anchor_id || d.anchorId || "-",
        distributorPhone: d.mobile_number || d.phone_number || d.distributor_phone || d.distributorPhone || "-",
        distributorEmail: d.email || d.distributor_email || d.distributorEmail || "-",
      }));

      setRows(mapped);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to load consolidated limit data");
    } finally {
      setLoading(false);
    }
  }

  const lastFiltersRef = useRef({
    filterCompanyName,
    filterDistributorCode,
    filterState,
    filterLender,
    filterAnchorId,
    filterBillingStatus,
  });

  useEffect(() => {
    const currentFilters = {
      filterCompanyName,
      filterDistributorCode,
      filterState,
      filterLender,
      filterAnchorId,
      filterBillingStatus,
    };

    const filtersChanged = JSON.stringify(lastFiltersRef.current) !== JSON.stringify(currentFilters);

    if (filtersChanged) {
      lastFiltersRef.current = currentFilters;
      if (page !== 1) {
        setPage(1);
        return;
      }
    }

    fetchConsolidatedLimits(page, !initialFetched);
    if (!initialFetched) {
      setInitialFetched(true);
    }
  }, [page, filterCompanyName, filterDistributorCode, filterState, filterLender, filterAnchorId, filterBillingStatus]);

  async function performUpload(file: File) {
    if (uploadLoading) return;
    try {
      setUploadLoading(true);
      const formData = new FormData();
      formData.append("file", file);

      const url = `${ENV.VITE_BACKEND_BASE_URL}/invoice/consolidated-limit-report`;

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

  const handleImport = async (file: File) => {
    await performUpload(file);
  };

  async function handleExport() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterCompanyName) params.append("company_name", filterCompanyName);
      if (filterDistributorCode) params.append("distributor_code", filterDistributorCode);
      if (filterState) params.append("state", filterState);
      if (filterLender) params.append("lender", filterLender);
      if (filterAnchorId) params.append("anchor_id", filterAnchorId);
      if (filterBillingStatus) params.append("billing_status", filterBillingStatus);
      params.append("is_export", "true");

      const url = `${ENV.VITE_BACKEND_BASE_URL}/invoice/consolidated-limit-report?${params.toString()}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch export data");
      const csvText = await res.text();
      downloadCSVText(csvText, "consolidated-limit-report");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Export failed");
    } finally {
      setLoading(false);
    }
  }

  const filteredRows = rows;

  return (
    <div className="relative">
      <MasterToolbar
        title="Consolidated Limits Data Report"
        onImport={handleImport}
        onExportCSV={handleExport}
      />

      {/* Filters Section */}
      <div className="flex items-center gap-3 overflow-x-auto flex-nowrap mb-4 p-4 border rounded-2xl bg-white shadow-sm scrollbar-none mt-4">
        {/* Company Name Input */}
        <Input
          value={filterCompanyName}
          onChange={(e) => setFilterCompanyName(e.target.value)}
          placeholder="Company Name"
          className="w-44 h-9 text-xs rounded-md shrink-0"
        />

        {/* Distributor Code Input */}
        <Input
          value={filterDistributorCode}
          onChange={(e) => setFilterDistributorCode(e.target.value)}
          placeholder="Distributor Code"
          className="w-36 h-9 text-xs rounded-md shrink-0"
        />

        {/* State Input */}
        <Input
          value={filterState}
          onChange={(e) => setFilterState(e.target.value)}
          placeholder="State"
          className="w-36 h-9 text-xs rounded-md shrink-0"
        />

        {/* Lender Input */}
        <Input
          value={filterLender}
          onChange={(e) => setFilterLender(e.target.value)}
          placeholder="Lender"
          className="w-36 h-9 text-xs rounded-md shrink-0"
        />

        {/* Anchor Id Input */}
        <Input
          value={filterAnchorId}
          onChange={(e) => setFilterAnchorId(e.target.value)}
          placeholder="Anchor Id"
          className="w-36 h-9 text-xs rounded-md shrink-0"
        />

        {/* Billing Status Input */}
        <Input
          value={filterBillingStatus}
          onChange={(e) => setFilterBillingStatus(e.target.value)}
          placeholder="Billing Status"
          className="w-36 h-9 text-xs rounded-md shrink-0"
        />

        {/* Clear Filters Button */}
        {(filterCompanyName || filterDistributorCode || filterState || filterLender || filterAnchorId || filterBillingStatus) && (
          <button
            onClick={() => {
              setFilterCompanyName("");
              setFilterDistributorCode("");
              setFilterState("");
              setFilterLender("");
              setFilterAnchorId("");
              setFilterBillingStatus("");
            }}
            className="ml-auto text-xs text-rose-600 hover:text-rose-700 font-semibold cursor-pointer shrink-0"
          >
            Clear Filters
          </button>
        )}
      </div>

      <div className="border rounded-md overflow-auto max-h-145 bg-white shadow-sm mt-6">
        <Table className="min-w-800">
          <TableHeader className="sticky top-0 z-10 bg-white shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
            <TableRow>
              <TableHead className="w-16">Sno</TableHead>
              <TableHead>Company Name</TableHead>
              <TableHead>Distributor Code</TableHead>
              <TableHead>City</TableHead>
              <TableHead>State</TableHead>
              <TableHead>Lender</TableHead>
              <TableHead className="text-right">Sanction Limit</TableHead>
              <TableHead className="text-right">Operative Limit</TableHead>
              <TableHead className="text-right">Utilised Limit</TableHead>
              <TableHead className="text-right">Available Limit</TableHead>
              <TableHead>Limit Expiry</TableHead>
              <TableHead className="text-right">Overdue</TableHead>
              <TableHead>Funding Type</TableHead>
              <TableHead>Billing Status</TableHead>
              <TableHead>Anchor Id</TableHead>
              <TableHead>Distributor Phone</TableHead>
              <TableHead>Distributor Email</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={17} className="text-center py-12">
                  <div className="flex items-center justify-center gap-2 text-slate-500">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Loading consolidated limits...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={17} className="text-center text-muted-foreground py-8">
                  No records matching filters.
                </TableCell>
              </TableRow>
            ) : (
              filteredRows.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.sno}</TableCell>
                  <TableCell className="font-semibold text-slate-800">{item.companyName}</TableCell>
                  <TableCell className="font-mono">{item.distributorCode}</TableCell>
                  <TableCell>{item.city}</TableCell>
                  <TableCell>{item.state}</TableCell>
                  <TableCell className="font-semibold text-blue-600">{item.lender}</TableCell>
                  <TableCell className="text-right text-emerald-600 font-medium">{formatCurrency(item.sanctionLimit)}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(item.operativeLimit)}</TableCell>
                  <TableCell className="text-right text-blue-600 font-medium">{formatCurrency(item.utilisedLimit)}</TableCell>
                  <TableCell className="text-right text-slate-700 font-medium">{formatCurrency(item.availableLimit)}</TableCell>
                  <TableCell>{formatToDDMMYYYY(item.limitExpiry)}</TableCell>
                  <TableCell className="text-right text-rose-500 font-medium">{formatCurrency(item.overdue)}</TableCell>
                  <TableCell>{item.fundingType}</TableCell>
                  <TableCell>{item.billingStatus}</TableCell>
                  <TableCell className="font-mono">{item.anchorId}</TableCell>
                  <TableCell>{item.distributorPhone}</TableCell>
                  <TableCell className="font-mono">{item.distributorEmail}</TableCell>
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
              <span className="font-medium">{totalRecords}</span> distributors
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
            <span className="text-sm font-semibold text-slate-700">Uploading and processing consolidated limit report file...</span>
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
                  if (page === 1) {
                    fetchConsolidatedLimits(1, false);
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
