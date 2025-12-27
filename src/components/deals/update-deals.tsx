import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlusCircle } from "lucide-react";

const UpdateDeals = () => {
    const Field = ({ label, value }: { label: string; value: string }) => (
        <div className="grid grid-cols-2 py-2 px-4 border-b last:border-0 border-border items-center min-h-[40px]">
            <span className="text-sm font-medium text-muted-foreground">{label}</span>
            <span className="text-sm text-foreground font-medium">{value}</span>
        </div>
    );

    const SectionHeader = ({ title }: { title: string }) => (
        <div className="bg-muted/50 py-2 px-4 border-y border-border font-bold text-center text-xs uppercase tracking-widest text-foreground">
            {title}
        </div>
    );

    return (
        <div className="space-y-6 bg-background text-foreground min-h-screen">

            {/* Header Section */}
            <div className="flex justify-between items-center border border-border p-4 rounded-xl bg-card shadow-sm">
                <h1 className="text-lg font-semibold">
                    Deals Owner: <span className="text-primary font-bold">User</span>
                </h1>
                <Button variant="secondary" size="sm" className="font-semibold cursor-pointer">
                    Update
                </Button>
            </div>

            <Card className="overflow-hidden border-border bg-card shadow-md">
                {/* Loan Account Status */}
                <SectionHeader title="Loan Account Status" />
                <CardContent className="p-0 grid grid-cols-1 md:grid-cols-2">
                    <div className="md:border-r border-border">
                        <Field label="Deal Type" value="Picklist" />
                        <Field label="Deal Call Back Date/Time" value="Date/Time" />
                        <Field label="Deal Approval Status" value="Picklist" />
                    </div>
                    <div>
                        <Field label="Deal Status" value="Picklist" />
                        <Field label="Stage" value="Picklist" />
                        <Field label="Closing Date" value="Date" />
                        <Field label="Disbursement Date" value="Date" />
                    </div>
                </CardContent>

                {/* Loan Liabilities Information */}
                <SectionHeader title="Loan Liabilities Information" />
                <CardContent className="p-0 grid grid-cols-1 md:grid-cols-2">
                    <div className="md:border-r border-border">
                        <Field label="Deal Name" value="Single Line" />
                        <Field label="Start Date" value="Date" />
                        <Field label="End Date" value="Date" />
                        <Field label="Amount" value="Currency" />
                        <Field label="Created By" value="System Driven Field (User)" />
                        <Field label="Modified By" value="System Driven Field (User)" />
                    </div>
                    <div>
                        <Field label="Account Name" value="Single Line" />
                        <Field label="Lender Name" value="Picklist" />
                        <Field label="Loan Type" value="Picklist" />
                        <Field label="Loan Product" value="Picklist" />
                        <Field label="Interest Type" value="Picklist" />
                        <Field label="Rate of Interest" value="Percent" />
                    </div>
                </CardContent>

                {/* Funding & Commercials */}
                <SectionHeader title="Funding & Commercials" />
                <CardContent className="p-0 grid grid-cols-1 md:grid-cols-2">
                    <div className="md:border-r border-border">
                        <Field label="Sanction Amount" value="Currency" />
                        <Field label="Processing Fees" value="Currency" />
                        <Field label="Insurance Amount" value="Currency" />
                    </div>
                    <div>
                        <Field label="Disbursed Amount" value="Currency" />
                        <Field label="MM Charges" value="Currency" />
                        <div className="hidden md:block py-2 px-4 h-[40px] border-b border-border last:border-0"></div>
                    </div>
                </CardContent>

                {/* Rejection Status */}
                <SectionHeader title="Rejection Status" />
                <CardContent className="p-0 grid grid-cols-1 md:grid-cols-2">
                    <div className="md:border-r border-border">
                        <Field label="Lender Rejection Reason" value="Multi-Select" />
                        <Field label="Lender Rejection Status Explanation" value="Single Line" />
                    </div>
                    <div>
                        <Field label="Customer Rejection Reason" value="Picklist" />
                        <Field label="Customer Rejection Status Explanation" value="Single Line" />
                    </div>
                </CardContent>

                {/* Notes Section */}
                <SectionHeader title="Notes" />
                <CardContent className="p-0">
                    {[
                        { id: 1, date: "19-12-2025 1:15 PM" },
                        { id: 2, date: "26-12-2025 5:20 PM" }
                    ].map((note) => (
                        <div key={note.id} className="p-4 border-b border-border group hover:bg-muted/30 transition-colors">
                            <p className="text-sm font-semibold mb-3">Note content {note.id}</p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[11px] text-muted-foreground uppercase tracking-tight">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold">Module :</span>
                                    <Badge variant="outline" className="text-[9px] px-1 h-4 uppercase">Deal</Badge>
                                </div>
                                <div><span className="font-bold">Created time (Note) :</span> {note.date}</div>
                                <div><span className="font-bold">Created by :</span> (Note Owner)</div>
                            </div>
                        </div>
                    ))}

                    <button className="w-full p-4 text-sm font-bold text-primary hover:bg-primary/5 flex items-center justify-center transition-all">
                        <PlusCircle className="w-4 h-4 mr-2" />
                        ADD NOTE
                    </button>
                </CardContent>
            </Card>
        </div>
    );
};

export default UpdateDeals;