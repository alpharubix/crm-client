import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlusCircle } from "lucide-react";

const StaticAccountView = () => {

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
    <div className=" space-y-6 bg-background text-foreground min-h-screen">

      {/* Header Bar - Adapts to Dark/Light */}
      <div className="flex justify-between items-center border border-border p-4 rounded-xl bg-card shadow-sm">
        <h1 className="text-lg font-semibold">
          Account Owner: <span className="text-primary font-bold">User</span>
        </h1>
        <Button variant="secondary" size="sm" className="font-semibold cursor-pointer">
          Update
        </Button>
      </div>

      <Card className="overflow-hidden border-border bg-card">
        {/* Account Status */}
        <SectionHeader title="Account Status" />
        <CardContent className="p-0 grid grid-cols-1 md:grid-cols-2">
          <div className="md:border-r border-border">
            <Field label="Assignment Date" value="Date" />
            <Field label="Source" value="Pick List" />
            <Field label="Distributor Code" value="Single Line" />
            <Field label="WABA Interested" value="Checkbox" />
          </div>
          <div>
            <Field label="Call Back Date/ Time" value="Date" />
            <Field label="Account Status" value="Pick List" />
            <Field label="Account Stage" value="Pick List" />
            <Field label="Business Status" value="Pick List" />
          </div>
        </CardContent>

        {/* Customer Basic Details */}
        <SectionHeader title="Customer Basic Details" />
        <CardContent className="p-0 grid grid-cols-1 md:grid-cols-2">
          <div className="md:border-r border-border">
            <Field label="First Name" value="Single Line" />
            <Field label="Residential Ownership" value="Pick List" />
            <Field label="Residential Location" value="Single Line" />
            <Field label="No of Years..." value="Number" />
            <Field label="Created By" value="System User" />
          </div>
          <div>
            <Field label="Last Name" value="Single Line" />
            <Field label="Mothers Name" value="Single Line" />
            <Field label="Preferred Language" value="Multi-Select" />
            <Field label="Premise Location" value="Single Line" />
            <Field label="Premise Ownership" value="Pick List" />
          </div>
        </CardContent>

        {/* Address Information */}
        <SectionHeader title="Address Information" />
        <CardContent className="p-0 grid grid-cols-1 md:grid-cols-2 border-b border-border">
          <div className="md:border-r border-border">
            <Field label="Street" value="Single Line" />
            <Field label="State" value="Single Line" />
            <Field label="Code" value="Single Line" />
          </div>
          <div>
            <Field label="City" value="Single Line" />
            <Field label="Country" value="Single Line" />
          </div>
        </CardContent>

        {/* References */}
        <SectionHeader title="References from Customer" />
        <CardContent className="p-0 grid grid-cols-1 md:grid-cols-2 border-b border-border">
          <div className="md:border-r border-border">
            <Field label="Name of Person 1" value="Single Line" />
            <Field label="Phone of Person 1" value="Phone" />
            <Field label="Email ID Person 1" value="Email" />
          </div>
          <div>
            <Field label="Name of Person 2" value="Single Line" />
            <Field label="Phone of Person 2" value="Phone" />
            <Field label="Email ID Person 2" value="Email" />
          </div>
        </CardContent>

        {/* Notes */}
        <SectionHeader title="Notes" />
        <CardContent className="p-4 space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="bg-muted/30 p-3 rounded-lg border border-border">
              <p className="text-sm font-medium mb-2 text-foreground">Note content {i}</p>
              <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground uppercase tracking-wider">
                <span>Module: <Badge variant="outline" className="text-[10px] h-4">Contact</Badge></span>
                <span>Created: 19-12-2025</span>
                <span>Owner: Note Owner</span>
              </div>
            </div>
          ))}

          <Button variant="ghost" size="sm" className="w-full text-primary hover:bg-primary/10 cursor-pointer">
            <PlusCircle className="w-4 h-4 mr-2" /> Add Note
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default StaticAccountView;