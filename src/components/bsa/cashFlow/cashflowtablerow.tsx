import type {
  CashFlowSummary,
  CashFlowMonth,
} from "./cashFlowType";

export type RowConfig = {
  label: string;
  summaryKey: keyof CashFlowSummary | null;
  monthKey: keyof CashFlowMonth | null;
  labelClass?: string;
  valueClass?: string;
  rowClass?: string;
  isPercent?: boolean;
};

const headerLabelClass = "font-bold bg-gray-100 pl-2";
const subLabelClass = "font-medium text-gray-800";
const totalValueClass = "font-bold bg-gray-100";

const rows: RowConfig[] = [
  {
    label: "Total Inflow (%)",
    summaryKey: "total_inflows_percent",
    monthKey: "TotalInflowPercentage",
    labelClass: headerLabelClass,
    valueClass: totalValueClass,
    isPercent: true,
  },
  {
    label: "Inflows/Revenue: (A)",
    summaryKey: "inflows_revenue_a",
    monthKey: "Inflow",
    labelClass: headerLabelClass,
    valueClass: totalValueClass,
  },
  {
    label: "Cash Deposit",
    summaryKey: "cash_deposit",
    monthKey: "CashDeposit",
    labelClass: subLabelClass,
  },
  {
    label: "Cheque Receipt*",
    summaryKey: "cheque_receipt",
    monthKey: "ChequeReceipt",
    labelClass: subLabelClass,
  },
  {
    label: "Online Receipt**",
    summaryKey: "online_receipt",
    monthKey: "OnlineReceipt",
    labelClass: subLabelClass,
  },
  {
    label: "Other Receipt",
    summaryKey: "other_receipt",
    monthKey: "OtherReceipt",
    labelClass: subLabelClass,
  },
  {
    label: "OutFlows/Expenses: (B)",
    summaryKey: "outflows_expenses_b",
    monthKey: "OutFlow",
    labelClass: headerLabelClass,
    valueClass: totalValueClass,
  },
  {
    label: "Cash Withdrawal",
    summaryKey: "cash_withdrawal",
    monthKey: "CashWithdraw",
    labelClass: subLabelClass,
  },
  {
    label: "Cheque Payment*",
    summaryKey: "cheque_payment",
    monthKey: "ChequePayment",
    labelClass: subLabelClass,
  },
  {
    label: "Online Payment**",
    summaryKey: "online_payment",
    monthKey: "OnlinePayment",
    labelClass: subLabelClass,
  },
  {
    label: "Other Payment",
    summaryKey: "other_payment",
    monthKey: "OtherPayment",
    labelClass: subLabelClass,
  },
  {
    label: "Gross Inflow/Profit (C=A-B)",
    summaryKey: "gross_inflow_profit_c",
    monthKey: "GrossInflow",
    labelClass: headerLabelClass,
    valueClass: totalValueClass,
    rowClass: "border-y-4 border-double border-gray-400",
  },
  {
    label: "Less: Indirect Expenses (D)",
    summaryKey: "indirect_expenses_d",
    monthKey: "IndirectExpense",
    labelClass: headerLabelClass,
    valueClass: totalValueClass,
  },
  {
    label: "Salary Payment",
    summaryKey: "salary_payment",
    monthKey: "SalaryPayment",
    labelClass: subLabelClass,
  },
  {
    label: "Insurance",
    summaryKey: "insurance_payment",
    monthKey: "InsurancePayment",
    labelClass: subLabelClass,
  },
  {
    label: "Rent Payment",
    summaryKey: "rent_payment",
    monthKey: "RentPayment",
    labelClass: subLabelClass,
  },
  {
    label: "Company Expense",
    summaryKey: "company_expense",
    monthKey: "CompanyExpense",
    labelClass: subLabelClass,
  },
  {
    label: "Bank Charges",
    summaryKey: "bank_charge",
    monthKey: "BankCharge",
    labelClass: subLabelClass,
  },
  {
    label: "Utility Payment",
    summaryKey: "utility_expense",
    monthKey: "UtilityExpense",
    labelClass: subLabelClass,
  },
  {
    label: "Tax Payment",
    summaryKey: "tax_paid",
    monthKey: "TaxPaid",
    labelClass: subLabelClass,
  },
  {
    label: "Interest Paid",
    summaryKey: "interest_paid",
    monthKey: "InterestPaid",
    labelClass: subLabelClass,
  },
  {
    label: "Refund/Reversal",
    summaryKey: "refund_payment",
    monthKey: "RefundPayment",
    labelClass: subLabelClass,
  },
  {
    label: "Credit Card Payment",
    summaryKey: "credit_card_payment",
    monthKey: "CreditCardPayment",
    labelClass: subLabelClass,
  },
  {
    label: "Forex",
    summaryKey: "forex_payment",
    monthKey: "ForexPayment",
    labelClass: subLabelClass,
  },
  {
    label: "Add: Indirect Income (E)",
    summaryKey: "indirect_income_e",
    monthKey: "IndirectIncome",
    labelClass: headerLabelClass,
    valueClass: totalValueClass,
  },
  {
    label: "Interest Received",
    summaryKey: "interest_received",
    monthKey: "InterestReceived",
    labelClass: subLabelClass,
  },
  {
    label: "Tax Refund",
    summaryKey: "tax_refund",
    monthKey: "TaxRefund",
    labelClass: subLabelClass,
  },
  {
    label: "Rent Received",
    summaryKey: "rent_receipt",
    monthKey: "RentReceipt",
    labelClass: subLabelClass,
  },
  {
    label: "Net Inflow/Profit (F=C-D+E)",
    summaryKey: "net_inflow_profit_f",
    monthKey: "NetInflow",
    labelClass: headerLabelClass,
    valueClass: totalValueClass,
    rowClass: "border-y-4 border-double border-gray-400",
  },
  {
    label: "Add: Receivables (g)",
    summaryKey: "total_receivables_g",
    monthKey: "Receiveble",
    labelClass: headerLabelClass,
    valueClass: totalValueClass,
  },
  {
    label: "Loan",
    summaryKey: "loan_receipt",
    monthKey: "LoanReceipt",
    labelClass: subLabelClass,
  },
  {
    label: "Working Capital",
    summaryKey: "work_capital_receipt",
    monthKey: "WorkCapitalReceipt",
    labelClass: subLabelClass,
  },
  {
    label: "Investment",
    summaryKey: "investment_receipt",
    monthKey: "InvestmentReceipt",
    labelClass: subLabelClass,
  },
  {
    label: "Insurance",
    summaryKey: "insurance_receipt",
    monthKey: "InsuranceReceipt",
    labelClass: subLabelClass,
  },
  {
    label: "Contra",
    summaryKey: "contra_receipt",
    monthKey: "ContraReceipt",
    labelClass: subLabelClass,
  },
  {
    label: "FI Transaction",
    summaryKey: "fi_receipt",
    monthKey: "FiReceipt",
    labelClass: subLabelClass,
  },
  {
    label: "Sweep-In",
    summaryKey: "sweep_in",
    monthKey: "SweepIn",
    labelClass: subLabelClass,
  },
  {
    label: "Bank Accruals",
    summaryKey: "bank_accruals",
    monthKey: "BankAccural",
    labelClass: headerLabelClass,
    valueClass: totalValueClass,
  },
  {
    label: "Add: Opening Balance",
    summaryKey: "opening_balance",
    monthKey: "OpeningBalance",
    labelClass: headerLabelClass,
    valueClass: totalValueClass,
  },
  {
    label: "Closing Balance",
    summaryKey: "closing_balance",
    monthKey: "ClosingBalance",
    labelClass: headerLabelClass,
    valueClass: totalValueClass,
    rowClass: "border-b-4 border-double border-gray-400",
  },
];

export default rows;