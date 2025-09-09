import { message, Tooltip } from "antd";
import { Plus, X } from "lucide-react";

const ContentEnhancements = ({
  formData,
  setFormData,
  setData,
  brands,
  loadingBrands,
  brandError,
  localFormData,
  setLocalFormData,
}) => {
  const handleAddLink = () => {
    const input = localFormData.newLink.trim();
    if (!input) return;

    const existing = formData.referenceLinks.map((link) => link.toLowerCase().trim());

    const isValidURL = (url) => {
      try {
        new URL(url);
        return true;
      } catch {
        return false;
      }
    };

    const seen = new Set();
    const newLinks = input
      .split(",")
      .map((link) => link.trim())
      .filter((link) => {
        const lower = link.toLowerCase();
        return !seen.has(lower) && isValidURL(link) && !existing.includes(lower) && seen.add(lower);
      });

    if (newLinks.length === 0) {
      message.error("Please enter valid, non-duplicate URLs separated by commas.");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      referenceLinks: [...prev.referenceLinks, ...newLinks],
    }));
    setLocalFormData((prev) => ({ ...prev, newLink: "" }));
    message.success("Reference link added!");
  };

  const handleRemoveLink = (index) => {
    setFormData((prev) => ({
      ...prev,
      referenceLinks: prev.referenceLinks.filter((_, i) => i !== index),
    }));
    setData((prev) => ({
      ...prev,
      referenceLinks: prev.referenceLinks.filter((_, i) => i !== index),
    }));
  };

  return (
    <>
      {/* Quick Summary Toggle */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">Add a Quick Summary</span>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={formData.isCheckedQuick}
            onChange={() => {
              setFormData((prev) => ({
                ...prev,
                isCheckedQuick: !prev.isCheckedQuick,
              }));
              setData((prev) => ({
                ...prev,
                isCheckedQuick: !prev.isCheckedQuick,
              }));
            }}
            className="sr-only peer"
            aria-checked={formData.isCheckedQuick}
          />
          <div className="w-12 h-6 bg-gray-300 rounded-full peer peer-checked:after:translate-x-6 peer-checked:bg-[#1B6FC9] after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-transform duration-300" />
        </label>
      </div>

      {/* Brand Voice Section */}
      <div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Write with Brand Voice</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isCheckedBrand}
              onChange={() => {
                setFormData((prev) => ({
                  ...prev,
                  isCheckedBrand: !prev.isCheckedBrand,
                  brandId: null,
                }));
                setData((prev) => ({
                  ...prev,
                  isCheckedBrand: !prev.isCheckedBrand,
                  brandId: null,
                }));
              }}
              className="sr-only peer"
              aria-checked={formData.isCheckedBrand}
            />
            <div className="w-12 h-6 bg-gray-300 rounded-full peer peer-checked:after:translate-x-6 peer-checked:bg-[#1B6FC9] after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-transform duration-300" />
          </label>
        </div>
        {formData.isCheckedBrand && (
          <div className="mt-3 p-4 rounded-md border border-gray-200 bg-gray-50">
            {loadingBrands ? (
              <div className="text-gray-500 text-sm">Loading brand voices...</div>
            ) : brandError ? (
              <div className="text-red-500 text-sm font-medium">{brandError}</div>
            ) : brands?.length > 0 ? (
              <div className="max-h-48 overflow-y-auto pr-1">
                <div className="grid gap-3">
                  {brands.map((voice) => (
                    <label
                      key={voice._id}
                      className={`flex items-start gap-2 p-3 rounded-md cursor-pointer ${
                        formData.brandId === voice._id
                          ? "bg-blue-100 border-blue-300"
                          : "bg-white border border-gray-200"
                      }`}
                    >
                      <input
                        type="radio"
                        name="selectedBrandVoice"
                        value={voice._id}
                        checked={formData.brandId === voice._id}
                        onChange={() => {
                          setFormData((prev) => ({
                            ...prev,
                            brandId: voice._id,
                          }));
                          setData((prev) => ({
                            ...prev,
                            brandId: voice._id,
                          }));
                        }}
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-600"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-700">{voice.nameOfVoice}</div>
                        <p className="text-sm text-gray-600 mt-1">{voice.describeBrand}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-gray-500 text-sm italic">
                No brand voices available. Create one to get started.
              </div>
            )}
          </div>
        )}

        {formData.isCheckedBrand && (
          <div className="flex items-center justify-between mt-3">
            <span className="text-sm font-medium text-gray-700">Add CTA at the End</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.addCTA}
                onChange={() => {
                  setFormData((prev) => ({
                    ...prev,
                    addCTA: !prev.addCTA,
                  }));
                  setData((prev) => ({
                    ...prev,
                    addCTA: !prev.addCTA,
                  }));
                }}
                className="sr-only peer"
                aria-checked={formData.addCTA}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1B6FC9]" />
            </label>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {/* Add FAQ Toggle */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-gray-700">Add FAQ</p>
            <p className="text-xs font-medium text-gray-500">
              Generate frequently asked questions for your blog.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isFAQEnabled}
              onChange={() => {
                setFormData((prev) => ({
                  ...prev,
                  isFAQEnabled: !prev.isFAQEnabled,
                }));
                setData((prev) => ({
                  ...prev,
                  isFAQEnabled: !prev.isFAQEnabled,
                }));
              }}
              className="sr-only peer"
            />
            <div className="w-12 h-6 bg-gray-300 rounded-full peer peer-checked:after:translate-x-6 peer-checked:bg-[#1B6FC9] after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-transform duration-300" />
          </label>
        </div>

        {/* Interlinks Toggle */}
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm font-medium text-gray-700">
            Include Interlinks
            <p className="text-xs text-gray-500">
              Auto-link to other blogs within your content.
            </p>
          </span>
          <label className="relative inline-flex items-center cursor-pointer self-end">
            <input
              type="checkbox"
              checked={formData.includeInterlinks}
              onChange={(e) => {
                setFormData((prev) => ({
                  ...prev,
                  includeInterlinks: e.target.checked,
                }));
                setData((prev) => ({
                  ...prev,
                  includeInterlinks: e.target.checked,
                }));
              }}
              className="sr-only peer"
            />
            <div className="w-12 h-6 bg-gray-300 rounded-full peer peer-checked:after:translate-x-6 peer-checked:bg-[#1B6FC9] after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-transform duration-300" />
          </label>
        </div>

        {/* Competitive Research */}
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm font-medium text-gray-700">
            Add Competitive Research
            <p className="text-xs text-gray-500">
              Analyze similar blogs to find strategic insights.
            </p>
          </span>
          <label className="relative inline-flex items-center cursor-pointer self-end">
            <input
              type="checkbox"
              checked={formData.isCompetitiveResearchEnabled}
              onChange={() => {
                setFormData((prev) => ({
                  ...prev,
                  isCompetitiveResearchEnabled: !prev.isCompetitiveResearchEnabled,
                }));
                setData((prev) => ({
                  ...prev,
                  isCompetitiveResearchEnabled: !prev.isCompetitiveResearchEnabled,
                }));
              }}
              className="sr-only peer"
            />
            <div className="w-12 h-6 bg-gray-300 rounded-full peer peer-checked:after:translate-x-6 peer-checked:bg-[#1B6FC9] after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-transform duration-300" />
          </label>
        </div>

        {/* Outbound Links (Only if Competitive Research is enabled) */}
        {formData.isCompetitiveResearchEnabled && (
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm font-medium text-gray-700">
              Show Outbound Links
              <p className="text-xs text-gray-500">
                Display reference links from competitor analysis.
              </p>
            </span>
            <label className="relative inline-flex items-center cursor-pointer self-end">
              <input
                type="checkbox"
                checked={formData.addOutBoundLinks}
                onChange={() => {
                  setFormData((prev) => ({
                    ...prev,
                    addOutBoundLinks: !prev.addOutBoundLinks,
                  }));
                  setData((prev) => ({
                    ...prev,
                    addOutBoundLinks: !prev.addOutBoundLinks,
                  }));
                }}
                className="sr-only peer"
              />
              <div className="w-12 h-6 bg-gray-300 rounded-full peer peer-checked:after:translate-x-6 peer-checked:bg-[#1B6FC9] after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-transform duration-300" />
            </label>
          </div>
        )}
      </div>

      {/* Reference Links Section */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Add Reference Links (Helps make blog more compelling)
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
            placeholder="https://example.com"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddLink();
              }
            }}
            value={localFormData.newLink}
            onChange={(e) =>
              setLocalFormData((prev) => ({
                ...prev,
                newLink: e.target.value,
              }))
            }
          />
          <button
            onClick={handleAddLink}
            className="px-3 py-2 bg-[#1B6FC9] hover:bg-[#1B6FC9]/90 text-white rounded-md"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        {formData.referenceLinks.length > 0 && (
          <div className="mt-2 space-y-2">
            {formData.referenceLinks.map((link, index) => (
              <div
                key={index}
                className="flex items-center justify-between gap-2 p-2 bg-gray-50 rounded-md"
              >
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 truncate"
                >
                  {link}
                </a>
                <button
                  onClick={() => handleRemoveLink(index)}
                  className="text-gray-500 hover:text-red-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default ContentEnhancements;