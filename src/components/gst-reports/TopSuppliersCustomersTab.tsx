import React from "react";
import { useQuery } from "@tanstack/react-query";
import { ENV } from "@/conf";

export interface GstReportPayload {
  gst_reference_id: string;
}

export interface GstTopSuppliersCustomersResponse {
  message: string;
  data: any[];
}

export const getGstTopSuppliersCustomers = async (
  data: GstReportPayload,
): Promise<GstTopSuppliersCustomersResponse> => {
  const response = await fetch(
    `${ENV.VITE_BACKEND_BASE_URL}/accounts/r1xcrm-top-suppliers-and-customers`,
    {
      credentials: "include",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    },
  );
  if (!response.ok) {
    throw new Error("Failed to fetch Top Suppliers and Customers.");
  }
  return response.json();
};

export default function TopSuppliersCustomersTab({ gstReferenceId }: { gstReferenceId: string }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["gstTopSuppliersCustomers", gstReferenceId],
    queryFn: () => getGstTopSuppliersCustomers({ gst_reference_id: gstReferenceId }),
    enabled: !!gstReferenceId,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <span className="h-10 w-10 rounded-full border-4 border-[#000080]/20 border-t-[#000080] animate-spin" />
      </div>
    );
  }

  if (isError || !data || !data.data) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-12 text-center text-red-500">
        Failed to load Top Suppliers & Customers Data.
      </div>
    );
  }

  const accountDetails = data.data.find((item: any) => item["Account Details"])?.["Account Details"];
  const majorData = data.data.find((item: any) => item["Major Suppliers & Customers "])?.["Major Suppliers & Customers "];
  
  const suppliers = majorData?.find((item: any) => item["10 Major Suppliers"])?.["10 Major Suppliers"] || [];
  const customers = majorData?.find((item: any) => item["10 Major Customers"])?.["10 Major Customers"] || [];

  const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <h3 className="text-lg font-semibold text-white bg-[#e67e22] px-4 py-2 rounded-t-md text-center">
      {children}
    </h3>
  );

  const renderTable = (title: string, tableData: any[]) => {
    if (!tableData || tableData.length === 0) {
      return (
        <div className="bg-white rounded-md shadow-sm border border-gray-200">
          <SectionTitle>{title}</SectionTitle>
          <div className="p-8 text-center text-gray-500">
            No data available for {title}
          </div>
        </div>
      );
    }

    const headers = Object.keys(tableData[0]);

    return (
      <div className="bg-white rounded-md shadow-sm border border-gray-200">
        <SectionTitle>{title}</SectionTitle>
        <div className="p-0 overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-[#000080] text-white">
              <tr>
                {headers.map((header) => (
                  <th key={header} className="px-4 py-2 border border-[#000080] font-semibold text-center">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableData.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  {headers.map((header) => {
                    const isNumber = !isNaN(Number(row[header])) && row[header] !== '';
                    const rawVal = row[header];
                    const isNegative = typeof rawVal === 'number' ? rawVal < 0 : (typeof rawVal === 'string' && rawVal.trim().startsWith('-'));
                    return (
                      <td key={header} className={`px-4 py-2 border border-gray-200 ${isNumber && header !== 'S.No' && header !== 'Sl. no.' ? 'text-right' : 'text-center'} ${isNegative ? 'text-red-600' : ''}`}>
                        {header.toLowerCase().includes('amount') ? `₹ ${Number(row[header]).toLocaleString('en-IN')}` : row[header]}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Account Details */}
      {accountDetails && (
        <div className="bg-white rounded-md shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-white bg-[#e67e22] px-4 py-2 rounded-t-md text-center">
            Customer Profile
          </h3>
          <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-center">
            <div className="border border-gray-200 rounded-md p-2">
               <span className="font-semibold text-[#000080] block mb-1">Company Name</span>
               <span className="text-gray-700">{accountDetails["GSTR Analysis Report  - "] || "N/A"}</span>
            </div>
            <div className="border border-gray-200 rounded-md p-2">
               <span className="font-semibold text-[#000080] block mb-1">GSTIN</span>
               <span className="text-gray-700">{accountDetails["GSTIN"]}</span>
            </div>
             <div className="border border-gray-200 rounded-md p-2">
               <span className="font-semibold text-[#000080] block mb-1">PAN</span>
               <span className="text-gray-700">{accountDetails["PAN"]}</span>
            </div>
             <div className="border border-gray-200 rounded-md p-2">
               <span className="font-semibold text-[#000080] block mb-1">State</span>
               <span className="text-gray-700">{accountDetails["State of Operations(based on max. gross sales)"]}</span>
            </div>
             <div className="border border-gray-200 rounded-md p-2">
               <span className="font-semibold text-[#000080] block mb-1">Period From</span>
               <span className="text-gray-700">{accountDetails["periodFrom"]}</span>
            </div>
             <div className="border border-gray-200 rounded-md p-2">
               <span className="font-semibold text-[#000080] block mb-1">Period To</span>
               <span className="text-gray-700">{accountDetails["periodTo"]}</span>
            </div>
          </div>
        </div>
      )}

      {/* Tables */}
      <div className="grid grid-cols-1 gap-6">
        {renderTable("10 Major Suppliers", suppliers)}
        {renderTable("10 Major Customers", customers)}
      </div>
    </div>
  );
}
