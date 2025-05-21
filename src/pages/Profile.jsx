import React, { useState } from "react";

const Profile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    profilePicture: "/images/default-profile.png", // Default profile picture
    name: "Siva Dheeraj",
    email: "sivadheeraj@example.com",
    username: "Siva Dheeraj123",
    preferredAIModel: "Gemini",
    writingTone: "Professional",
    topicsOfInterest: ["Technology", "AI", "Programming"],
    phone: "+91 999029292999",
    bio: "Product Designer",
    address: {
      country: "India",
      state: "Surat, Gujarat",
      postalCode: "5400055",
      taxId: "AS564178969",
    },
  });

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        [name]: value,
      },
    }));
  };

  const handleSave = () => {
    setIsEditing(false);
    alert("Profile updated successfully!");
    // Add API call here to save the updated profile data
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Optionally reset the form to original values
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="w-full mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
        {/* Header Section */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-6">
            <img
              src={profileData.profilePicture}
              alt="Profile"
              className="w-24 h-24 rounded-full object-cover border border-gray-300"
            />
            <div>
              <h1 className="text-2xl font-bold">{profileData.name}</h1>
              <p className="text-sm text-gray-600">{profileData.bio}</p>
              <p className="text-sm text-gray-600">{profileData.address.state}</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6 space-y-6">
          {/* Personal Information Section */}
          <div className="border-b border-gray-200 pb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Personal Information</h2>
              <button
                onClick={handleEditToggle}
                className="text-blue-500 hover:underline text-sm"
              >
                {isEditing ? "Cancel" : "Edit"}
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="name"
                    value={profileData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <p className="text-gray-600">{profileData.name}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="phone"
                    value={profileData.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <p className="text-gray-600">{profileData.phone}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email Address</label>
                {isEditing ? (
                  <input
                    type="email"
                    name="email"
                    value={profileData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <p className="text-gray-600">{profileData.email}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Bio</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="bio"
                    value={profileData.bio}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <p className="text-gray-600">{profileData.bio}</p>
                )}
              </div>
            </div>
          </div>

          {/* Address Section */}
          <div className="border-b border-gray-200 pb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Address</h2>
              <button
                onClick={handleEditToggle}
                className="text-blue-500 hover:underline text-sm"
              >
                {isEditing ? "Cancel" : "Edit"}
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Country</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="country"
                    value={profileData.address.country}
                    onChange={handleAddressChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <p className="text-gray-600">{profileData.address.country}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">City/State</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="state"
                    value={profileData.address.state}
                    onChange={handleAddressChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <p className="text-gray-600">{profileData.address.state}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Postal Code</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="postalCode"
                    value={profileData.address.postalCode}
                    onChange={handleAddressChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <p className="text-gray-600">{profileData.address.postalCode}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Tax ID</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="taxId"
                    value={profileData.address.taxId}
                    onChange={handleAddressChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <p className="text-gray-600">{profileData.address.taxId}</p>
                )}
              </div>
            </div>
          </div>

          {/* Save and Cancel Buttons */}
          {isEditing && (
            <div className="flex justify-end space-x-4">
              <button
                onClick={handleSave}
                className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition duration-200"
              >
                Save
              </button>
              <button
                onClick={handleCancel}
                className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition duration-200"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;