import { useEffect, useState } from "react";
import axiosInstance from "@/api/index";

const BrandVoiceSection = ({ isCheckedBrand }) => {
  const [brandVoices, setBrandVoices] = useState([]);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [brandError, setBrandError] = useState(null);

  useEffect(() => {
    if (isCheckedBrand) {
      setLoadingBrands(true);
      axiosInstance
        .get("/brand")
        .then((res) => {
          let brandsArr = Array.isArray(res.data)
            ? res.data
            : res.data
            ? [res.data]
            : [];
          setBrandVoices(brandsArr);
          setLoadingBrands(false);
        })
        .catch((err) => {
          setBrandError("Failed to fetch brand voices");
          setLoadingBrands(false);
        });
    }
  }, [isCheckedBrand]);

  if (!isCheckedBrand) return null;

  return (
    <div className="mt-4 p-4 rounded-lg border border-indigo-200 bg-indigo-50">
      {loadingBrands ? (
        <div className="text-gray-500 text-sm">Loading brand voices...</div>
      ) : brandError ? (
        <div className="text-red-500 text-sm">{brandError}</div>
      ) : brandVoices.length > 0 ? (
        <div className="space-y-2">
          {brandVoices.map((voice) => (
            <div key={voice._id} className="mb-2">
              <div className="font-semibold text-indigo-700">{voice.nameOfVoice}</div>
              <div className="text-gray-700 text-sm mt-1">{voice.describeBrand}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-gray-500 text-sm">No brand voices created yet.</div>
      )}
    </div>
  );
};

export default BrandVoiceSection;
