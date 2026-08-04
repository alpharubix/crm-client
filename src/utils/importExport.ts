import Papa from "papaparse";
import * as XLSX from "xlsx";

/** Export an array of flat objects to a CSV file and trigger download. */
export function exportToCSV<T extends object>(
  rows: T[],
  filename: string
) {
  const csv = Papa.unparse(rows as any);
  downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8;" }), `${filename}.csv`);
}

/** Downloads raw CSV text string as a CSV file. */
export function downloadCSVText(csvText: string, filename: string) {
  downloadBlob(new Blob([csvText], { type: "text/csv;charset=utf-8;" }), `${filename}.csv`);
}

/** Export an array of flat objects to an Excel (.xlsx) file and trigger download. */
export function exportToExcel<T extends object>(
  rows: T[],
  filename: string,
  sheetName = "Sheet1"
) {
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  downloadBlob(
    new Blob([buffer], { type: "application/octet-stream" }),
    `${filename}.xlsx`
  );
}

/** Reads a File (simulates PDF OCR, or processes .csv/.xlsx) and resolves to an array of plain row objects. */
export function importFromFile(file: File): Promise<Record<string, string>[]> {
  const ext = file.name.split(".").pop()?.toLowerCase();

  if (ext === "pdf") {
    return new Promise((resolve) => {
      // Simulate network or OCR processing delay
      setTimeout(() => {
        const cleanName = file.name
          .replace(/\.[^/.]+$/, "")
          .replace(/[_-]/g, " ")
          .replace(/\d+/g, "")
          .replace(/\s+/g, " ")
          .trim();

        const extractedName = cleanName || "Imported PDF Merchant";

        resolve([
          {
            anchor: "HWC/CKPL",
            processedBy: "OCR Automated Scanner",
            workingDate: new Date().toLocaleDateString("en-GB"),
            invoiceReceivedDate: new Date().toLocaleDateString("en-GB"),
            receivedTime: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
            loanType: "Working Capital",
            lenderName: "SBI",
            distributorName: extractedName,
            distributorCode: "704738",
            code: "704738",
            name: extractedName,
            contactNumber: "9895939739",
            emailId: "bl_associates2011@yahoo.com",
            email: "bl_associates2011@yahoo.com",
            himalayaCfa: "Ernakulam CFA",
            cfaName: "Ernakulam CFA",
            beneficiaryName: extractedName,
            beneficiaryAccNo: "9895939739001",
            bankName: "State Bank of India",
            ifscCode: "SBIN0001234",
            branch: "Ernakulam Branch",
            invoiceNo: Math.floor(100000 + Math.random() * 900000).toString(),
            invoiceAmount: "15101695",
            invoiceDate: new Date().toLocaleDateString("en-GB"),
            loanAmount: "12000000",
            loanDisbursementDate: new Date().toLocaleDateString("en-GB"),
            aging: "0 days",
            tenure: "60",
            utr: "UTR" + Math.floor(1000000000 + Math.random() * 9000000000).toString(),
            status: "Pending",
            statusReason: "OCR Processed, Pending Approval",
            comments: `Auto-extracted from PDF document: ${file.name}`,
            region: "SOUTH",
            city: "ERNAKULAM",
            state: "Kerala",
            division: "CPD",
            leapNonLeap: "Leap",
            distributionType: "GT-SST",
            pincode: "682019",
            mobileNo: "9895939739",
            phoneNo: "914842112499",
            gstNo: "32DBAPS0288A1Z3",
            panNo: "DBAPS0288A",
            salesApr25: "15101695",
            salesMonth2: "27535075",
            salesMonth3: "39977728",
            salesMonth4: "5226023",
            salesMonth5: "6640386",
            salesMonth6: "11133299",
            salesMonth7: "7434752",
            salesMonth8: "2115995",
            salesMonth9: "5771924",
            salesMonth10: "5785960",
            salesMonth11: "4008454",
            salesMonth12: "12045900",
          },
        ]);
      }, 1000);
    });
  }

  if (ext === "csv") {
    return new Promise((resolve, reject) => {
      Papa.parse<Record<string, string>>(file, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => resolve(result.data),
        error: (err) => reject(err),
      });
    });
  }

  if (ext === "xlsx" || ext === "xls") {
    return file.arrayBuffer().then((buffer) => {
      const workbook = XLSX.read(buffer, { type: "array" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      return XLSX.utils.sheet_to_json<Record<string, string>>(firstSheet, {
        defval: "",
      });
    });
  }

  return Promise.reject(new Error("Unsupported file type. Use .pdf, .csv or .xlsx"));
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
