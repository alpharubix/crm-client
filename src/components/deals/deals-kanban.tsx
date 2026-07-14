import { useState } from "react";
import { FilterX, Search } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
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

        <div className="bg-white dark:bg-zinc-950 border rounded-xl shadow-sm p-5 space-y-5">
          {/* Top Row: Search & Dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 w-full">
            <div className="space-y-1">
              <Label
                htmlFor="search"
                className="text-[11px] font-bold tracking-wider text-zinc-400 uppercase"
              >
                Search
              </Label>
              <Input
                id="search"
                placeholder="Account name..."
                className="h-9 text-xs rounded-lg border-zinc-200"
                value={localFilters.search}
                onChange={(e) => setFilter("search", e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && applyFilters()}
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <Label className="text-[11px] font-bold tracking-wider text-zinc-400 uppercase">Loan Type</Label>
              <MultiSelect
                options={LOAN_TYPE_OPTIONS}
                value={localFilters.project_type}
                onChange={(val) => setFilter("project_type", val)}
                placeholder="Select Types..."
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <Label className="text-[11px] font-bold tracking-wider text-zinc-400 uppercase">
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

          {/* Thin dotted/dashed horizontal separator just like the screenshot */}
          <div className="border-t border-dashed border-zinc-200 my-1" />

          {/* Bottom Row: Grouped Date Ranges with Vertical Dividers */}
          <div className="flex flex-wrap items-center gap-y-4 text-xs">
            {/* Group 1: Created At */}
            <div className="flex gap-3 pr-4">
              <div className="space-y-1">
                <Label
                  htmlFor="from_date"
                  className="text-[10px] font-semibold text-zinc-500"
                >
                  Created From
                </Label>
                <Input
                  id="from_date"
                  type="date"
                  className="h-9 text-xs w-[140px] rounded-lg border-zinc-200"
                  value={localFilters.created_from}
                  onChange={(e) => setFilter("created_from", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label
                  htmlFor="to_date"
                  className="text-[10px] font-semibold text-zinc-500"
                >
                  Created To
                </Label>
                <Input
                  id="to_date"
                  type="date"
                  className="h-9 text-xs w-[140px] rounded-lg border-zinc-200"
                  value={localFilters.created_to}
                  onChange={(e) => setFilter("created_to", e.target.value)}
                />
              </div>
            </div>

            {/* Vertical Line 1 */}
            <div className="hidden md:block h-10 w-[1px] bg-zinc-200 mx-2" />

            {/* Group 2: Expected Closing Range */}
            <div className="flex gap-3 px-0 md:px-4">
              <div className="space-y-1">
                <Label className="text-[10px] font-semibold text-zinc-500">
                  Expected From
                </Label>
                <Input
                  type="date"
                  className="h-9 text-xs w-[140px] rounded-lg border-zinc-200"
                  value={localFilters.expected_closing_from}
                  onChange={(e) =>
                    setFilter("expected_closing_from", e.target.value)
                  }
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-semibold text-zinc-500">
                  Expected To
                </Label>
                <Input
                  type="date"
                  className="h-9 text-xs w-[140px] rounded-lg border-zinc-200"
                  value={localFilters.expected_closing_to}
                  onChange={(e) =>
                    setFilter("expected_closing_to", e.target.value)
                  }
                />
              </div>
            </div>

            {/* Vertical Line 2 */}
            <div className="hidden md:block h-10 w-[1px] bg-zinc-200 mx-2" />

            {/* Group 3: Status Closing Range */}
            <div className="flex gap-3 pl-0 md:pl-4">
              <div className="space-y-1">
                <Label className="text-[10px] font-semibold text-zinc-500">
                  Status Closing From
                </Label>
                <Input
                  type="date"
                  className="h-9 text-xs w-[140px] rounded-lg border-zinc-200"
                  value={localFilters.status_closing_from}
                  onChange={(e) =>
                    setFilter("status_closing_from", e.target.value)
                  }
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-semibold text-zinc-500">
                  Status Closing To
                </Label>
                <Input
                  type="date"
                  className="h-9 text-xs w-[140px] rounded-lg border-zinc-200"
                  value={localFilters.status_closing_to}
                  onChange={(e) =>
                    setFilter("status_closing_to", e.target.value)
                  }
                />
              </div>
            </div>
          </div>

          {/* Action Buttons: Left-aligned exactly like your design */}
          <div className="flex items-center gap-4 pt-2">
            <Button
              onClick={applyFilters}
              className="h-9 text-xs px-5 bg-[#4f46e5] hover:bg-[#4338ca] text-white rounded-lg font-medium shadow-sm flex items-center gap-1.5"
            >
              <Search size={14} /> Apply Filters
            </Button>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                onClick={clearFilters}
                className="h-9 text-xs text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50 px-2 flex items-center gap-1.5"
              >
                <FilterX size={14} /> Reset
              </Button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <DealsKanbanView filters={appliedFilters} enabled={hasApplied} />
        </div>
      </div>
    </div>
  );
}
