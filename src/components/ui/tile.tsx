const Tile = ({
  title,
  value,
  className = '',
}: {
  title: string;
  value: string | number;
  className?: string;
}) => (
  <div
    className={`rounded-xl border border-gray-200 bg-white p-2 shadow-sm ${className}`}
  >
    <p className='text-xs uppercase tracking-wide text-gray-500'>{title}</p>

    <p className='mt-3 text-xs font-semibold  break-words'>{value}</p>
  </div>
);

export default Tile;
