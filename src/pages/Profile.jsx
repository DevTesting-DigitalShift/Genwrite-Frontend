import React, { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  CreditCardIcon,
  BanknotesIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  ChartBarIcon,
  BellIcon,
  ShieldCheckIcon,
  GlobeAltIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  MapPinIcon,
} from "@heroicons/react/24/solid"
import { useSelector, useDispatch } from "react-redux"
import { loadAuthenticatedUser } from "@store/slices/authSlice"
import { DatePicker, message, Select, Tag, Progress, Badge, Tooltip } from "antd"
import moment from "moment"
import { Helmet } from "react-helmet"
import { updateProfile } from "@store/slices/userSlice"

const DEMO_PROFILE = {
  profilePicture: "",
  personalDetails: {
    name: "eg : Siva Dheeraj",
    email: "eg : sivadheeraj@example.com",
    phone: "eg : +91 9990292929",
    bio: "eg : Lead Product Designer",
    jobTitle: "eg : Senior UX Engineer",
    company: "eg : Tech Innovators Inc",
    dob: "eg : 1990-05-15",
    interests: ["technology", "art"],
    gstOrTaxId: "eg : 27ABCDE1234F1Z5",
  },
  subscription: {
    plan: "free",
    startDate: "2024-01-01",
    renewalDate: "1/1/2025",
    status: "active",
    credits: { base: 100, extra: 0 },
  },
  usage: {
    aiImages: 0,
    createdJobs: 0,
  },
  usageLimits: {
    aiImages: 0,
    createdJobs: 0,
  },
}

const INTEREST_OPTIONS = [
  { value: "technology", label: "Technology", color: "#1890ff" },
  { value: "sports", label: "Sports", color: "#52c41a" },
  { value: "music", label: "Music", color: "#722ed1" },
  { value: "art", label: "Art", color: "#eb2f96" },
  { value: "other", label: "Other", color: "#fa8c16" },
]

const PLAN_COLORS = {
  free: "from-gray-500 to-gray-600",
  basic: "from-blue-500 to-blue-600",
  pro: "from-purple-500 to-purple-600",
  enterprise: "from-gold-500 to-yellow-600",
}

const STATUS_COLORS = {
  active: "bg-green-500",
  canceled: "bg-red-500",
  past_due: "bg-orange-500",
  unpaid: "bg-red-600",
}

