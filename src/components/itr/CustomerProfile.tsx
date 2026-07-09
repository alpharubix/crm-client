export default function CustomerProfile({ profile }: { profile: any }) {
  if (!profile) return null;
  return (
    <div className="bg-white rounded-md shadow-sm border border-gray-200 mb-6 animate-in fade-in duration-500">
      <h3 className="text-lg font-semibold text-white bg-[#e67e22] px-4 py-2 rounded-t-md text-center">
        Customer Profile
      </h3>
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-center">
        <div className="border border-gray-200 rounded-md p-2">
           <span className="font-semibold text-[#000080] block mb-1">Company Name</span>
           <span className="text-gray-700">{profile.company_name || "N/A"}</span>
        </div>
        <div className="border border-gray-200 rounded-md p-2">
           <span className="font-semibold text-[#000080] block mb-1">GSTIN</span>
           <span className="text-gray-700">{profile.gstin || "N/A"}</span>
        </div>
         <div className="border border-gray-200 rounded-md p-2">
           <span className="font-semibold text-[#000080] block mb-1">Phone Number</span>
           <span className="text-gray-700">{profile.phone_number || "N/A"}</span>
        </div>
         <div className="border border-gray-200 rounded-md p-2">
           <span className="font-semibold text-[#000080] block mb-1">PAN</span>
           <span className="text-gray-700">{profile.pan || "N/A"}</span>
        </div>
      </div>
    </div>
  );
}
