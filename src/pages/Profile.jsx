import React, { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  DocumentArrowDownIcon,
  CreditCardIcon,
  BanknotesIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid"
import axiosInstance from "@api/index"
import { toast, ToastContainer } from "react-toastify"
import { useSelector, useDispatch } from "react-redux"
import { load, setUser } from "@store/slices/authSlice"

const DEMO_PROFILE = {
  profilePicture: "https://source.unsplash.com/random/800x800/?portrait",
  personalDetails: {
    name: "eg : Siva Dheeraj",
    email: "eg : sivadheeraj@example.com",
    phone: "eg : +91 9990292929",
    bio: "eg : Lead Product Designer",
    jobTitle: "eg : Senior UX Engineer",
    company: "eg : Tech Innovators Inc",
    website: "eg : www.sivadheeraj.design",
    dob: "eg : 1990-05-15",
  },
  billingDetails: {
    companyName: "eg : ABC Corporation",
    address: "eg : 123 Business Street, Financial District",
    city: "eg : Mumbai",
    country: "eg : India",
    gstNumber: "eg : 27ABCDE1234F1Z5",
    taxId: "eg : AS564178969",
    paymentMethod: "eg : Stripe",
    companyEmail: "eg : accounts@abc-corp.in",
  },
  subscription: {
    type: "Free",
    startDate: "2024-01-01",
    renewalDate: "1/1/2025",
    credits: 1500,
    planFeatures: ["Unlimited Projects", "Priority Support", "Advanced Analytics"],
    paymentHistory: [
      { id: 1, date: "2024-03-01", amount: "$1500", status: "paid" },
      { id: 2, date: "2024-02-01", amount: "$1500", status: "paid" },
    ],
  },
}

const Profile = () => {
  const [isEditing, setIsEditing] = useState(false)
  const fileInputRef = useRef(null)
  const [profileData, setProfileData] = useState(DEMO_PROFILE)
  const { user } = useSelector((state) => state.auth)
  const dispatch = useDispatch()

  // Fetch user data from backend
  useEffect(() => {
    const fetchUser = async () => {
      try {
        await load()(dispatch)
        setProfileData((prev) => ({
          profilePicture: user.avatar || prev.profilePicture,
          personalDetails: {
            name: user.name || "",
            email: user.email || "",
            phone: user.phone || "",
            bio: user.bio || "",
            jobTitle: user.jobTitle || "",
            company: user.company || "",
            website: user.website || "",
            wordpress: user.wordpressLink || "",
            dob: user.dob || "",
          },
          billingDetails: {
            companyName: user.billingDetails?.companyName || "",
            address: user.billingDetails?.address || "",
            city: user.billingDetails?.city || "",
            country: user.billingDetails?.country || "",
            gstNumber: user.billingDetails?.gstNumber || "",
            taxId: user.billingDetails?.taxId || "",
            paymentMethod: user.billingDetails?.paymentMethod || "",
            companyEmail: user.billingDetails?.companyEmail || "",
          },
          subscription: {
            type: user?.plan || "Free", // always default to Free
            startDate: user.subscription?.startDate || "",
            renewalDate: user.subscription?.renewalDate || "",
            credits: user.credits.base ?? 0,
            planFeatures: user.subscription?.planFeatures || [],
          },
          invoices: user.invoices?.length ? user.invoices : [],
        }))
      } catch (err) {
        // fallback to demo data if error
        setProfileData(DEMO_PROFILE)
      }
    }
    fetchUser()
  }, [])

  useEffect(() => {
    const updateUser = async (data) => {
      try {
        const res = await axiosInstance.put("/user/profile", data)
        if (res?.data) {
          await load()(dispatch)
        }
        toast.success("User updated successfully")
      } catch (err) {
        toast.error("User update error, try after some time")
      }
    }
    const wordpress = profileData?.personalDetails?.wordpress?.trim()
    if (!isEditing && wordpress && user.wordpressLink !== wordpress) {
      updateUser({
        wordpressLink: wordpress,
      })
    }
  }, [profileData.personalDetails.wordpress, isEditing])

  // Handlers
  const handleEditToggle = () => setIsEditing(!isEditing)
  const handleSave = () => setIsEditing(false)
  const handleCancel = () => setIsEditing(false)

  const handleImageUpload = (e) => {
    if (!isEditing) return
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setProfileData((prev) => ({ ...prev, profilePicture: e.target.result }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    const [section, field] = name.split(".")
    setProfileData((prev) => ({
      ...prev,
      [section]: { ...prev[section], [field]: value },
    }))
  }

  // Animation configurations
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 120 },
    },
    hover: {
      y: -5,
      scale: 1.02,
      boxShadow: "0 20px 25px -12px rgba(0, 0, 0, 0.15)",
    },
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/50 p-8"
      >
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="max-w-7xl mx-auto bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-2xl border border-white/20 overflow-hidden"
        >
          {/* Header Section */}
          <div className="relative p-8 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
            <div className="relative flex flex-col md:flex-row items-center gap-8">
              <motion.div
                className="relative group"
                whileHover="hover"
                variants={{
                  hover: { scale: 1.03 },
                }}
              >
                {profileData?.profilePicture && (
                  <>
                    <img
                      src={profileData.profilePicture}
                      alt="Profile"
                      className="w-40 h-40 rounded-full border-4 border-white/80 object-cover shadow-2xl relative z-10"
                      onClick={() => isEditing && fileInputRef.current.click()}
                      style={{ cursor: isEditing ? "pointer" : "default" }}
                    />
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      className="hidden"
                      accept="image/*"
                      disabled={!isEditing}
                    />
                  </>
                )}
              </motion.div>

              <motion.div className="space-y-3 text-white" initial={{ x: -20 }} animate={{ x: 0 }}>
                <h1 className="text-4xl font-bold flex items-center gap-3">
                  {profileData.personalDetails.name || (
                    <span className="text-gray-300">Full Name</span>
                  )}
                </h1>
                <p className="text-xl font-light opacity-90">
                  {profileData.personalDetails.bio || <span className="text-gray-300">Bio</span>}
                </p>
                <div className="flex flex-wrap gap-3">
                  <motion.div
                    className="px-4 py-2 bg-white/20 rounded-full capitalize backdrop-blur-sm flex items-center gap-2"
                    whileHover={{ y: -2 }}
                  >
                    <CreditCardIcon className="w-5 h-5" />
                    <span>{profileData.subscription.type}</span>
                  </motion.div>
                  <motion.div
                    className="px-4 py-2 bg-white/20 rounded-full backdrop-blur-sm flex items-center gap-2"
                    whileHover={{ y: -2 }}
                  >
                    <BanknotesIcon className="w-5 h-5" />
                    <span>{profileData.subscription.credits} Credits</span>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Main Content */}
          <motion.div className="p-8 space-y-8">
            {/* Edit Controls */}
            <div className="flex justify-end gap-4">
              <AnimatePresence mode="wait">
                {isEditing ? (
                  <>
                    <motion.button
                      key="save"
                      onClick={handleSave}
                      className="px-6 py-2 bg-green-500 text-white rounded-xl flex items-center gap-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      whileHover={{ scale: 1.05 }}
                    >
                      <CheckIcon className="w-5 h-5" />
                      Save Changes
                    </motion.button>
                    <motion.button
                      key="cancel"
                      onClick={handleCancel}
                      className="px-6 py-2 bg-gray-500 text-white rounded-xl flex items-center gap-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      whileHover={{ scale: 1.05 }}
                    >
                      <XMarkIcon className="w-5 h-5" />
                      Cancel
                    </motion.button>
                  </>
                ) : (
                  <motion.button
                    key="edit"
                    onClick={handleEditToggle}
                    className="px-6 py-2 bg-blue-500 text-white rounded-xl flex items-center gap-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    whileHover={{ scale: 1.05 }}
                  >
                    <PencilIcon className="w-5 h-5" />
                    Edit Profile
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            {/* Profile Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Personal Details */}
                <motion.div
                  variants={cardVariants}
                  whileHover="hover"
                  className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl border-2 border-slate-200 shadow-lg"
                >
                  <h2 className="text-2xl font-bold text-slate-800 mb-6">Personal Details</h2>
                  <div className="space-y-4">
                    <ProfileField
                      label="Full Name"
                      name="personalDetails.name"
                      value={profileData.personalDetails.name}
                      isEditing={isEditing}
                      onChange={handleInputChange}
                      placeholder={DEMO_PROFILE.personalDetails.name}
                    />
                    <ProfileField
                      label="Email"
                      name="personalDetails.email"
                      value={profileData.personalDetails.email}
                      isEditing={isEditing}
                      onChange={handleInputChange}
                      placeholder={DEMO_PROFILE.personalDetails.email}
                    />
                    <ProfileField
                      label="WordPress Link"
                      name="personalDetails.wordpress"
                      value={profileData.personalDetails.wordpress}
                      isEditing={isEditing}
                      onChange={handleInputChange}
                      placeholder="eg : https://yourblog.wordpress.com"
                    />
                    <ProfileField
                      label="Phone"
                      name="personalDetails.phone"
                      value={profileData.personalDetails.phone}
                      isEditing={isEditing}
                      onChange={handleInputChange}
                      placeholder={DEMO_PROFILE.personalDetails.phone}
                    />
                    <ProfileField
                      label="Job Title"
                      name="personalDetails.jobTitle"
                      value={profileData.personalDetails.jobTitle}
                      isEditing={isEditing}
                      onChange={handleInputChange}
                      placeholder={DEMO_PROFILE.personalDetails.jobTitle}
                    />
                    <ProfileField
                      label="Company"
                      name="personalDetails.company"
                      value={profileData.personalDetails.company}
                      isEditing={isEditing}
                      onChange={handleInputChange}
                      placeholder={DEMO_PROFILE.personalDetails.company}
                    />
                    <ProfileField
                      label="Website"
                      name="personalDetails.website"
                      value={profileData.personalDetails.website}
                      isEditing={isEditing}
                      onChange={handleInputChange}
                      placeholder={DEMO_PROFILE.personalDetails.website}
                    />
                    <ProfileField
                      label="Date of Birth"
                      name="personalDetails.dob"
                      value={profileData.personalDetails.dob}
                      isEditing={isEditing}
                      onChange={handleInputChange}
                      placeholder={DEMO_PROFILE.personalDetails.dob}
                    />
                  </div>
                </motion.div>

                {/* Subscription & Credits */}
                <motion.div
                  variants={cardVariants}
                  whileHover="hover"
                  className="bg-gradient-to-br from-blue-50 to-purple-50 p-8 rounded-2xl border-2 border-indigo-100 shadow-lg relative overflow-hidden"
                >
                  <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-200/20 rounded-full blur-3xl" />
                  <h2 className="text-2xl font-bold text-slate-800 mb-6">Subscription & Credits</h2>
                  <div className="space-y-4 ">
                    <div className="flex justify-between items-center p-3 rounded-lg bg-white/80">
                      <span className="font-medium">Plan Type</span>
                      <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-1 rounded-full capitalize">
                        {profileData.subscription.type}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-white/80">
                      <span className="font-medium">Credits Available</span>
                      <span className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-1 rounded-full">
                        {profileData.subscription.credits || DEMO_PROFILE.subscription.credits}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-white/80">
                      <span className="font-medium">Start Date</span>
                      <span>
                        {new Date(profileData.subscription.startDate).toLocaleDateString('en-IN',) || DEMO_PROFILE.subscription.startDate}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-white/80">
                      <span className="font-medium">Renewal Date</span>
                      <span>
                        {profileData.subscription.renewalDate ||
                          DEMO_PROFILE.subscription.renewalDate}
                      </span>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Right Column */}
              {/* <div className="space-y-6">
                <motion.div
                  variants={cardVariants}
                  whileHover="hover"
                  className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl border-2 border-slate-200 shadow-lg"
                >
                  <h2 className="text-2xl font-bold text-slate-800 mb-6">Billing Information</h2>
                  <div className="space-y-4">
                    <ProfileField
                      label="Company Name"
                      name="billingDetails.companyName"
                      value={profileData.billingDetails.companyName}
                      isEditing={isEditing}
                      onChange={handleInputChange}
                      placeholder={DEMO_PROFILE.billingDetails.companyName}
                    />
                    <ProfileField
                      label="Address"
                      name="billingDetails.address"
                      value={profileData.billingDetails.address}
                      isEditing={isEditing}
                      onChange={handleInputChange}
                      placeholder={DEMO_PROFILE.billingDetails.address}
                    />
                    <ProfileField
                      label="City"
                      name="billingDetails.city"
                      value={profileData.billingDetails.city}
                      isEditing={isEditing}
                      onChange={handleInputChange}
                      placeholder={DEMO_PROFILE.billingDetails.city}
                    />
                    <ProfileField
                      label="Country"
                      name="billingDetails.country"
                      value={profileData.billingDetails.country}
                      isEditing={isEditing}
                      onChange={handleInputChange}
                      placeholder={DEMO_PROFILE.billingDetails.country}
                    />
                    <ProfileField
                      label="GST Number"
                      name="billingDetails.gstNumber"
                      value={profileData.billingDetails.gstNumber}
                      isEditing={isEditing}
                      onChange={handleInputChange}
                      placeholder={DEMO_PROFILE.billingDetails.gstNumber}
                    />
                    <ProfileField
                      label="Tax ID"
                      name="billingDetails.taxId"
                      value={profileData.billingDetails.taxId}
                      isEditing={isEditing}
                      onChange={handleInputChange}
                      placeholder={DEMO_PROFILE.billingDetails.taxId}
                    />
                    <ProfileField
                      label="Payment Method"
                      name="billingDetails.paymentMethod"
                      value={profileData.billingDetails.paymentMethod}
                      isEditing={isEditing}
                      onChange={handleInputChange}
                      placeholder={DEMO_PROFILE.billingDetails.paymentMethod}
                    />
                    <ProfileField
                      label="Billing Email"
                      name="billingDetails.companyEmail"
                      value={profileData.billingDetails.companyEmail}
                      isEditing={isEditing}
                      onChange={handleInputChange}
                      placeholder={DEMO_PROFILE.billingDetails.companyEmail}
                    />
                  </div>
                </motion.div>
              </div> */}
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
      <ToastContainer />
    </>
  )
}

const ProfileField = ({ label, name, value, isEditing, onChange, placeholder }) => (
  <motion.div className="space-y-2" whileHover={{ scale: 1.02 }}>
    <label className="text-sm font-medium text-slate-600">{label}</label>
    {isEditing ? (
      <motion.input
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full px-4 py-2 border-2 border-blue-500 rounded-lg focus:ring-2 focus:ring-blue-200 bg-white/80"
        whileFocus={{ scale: 1.02 }}
      />
    ) : (
      <motion.div
        className="px-4 py-2 bg-white/80 rounded-lg border-2 border-slate-200"
        whileHover={{ x: 5 }}
      >
        {value || <span className="text-gray-400">{placeholder}</span>}
      </motion.div>
    )}
  </motion.div>
)

export default Profile