const Profile = () => {
  const [isEditing, setIsEditing] = useState(false)
  const fileInputRef = useRef(null)
  const [profileData, setProfileData] = useState(DEMO_PROFILE)
  const { user } = useSelector((state) => state.auth)
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(loadAuthenticatedUser())
  }, [dispatch])

  const totalCredits = (user?.credits?.base ?? 0) + (user?.credits?.extra ?? 0)

  useEffect(() => {
    if (!user) return

    setProfileData((prev) => ({
      profilePicture: user.avatar || prev.profilePicture,
      personalDetails: {
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        bio: user.bio || "",
        jobTitle: user.jobTitle || "",
        company: user.company || "",
        wordpress: user.wordpressLink || "",
        dob: user.dob || "",
        interests: user.interests || ["other"],
      },
      billingDetails: {
        company: user.billing?.company || "",
        address: {
          line1: user.billing?.address?.line1 || "",
          line2: user.billing?.address?.line2 || "",
          city: user.billing?.address?.city || "",
          state: user.billing?.address?.state || "",
          country: user.billing?.address?.country || "",
          postalCode: user.billing?.address?.postalCode || "",
        },
        gstOrTaxId: user.billing?.gstOrTaxId || "",
      },
      subscription: {
        plan: user.subscription?.plan || "free",
        startDate: user.subscription?.startDate || "",
        renewalDate: user.subscription?.renewalDate || "",
        status: user.subscription?.status || "active",
        credits: {
          base: user.credits?.base ?? 0,
          extra: user.credits?.extra ?? 0,
        },
      },
      usage: {
        aiImages: user.usage?.aiImages ?? 0,
        createdJobs: user.usage?.createdJobs ?? 0,
      },
      usageLimits: {
        aiImages: user.usageLimits?.aiImages ?? 0,
        createdJobs: user.usageLimits?.createdJobs ?? 0,
      },
      emailVerified: user.emailVerified || false,
      notifications: user.notifications || [],
    }))
  }, [user])

  const handleSave = async () => {
    const payload = {
      avatar: profileData.profilePicture,
      name: profileData.personalDetails.name,
      bio: profileData.personalDetails.bio,
      email: profileData.personalDetails.email,
      phone: profileData.personalDetails.phone,
      jobTitle: profileData.personalDetails.jobTitle,
      company: profileData.personalDetails.company,
      dob: profileData.personalDetails.dob,
      wordpressLink: profileData.personalDetails.wordpress,
      interests: profileData.personalDetails.interests,
      billing: {
        company: profileData.billingDetails.company,
        address: profileData.billingDetails.address,
        gstOrTaxId: profileData.billingDetails.gstOrTaxId,
      },
    }

    try {
      dispatch(updateProfile(payload))
        .unwrap()
        .then(() => {
          setIsEditing(false)
          message.success("Profile updated successfully!")
        })
    } catch (err) {
      message.error("Error updating profile, try again")
    }
  }

  // Handlers
  const handleEditToggle = () => setIsEditing(!isEditing)
  // const handleSave = () => setIsEditing(false)
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

    // For phone number field, allow only digits and enforce max length of 15
    if (name === "personalDetails.phone") {
      const numericValue = value.replace(/[^0-9]/g, "") // Remove non-numeric characters
      if (numericValue.length > 15) {
        message.error("Phone number cannot exceed 15 digits.")
        return
      }
      setProfileData((prev) => ({
        ...prev,
        personalDetails: {
          ...prev.personalDetails,
          phone: numericValue,
        },
      }))
    } else if (name.startsWith("personalDetails.")) {
      // Handle personal details fields
      setProfileData((prev) => ({
        ...prev,
        personalDetails: {
          ...prev.personalDetails,
          [name.split(".")[1]]: value,
        },
      }))
    } else if (name.startsWith("billingDetails.")) {
      // Handle billing details fields
      const fieldPath = name.split(".")
      if (fieldPath.length === 3 && fieldPath[1] === "address") {
        // Handle nested address fields
        setProfileData((prev) => ({
          ...prev,
          billingDetails: {
            ...prev.billingDetails,
            address: {
              ...prev.billingDetails.address,
              [fieldPath[2]]: value,
            },
          },
        }))
      } else {
        // Handle direct billing fields
        setProfileData((prev) => ({
          ...prev,
          billingDetails: {
            ...prev.billingDetails,
            [fieldPath[1]]: value,
          },
        }))
      }
    }
  }

  const handleInterestsChange = (selectedInterests) => {
    setProfileData((prev) => ({
      ...prev,
      personalDetails: {
        ...prev.personalDetails,
        interests: selectedInterests,
      },
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
        <Helmet>
          <title>Profile | GenWrite</title>
        </Helmet>
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
                {profileData?.profilePicture ? (
                  <>
                    <img
                      src={profileData.profilePicture}
                      alt="Profile"
                      className="w-40 h-40 rounded-full border-4 border-white/80 object-cover shadow-2xl relative z-10"
                      // onClick={() => isEditing && fileInputRef.current.click()}
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
                ) : (
                  <div
                    className="w-40 h-40 rounded-full border-4 border-white/80 bg-gradient-to-tr from-blue-400 to-purple-700 text-white flex items-center justify-center text-7xl font-bold shadow-2xl relative z-10"
                    onClick={() => isEditing && fileInputRef.current.click()}
                    style={{ cursor: isEditing ? "pointer" : "default" }}
                  >
                    {profileData?.personalDetails?.name
                      ? `${profileData?.personalDetails.name[0]?.toUpperCase()}`
                      : "NA"}
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      className="hidden"
                      accept="image/*"
                      disabled={!isEditing}
                    />
                  </div>
                )}
              </motion.div>

              <motion.div className="space-y-3 text-white" initial={{ x: -20 }} animate={{ x: 0 }}>
                <div className="flex items-center gap-3">
                  <h1 className="text-4xl font-bold">
                    {profileData.personalDetails.name || (
                      <span className="text-gray-300">Full Name</span>
                    )}
                  </h1>
                  {profileData.emailVerified && (
                    <Tooltip title="Email Verified">
                      <ShieldCheckIcon className="w-6 h-6 text-green-400" />
                    </Tooltip>
                  )}
                </div>
                <p className="text-xl font-light opacity-90">
                  {profileData.personalDetails.bio || <span className="text-gray-300">Bio</span>}
                </p>
                <div className="flex flex-wrap gap-3">
                  <motion.div
                    className={`px-4 py-2 bg-gradient-to-r ${
                      PLAN_COLORS[profileData.subscription.plan] || PLAN_COLORS.free
                    } rounded-full capitalize backdrop-blur-sm flex items-center gap-2`}
                    whileHover={{ y: -2, scale: 1.05 }}
                  >
                    <CreditCardIcon className="w-5 h-5" />
                    <span>{profileData.subscription.plan}</span>
                  </motion.div>
                  <motion.div
                    className="px-4 py-2 bg-white/20 rounded-full backdrop-blur-sm flex items-center gap-2"
                    whileHover={{ y: -2, scale: 1.05 }}
                  >
                    <BanknotesIcon className="w-5 h-5" />
                    <span>{totalCredits} Credits</span>
                  </motion.div>
                  <motion.div
                    className={`px-3 py-1 ${
                      STATUS_COLORS[profileData.subscription.status] || STATUS_COLORS.active
                    } rounded-full text-xs font-medium flex items-center gap-1`}
                    whileHover={{ y: -2, scale: 1.05 }}
                  >
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    <span className="capitalize">{profileData.subscription.status}</span>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Main Content */}
          <motion.div className="p-8 space-y-8">
            {/* Edit Controls */}
            <div className="flex justify-end gap-4">
              <AnimatePresence>
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
            <div className="grid grid-cols-1 gap-8">
              {/* Left Column */}
              {/* Personal Details */}
              <motion.div
                variants={cardVariants}
                whileHover="hover"
                className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl border-2 border-slate-200 shadow-lg"
              >
                <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <UserGroupIcon className="w-6 h-6 text-blue-500" />
                  Personal Details
                </h2>
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
                    disabled={true}
                  />
                  <ProfileField
                    label="Bio"
                    name="personalDetails.bio"
                    value={profileData.personalDetails.bio}
                    isEditing={isEditing}
                    onChange={handleInputChange}
                    placeholder="e.g : I'm a travel enthusiast who loves exploring new cultures."
                    type="textarea"
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
                    maxLength={15}
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

                  {/* Interests Section */}
                  <motion.div className="space-y-2" whileHover={{ scale: 1.02 }}>
                    <label className="text-sm font-medium text-slate-600">Interests</label>
                    {isEditing ? (
                      <Select
                        mode="multiple"
                        value={profileData.personalDetails.interests}
                        onChange={handleInterestsChange}
                        className="w-full"
                        placeholder="Select your interests"
                        options={INTEREST_OPTIONS}
                        maxTagCount="responsive"
                      />
                    ) : (
                      <motion.div
                        className="px-4 py-2 bg-white/80 rounded-lg border-2 border-slate-200"
                        whileHover={{ x: 5 }}
                      >
                        <div className="flex flex-wrap gap-2">
                          {profileData.personalDetails.interests?.length > 0 ? (
                            profileData.personalDetails.interests.map((interest) => {
                              const option = INTEREST_OPTIONS.find((opt) => opt.value === interest)
                              return (
                                <Tag key={interest} color={option?.color || "#fa8c16"}>
                                  {option?.label || interest}
                                </Tag>
                              )
                            })
                          ) : (
                            <span className="text-gray-400">No interests selected</span>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </motion.div>

                  {/* Date of Birth */}
                  <motion.div className="space-y-2" whileHover={{ scale: 1.02 }}>
                    <label className="text-sm font-medium text-slate-600">Date of Birth</label>
                    {isEditing ? (
                      <DatePicker
                        format="YYYY-MM-DD"
                        value={
                          profileData.personalDetails.dob
                            ? moment(profileData.personalDetails.dob)
                            : null
                        }
                        onChange={(date, dateString) =>
                          handleInputChange({
                            target: {
                              name: "personalDetails.dob",
                              value: dateString,
                            },
                          })
                        }
                        className="w-full"
                        disabledDate={(current) => current && current > moment().endOf("day")}
                      />
                    ) : (
                      <motion.div
                        className="px-4 py-2 bg-white/80 rounded-lg border-2 border-slate-200"
                        whileHover={{ x: 5 }}
                      >
                        {profileData.personalDetails.dob ? (
                          new Date(profileData.personalDetails.dob).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })
                        ) : (
                          <span className="text-gray-400">{DEMO_PROFILE.personalDetails.dob}</span>
                        )}
                      </motion.div>
                    )}
                  </motion.div>
                </div>
              </motion.div>

              <div className="space-y-6 grid grid-cols-2 gap-8">
                {/* Subscription & Credits */}
                <motion.div
                  variants={cardVariants}
                  whileHover="hover"
                  className="bg-gradient-to-br from-blue-50 to-purple-50 p-8 rounded-2xl border-2 border-indigo-100 shadow-lg relative overflow-hidden"
                >
                  <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-200/20 rounded-full blur-3xl" />
                  <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <CreditCardIcon className="w-6 h-6 text-indigo-500" />
                    Subscription & Credits
                  </h2>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 rounded-lg bg-white/80">
                      <span className="font-medium">Plan Type</span>
                      <Badge
                        count={profileData.subscription.plan.toUpperCase()}
                        style={{
                          backgroundColor:
                            profileData.subscription.plan === "free"
                              ? "#d9d9d9"
                              : profileData.subscription.plan === "basic"
                              ? "#1890ff"
                              : profileData.subscription.plan === "pro"
                              ? "#722ed1"
                              : "#faad14",
                          color: profileData.subscription.plan === "free" ? "#000" : "#fff",
                        }}
                      />
                    </div>
                    {/* <div className="flex justify-between items-center p-4 rounded-lg bg-white/80">
                      <span className="font-medium">Base Credits</span>
                      <span className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-1 rounded-full font-semibold">
                        {profileData.subscription.credits?.base || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-4 rounded-lg bg-white/80">
                      <span className="font-medium">Extra Credits</span>
                      <span className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-1 rounded-full font-semibold">
                        {profileData.subscription.credits?.extra || 0}
                      </span>
                    </div> */}
                    <div className="flex justify-between items-center p-4 rounded-lg bg-white/80">
                      <span className="font-medium">Total Credits</span>
                      <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1 rounded-full font-bold text-lg">
                        {totalCredits}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-4 rounded-lg bg-white/80">
                      <span className="font-medium">Start Date</span>
                      <span className="text-gray-700">
                        {profileData?.subscription?.startDate
                          ? new Date(profileData.subscription.startDate).toLocaleDateString(
                              "en-IN",
                              {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              }
                            )
                          : DEMO_PROFILE.subscription.startDate}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-4 rounded-lg bg-white/80">
                      <span className="font-medium">Renewal Date</span>
                      <span className="text-gray-700">
                        {profileData?.subscription?.renewalDate
                          ? new Date(profileData.subscription.renewalDate).toLocaleDateString(
                              "en-IN",
                              {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              }
                            )
                          : "Not set"}
                      </span>
                    </div>
                  </div>
                </motion.div>

                {/* Notifications */}
                <motion.div
                  variants={cardVariants}
                  whileHover="hover"
                  className="bg-gradient-to-br from-orange-50 to-red-50 p-8 rounded-2xl border-2 border-orange-100 shadow-lg relative overflow-hidden"
                >
                  <div className="absolute -top-20 -right-20 w-40 h-40 bg-orange-200/20 rounded-full blur-3xl" />
                  <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <BellIcon className="w-6 h-6 text-orange-500" />
                    Recent Notifications
                    {profileData.notifications?.length > 0 && (
                      <Badge count={profileData.notifications.length} />
                    )}
                  </h2>
                  <div className="space-y-3 max-h-72 overflow-y-auto">
                    {profileData.notifications?.length > 0 ? (
                      profileData.notifications.slice(0, 5).map((notification, index) => (
                        <motion.div
                          key={index}
                          className="p-3 rounded-lg bg-white/80 border-l-4 border-orange-400"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-sm">{notification.title}</p>
                              <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                            </div>
                            <span className="text-xs text-gray-500">
                              {notification.createdAt
                                ? new Date(notification.createdAt).toLocaleDateString()
                                : "Recent"}
                            </span>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <BellIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No notifications yet</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </>
  )
}

const ProfileField = ({ label, name, value, isEditing, onChange, placeholder, maxLength }) => (
  <motion.div className="space-y-2" whileHover={{ scale: 1.02 }}>
    <label className="text-sm font-medium text-slate-600">{label}</label>
    {isEditing ? (
      <motion.input
        type="tel" // Set input type to 'tel' for phone numbers
        name={name}
        value={value || ""} // Ensure controlled input with fallback
        onChange={onChange}
        placeholder={placeholder}
        className="w-full px-4 py-2 border-2 border-blue-500 rounded-lg focus:ring-2 focus:ring-blue-200 bg-white/80"
        whileFocus={{ scale: 1.02 }}
        maxLength={maxLength} // Use maxLength instead of max
        pattern="[0-9]*" // Restrict to numeric input (optional, for browsers)
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
