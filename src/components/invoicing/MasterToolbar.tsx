import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Download, Plus, Upload } from "lucide-react";

interface MasterToolbarProps {
  title: string;
  onAdd?: () => void;
  onImport: (file: File) => void;
  onExportCSV: () => void;
}

export function MasterToolbar({
  title,
  onAdd,
  onImport,
  onExportCSV,
}: MasterToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onImport(file);
    e.target.value = ""; // allow re-importing the same file name
  }

  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.csv,.xlsx,.xls"
          className="hidden"
          onChange={handleFileChange}
        />
        <Button
          variant="outline"
          className="cursor-pointer"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-4 w-4 mr-1 cursor-pointer" />
          Import
        </Button>

        <Button variant="outline" size="sm" className="cursor-pointer" onClick={onExportCSV}>
          <Download className="h-4 w-4 mr-1 " />
          Export
        </Button>

        {onAdd && (
          <Button size="sm" onClick={onAdd} className="bg-primary text-white hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-1" />
            Add New
          </Button>
        )}
      </div>
    </div>
  );
}
