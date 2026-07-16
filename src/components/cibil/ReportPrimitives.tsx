import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

type ReportRecord = Record<string, unknown>;

export interface MetricItem {
  label: string;
  value: unknown;
  tone?: 'default' | 'strong' | 'danger';
}

export interface DefinitionItem {
  abbreviation: string;
  denotes: string;
  explanation: string;
}

const isScalar = (value: unknown) =>
  value === null ||
  ['string', 'number', 'boolean'].includes(typeof value);

export const isRecord = (value: unknown): value is ReportRecord =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

export const asRecord = (value: unknown): ReportRecord =>
  isRecord(value) ? value : {};

const normalizeKey = (key: string) =>
  key.replace(/[^a-z0-9]/gi, '').toLowerCase();

export const formatLabel = (label: string) => {
  const cleaned = label
    .replace(/_/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned || label;
};

export const formatValue = (value: unknown): string => {
  if (value === null || value === undefined || value === '') return 'N/A';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number') return Number.isFinite(value) ? value.toLocaleString('en-IN') : String(value);
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return `${value.length} item${value.length === 1 ? '' : 's'}`;
  if (isRecord(value)) return `${Object.keys(value).length} field${Object.keys(value).length === 1 ? '' : 's'}`;
  return String(value);
};

export const findDeepValue = (
  source: unknown,
  candidates: string[]
): unknown => {
  const candidateSet = new Set(candidates.map(normalizeKey));
  const seen = new WeakSet<object>();

  const visit = (value: unknown): unknown => {
    if (!value || typeof value !== 'object') return undefined;
    if (seen.has(value)) return undefined;
    seen.add(value);

    if (Array.isArray(value)) {
      for (const item of value) {
        const found = visit(item);
        if (found !== undefined) return found;
      }
      return undefined;
    }

    const record = value as ReportRecord;
    for (const [key, item] of Object.entries(record)) {
      if (candidateSet.has(normalizeKey(key)) && isScalar(item)) return item;
    }

    for (const item of Object.values(record)) {
      const found = visit(item);
      if (found !== undefined) return found;
    }

    return undefined;
  };

  return visit(source);
};

const getScalarEntries = (record: ReportRecord) =>
  Object.entries(record).filter(([, value]) => isScalar(value));

const getComplexEntries = (record: ReportRecord) =>
  Object.entries(record).filter(([, value]) => !isScalar(value));

const getTableRows = (value: unknown): ReportRecord[] => {
  if (!Array.isArray(value)) return [];
  return value.filter(isRecord);
};

const getTableColumns = (rows: ReportRecord[]) => {
  const columns: string[] = [];
  rows.forEach((row) => {
    Object.keys(row).forEach((key) => {
      if (!columns.includes(key)) columns.push(key);
    });
  });
  return columns;
};

export function SectionFrame({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm', className)}>
      <div className="border-b border-slate-200 bg-black px-4 py-3 text-white">
        <h3 className="text-sm font-semibold uppercase tracking-wide">{title}</h3>
        {description ? <p className="mt-1 text-xs text-white/75">{description}</p> : null}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

export function EmptyReportState({ message = 'No data returned for this section.' }: { message?: string }) {
  return (
    <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
      {message}
    </div>
  );
}

export function LoadingState({ label = 'Loading report section...' }: { label?: string }) {
  return (
    <div className="flex min-h-64 items-center justify-center rounded-md border border-slate-200 bg-white">
      <span className="mr-3 h-5 w-5 rounded-full border-2 border-slate-200 border-t-black animate-spin" />
      <span className="text-sm font-medium text-slate-600">{label}</span>
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-md border border-red-200 bg-red-50 px-4 py-8 text-center text-sm font-medium text-red-700">
      {message}
    </div>
  );
}

export function MetricGrid({ items }: { items: MetricItem[] }) {
  const visibleItems = items.filter((item) => item.value !== undefined && item.value !== null && item.value !== '');

  if (!visibleItems.length) return <EmptyReportState />;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {visibleItems.map((item) => (
        <div key={item.label} className="rounded-md border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{item.label}</p>
          <p
            className={cn(
              'mt-2 break-words text-base font-semibold text-slate-900',
              item.tone === 'strong' && 'text-black',
              item.tone === 'danger' && 'text-red-600'
            )}
          >
            {formatValue(item.value)}
          </p>
        </div>
      ))}
    </div>
  );
}

export function KeyValueGrid({ data }: { data: Array<{ label: string; value: unknown }> }) {
  const visibleData = data.filter((item) => item.value !== undefined && item.value !== null && item.value !== '');

  if (!visibleData.length) return <EmptyReportState />;

  return (
    <dl className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
      {visibleData.map((item) => (
        <div key={item.label} className="rounded-md border border-slate-200 bg-white p-3">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{item.label}</dt>
          <dd className="mt-1 break-words text-sm font-medium text-slate-900">{formatValue(item.value)}</dd>
        </div>
      ))}
    </dl>
  );
}

export function DataTable({ rows }: { rows: ReportRecord[] }) {
  if (!rows.length) return <EmptyReportState />;

  const columns = getTableColumns(rows);

  if (!columns.length) return <EmptyReportState />;

  return (
    <div className="overflow-x-auto rounded-md border border-slate-200">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
          <tr>
            {columns.map((column) => (
              <th key={column} scope="col" className="whitespace-nowrap border-b border-slate-200 px-3 py-2 font-semibold">
                {formatLabel(column)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {rows.map((row, index) => (
            <tr key={index} className="hover:bg-slate-50">
              {columns.map((column) => (
                <td key={column} className="max-w-xs break-words px-3 py-2 text-slate-700 whitespace-normal">
                  {formatValue(row[column])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function DefinitionTable({ items }: { items: DefinitionItem[] }) {
  return (
    <DataTable
      rows={items.map((item) => ({
        abbreviation: item.abbreviation,
        denotes: item.denotes,
        explanation: item.explanation,
      }))}
    />
  );
}

export function DataBlock({ title, value, depth = 0 }: { title: string; value: unknown; depth?: number }) {
  if (value === null || value === undefined || value === '') {
    return <EmptyReportState message={`${title} was not returned by the backend.`} />;
  }

  if (Array.isArray(value)) {
    const rows = getTableRows(value);

    if (rows.length === value.length && rows.length > 0) {
      return <DataTable rows={rows} />;
    }

    if (!value.length) return <EmptyReportState />;

    return (
      <div className="space-y-3">
        {value.map((item, index) => (
          <DataBlock key={index} title={`${title} ${index + 1}`} value={item} depth={depth + 1} />
        ))}
      </div>
    );
  }

  if (!isRecord(value)) {
    return <KeyValueGrid data={[{ label: title, value }]} />;
  }

  const scalarEntries = getScalarEntries(value);
  const complexEntries = getComplexEntries(value);

  if (!scalarEntries.length && !complexEntries.length) return <EmptyReportState />;

  return (
    <div className="space-y-4">
      {scalarEntries.length ? (
        <KeyValueGrid data={scalarEntries.map(([label, item]) => ({ label: formatLabel(label), value: item }))} />
      ) : null}
      {complexEntries.map(([key, item]) => (
        <div key={key} className={cn(depth < 2 && 'rounded-md border border-slate-200 bg-slate-50 p-3')}>
          <h4 className="mb-3 text-sm font-semibold text-slate-800">{formatLabel(key)}</h4>
          <DataBlock title={formatLabel(key)} value={item} depth={depth + 1} />
        </div>
      ))}
    </div>
  );
}