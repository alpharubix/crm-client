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
import { type Distributor } from "@/types/master";
import { exportToCSV, exportToExcel, downloadCSVText } from "@/utils/importExport";
import { formatToDDMMYYYY } from "@/utils/date-formatter";
import { MasterToolbar } from "@/components/invoicing/MasterToolbar";
import { ENV, USERS_MAP } from "@/conf";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface DistributorMasterProps {
  forcedTab?: 'general' | 'contact' | 'sales';
  allowedTabs?: readonly ('general' | 'contact' | 'sales')[];
}

const seedData: Distributor[] = [];

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

function mapBackendToDistributor(d: any): Distributor {
  return {
    id: d._id || d.id || d.distributor_code || crypto.randomUUID(),
    anchor: d.anchor || "",
    dataReceived: d.data_received || "",
    enrollmentDate: d.enrollment_date || "",
    distributorCode: d.distributor_code || "",
    cfaName: d.cfa_name || "",
    region: d.region || "",
    name: d.distributor_name || "",
    city: d.city || "",
    state: d.state || "",
    division: d.division || "",
    leapNonLeap: d.leap_non_leap || "",
    distributionType: d.distribution_type || "",
    email: d.email || "",
    pincode: d.pincode || "",
    mobileNo: d.mobile_number || "",
    phoneNo: d.phone_number || "",
    gstNo: d.gst_number || "",
    panNo: d.pan_number || "",
    salesApr25: parseNumber(d.salesApr25 ?? d["Sales Apr'25"] ?? d["Sales - Apr'25"] ?? d["sales - apr'25"] ?? d["Sales-Apr25"] ?? 0),
    salesMonth2: parseNumber(d.salesMonth2 ?? d["Sales - Month2"] ?? d["sales - month2"] ?? d["Sales-Month2"] ?? 0),
    salesMonth3: parseNumber(d.salesMonth3 ?? d["Sales - Month3"] ?? d["sales - month3"] ?? d["Sales-Month3"] ?? 0),
    salesMonth4: parseNumber(d.salesMonth4 ?? d["Sales - Month4"] ?? d["sales - month4"] ?? d["Sales-Month4"] ?? 0),
    salesMonth5: parseNumber(d.salesMonth5 ?? d["Sales - Month5"] ?? d["sales - month5"] ?? d["Sales-Month5"] ?? 0),
    salesMonth6: parseNumber(d.salesMonth6 ?? d["Sales - Month6"] ?? d["sales - month6"] ?? d["Sales-Month6"] ?? 0),
    salesMonth7: parseNumber(d.salesMonth7 ?? d["Sales - Month7"] ?? d["sales - month7"] ?? d["Sales-Month7"] ?? 0),
    salesMonth8: parseNumber(d.salesMonth8 ?? d["Sales - Month8"] ?? d["sales - month8"] ?? d["Sales-Month8"] ?? 0),
    salesMonth9: parseNumber(d.salesMonth9 ?? d["Sales - Month9"] ?? d["sales - month9"] ?? d["Sales-Month9"] ?? 0),
    salesMonth10: parseNumber(d.salesMonth10 ?? d["Sales - Month10"] ?? d["sales - month10"] ?? d["Sales-Month10"] ?? 0),
    salesMonth11: parseNumber(d.salesMonth11 ?? d["Sales - Month11"] ?? d["sales - month11"] ?? d["Sales-Month11"] ?? 0),
    salesMonth12: parseNumber(d.salesMonth12 ?? d["Sales - Month12"] ?? d["sales - month12"] ?? d["Sales-Month12"] ?? 0),
    createdAt: d.created_at || "",
    updatedAt: d.updated_at || "",
    createdBy: d.created_by || "",
    updatedBy: d.updated_by || "",
  };
}

