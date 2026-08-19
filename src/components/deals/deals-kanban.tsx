import { useState } from "react";
import { FilterX, Search } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { DatePicker } from "../ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import DealsKanbanView, { type KanbanFilters } from "./deals-kanban-view";
import { Label } from "../ui/label";
import { MultiSelect, type Option } from "../ui/multi-select";
import users from "../../utils/users.json";
import { useQuery } from "@tanstack/react-query";
import { ENV } from "@/conf";

const LOAN_TYPE_OPTIONS: Option[] = [
  { value: "SCF", label: "SCF" },
  { value: "SCF Renewal", label: "SCF Renewal" },
  { value: "SCF Enhancement", label: "SCF Enhancement" },
  {
    value: "SCF (Renewal and Enhancement)",
    label: "SCF (Renewal & Enhancement)",
  },
  { value: "Open SCF", label: "Open SCF" },
  { value: "BT-SCF", label: "BT-SCF" },
  { value: "Unsecured OD", label: "Unsecured OD" },
  { value: "Unsecured Term Loan", label: "Unsecured Term Loan" },
  { value: "Secured Loan", label: "Secured Loan" },
  { value: "Vehicle Loan", label: "Vehicle Loan" },
];

interface LocalFilters {
  search: string;
  project_type: Option[];
  deal_owner_id: Option[];
  assignee_id: string;
  created_from: string;
  created_to: string;
  expected_closing_from: string;
  expected_closing_to: string;
  status_closing_from: string;
  status_closing_to: string;
}

const defaultFilters: LocalFilters = {
  search: "",
  project_type: [],
  deal_owner_id: [],
  assignee_id: "all",
  created_from: "",
  created_to: "",
  expected_closing_from: "",
  expected_closing_to: "",
  status_closing_from: "",
  status_closing_to: "",
};

function getDefaultDates() {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return {
    created_from: from.toISOString().split("T")[0], // "YYYY-MM-DD"
    created_to: to.toISOString().split("T")[0],
  };
}



