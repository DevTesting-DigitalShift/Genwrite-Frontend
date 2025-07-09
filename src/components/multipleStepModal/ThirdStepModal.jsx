
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchBrands } from "@store/slices/brandSlice";
import { message, Modal } from "antd";

const ThirdStepModal = ({ handleSubmit, handlePrevious, handleClose, data, setData }) => {
  const { brands } = useSelector((state) => state.brand);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchBrands());
  }, [dispatch]);

  const [formData, setFormData] = useState({
    isCheckedBrand: data.isCheckedBrand || false,
    brandId: data.brandId || null,
    categories: data.categories || [],
    ...data,
  });

  const [localFormData, setLocalFormData] = useState({
    images: [],
    currentImageIndex: 0,
    referenceLinks: [],
    newLink: "",
  });

  const {
    items: brandVoices,
    loading: loadingBrands,
    error: brandError,
  } = useSelector((state) => state.brand);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://localhost:6500/api/upload", {
        method: "POST",
        body: formData,
      });
      const resData = await response.json();
      setLocalFormData((prev) => ({
        ...prev,
        images: [...prev.images, resData.imageUrl],
      }));
    } catch (error) {
      console.error("Error uploading image:", error);
    }
  };

  const handleAddLink = () => {
    const input = localFormData.newLink.trim();
    if (!input) return;

    const existing = localFormData.referenceLinks.map((link) => link.toLowerCase().trim());

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

    setLocalFormData((prev) => ({
      ...prev,
      referenceLinks: [...prev.referenceLinks, ...newLinks],
      newLink: "",
    }));
  };

  const handleRemoveLink = (index) => {
    setLocalFormData((prev) => ({
      ...prev,
      referenceLinks: prev.referenceLinks.filter((_, i) => i !== index),
    }));
  };

  const handleCheckboxChange = () => {
    setData((prevData) => ({
      ...prevData,
      isCheckedGeneratedImages: !prevData.isCheckedGeneratedImages,
    }));
  };

  const handleNextClick = () => {
    const updatedData = {
      ...data,
      brandId: formData.isCheckedBrand ? formData.brandId : null,
      categories: formData.categories,
      images: [...(data.images || []), ...localFormData.images],
      referenceLinks: [...(data.referenceLinks || []), ...localFormData.referenceLinks],
    };
    handleSubmit(updatedData);
  };

  return (
    <Modal
      title="Step 3: Final Details"
      open={true}
      onCancel={handleClose}
      footer={
        <div className="flex justify-end gap-4">
          <button
            onClick={handlePrevious}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg"
          >
            Previous
          </button>
          <button
            onClick={handleNextClick}
            className="px-6 py-2 bg-[#1B6FC9] text-white rounded-lg"
          >
            Submit
          </button>
        </div>
      }
      width={800}
      centered
      transitionName=""
      maskTransitionName=""
      bodyStyle={{ padding: '24px' }}
    >
      <div>
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Step 3 of 3</span>
          </div>
          <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full w-full bg-[#1B6FC9] rounded-full" />
          </div>
        </div>

        <div className="space-y-6">
          {/* --- Brand Voice Section --- */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Write with Brand Voice</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isCheckedBrand}
                onChange={() =>
                  setFormData((prev) => ({
                    ...prev,
                    isCheckedBrand: !prev.isCheckedBrand,
                    brandId: !prev.isCheckedBrand ? prev.brandId : null,
                  }))
                }
                className="sr-only peer"
              />
              <div className="w-14 h-8 bg-gray-200 rounded-full peer peer-checked:after:translate-x-6 peer-checked:bg-[#1B6FC9] after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-6 after:w-6" />
            </label>
          </div>

          {formData.isCheckedBrand && (
            <div className="mt-4 p-6 rounded-lg border border-indigo-100 bg-indigo-50/50 shadow-sm">
              {loadingBrands ? (
                <div className="text-gray-500 text-sm">Loading brand voices...</div>
              ) : brandError ? (
                <div className="text-red-500 text-sm font-medium">{brandError}</div>
              ) : brands?.length > 0 ? (
                <div className="max-h-64 overflow-y-auto pr-1">
                  <div className="grid gap-4">
                    {brands.map((voice) => (
                      <label
                        key={voice._id}
                        className={`flex items-start gap-3 p-4 rounded-lg cursor-pointer ${
                          formData.brandId === voice._id
                            ? "bg-indigo-100 border-indigo-300 shadow-md"
                            : "bg-white border border-gray-200"
                        }`}
                      >
                        <input
                          type="radio"
                          name="selectedBrandVoice"
                          value={voice._id}
                          checked={formData.brandId === voice._id}
                          onChange={() =>
                            setFormData((prev) => ({
                              ...prev,
                              brandId: voice._id,
                            }))
                          }
                          className="mt-1 form-radio text-indigo-600 focus:ring-indigo-500 h-5 w-5"
                        />
                        <div className="flex-1">
                          <div className="font-semibold text-indigo-800 text-base">
                            {voice.nameOfVoice}
                          </div>
                          <p className="text-gray-600 text-sm mt-1 leading-relaxed">
                            {voice.describeBrand}
                          </p>
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

          {/* --- FAQ Section --- */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Add FAQ</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={!!data.isFAQEnabled}
                onChange={() =>
                  setData((prevData) => ({
                    ...prevData,
                    isFAQEnabled: !prevData.isFAQEnabled,
                  }))
                }
                className="sr-only peer"
              />
              <div className="w-14 h-8 bg-gray-200 rounded-full peer peer-checked:after:translate-x-6 peer-checked:bg-[#1B6FC9] after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-6 after:w-6" />
            </label>
          </div>

          {/* --- Competitive Research Section --- */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Add Competitive Research</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={!!data.isCompetitiveResearchEnabled}
                onChange={() =>
                  setData((prevData) => ({
                    ...prevData,
                    isCompetitiveResearchEnabled: !prevData.isCompetitiveResearchEnabled,
                  }))
                }
                className="sr-only peer"
              />
              <div className="w-14 h-8 bg-gray-200 rounded-full peer peer-checked:after:translate-x-6 peer-checked:bg-[#1B6FC9] after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-6 after:w-6" />
            </label>
          </div>

          {/* --- Reference Links Section --- */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Add Reference Links (Helps to make blog more compelling)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B6FC9]"
                placeholder="https://thedigitalshift.co/blog-standard/"
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
                className="px-3 py-2 bg-[#1B6FC9] text-white rounded-lg"
              >
                Add
              </button>
            </div>
            <div className="mt-2 space-y-2">
              {localFormData.referenceLinks.map((link, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between gap-2 p-2 bg-gray-50 rounded-lg"
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
                    className="ml-4 text-4xl text-gray-400"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* --- Image Upload Section --- */}
          {/* <div>
            <label className="block text-sm font-medium mb-2">
              Upload Images
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700"
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm font-medium">Use Generated Images</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!data.isCheckedGeneratedImages}
                  onChange={handleCheckboxChange}
                  className="sr-only peer"
                />
                <div className="w-14 h-8 bg-gray-200 rounded-full peer peer-checked:after:translate-x-6 peer-checked:bg-[#1B6FC9] after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-6 after:w-6" />
              </label>
            </div>
            <div className="mt-2 space-y-2">
              {localFormData.images.map((image, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between gap-2 p-2 bg-gray-50 rounded-lg"
                >
                  <span className="text-sm text-blue-600 truncate">{image}</span>
                  <button
                    onClick={() =>
                      setLocalFormData((prev) => ({
                        ...prev,
                        images: prev.images.filter((_, i) => i !== index),
                      }))
                    }
                    className="ml-4 text-4xl text-gray-400"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div> */}
        </div>
      </div>
    </Modal>
  );
};

export default ThirdStepModal;