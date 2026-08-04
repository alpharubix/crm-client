export interface Invoice {
  id: string;
  anchor: string;
  processedBy: string;
  workingDate: string;
  invoiceReceivedDate: string;
  receivedTime: string;
  loanType: string;
  lenderName: string;
  distributorName: string;
  distributorCode: string;
  contactNumber: string;
  emailId: string;
  himalayaCfa: string;
  beneficiaryName: string;
  beneficiaryAccNo: string;
  bankName: string;
  ifscCode: string;
  branch: string;
  invoiceNo: string;
  invoiceAmount: number;
  invoiceDate: string;
  loanAmount: number;
  loanDisbursementDate: string;
  aging: string;
  tenure: string | number;
  utr: string;
  status: string;
  statusReason: string;
  comments: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface Distributor {
  id: string;
  anchor: string;
  dataReceived: string; // dd-mm-yy
  enrollmentDate: string; // dd-mm-yy
  distributorCode: string;
  cfaName: string;
  region: string;
  name: string;
  city: string;
  state: string;
  division: string;
  leapNonLeap: string;
  distributionType: string;
  email: string;
  pincode: string;
  mobileNo: string;
  phoneNo: string;
  gstNo: string;
  panNo: string;
  salesApr25: number;
  salesMonth2: number;
  salesMonth3: number;
  salesMonth4: number;
  salesMonth5: number;
  salesMonth6: number;
  salesMonth7: number;
  salesMonth8: number;
  salesMonth9: number;
  salesMonth10: number;
  salesMonth11: number;
  salesMonth12: number;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}


export const emptyInvoice = (): Invoice => ({
  id: crypto.randomUUID(),
  anchor: "",
  processedBy: "",
  workingDate: "",
  invoiceReceivedDate: "",
  receivedTime: "",
  loanType: "",
  lenderName: "",
  distributorName: "",
  distributorCode: "",
  contactNumber: "",
  emailId: "",
  himalayaCfa: "",
  beneficiaryName: "",
  beneficiaryAccNo: "",
  bankName: "",
  ifscCode: "",
  branch: "",
  invoiceNo: "",
  invoiceAmount: 0,
  invoiceDate: "",
  loanAmount: 0,
  loanDisbursementDate: "",
  aging: "",
  tenure: "",
  utr: "",
  status: "Pending",
  statusReason: "",
  comments: "",
  createdAt: "",
  updatedAt: "",
  createdBy: "",
  updatedBy: "",
});

export const emptyDistributor = (): Distributor => ({
  id: crypto.randomUUID(),
  anchor: "",
  dataReceived: "",
  enrollmentDate: "",
  distributorCode: "",
  cfaName: "",
  region: "",
  name: "",
  city: "",
  state: "",
  division: "",
  leapNonLeap: "Leap",
  distributionType: "",
  email: "",
  pincode: "",
  mobileNo: "",
  phoneNo: "",
  gstNo: "",
  panNo: "",
  salesApr25: 0,
  salesMonth2: 0,
  salesMonth3: 0,
  salesMonth4: 0,
  salesMonth5: 0,
  salesMonth6: 0,
  salesMonth7: 0,
  salesMonth8: 0,
  salesMonth9: 0,
  salesMonth10: 0,
  salesMonth11: 0,
  salesMonth12: 0,
});
