import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlusCircle } from "lucide-react";

const UpdateContacts = () => {
    const Field = ({ label, value }: { label: string; value: string }) => (
        <div className="grid grid-cols-2 py-2.5 px-4 border-b last:border-0 border-border items-center">
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

            {/* Header Bar */}
            <div className="flex justify-between items-center border border-border p-4 rounded-xl bg-card shadow-sm">
                <h1 className="text-lg font-semibold">
                    Contact Owner: <span className="text-primary font-bold">User</span>
                </h1>
                <Button variant="secondary" size="sm" className="font-semibold cursor-pointer">
                    Update
                </Button>
            </div>

            <Card className="overflow-hidden border-border bg-card shadow-sm">
                {/* Contact Information Section */}
                <SectionHeader title="Contact Information" />
                <CardContent className="p-0 grid grid-cols-1 md:grid-cols-2">
                    <div className="md:border-r border-border">
                        <Field label="First Name" value="Single Line" />
                        <Field label="Lead Source" value="Pick List" />
                        <Field label="Mobile" value="Phone" />
                        <Field label="Phone" value="Phone" />
                        <Field label="Created By" value="System Driven Field (User)" />
                        <Field label="Modified By" value="System Driven Field (User)" />
                    </div>
                    <div>
                        <Field label="Last Name" value="Single Line" />
                        <Field label="Designation" value="Single Line" />
                        <Field label="Account Name" value="Lookup (Single Line)" />
                        <Field label="Email" value="Email" />
                        <Field label="Secondary Email" value="Email" />
                        <div className="hidden md:block py-2.5 px-4 h-[41px]"></div> {/* Spacer for alignment */}
                    </div>
                </CardContent>

                {/* Address Information Section */}
                <SectionHeader title="Address Information" />
                <CardContent className="p-0 grid grid-cols-1 md:grid-cols-2 border-b border-border">
                    <div className="md:border-r border-border">
                        <Field label="Street" value="Single Line" />
                        <Field label="State" value="Single Line" />
                        <Field label="Pincode" value="Single Line" />
                    </div>
                    <div>
                        <Field label="City" value="Single Line" />
                        <Field label="Country" value="Single Line" />
                        <div className="hidden md:block py-2.5 px-4 h-[41px]"></div> {/* Spacer for alignment */}
                    </div>
                </CardContent>

                {/* Notes Section */}
                <SectionHeader title="Notes" />
                <CardContent className="p-0">
                    {/* Note 1 */}
                    <div className="p-4 border-b border-border hover:bg-muted/20 transition-colors">
                        <p className="text-sm font-semibold mb-3">Note content 1</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[11px] text-muted-foreground uppercase tracking-tight">
                            <div className="flex items-center gap-2">
                                <span className="font-bold">Module :</span>
                                <Badge variant="secondary" className="text-[9px] px-1 h-4">Contact</Badge>
                            </div>
                            <div><span className="font-bold">Created time (Note) :</span> 19-12-2025 1:15 PM</div>
                            <div><span className="font-bold">Created by :</span> (Note Owner)</div>
                        </div>
                    </div>

                    {/* Note 2 */}
                    <div className="p-4 border-b border-border hover:bg-muted/20 transition-colors">
                        <p className="text-sm font-semibold mb-3">Note content 2</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[11px] text-muted-foreground uppercase tracking-tight">
                            <div className="flex items-center gap-2">
                                <span className="font-bold">Module :</span>
                                <Badge variant="secondary" className="text-[9px] px-1 h-4">Contact</Badge>
                            </div>
                            <div><span className="font-bold">Created time (Note) :</span> 26-12-2025 5:20 PM</div>
                            <div><span className="font-bold">Created by :</span> (Note Owner)</div>
                        </div>
                    </div>

                    {/* Add Note Action */}
                    <button className="w-full p-3 text-sm font-medium text-primary hover:bg-primary/5 flex items-center justify-center transition-colors">
                        <PlusCircle className="w-4 h-4 mr-2" />
                        Add Note
                    </button>
                </CardContent>
            </Card>
        </div>
    );
};

export default UpdateContacts;