export function DistributorMaster({ forcedTab, allowedTabs }: DistributorMasterProps) {
  const [rows, setRows] = useState<Distributor[]>(seedData);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'contact' | 'sales'>(forcedTab || 'general');

  // Pagination states
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const limit = 10; // Backend default limit

  // Filter states
  const [filterAnchor, setFilterAnchor] = useState("");
  const [filterRegion, setFilterRegion] = useState("");
  const [filterState, setFilterState] = useState("");
  const [filterDivision, setFilterDivision] = useState("");
  const [filterDistType, setFilterDistType] = useState("");
  



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

  async function fetchDistributors(pageNumber: number, silent = false) {
    try {
      if (!silent) setLoading(true);

      const params = new URLSearchParams();
      params.append("page", String(pageNumber));
      if (filterAnchor) params.append("anchor", filterAnchor);
      if (filterRegion) params.append("region", filterRegion);
      if (filterState) params.append("state", filterState);
      if (filterDivision) params.append("division", filterDivision);
      if (filterDistType) params.append("distribution_type", filterDistType);
     

      const res = await fetch(
        `${ENV.VITE_BACKEND_BASE_URL}/invoice/distributors?${params.toString()}`,
        {
          credentials: "include",
          cache: "no-store",
        }
      );
      if (!res.ok) throw new Error("Failed to fetch distributors");
      const json = await res.json();
      const rawList = json.data?.distributors || [];
      const pg = json.data?.page_info;

      setRows(rawList.map(mapBackendToDistributor));
      setTotalRecords(pg?.total_records || 0);

      // Calculate correct total pages on frontend since backend ceil(len(distributors) / limit) has a bug
      const computedTotalPages = Math.ceil((pg?.total_records || 0) / limit);
      setTotalPages(computedTotalPages || 1);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (forcedTab) {
      setActiveTab(forcedTab);
    }
  }, [forcedTab]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [
    filterAnchor,
    filterRegion,
    filterState,
    filterDivision,
    filterDistType,
   
  ]);

  useEffect(() => {
    fetchDistributors(page, !initialFetched);
    if (!initialFetched) {
      setInitialFetched(true);
    }
  }, [
    page,
    filterAnchor,
    filterRegion,
    filterState,
    filterDivision,
    filterDistType,
    
  ]);

  async function performUpload(file: File) {
    if (uploadLoading) return;
    try {
      setUploadLoading(true);
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(
        `${ENV.VITE_BACKEND_BASE_URL}/invoice/upload-distributor-master`,
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
      if (filterAnchor) params.append("anchor", filterAnchor);
      if (filterRegion) params.append("region", filterRegion);
      if (filterState) params.append("state", filterState);
      if (filterDivision) params.append("division", filterDivision);
      if (filterDistType) params.append("distribution_type", filterDistType);
     
      params.append("is_export", "true");

      const url = `${ENV.VITE_BACKEND_BASE_URL}/invoice/distributors?${params.toString()}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch export data");
      const csvText = await res.text();
      downloadCSVText(csvText, "distributor-master");
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
        title="Distributor Master"
        onImport={handleImport}
        onExportCSV={handleExport}
      />

      {/* Filters Section */}
      <div className="flex items-center gap-3 overflow-x-auto flex-nowrap mb-6 p-4 border rounded-2xl bg-white shadow-sm scrollbar-none">
        {/* Anchor Input */}
        <Input
          value={filterAnchor}
          onChange={(e) => setFilterAnchor(e.target.value)}
          placeholder="Anchor"
          className="w-44 h-9 text-xs rounded-md shrink-0"
        />

        {/* Region Input */}
        <Input
          value={filterRegion}
          onChange={(e) => setFilterRegion(e.target.value)}
          placeholder="Region"
          className="w-36 h-9 text-xs rounded-md shrink-0"
        />

        {/* State Input */}
        <Input
          value={filterState}
          onChange={(e) => setFilterState(e.target.value)}
          placeholder="State"
          className="w-36 h-9 text-xs rounded-md shrink-0"
        />

        {/* Division Input */}
        <Input
          value={filterDivision}
          onChange={(e) => setFilterDivision(e.target.value)}
          placeholder="Division"
          className="w-36 h-9 text-xs rounded-md shrink-0"
        />

        {/* Distribution Type Input */}
        <Input
          value={filterDistType}
          onChange={(e) => setFilterDistType(e.target.value)}
          placeholder="Distribution Type"
          className="w-44 h-9 text-xs rounded-md shrink-0"
        />

       

        {/* Clear Filters Button */}
        {(filterAnchor || filterRegion || filterState || filterDivision || filterDistType) && (
          <button
            onClick={() => {
              setFilterAnchor("");
              setFilterRegion("");
              setFilterState("");
              setFilterDivision("");
              setFilterDistType("");
              
            }}
            className="ml-auto text-xs text-rose-600 hover:text-rose-700 font-semibold cursor-pointer shrink-0"
          >
            Clear Filters
          </button>
        )}
      </div>

      <Tabs value={activeTab} className="w-full">
        {allowedTabs && allowedTabs.length > 1 && (
          <div className="border-b border-slate-200 mb-6 bg-white">
            <div className="flex gap-2 overflow-x-auto flex-nowrap scrollbar-none">
              {allowedTabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-none px-5 py-3 text-sm font-semibold transition-all duration-200 border-b-[3px] border-solid -mb-px ${activeTab === tab
                    ? 'bg-blue-50/75 text-blue-600 border-blue-600'
                    : 'text-slate-500 hover:text-slate-800 bg-transparent border-transparent'
                    }`}
                >
                  {tab === 'general' ? 'General Info' : tab === 'contact' ? 'Contact & Tax' : 'Sales Performance'}
                </button>
              ))}
            </div>
          </div>
        )}

        <TabsContent value="general" className="border rounded-md overflow-auto max-h-145 bg-white shadow-sm">
          <Table className="min-w-350">
            <TableHeader className="sticky top-0 z-10 bg-white shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
              <TableRow>
                <TableHead>Distributor Code</TableHead>
                <TableHead>Distributor Name</TableHead>
                <TableHead>Anchor</TableHead>
                <TableHead>CFA Name</TableHead>
                <TableHead>Region</TableHead>
                <TableHead>Division</TableHead>
                <TableHead>Leap/Non Leap</TableHead>
                <TableHead>Distribution Type</TableHead>
                <TableHead>City</TableHead>
                <TableHead>State</TableHead>
                <TableHead>Data Received</TableHead>
                <TableHead>Enrollment Date</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Updated At</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead>Updated By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading || !initialFetched ? (
                <TableRow>
                  <TableCell colSpan={16} className="text-center py-12">
                    <div className="flex items-center justify-center gap-2 text-slate-500">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Loading general info...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={16} className="text-center text-muted-foreground py-8">
                    No distributors yet matching filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium text-slate-800">{row.distributorCode}</TableCell>
                    <TableCell className="font-semibold">{row.name}</TableCell>
                    <TableCell>{row.anchor || "-"}</TableCell>
                    <TableCell>{row.cfaName || "-"}</TableCell>
                    <TableCell>{row.region || "-"}</TableCell>
                    <TableCell>{row.division || "-"}</TableCell>
                    <TableCell>{row.leapNonLeap}</TableCell>
                    <TableCell>{row.distributionType || "-"}</TableCell>
                    <TableCell>{row.city || "-"}</TableCell>
                    <TableCell>{row.state || "-"}</TableCell>
                    <TableCell>{formatToDDMMYYYY(row.dataReceived)}</TableCell>
                    <TableCell>{formatToDDMMYYYY(row.enrollmentDate)}</TableCell>
                    <TableCell className="text-xs text-slate-500 whitespace-nowrap">{formatDateTime(row.createdAt)}</TableCell>
                    <TableCell className="text-xs text-slate-500 whitespace-nowrap">{formatDateTime(row.updatedAt)}</TableCell>
                    <TableCell className="text-xs text-slate-500 whitespace-nowrap">{formatUser(row.createdBy)}</TableCell>
                    <TableCell className="text-xs text-slate-500 whitespace-nowrap">{formatUser(row.updatedBy)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="contact" className="border rounded-md overflow-auto max-h-145 bg-white shadow-sm">
          <Table className="min-w-300">
            <TableHeader className="sticky top-0 z-10 bg-white shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
              <TableRow>
                <TableHead>Distributor Code</TableHead>
                <TableHead>Distributor Name</TableHead>
                <TableHead>Anchor</TableHead>
                <TableHead>GST Number</TableHead>
                <TableHead>PAN Number</TableHead>
                <TableHead>Email Id</TableHead>
                <TableHead>Mobile No</TableHead>
                <TableHead>Phone No</TableHead>
                <TableHead>City</TableHead>
                <TableHead>State</TableHead>
                <TableHead>Pincode</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading || !initialFetched ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-12">
                    <div className="flex items-center justify-center gap-2 text-slate-500">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Loading contact info...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center text-muted-foreground py-8">
                    No distributors yet matching filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium text-slate-800">{row.distributorCode}</TableCell>
                    <TableCell className="font-semibold">{row.name}</TableCell>
                    <TableCell>{row.anchor || "-"}</TableCell>
                    <TableCell>{row.gstNo || "-"}</TableCell>
                    <TableCell>{row.panNo || "-"}</TableCell>
                    <TableCell>{row.email || "-"}</TableCell>
                    <TableCell>{row.mobileNo || "-"}</TableCell>
                    <TableCell>{row.phoneNo || "-"}</TableCell>
                    <TableCell>{row.city || "-"}</TableCell>
                    <TableCell>{row.state || "-"}</TableCell>
                    <TableCell>{row.pincode || "-"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="sales" className="border rounded-md overflow-auto max-h-145 bg-white shadow-sm">
          <Table className="min-w-150">
            <TableHeader className="sticky top-0 z-10 bg-white shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
              <TableRow>
                <TableHead>Distributor Code</TableHead>
                <TableHead>Distributor Name</TableHead>
                <TableHead>Anchor</TableHead>
                <TableHead className="text-right">Sales Apr'25</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading || !initialFetched ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12">
                    <div className="flex items-center justify-center gap-2 text-slate-500">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Loading sales info...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    No distributors yet matching filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium text-slate-800">{row.distributorCode}</TableCell>
                    <TableCell className="font-semibold">{row.name}</TableCell>
                    <TableCell>{row.anchor || "-"}</TableCell>
                    <TableCell className="text-right font-medium text-blue-600">{formatCurrency(row.salesApr25)}</TableCell>
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
            <span className="text-sm font-semibold text-slate-700">Uploading and processing distributors...</span>
          </div>
        </div>
      )}



      {/* Success/Error Dialog Modal with OK button */}
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
                  fetchDistributors(1);
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
