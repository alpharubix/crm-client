export const renderYearlyTable = (title: string, dataArray: any[]) => {
  if (!dataArray || dataArray.length === 0) return null;

  const years = Array.from(new Set(dataArray.map((d: any) => d.Year))).filter(Boolean).sort() as string[];
  const allKeys = Array.from(new Set(dataArray.flatMap((d: any) => Object.keys(d)))).filter(k => k !== 'Year');

  const isHighlighted = (key: string) => key.toLowerCase().includes('total') || key.toLowerCase().includes('net ') || key.toLowerCase().includes('gross ') || key.toLowerCase().includes('profit') || key.toLowerCase().includes('ebitda');

  return (
    <div className="bg-white rounded-md shadow-sm border border-gray-200 mb-6 overflow-x-auto animate-in fade-in duration-500">
      <div className="bg-[#e67e22] text-white px-4 py-2 text-center rounded-t-md font-semibold">
        {title}
      </div>
      <table className="w-full text-sm text-left border-collapse">
        <thead className="bg-[#000080] text-white">
          <tr>
            <th className="px-4 py-2 border border-[#000080]">Particulars</th>
            {years.map(y => (
              <th key={y} className="px-4 py-2 border border-[#000080] text-right min-w-[120px]">{y}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {allKeys.map((key, idx) => (
            <tr key={idx} className="hover:bg-gray-50 transition-colors">
              <td className={`px-4 py-2 border border-gray-200 ${isHighlighted(key) ? 'font-semibold text-[#000080]' : 'text-gray-700'}`}>
                {key}
              </td>
              {years.map(y => {
                const yearData = dataArray.find((d: any) => d.Year === y);
                let val = yearData ? yearData[key] : "";
                const rawVal = val;
                const isNegative = typeof rawVal === 'number' ? rawVal < 0 : (typeof rawVal === 'string' && rawVal.trim().startsWith('-'));
                
                if (val !== "" && val !== null && !isNaN(Number(val))) {
                  val = Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                }
                return (
                  <td key={y} className={`px-4 py-2 border border-gray-200 text-right font-medium ${isNegative ? 'text-red-600' : ''}`}>
                    {val || "-"}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const renderDataTable = (title: string, dataArray: any[]) => {
  if (!dataArray || dataArray.length === 0) return null;
  const allKeys = Array.from(new Set(dataArray.flatMap((d: any) => Object.keys(d))));

  return (
    <div className="bg-white rounded-md shadow-sm border border-gray-200 mb-6 overflow-x-auto animate-in fade-in duration-500">
      <div className="bg-[#000080] text-white px-4 py-2 text-center font-semibold opacity-90 border-b border-white/20">
        {title}
      </div>
      <table className="w-full text-sm text-left border-collapse">
        <thead className="bg-gray-100">
          <tr>
            {allKeys.map(key => (
              <th key={key} className="px-4 py-2 border border-gray-200 font-semibold text-[#000080]">{key}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dataArray.map((row, idx) => (
            <tr key={idx} className="hover:bg-gray-50 transition-colors">
              {allKeys.map(key => {
                let val = row[key];
                const rawVal = val;
                const isNegative = typeof rawVal === 'number' ? rawVal < 0 : (typeof rawVal === 'string' && rawVal.trim().startsWith('-'));
                
                if (val !== "" && val !== null && typeof val === 'number') {
                  val = Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                }
                return (
                  <td key={key} className={`px-4 py-2 border border-gray-200 text-gray-700 ${isNegative ? 'text-red-600 font-medium' : ''}`}>
                    {val || "-"}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
