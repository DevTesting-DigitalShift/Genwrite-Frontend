import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import SkeletonLoader from "./SkeletonLoader";
import {
  Badge,
  Button,
  Input,
  Popconfirm,
  Tooltip,
  Popover,
  Pagination,
  DatePicker,
  message,
  Tag,
} from "antd";
import {
  ArrowDownUp,
  Calendar,
  Filter,
  Plus,
  RefreshCcw,
  RotateCcw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import { useConfirmPopup } from "@/context/ConfirmPopupContext";
import {
  CheckCircleOutlined,
  SortAscendingOutlined,
  HourglassOutlined,
  CloseCircleOutlined,
  SortDescendingOutlined,
  FieldTimeOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { Helmet } from "react-helmet";
import { useDispatch } from "react-redux";
import { archiveBlog, fetchAllBlogs, retryBlog } from "@store/slices/blogSlice";
import moment from "moment";

const { RangePicker } = DatePicker;

const MyProjects = () => {
  const [filteredBlogs, setFilteredBlogs] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [loading, setLoading] = useState(false);
  const [sortType, setSortType] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState([null, null]);
  const [presetDateRange, setPresetDateRange] = useState([null, null]);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [isFunnelMenuOpen, setFunnelMenuOpen] = useState(false);
  const [isCustomDatePickerOpen, setIsCustomDatePickerOpen] = useState(false);
  const [activePresetLabel, setActivePresetLabel] = useState(""); // Track active preset label
  const navigate = useNavigate();
  const { handlePopup } = useConfirmPopup();
  const dispatch = useDispatch();
  const TRUNCATE_LENGTH = 120;
  const [totalBlogs, setTotalBlogs] = useState(0);

  // Scroll to top on page change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentPage]);

  // Toggle sort menu
  const toggleMenu = () => {
    setMenuOpen((prev) => {
      if (!prev) setFunnelMenuOpen(false);
      return !prev;
    });
  };

  // Toggle filter menu
  const toggleFunnelMenu = () => {
    setFunnelMenuOpen((prev) => {
      if (!prev) setMenuOpen(false);
      return !prev;
    });
  };

  // Toggle custom date picker menu
  const toggleCustomDateRangeMenu = () => {
    setIsCustomDatePickerOpen((prev) => {
      if (!prev) setMenuOpen(false);
      return !prev;
    });
  };

  // Reset filters
  const resetFilters = () => {
    setSortType("createdAt");
    setSortOrder("desc");
    setStatusFilter("all");
    setDateRange([null, null]);
    setPresetDateRange([null, null]);
    setActivePresetLabel("");
    setSearchTerm("");
    setDebouncedSearch("");
    setCurrentPage(1);
  };

  // Clear individual filters
  const clearSort = () => {
    setSortType("createdAt");
    setSortOrder("desc");
    setCurrentPage(1);
  };

  const clearStatusFilter = () => {
    setStatusFilter("all");
    setCurrentPage(1);
  };

  const clearDateFilter = () => {
    setDateRange([null, null]);
    setPresetDateRange([null, null]);
    setActivePresetLabel("");
    setCurrentPage(1);
  };

  const clearSearch = () => {
    setSearchTerm("");
    setDebouncedSearch("");
    setCurrentPage(1);
  };

  // Check if filters are active
  const isDefaultSort = sortType === "createdAt" && sortOrder === "desc";
  const hasActiveFilters = 
    !isDefaultSort || 
    statusFilter !== "all" || 
    dateRange[0] || 
    presetDateRange[0] || 
    debouncedSearch;

  // Get current sort label
  const getCurrentSortLabel = () => {
    if (sortType === "title" && sortOrder === "asc") return "A-Z";
    if (sortType === "title" && sortOrder === "desc") return "Z-A";
    if (sortType === "createdAt" && sortOrder === "desc") return "Newest First";
    if (sortType === "createdAt" && sortOrder === "asc") return "Oldest First";
    return "Default";
  };

  // Get current status label
  const getCurrentStatusLabel = () => {
    switch (statusFilter) {
      case "complete": return "Completed";
      case "pending": return "Pending";
      case "failed": return "Failed";
      default: return "All";
    }
  };

  // Get current date label
  const getCurrentDateLabel = () => {
    if (activePresetLabel) return activePresetLabel;
    if (dateRange[0] && dateRange[1]) {
      return `${moment(dateRange[0]).format("MMM DD")} - ${moment(dateRange[1]).format("MMM DD")}`;
    }
    return null;
  };

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Fetch blogs with filters
  const fetchBlogs = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = {
        sort: sortType && sortOrder ? `${sortType}:${sortOrder}` : undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        q: debouncedSearch || undefined,
        start:
          dateRange[0]
            ? moment(dateRange[0]).toISOString()
            : presetDateRange[0]
            ? moment(presetDateRange[0]).toISOString()
            : undefined,
        end:
          dateRange[1]
            ? moment(dateRange[1]).toISOString()
            : presetDateRange[1]
            ? moment(presetDateRange[1]).toISOString()
            : undefined,
        page: currentPage,
        limit: itemsPerPage,
        isArchived: "",
      };
      const response = await dispatch(fetchAllBlogs(queryParams)).unwrap();
      setFilteredBlogs(response.data || []);
      setTotalBlogs(response.totalItems || 0);
    } catch (error) {
      console.error("Failed to fetch blogs:", {
        error: error.message,
        status: error.status,
        response: error.response,
      });
      message.error("Failed to load blogs. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [
    dispatch,
    sortType,
    sortOrder,
    statusFilter,
    debouncedSearch,
    dateRange,
    presetDateRange,
    currentPage,
    itemsPerPage,
  ]);

  // Fetch blogs when filters or page change
  useEffect(() => {
    fetchBlogs();
  }, [fetchBlogs]);

  // Responsive items per page
  useEffect(() => {
    const updateItemsPerPage = () => {
      if (window.innerWidth >= 1024) {
        setItemsPerPage(15);
      } else if (window.innerWidth >= 768) {
        setItemsPerPage(12);
      } else {
        setItemsPerPage(6);
      }
      setCurrentPage(1);
    };

    updateItemsPerPage();
    window.addEventListener("resize", updateItemsPerPage);
    return () => window.removeEventListener("resize", updateItemsPerPage);
  }, []);

  // Handle blog click
  const handleBlogClick = (blog) => {
    navigate(`/toolbox/${blog._id}`);
  };

  const handleManualBlogClick = (blog) => {
    navigate(`/blog-editor/${blog._id}`);
  };

  // Handle retry
  const handleRetry = async (id) => {
    try {
      await dispatch(retryBlog({ id })).unwrap();
      await fetchBlogs();
    } catch (error) {
      console.error("Failed to retry blog:", error);
      message.error("Failed to retry blog. Please try again.");
    }
  };

  // Handle archive
  const handleArchive = async (id) => {
    try {
      await dispatch(archiveBlog(id)).unwrap();
      await fetchBlogs();
    } catch (error) {
      console.error("Failed to archive blog:", error);
      message.error("Failed to archive blog. Please try again.");
    }
  };

  // Truncate content
  const truncateContent = (content, length = TRUNCATE_LENGTH) => {
    if (!content) return "";
    return content.length > length ? content.substring(0, length) + "..." : content;
  };

  // Strip markdown
  const stripMarkdown = (text) => {
    return text
      ?.replace(/<[^>]*>/g, "")
      ?.replace(/[\\*#=_~`>\-]+/g, "")
      ?.replace(/\s{2,}/g, " ")
      ?.trim();
  };

  // Menu options for sorting
  const menuOptions = [
    {
      label: "A-Z (Ascending)",
      icon: <SortAscendingOutlined />,
      onClick: () => {
        setSortType("title");
        setSortOrder("asc");
        setMenuOpen(false);
        setCurrentPage(1);
      },
    },
    {
      label: "Z-A (Descending)",
      icon: <SortDescendingOutlined />,
      onClick: () => {
        setSortType("title");
        setSortOrder("desc");
        setMenuOpen(false);
        setCurrentPage(1);
      },
    },
    {
      label: "Created Date (Newest)",
      icon: <FieldTimeOutlined />,
      onClick: () => {
        setSortType("createdAt");
        setSortOrder("desc");
        setMenuOpen(false);
        setCurrentPage(1);
      },
    },
    {
      label: "Created Date (Oldest)",
      icon: <ClockCircleOutlined />,
      onClick: () => {
        setSortType("createdAt");
        setSortOrder("asc");
        setMenuOpen(false);
        setCurrentPage(1);
      },
    },
  ];

  // Filter options
  const funnelMenuOptions = [
    {
      label: "All Statuses",
      icon: <CheckCircleOutlined />,
      onClick: () => {
        setStatusFilter("all");
        setFunnelMenuOpen(false);
        setCurrentPage(1);
      },
    },
    {
      label: "Status: Completed",
      icon: <CheckCircleOutlined />,
      onClick: () => {
        setStatusFilter("complete");
        setFunnelMenuOpen(false);
        setCurrentPage(1);
      },
    },
    {
      label: "Status: Pending",
      icon: <HourglassOutlined />,
      onClick: () => {
        setStatusFilter("pending");
        setFunnelMenuOpen(false);
        setCurrentPage(1);
      },
    },
    {
      label: "Status: Failed",
      icon: <CloseCircleOutlined />,
      onClick: () => {
        setStatusFilter("failed");
        setFunnelMenuOpen(false);
        setCurrentPage(1);
      },
    },
  ];

  // Date range presets
  const datePresets = [
    {
      label: "Last 7 Days",
      value: [moment().subtract(7, "days"), moment()],
      onClick: () => {
        setPresetDateRange([moment().subtract(7, "days"), moment()]);
        setDateRange([null, null]);
        setActivePresetLabel("Last 7 Days");
        setCurrentPage(1);
        setIsCustomDatePickerOpen(false);
      },
    },
    {
      label: "Last 30 Days",
      value: [moment().subtract(30, "days"), moment()],
      onClick: () => {
        setPresetDateRange([moment().subtract(30, "days"), moment()]);
        setDateRange([null, null]);
        setActivePresetLabel("Last 30 Days");
        setCurrentPage(1);
        setIsCustomDatePickerOpen(false);
      },
    },
    {
      label: "Last 3 Months",
      value: [moment().subtract(3, "months"), moment()],
      onClick: () => {
        setPresetDateRange([moment().subtract(3, "months"), moment()]);
        setDateRange([null, null]);
        setActivePresetLabel("Last 3 Months");
        setCurrentPage(1);
        setIsCustomDatePickerOpen(false);
      },
    },
    {
      label: "Last 6 Months",
      value: [moment().subtract(6, "months"), moment()],
      onClick: () => {
        setPresetDateRange([moment().subtract(6, "months"), moment()]);
        setDateRange([null, null]);
        setActivePresetLabel("Last 6 Months");
        setCurrentPage(1);
        setIsCustomDatePickerOpen(false);
      },
    },
    {
      label: "This Year",
      value: [moment().startOf("year"), moment()],
      onClick: () => {
        setPresetDateRange([moment().startOf("year"), moment()]);
        setDateRange([null, null]);
        setActivePresetLabel("This Year");
        setCurrentPage(1);
        setIsCustomDatePickerOpen(false);
      },
    },
  ];

  return (
    <div className="p-5">
      <Helmet>
        <title>Blogs | GenWrite</title>
      </Helmet>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex-1">
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
          >
            Blogs Generated
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="text-gray-500 text-sm mt-2 max-w-md"
          >
            All your content creation tools in one place. Streamline your workflow with our powerful
            suite of tools.
          </motion.p>
        </div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Link
            to="/blog-editor"
            className="flex items-center gap-2 px-4 py-2 bg-[#1B6FC9] hover:bg-[#1B6FC9]/90 text-white rounded-lg transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            New Blog
          </Link>
        </motion.div>
      </div>

      {/* Active Filters Display */}
      {/* {hasActiveFilters && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-blue-800 mr-2">Active Filters:</span>
            
            {!isDefaultSort && (
              <Tag
                closable
                onClose={clearSort}
                className="bg-blue-100 border-blue-300 text-blue-800 font-medium"
              >
                Sort: {getCurrentSortLabel()}
              </Tag>
            )}
            
            {statusFilter !== "all" && (
              <Tag
                closable
                onClose={clearStatusFilter}
                className="bg-green-100 border-green-300 text-green-800 font-medium"
              >
                Status: {getCurrentStatusLabel()}
              </Tag>
            )}
            
            {getCurrentDateLabel() && (
              <Tag
                closable
                onClose={clearDateFilter}
                className="bg-purple-100 border-purple-300 text-purple-800 font-medium"
              >
                Date: {getCurrentDateLabel()}
              </Tag>
            )}
            
            {debouncedSearch && (
              <Tag
                closable
                onClose={clearSearch}
                className="bg-orange-100 border-orange-300 text-orange-800 font-medium"
              >
                Search: "{debouncedSearch}"
              </Tag>
            )}
            
            <Button
              type="link"
              size="small"
              onClick={resetFilters}
              className="text-blue-600 hover:text-blue-800 p-0 h-auto font-medium"
            >
              Clear All
            </Button>
          </div>
        </motion.div>
      )} */}

      {/* Filter and Sort Bar */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-lg mb-6">
        <div className="flex-1">
          <Input
            placeholder="Search blogs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            prefix={<Search className="w-4 h-4 text-gray-500" />}
            className={`rounded-lg border-gray-300 shadow-sm ${
              debouncedSearch ? 'border-orange-400 shadow-orange-100' : ''
            }`}
            aria-label="Search blogs"
          />
        </div>
        <div className="flex gap-2">
          <Popover
            open={isMenuOpen}
            onOpenChange={(visible) => setMenuOpen(visible)}
            trigger="click"
            placement="bottomRight"
            content={
              <div className="min-w-[200px] rounded-lg space-y-1">
                {menuOptions.map(({ label, icon, onClick }) => (
                  <Tooltip title={label} placement="left" key={label}>
                    <button
                      onClick={onClick}
                      className="w-full flex items-center gap-3 px-4 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                      aria-label={`Sort by ${label}`}
                    >
                      <span className="text-lg">{icon}</span>
                      <span>{label}</span>
                    </button>
                  </Tooltip>
                ))}
              </div>
            }
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                type="default"
                icon={<ArrowDownUp className="w-4 h-4" />}
                onClick={toggleMenu}
                className={`p-2 rounded-lg border-gray-300 shadow-sm hover:bg-gray-100 ${
                  !isDefaultSort ? 'border-blue-400 bg-blue-50 text-blue-600' : ''
                }`}
                aria-label="Open sort menu"
              >
                Sort
              </Button>
            </motion.div>
          </Popover>

          <Popover
            open={isFunnelMenuOpen}
            onOpenChange={(visible) => setFunnelMenuOpen(visible)}
            trigger="click"
            placement="bottomRight"
            content={
              <div className="min-w-[200px] rounded-lg space-y-1">
                {funnelMenuOptions.map(({ label, icon, onClick }) => (
                  <Tooltip title={label} placement="left" key={label}>
                    <button
                      onClick={onClick}
                      className="w-full flex items-center gap-3 px-4 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                      aria-label={`Filter by ${label}`}
                    >
                      <span className="text-lg">{icon}</span>
                      <span>{label}</span>
                    </button>
                  </Tooltip>
                ))}
              </div>
            }
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                type="default"
                icon={<Filter className="w-4 h-4" />}
                onClick={toggleFunnelMenu}
                className={`p-2 rounded-lg border-gray-300 shadow-sm hover:bg-gray-100 ${
                  statusFilter !== 'all' ? 'border-green-400 bg-green-50 text-green-600' : ''
                }`}
                aria-label="Open filter menu"
              >
                Filter
              </Button>
            </motion.div>
          </Popover>

          <Popover
            open={isCustomDatePickerOpen}
            onOpenChange={(visible) => setIsCustomDatePickerOpen(visible)}
            trigger="click"
            placement="bottomRight"
            content={
              <div>
                {datePresets.map(({ label, onClick }) => (
                  <Tooltip title={label} placement="left" key={label}>
                    <button
                      onClick={onClick}
                      className="w-full flex items-center gap-3 px-4 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                      aria-label={`Filter by ${label}`}
                    >
                      <span className="text-lg">
                        <FieldTimeOutlined />
                      </span>
                      <span>{label}</span>
                    </button>
                  </Tooltip>
                ))}
              </div>
            }
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                type="default"
                icon={<Calendar className="w-4 h-4" />}
                onClick={toggleCustomDateRangeMenu}
                className={`p-2 rounded-lg border-gray-300 shadow-sm hover:bg-gray-100 ${
                  (dateRange[0] || presetDateRange[0]) ? 'border-purple-400 bg-purple-50 text-purple-600' : ''
                }`}
                aria-label="Open date preset menu"
              >
                Custom Date
              </Button>
            </motion.div>
          </Popover>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              type="default"
              icon={<RefreshCcw className="w-4 h-4" />}
              onClick={fetchBlogs}
              className="p-2 rounded-lg border-gray-300 shadow-sm hover:bg-gray-100"
              aria-label="Refresh blogs"
            >
              Refresh
            </Button>
          </motion.div>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              type="default"
              icon={<RotateCcw className="w-4 h-4" />}
              onClick={resetFilters}
              className={`p-2 rounded-lg border-gray-300 shadow-sm hover:bg-gray-100 ${
                hasActiveFilters ? 'border-red-400 bg-red-50 text-red-600' : ''
              }`}
              aria-label="Reset filters"
            >
              Reset
            </Button>
          </motion.div>
        </div>
        <div className="flex-1">
          <RangePicker
            value={dateRange}
            onChange={(dates) => {
              setDateRange(dates);
              setPresetDateRange([null, null]);
              setActivePresetLabel("");
              setCurrentPage(1);
            }}
            className={`w-full rounded-lg border-gray-300 shadow-sm ${
              (dateRange[0] || presetDateRange[0]) ? 'border-purple-400 shadow-purple-100' : ''
            }`}
            format="YYYY-MM-DD"
            placeholder={["Start date", "End date"]}
            aria-label="Select date range"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(itemsPerPage)].map((_, index) => (
            <div key={index} className="bg-white shadow-md rounded-xl p-4">
              <SkeletonLoader />
            </div>
          ))}
        </div>
      ) : filteredBlogs.length === 0 ? (
        <div
          className="flex flex-col justify-center items-center"
          style={{ minHeight: "calc(100vh - 270px)" }}
        >
          <img src="Images/no-blog.png" alt="No blogs" style={{ width: "8rem" }} />
          <p className="text-xl mt-5">No blogs available.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 place-items-center p-2">
            {filteredBlogs.map((blog) => {
              const isManualEditor = blog.isManuallyEdited === true;
              const {
                _id,
                title,
                status,
                createdAt,
                content,
                aiModel,
                focusKeywords,
                updatedAt,
                wordpress,
                agendaJob,
              } = blog;
              const isGemini = /gemini/gi.test(aiModel);
              return (
                <Badge.Ribbon
                  key={_id}
                  text={
                    <span className="flex items-center justify-center gap-1 py-1 font-medium tracking-wide">
                      {isManualEditor ? (
                        <>
                          Manually Generated
                        </>
                      ) : (
                        <>
                          <img
                            src={`./Images/${
                              isGemini ? "gemini" : aiModel === "claude" ? "claude" : "chatgpt"
                            }.png`}
                            alt={isGemini ? "Gemini" : aiModel === "claude" ? "Claude" : "ChatGPT"}
                            width={20}
                            height={20}
                            loading="lazy"
                            className="bg-white"
                          />
                          {isGemini
                            ? "Gemini-1.5-flash"
                            : aiModel === "claude"
                            ? "Claude-3-Haiku"
                            : "ChatGPT-4o-mini"}
                        </>
                      )}
                    </span>
                  }
                  className="absolute top-0"
                  color={
                    isManualEditor
                      ? "#9CA3AF"
                      : isGemini
                      ? "#4796E3"
                      : aiModel === "claude"
                      ? "#9368F8"
                      : "#74AA9C"
                  }
                >
                  <div
                    className={`bg-white shadow-md hover:shadow-xl transition-all duration-300 rounded-xl p-4 min-h-[180px] min-w-[390px] relative ${
                      isManualEditor
                        ? "border-gray-500"
                        : status === "failed"
                        ? "border-red-500"
                        : status === "pending" || status === "in-progress"
                        ? "border-yellow-500"
                        : "border-green-500"
                    } border-2`}
                    title={title}
                  >
                    <div className="text-xs font-semibold text-gray-400 mb-2 -mt-2">
                      {new Date(createdAt).toLocaleDateString("en-US", { dateStyle: "medium" })}
                    </div>

                    {isManualEditor ? (
                      <div
                        className="cursor-pointer"
                        onClick={() => handleManualBlogClick(blog)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === "Enter" && navigate(`/blog-editor`)}
                        aria-label={`View blog ${title}`}
                      >
                        <div className="flex flex-col gap-4 items-center justify-between mb-2">
                          <h3 className="text-lg capitalize font-semibold text-gray-900 !text-left max-w-76">
                            {title}
                          </h3>
                          <p className="text-sm text-gray-600 mb-4 line-clamp-3 break-all">
                            {truncateContent(stripMarkdown(content)) || ""}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <Tooltip
                        title={
                          status === "complete"
                            ? title
                            : status === "failed"
                            ? "Blog generation failed"
                            : status === "pending"
                            ? `Pending Blog will be generated ${
                                agendaJob?.nextRunAt
                                  ? "at " +
                                    new Date(agendaJob.nextRunAt).toLocaleString("en-IN", {
                                      dateStyle: "medium",
                                      timeStyle: "short",
                                    })
                                  : "shortly"
                              }`
                            : `Blog generation is ${status}`
                        }
                        color={
                          status === "complete" ? "green" : status === "failed" ? "red" : "#eab308"
                        }
                      >
                        <div
                          className="cursor-pointer"
                          onClick={() => {
                            if (status === "complete" || status === "failed") {
                              handleBlogClick(blog);
                            }
                          }}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) =>
                            e.key === "Enter" &&
                            (status === "complete" || status === "failed") &&
                            handleBlogClick(blog)
                          }
                          aria-label={`View blog ${title}`}
                        >
                          <div className="flex flex-col gap-4 items-center justify-between mb-2">
                            <h3 className="text-lg capitalize font-semibold text-gray-900 !text-left max-w-76">
                              {title}
                            </h3>
                            <p className="text-sm text-gray-600 mb-4 line-clamp-3 break-all">
                              {truncateContent(stripMarkdown(content)) || ""}
                            </p>
                          </div>
                        </div>
                      </Tooltip>
                    )}

                    <div className="flex items-center justify-end gap-2">
                      <div className="flex flex-wrap gap-2">
                        {focusKeywords?.map((keyword, index) => (
                          <span
                            key={index}
                            className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                      {status === "failed" && (
                        <Popconfirm
                          title="Retry Blog Generation"
                          description="Are you sure you want to retry generating this blog?"
                          icon={
                            <RotateCcw style={{ color: "red" }} size={15} className="mt-1 mr-1" />
                          }
                          okText="Yes"
                          cancelText="No"
                          onConfirm={() => handleRetry(_id)}
                        >
                          <Button
                            type="text"
                            className="p-2 hover:!border-blue-500 hover:text-blue-500"
                            aria-label="Retry blog generation"
                          >
                            <RotateCcw />
                          </Button>
                        </Popconfirm>
                      )}
                      <Button
                        type="text"
                        className="p-2 hover:!border-red-500 hover:text-red-500"
                        onClick={() =>
                          handlePopup({
                            title: "Move to Trash",
                            description: (
                              <span className="my-2">
                                Blog <b>{title}</b> will be moved to trash. You can restore it
                                later.
                              </span>
                            ),
                            confirmText: "Delete",
                            onConfirm: () => {
                              handleArchive(_id);
                            },
                            confirmProps: {
                              type: "text",
                              className: "border-red-500 hover:bg-red-500 hover:text-white",
                            },
                            cancelProps: {
                              danger: false,
                            },
                          })
                        }
                        aria-label={`Move blog ${title} to trash`}
                      >
                        <Trash2 />
                      </Button>
                    </div>

                    <div className="mt-3 -mb-2 flex justify-end text-xs text-right text-gray-500 font-medium">
                      {wordpress?.postedOn && (
                        <span className="">
                          Posted on:{" "}
                          {new Date(wordpress.postedOn).toLocaleDateString("en-US", {
                            dateStyle: "medium",
                          })}
                        </span>
                      )}
                      <span className="ml-auto">
                        Last updated:{" "}
                        {new Date(updatedAt).toLocaleDateString("en-US", {
                          dateStyle: "medium",
                        })}
                      </span>
                    </div>
                  </div>
                </Badge.Ribbon>
              );
            })}
          </div>
          {totalBlogs > 15 && (
            <div className="flex justify-center mt-8">
              <Pagination
                current={currentPage}
                total={totalBlogs}
                pageSize={itemsPerPage}
                onChange={(page, pageSize) => {
                  setCurrentPage(page);
                  if (pageSize !== itemsPerPage) {
                    setItemsPerPage(pageSize);
                    setCurrentPage(1);
                  }
                }}
                showTotal={(total) => `Total ${total} blogs`}
                responsive={true}
                showSizeChanger={false}
                pageSizeOptions={["6", "12", "15"]}
                disabled={loading}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MyProjects;