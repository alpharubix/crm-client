import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { listCibilReports } from "@/pages/cibil/api";
import type { CibilReportListItem } from "@/pages/cibil/api";

function ExistingReports() {
const navigate = useNavigate();
  const { id } = useParams()
  const [reports, setReports] = useState<CibilReportListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    document.title = "Existing CIBIL Reports";

    const fetchReports = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await listCibilReports(id!);
        setReports(response.data);
      } catch (err) {
        console.log(err);
        setError("Error while fetching CIBIL reports");
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  const handleViewReport = (reference_id: string) => {
    console.log(reference_id);
    navigate(`/accounts/${id}/cibil/${reference_id}/reports`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg px-6 py-5 flex items-center gap-3 border border-slate-200">
          <div className="h-5 w-5 rounded-full border-2 border-slate-300 border-t-blue-600 animate-spin" />
          <p className="text-sm font-medium text-slate-700">Loading reports...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-red-200 p-6">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 text-lg">
              !
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Something went wrong</h2>
              <p className="text-sm text-slate-600 mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            Existing CIBIL Reports
          </h1>
          <p className="mt-3 text-slate-600 max-w-2xl">
            Below is a list of your available CIBIL reports. Open any report to view the detailed credit summary.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {reports?.length === 0 ? (
            <div className="p-10 text-center">
              <div className="mx-auto h-14 w-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-2xl">
                ◌
              </div>
              <h2 className="mt-4 text-lg font-semibold text-slate-900">No reports found</h2>
              <p className="mt-2 text-sm text-slate-600">
                There are no CIBIL reports available right now.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-200">
              {reports?.map((report) => (
                <li
                  key={report.reference_id}
                  className="p-4 sm:p-6 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                          Report Reference ID
                        </p>
                        <p className="text-base font-semibold text-slate-900">
                          {report.reference_id}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-emerald-700 font-medium">
                          {report.cibil_pulled_date}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      onClick={() => handleViewReport(report.reference_id)}
                    >
                      View Report
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default ExistingReports;