export default function DealsKanban() {
  const [defaultDates] = useState(getDefaultDates);
  const [localFilters, setLocalFilters] = useState<LocalFilters>({
    ...defaultFilters,
    created_from: defaultDates.created_from,
    created_to: defaultDates.created_to,
  });
  const [appliedFilters, setAppliedFilters] =
    useState<KanbanFilters>(defaultDates);
  const [hasApplied, setHasApplied] = useState(true);

  function setFilter<K extends keyof LocalFilters>(
    key: K,
    value: LocalFilters[K],
  ) {
    setLocalFilters((prev) => ({ ...prev, [key]: value }));
  }

  const { data: ownerResponse } = useQuery({
    queryKey: ['deal-owners'],
    queryFn: async () => {
      const res = await fetch(`${ENV.VITE_BACKEND_BASE_URL}/user/filter`, {
        credentials: 'include',
      })
      return res.json()
    },
  })

  const owners = ownerResponse?.data ?? []

  function applyFilters() {
    const f: KanbanFilters = {};
    if (localFilters.search) f.account_name = localFilters.search;
    if (localFilters.project_type.length > 0)
      f.loan_type = localFilters.project_type.map((p) => p.value);
    if (localFilters.deal_owner_id.length > 0) {
      f.deal_owner_id = localFilters.deal_owner_id.map((o) => o.value);
    }
    if (localFilters.created_from) f.created_from = localFilters.created_from;
    if (localFilters.created_to) f.created_to = localFilters.created_to;
    if (localFilters.expected_closing_from)
      f.expected_closing_from = localFilters.expected_closing_from;
    if (localFilters.expected_closing_to)
      f.expected_closing_to = localFilters.expected_closing_to;
    if (localFilters.status_closing_from)
      f.status_closing_from = localFilters.status_closing_from;
    if (localFilters.status_closing_to)
      f.status_closing_to = localFilters.status_closing_to;
    setAppliedFilters(f);
    setHasApplied(true);
  }

  function clearFilters() {
    const cleared: LocalFilters = {
      search: "",
      project_type: [],
      deal_owner_id: [],
      assignee_id: "all",
      created_from: "",
      created_to: "",
      expected_closing_from: "",
      expected_closing_to: "",
      status_closing_from: "",
      status_closing_to: "",
    };
    setLocalFilters(cleared);
    setAppliedFilters({});
  }

  const hasActiveFilters = true;

  return (
    <div className="w-full h-full p-4 flex flex-col max-w-[1400px] mx-auto">
      <div className="flex flex-col flex-1 min-h-0">
        <div className="flex items-center justify-between mb-6 shrink-0">
          <h1 className="text-xl font-bold tracking-tight">Deals Kanban</h1>
          {/* <Button>Create +</Button> */}
        </div>

        <div className="bg-card border border-border/70 rounded-2xl shadow-2xs p-4 sm:p-5 space-y-4">
          {/* Top Row: Search & MultiSelect Dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3.5 w-full">
            <div className="space-y-1.5 md:col-span-1">
              <Label
                htmlFor="search"
                className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase"
              >
                Search Account
              </Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/70 pointer-events-none" />
                <Input
                  id="search"
                  placeholder="Account name..."
                  className="pl-8 h-9 text-xs rounded-lg bg-background border-border/60"
                  value={localFilters.search}
                  onChange={(e) => setFilter("search", e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && applyFilters()}
                />
              </div>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">Loan Type</Label>
              <MultiSelect
                options={LOAN_TYPE_OPTIONS}
                value={localFilters.project_type}
                onChange={(val) => setFilter("project_type", val)}
                placeholder="Select Loan Types..."
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                Deal Owner
              </Label>
              <MultiSelect
                options={owners.map((owner: any) => ({
                  label: owner.full_name,
                  value: owner.id.toString(),
                }))}
                value={localFilters.deal_owner_id || []}
                onChange={(val) => setFilter('deal_owner_id', val)}
                placeholder='Select Owners...'
              />
            </div>
          </div>

          {/* Grouped Date Ranges with Subtle Background Containers */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-2 border-t border-border/50">
            {/* Group 1: Created Date */}
            <div className="bg-muted/20 border border-border/40 p-2.5 rounded-xl space-y-1.5">
              <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                Created Date
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <DatePicker
                  value={localFilters.created_from}
                  onChange={(val) => setFilter("created_from", val)}
                  placeholder="From Date"
                />
                <DatePicker
                  value={localFilters.created_to}
                  onChange={(val) => setFilter("created_to", val)}
                  placeholder="To Date"
                />
              </div>
            </div>

            {/* Group 2: Expected Closing */}
            <div className="bg-muted/20 border border-border/40 p-2.5 rounded-xl space-y-1.5">
              <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                Expected Closing
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <DatePicker
                  value={localFilters.expected_closing_from}
                  onChange={(val) => setFilter("expected_closing_from", val)}
                  placeholder="From Date"
                />
                <DatePicker
                  value={localFilters.expected_closing_to}
                  onChange={(val) => setFilter("expected_closing_to", val)}
                  placeholder="To Date"
                />
              </div>
            </div>

            {/* Group 3: Status Closing */}
            <div className="bg-muted/20 border border-border/40 p-2.5 rounded-xl space-y-1.5">
              <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                Status Closing
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <DatePicker
                  value={localFilters.status_closing_from}
                  onChange={(val) => setFilter("status_closing_from", val)}
                  placeholder="From Date"
                />
                <DatePicker
                  value={localFilters.status_closing_to}
                  onChange={(val) => setFilter("status_closing_to", val)}
                  placeholder="To Date"
                />
              </div>
            </div>
          </div>

          {/* Bottom Action Buttons Bar */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border/40">
            {hasActiveFilters && (
              <Button
                variant="outline"
                onClick={clearFilters}
                className="h-9 text-xs rounded-lg px-3.5 cursor-pointer gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <FilterX size={14} /> Reset
              </Button>
            )}
            <Button
              onClick={applyFilters}
              className="h-9 text-xs px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold cursor-pointer shadow-sm gap-1.5"
            >
              <Search size={14} /> Apply Filters
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <DealsKanbanView filters={appliedFilters} enabled={hasApplied} />
        </div>
      </div>
    </div>
  );
}
