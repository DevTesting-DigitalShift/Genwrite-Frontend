import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  Search,
  TrendingUp,
  Eye,
  MousePointer,
  BarChart3,
  ExternalLink,
  RefreshCw,
  LogIn,
  Download,
  ChevronDown,
  ChevronUp,
  TrendingDown,
  X,
} from "lucide-react";
import { Helmet } from "react-helmet";
import { motion } from "framer-motion";
import { useSelector } from "react-redux";
import { message, Button, Table, Tag, Select, Input, Tooltip, DatePicker, Switch } from "antd";
import { useNavigate, useSearchParams } from "react-router-dom";
import Loading from "@components/Loading";
import { utils, writeFile } from "sheetjs-style";
import { selectUser } from "@store/slices/authSlice";
import UpgradeModal from "@components/UpgradeModal";
import moment from "moment";
import { FcGoogle } from "react-icons/fc";
import Fuse from "fuse.js";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const { Option } = Select;
const { Search: AntSearch } = Input;
const { RangePicker } = DatePicker;

// Country code to name mapping
const countryCodeToName = {
  USA: "United States",
  IND: "India",
  GBR: "United Kingdom",
  CAN: "Canada",
  AUS: "Australia",
  DEU: "Germany",
  FRA: "France",
  JPN: "Japan",
  CHN: "China",
  BRA: "Brazil",
  "N/A": "Unknown",
};

const SearchConsole = () => {
  const [searchTerm, setSearchTerm] = useState(() => sessionStorage.getItem("gscSearchTerm") || "");
  const [currentPage, setCurrentPage] = useState(
    () => Number(sessionStorage.getItem("gscCurrentPage")) || 1
  );
  const [itemsPerPage, setItemsPerPage] = useState(
    () => Number(sessionStorage.getItem("gscItemsPerPage")) || 10
  );
  const [dateRange, setDateRange] = useState(() => sessionStorage.getItem("gscDateRange") || "30d");
  const [customDateRange, setCustomDateRange] = useState([
    sessionStorage.getItem("gscCustomDateRangeStart")
      ? moment(sessionStorage.getItem("gscCustomDateRangeStart"))
      : null,
    sessionStorage.getItem("gscCustomDateRangeEnd")
      ? moment(sessionStorage.getItem("gscCustomDateRangeEnd"))
      : null,
  ]);
  const [selectedBlogTitle, setSelectedBlogTitle] = useState(
    () => sessionStorage.getItem("gscSelectedBlogTitle") || "all"
  );
  const [selectedCountries, setSelectedCountries] = useState(() =>
    JSON.parse(sessionStorage.getItem("gscSelectedCountries") || "[]")
  );
  const [includeCountry, setIncludeCountry] = useState(
    () => sessionStorage.getItem("gscIncludeCountry") === "true"
  );
  const [isConnecting, setIsConnecting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(!!useSelector(selectUser)?.gsc);
  const [searchParams, setSearchParams] = useSearchParams();
  const [expandedRows, setExpandedRows] = useState([]);
  const [connectErr, setConnectErr] = useState(null);

  const queryClient = useQueryClient();
  const user = useSelector(selectUser);
  const userPlan = (user?.plan || user?.subscription?.plan || "free").toLowerCase();
  const navigate = useNavigate();

  // Persist filter states to sessionStorage
  useEffect(() => {
    sessionStorage.setItem("gscSearchTerm", searchTerm);
    sessionStorage.setItem("gscCurrentPage", currentPage);
    sessionStorage.setItem("gscItemsPerPage", itemsPerPage);
    sessionStorage.setItem("gscDateRange", dateRange);
    sessionStorage.setItem(
      "gscCustomDateRangeStart",
      customDateRange[0] ? customDateRange[0].toISOString() : ""
    );
    sessionStorage.setItem(
      "gscCustomDateRangeEnd",
      customDateRange[1] ? customDateRange[1].toISOString() : ""
    );
    sessionStorage.setItem("gscSelectedBlogTitle", selectedBlogTitle);
    sessionStorage.setItem("gscSelectedCountries", JSON.stringify(selectedCountries));
    sessionStorage.setItem("gscIncludeCountry", includeCountry.toString());
  }, [
    searchTerm,
    currentPage,
    itemsPerPage,
    dateRange,
    customDateRange,
    selectedBlogTitle,
    selectedCountries,
    includeCountry,
  ]);

  // Utility to check for invalid_grant error
  const isInvalidGrantError = (err) => {
    if (!err) return false;
    if (typeof err === "string") return err.toLowerCase().includes("invalid_grant");
    if (err.message) return err.message.toLowerCase().includes("invalid_grant");
    if (err.error) return err.error.toLowerCase().includes("invalid_grant");
    if (err.response?.data?.error)
      return err.response.data.error.toLowerCase().includes("invalid_grant");
    return false;
  };

  // Fetch blogs using TanStack Query
  const { data: blogs = { data: [] } } = useQuery({
    queryKey: ["blogs"],
    queryFn: async () => {
      const response = await fetchAllBlogs(); // Assuming fetchAllBlogs is available globally or imported
      return response.data || [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    cacheTime: 15 * 60 * 1000, // 15 minutes
    onError: (error) => {
      console.error("Failed to fetch blogs:", error);
      message.error("Failed to load blogs. Please try again.");
    },
  });

  // Calculate date range for API request
  const getDateRangeParams = useCallback(() => {
    let from, to;
    if (customDateRange[0] && customDateRange[1]) {
      from = customDateRange[0].startOf("day").toISOString().split("T")[0];
      to = customDateRange[1].endOf("day").toISOString().split("T")[0];
    } else {
      to = new Date();
      from = new Date();
      switch (dateRange) {
        case "7d":
          from.setDate(to.getDate() - 7);
          break;
        case "30d":
          from.setDate(to.getDate() - 30);
          break;
        case "180d":
          from.setDate(to.getDate() - 180);
          break;
        default:
          from.setDate(to.getDate() - 30);
      }
      from = from.toISOString().split("T")[0];
      to = to.toISOString().split("T")[0];
    }
    return { from, to };
  }, [dateRange, customDateRange]);

  // Get blogUrl from blogTitle
  const getBlogUrlFromTitle = useCallback(
    (title) => {
      if (title === "all") return null;
      const blog = blogs.data?.find((b) => b.title === title);
      return blog?.url || null;
    },
    [blogs.data]
  );

  // Fetch analytics data using TanStack Query
  const { data: blogData = [], isLoading } = useQuery({
    queryKey: [
      "gscAnalytics",
      dateRange,
      customDateRange[0]?.toISOString() ?? null,
      customDateRange[1]?.toISOString() ?? null,
      selectedBlogTitle,
      includeCountry,
    ],
    queryFn: async () => {
      if (!user?.gsc) {
        setIsAuthenticated(false);
        return [];
      }
      const { from, to } = getDateRangeParams();
      const blogUrl = getBlogUrlFromTitle(selectedBlogTitle);
      const params = {
        from,
        to,
        includeCountry,
        ...(blogUrl && { blogUrl }),
      };
      const data = await fetchGscAnalytics(params).unwrap(); // Assuming fetchGscAnalytics is available globally or imported
      return data.map((item, index) => ({
        id: `${item.link}-${index}`,
        url: item.link,
        clicks: item.clicks,
        impressions: item.impressions,
        ctr: (item.ctr * 100).toFixed(2),
        position: item.position.toFixed(1),
        keywords: [item.key].map((k) => (k.length > 50 ? `${k.substring(0, 47)}...` : k)),
        countryCode: item.countryCode || "N/A",
        countryName: countryCodeToName[item.countryCode] || item.countryName || "Unknown",
        blogId: item.blogId,
        blogTitle: item.blogTitle || "Untitled",
      }));
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    cacheTime: 15 * 60 * 1000, // 15 minutes
    enabled: !!user?.gsc, // Only fetch if authenticated
    onError: (error) => {
      console.error("Error fetching analytics data:", JSON.stringify(error, null, 2));
      setConnectErr(error);
      if (isInvalidGrantError(error)) {
        setIsAuthenticated(false);
      }
      message.error("Failed to load analytics data. Please try again.");
    },
    onSuccess: () => {
      setConnectErr(null);
      setIsAuthenticated(true);
    },
  });

  // Google Search Console authentication using TanStack Query mutation
  const connectGscMutation = useMutation({
    mutationFn: async () => {
      let authUrl = await fetchGscAuthUrl().unwrap(); // Assuming fetchGscAuthUrl is available globally or imported
      if (!authUrl.includes("prompt=select_account")) {
        const url = new URL(authUrl);
        const params = new URLSearchParams(url.search);
        params.set("prompt", "select_account");
        url.search = params.toString();
        authUrl = url.toString();
      }
      return authUrl;
    },
    onMutate: () => {
      setIsConnecting(true);
    },
    onSuccess: (authUrl) => {
      const popup = window.open(authUrl, "GSC Connect", "width=600,height=600");
      if (!popup) {
        throw new Error("Popup blocked. Please allow popups and try again.");
      }

      const handleMessage = async (event) => {
        if (event.origin !== import.meta.env.VITE_BACKEND_URL) return;
        if (typeof event.data === "string" && event.data === "GSC Connected") {
          try {
            setIsAuthenticated(true);
            message.success("Google Search Console connected successfully!");
            queryClient.invalidateQueries(["gscAnalytics"]);
            navigate(0);
          } catch (err) {
            message.error(err.message || err.error || "Failed to verify GSC connection");
            console.error("GSC verification error:", JSON.stringify(err, null, 2));
            setConnectErr(err);
          } finally {
            setIsConnecting(false);
            window.removeEventListener("message", handleMessage);
          }
        } else if (typeof event.data === "string") {
          message.error(event.data || "Authentication failed");
          setConnectErr(event.data || "Authentication failed");
          setIsConnecting(false);
          window.removeEventListener("message", handleMessage);
        }
      };

      window.addEventListener("message", handleMessage);

      const checkPopupClosed = setInterval(() => {
        if (popup.closed && !isAuthenticated) {
          clearInterval(checkPopupClosed);
          setIsConnecting(false);
          setConnectErr("Authentication window closed");
          window.removeEventListener("message", handleMessage);
        }
      }, 1000);

      return () => {
        window.removeEventListener("message", handleMessage);
        clearInterval(checkPopupClosed);
      };
    },
    onError: (error) => {
      message.error(error.message || error.error || "Failed to initiate GSC connection");
      console.error("GSC auth error:", JSON.stringify(error, null, 2));
      setConnectErr(error);
      setIsConnecting(false);
    },
  });

  // Clear search params
  useEffect(() => {
    if (searchParams.get("code") || searchParams.get("state")) {
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Group blog data by blogTitle and calculate totals/averages
  const groupedBlogData = useMemo(() => {
    const grouped = blogData.reduce((acc, item) => {
      const title = item.blogTitle || "Untitled";
      if (!acc[title]) {
        acc[title] = {
          blogTitle: title,
          url: item.url,
          keywords: [],
          clicks: 0,
          impressions: 0,
          ctr: [],
          position: [],
          countryCode: item.countryCode,
          countryName: item.countryName,
          blogId: item.blogId,
          keywordDetails: [],
        };
      }
      acc[title].keywords.push(...item.keywords);
      acc[title].clicks += Number(item.clicks) || 0;
      acc[title].impressions += Number(item.impressions) || 0;
      acc[title].ctr.push(Number(item.ctr) || 0);
      acc[title].position.push(Number(item.position) || 0);
      acc[title].keywordDetails.push({
        id: item.id,
        keyword: item.keywords[0],
        clicks: item.clicks,
        impressions: item.impressions,
        ctr: item.ctr,
        position: item.position,
        url: item.url,
        countryCode: item.countryCode,
        countryName: item.countryName,
      });
      return acc;
    }, {});

    return Object.values(grouped).map((group, index) => ({
      id: `${group.blogTitle}-${index}`,
      blogTitle: group.blogTitle,
      url: group.url,
      keywords: [...new Set(group.keywords)],
      clicks: group.clicks,
      impressions: group.impressions,
      ctr: group.ctr.length
        ? (group.ctr.reduce((sum, val) => sum + val, 0) / group.ctr.length).toFixed(2)
        : 0,
      position: group.position.length
        ? (group.position.reduce((sum, val) => sum + val, 0) / group.position.length).toFixed(1)
        : 0,
      countryCode: group.countryCode,
      countryName: group.countryName,
      blogId: group.blogId,
      keywordDetails: group.keywordDetails,
    }));
  }, [blogData]);

  // Client-side filtered and searched data
  const filteredBlogData = useMemo(() => {
    let result =
      selectedBlogTitle === "all"
        ? groupedBlogData
        : blogData.filter((item) => item.blogTitle === selectedBlogTitle);

    if (searchTerm?.trim()) {
      const fuse = new Fuse(result, {
        keys: [
          { name: selectedBlogTitle === "all" ? "blogTitle" : "keywords", weight: 0.4 },
          { name: "url", weight: 0.4 },
          { name: selectedBlogTitle === "all" ? "keywords" : "blogTitle", weight: 0.2 },
        ],
        threshold: 0.3,
        includeScore: true,
        shouldSort: true,
      });
      result = fuse.search(searchTerm).map(({ item }) => item);
    }

    if (includeCountry && selectedCountries.length > 0) {
      result = result.filter((item) => selectedCountries.includes(item.countryCode));
    }

    return result;
  }, [groupedBlogData, blogData, searchTerm, selectedCountries, includeCountry, selectedBlogTitle]);

  // Get current page for the data for export
  const currentPageData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredBlogData.slice(startIndex, endIndex);
  }, [filteredBlogData, currentPage, itemsPerPage]);

  // Handle search trigger (client-side only)
  const handleSearch = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  // Reset all filters
  const resetAllFilters = useCallback(() => {
    setSearchTerm("");
    setSelectedBlogTitle("all");
    setSelectedCountries([]);
    setIncludeCountry(false);
    setCustomDateRange([null, null]);
    setDateRange("30d");
    setCurrentPage(1);
    setExpandedRows([]);
    sessionStorage.removeItem("gscSearchTerm");
    sessionStorage.removeItem("gscCurrentPage");
    sessionStorage.removeItem("gscItemsPerPage");
    sessionStorage.removeItem("gscDateRange");
    sessionStorage.removeItem("gscCustomDateRangeStart");
    sessionStorage.removeItem("gscCustomDateRangeEnd");
    sessionStorage.removeItem("gscSelectedBlogTitle");
    sessionStorage.removeItem("gscSelectedCountries");
    sessionStorage.removeItem("gscIncludeCountry");
    queryClient.invalidateQueries(["gscAnalytics"]);
  }, [queryClient]);

  // Check if filters are active
  const isDefaultDateRange = dateRange === "30d" && !customDateRange[0];
  const hasActiveFilters =
    !!searchTerm ||
    selectedBlogTitle !== "all" ||
    selectedCountries.length > 0 ||
    !isDefaultDateRange;

  // Export data as Excel
  const handleExport = useCallback(async () => {
    if (!currentPageData.length) {
      message.warning("No data available to export");
      return;
    }
    try {
      const headers =
        selectedBlogTitle === "all"
          ? [
              "Blog Title",
              "Keywords",
              "Total Clicks",
              "Total Impressions",
              "Avg CTR (%)",
              "Avg Position",
              "URL",
              ...(includeCountry ? ["Country"] : []),
            ]
          : [
              "Keyword",
              "Clicks",
              "Impressions",
              "CTR (%)",
              "Position",
              "URL",
              ...(includeCountry ? ["Country"] : []),
            ];
      const rows = currentPageData.map((item) =>
        selectedBlogTitle === "all"
          ? {
              "Blog Title": item.blogTitle,
              Keywords: item.keywords.join(", "),
              "Total Clicks": item.clicks,
              "Total Impressions": item.impressions,
              "Avg CTR (%)": item.ctr,
              "Avg Position": item.position,
              URL: item.url,
              ...(includeCountry ? { Country: item.countryName } : {}),
            }
          : {
              Keyword: item.keywords[0],
              Clicks: item.clicks,
              Impressions: item.impressions,
              "CTR (%)": item.ctr,
              Position: item.position,
              URL: item.url,
              ...(includeCountry ? { Country: item.countryName } : {}),
            }
      );
      const worksheet = utils.json_to_sheet(rows, { header: headers });
      const workbook = utils.book_new();
      utils.book_append_sheet(workbook, worksheet, "Search Console Data");
      const fileName = `search_console_data_${new Date().toISOString().split("T")[0]}.xlsx`;
      writeFile(workbook, fileName);
    } catch (err) {
      message.error(err.message || err.error || "Failed to export data");
      console.error("Error exporting data:", err);
    }
  }, [currentPageData, includeCountry, selectedBlogTitle]);

  // Calculate totals for summary cards
  const totals = useMemo(() => {
    const totalClicks = filteredBlogData.reduce((sum, item) => sum + Number(item.clicks || 0), 0);
    const totalImpressions = filteredBlogData.reduce(
      (sum, item) => sum + Number(item.impressions || 0),
      0
    );
    const avgCtr =
      filteredBlogData.length > 0
        ? filteredBlogData.reduce((sum, item) => sum + Number(item.ctr || 0), 0) /
          filteredBlogData.length
        : 0;
    const avgPosition =
      filteredBlogData.length > 0
        ? filteredBlogData.reduce((sum, item) => sum + Number(item.position || 0), 0) /
          filteredBlogData.length
        : 0;

    return {
      clicks: totalClicks,
      impressions: totalImpressions,
      avgCtr,
      avgPosition,
    };
  }, [filteredBlogData]);

  // Get unique countries for filter
  const countries = useMemo(() => {
    const countryMap = new Map();
    blogData.forEach((item) => {
      if (item.countryCode && item.countryName) {
        countryMap.set(item.countryCode, item.countryName);
      }
    });
    return Array.from(countryMap.entries()).map(([code, name]) => ({
      value: code,
      text: name,
    }));
  }, [blogData]);

  // Get unique blog titles for selection
  const blogTitles = useMemo(() => {
    const seen = new Set();
    const uniqueTitles = [];
    for (const item of blogData) {
      const title = item.blogTitle || "Untitled";
      if (!seen.has(title)) {
        seen.add(title);
        uniqueTitles.push(title);
      }
    }
    return ["all", ...uniqueTitles];
  }, [blogData]);

  // Toggle expanded rows
  const toggleRow = (id) => {
    setExpandedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
    );
  };

  // Columns for the nested keyword table (in expandable rows)
  const keywordColumns = [
    {
      title: "Keyword",
      dataIndex: "keyword",
      key: "keyword",
      render: (keyword) => (
        <Tooltip title={keyword}>
          <Tag color="blue" className="text-sm cursor-pointer">
            {keyword}
          </Tag>
        </Tooltip>
      ),
    },
    {
      title: "Clicks",
      dataIndex: "clicks",
      key: "clicks",
      sorter: (a, b) => a.clicks - b.clicks,
      render: (clicks) => (
        <div className="font-semibold text-gray-900">{new Intl.NumberFormat().format(clicks)}</div>
      ),
      align: "center",
    },
    {
      title: "Impressions",
      dataIndex: "impressions",
      key: "impressions",
      sorter: (a, b) => a.impressions - b.impressions,
      render: (impressions) => (
        <div className="font-semibold text-gray-900">
          {new Intl.NumberFormat().format(impressions)}
        </div>
      ),
      align: "center",
    },
    {
      title: "CTR",
      dataIndex: "ctr",
      key: "ctr",
      sorter: (a, b) => a.ctr - b.ctr,
      render: (ctr) => (
        <div
          className={`font-semibold ${
            ctr >= 8 ? "text-green-600" : ctr >= 5 ? "text-yellow-600" : "text-red-600"
          }`}
        >
          {ctr}%
        </div>
      ),
      align: "center",
    },
    {
      title: "Position",
      dataIndex: "position",
      key: "position",
      sorter: (a, b) => a.position - b.position,
      render: (position) => (
        <div
          className={`font-semibold ${
            position <= 3 ? "text-green-600" : position <= 10 ? "text-yellow-600" : "text-red-600"
          }`}
        >
          {position}
        </div>
      ),
      align: "center",
    },
    ...(includeCountry
      ? [
          {
            title: "Country",
            dataIndex: "countryName",
            key: "countryName",
            render: (countryName) => countryName || "-",
            sorter: (a, b) => a.countryName.localeCompare(b.countryName),
            filters: countries,
            filterMultiple: true,
            onFilter: (value, record) => record.countryCode === value,
          },
        ]
      : []),
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <div className="flex items-center justify-center gap-2">
          <Tooltip title={record.url}>
            <Button
              type="text"
              icon={<ExternalLink className="w-4 h-4" />}
              onClick={() => window.open(record.url, "_blank")}
              disabled={!record.url}
              title="View Blog"
            />
          </Tooltip>
        </div>
      ),
      align: "center",
    },
  ];

  // Ant Design Table Columns for main table
  const columns =
    selectedBlogTitle === "all"
      ? [
          {
            title: "Blog Title",
            dataIndex: "blogTitle",
            key: "blogTitle",
            render: (blogTitle, record) => (
              <div
                className="font-medium text-blue-600 cursor-pointer hover:underline"
                onClick={() => toggleRow(record.id)}
              >
                {blogTitle}
              </div>
            ),
            sorter: (a, b) => a.blogTitle.localeCompare(b.blogTitle),
          },
          {
            title: "Keywords",
            dataIndex: "keywords",
            key: "keywords",
            render: (keywords, record) => (
              <div className="flex flex-wrap gap-1 max-w-xs">
                {keywords.length > 0 ? (
                  <Tag color="blue" className="text-sm">
                    +{keywords.length} keywords
                  </Tag>
                ) : (
                  <Tag color="default" className="text-sm">
                    No keywords
                  </Tag>
                )}
              </div>
            ),
          },
          {
            title: "Total Clicks",
            dataIndex: "clicks",
            key: "clicks",
            sorter: (a, b) => a.clicks - b.clicks,
            render: (clicks) => (
              <div className="font-semibold text-gray-900">
                {new Intl.NumberFormat().format(clicks)}
              </div>
            ),
            align: "center",
          },
          {
            title: "Total Impressions",
            dataIndex: "impressions",
            key: "impressions",
            sorter: (a, b) => a.impressions - b.impressions,
            render: (impressions) => (
              <div className="font-semibold text-gray-900">
                {new Intl.NumberFormat().format(impressions)}
              </div>
            ),
            align: "center",
          },
          {
            title: "Avg CTR",
            dataIndex: "ctr",
            key: "ctr",
            sorter: (a, b) => a.ctr - b.ctr,
            render: (ctr) => (
              <div
                className={`font-semibold ${
                  ctr >= 8 ? "text-green-600" : ctr >= 5 ? "text-yellow-600" : "text-red-600"
                }`}
              >
                {ctr}%
              </div>
            ),
            align: "center",
          },
          {
            title: "Avg Position",
            dataIndex: "position",
            key: "position",
            sorter: (a, b) => a.position - b.position,
            render: (position) => (
              <div
                className={`font-semibold ${
                  position <= 3
                    ? "text-green-600"
                    : position <= 10
                    ? "text-yellow-600"
                    : "text-red-600"
                }`}
              >
                {position}
              </div>
            ),
            align: "center",
          },
          ...(includeCountry
            ? [
                {
                  title: "Country",
                  dataIndex: "countryName",
                  key: "countryName",
                  render: (countryName) => countryName || "-",
                  sorter: (a, b) => a.countryName.localeCompare(b.countryName),
                  filters: countries,
                  filterMultiple: true,
                  onFilter: (value, record) => record.countryCode === value,
                },
              ]
            : []),
          {
            title: "Actions",
            key: "actions",
            render: (_, record) => (
              <div className="flex items-center justify-center gap-2">
                <Tooltip title="Toggle Keywords">
                  <Button
                    type="text"
                    icon={
                      expandedRows.includes(record.id) ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )
                    }
                    onClick={() => toggleRow(record.id)}
                    title={expandedRows.includes(record.id) ? "Hide Keywords" : "Show Keywords"}
                  />
                </Tooltip>
                <Tooltip title={record.url}>
                  <Button
                    type="text"
                    icon={<ExternalLink className="w-4 h-4" />}
                    onClick={() => window.open(record.url, "_blank")}
                    disabled={!record.url}
                    title="View Blog"
                  />
                </Tooltip>
              </div>
            ),
            align: "center",
          },
        ]
      : [
          {
            title: "Keyword",
            dataIndex: "keywords",
            key: "keywords",
            render: (keywords) => (
              <Tooltip title={keywords[0]}>
                <Tag color="blue" className="text-sm cursor-pointer">
                  {keywords[0]}
                </Tag>
              </Tooltip>
            ),
          },
          {
            title: "Clicks",
            dataIndex: "clicks",
            key: "clicks",
            sorter: (a, b) => a.clicks - b.clicks,
            render: (clicks) => (
              <div className="font-semibold text-gray-900">
                {new Intl.NumberFormat().format(clicks)}
              </div>
            ),
            align: "center",
          },
          {
            title: "Impressions",
            dataIndex: "impressions",
            key: "impressions",
            sorter: (a, b) => a.impressions - b.impressions,
            render: (impressions) => (
              <div className="font-semibold text-gray-900">
                {new Intl.NumberFormat().format(impressions)}
              </div>
            ),
            align: "center",
          },
          {
            title: "CTR",
            dataIndex: "ctr",
            key: "ctr",
            sorter: (a, b) => a.ctr - b.ctr,
            render: (ctr) => (
              <div
                className={`font-semibold ${
                  ctr >= 8 ? "text-green-600" : ctr >= 5 ? "text-yellow-600" : "text-red-600"
                }`}
              >
                {ctr}%
              </div>
            ),
            align: "center",
          },
          {
            title: "Position",
            dataIndex: "position",
            key: "position",
            sorter: (a, b) => a.position - b.position,
            render: (position) => (
              <div
                className={`font-semibold ${
                  position <= 3
                    ? "text-green-600"
                    : position <= 10
                    ? "text-yellow-600"
                    : "text-red-600"
                }`}
              >
                {position}
              </div>
            ),
            align: "center",
          },
          ...(includeCountry
            ? [
                {
                  title: "Country",
                  dataIndex: "countryName",
                  key: "countryName",
                  render: (countryName) => countryName || "-",
                  sorter: (a, b) => a.countryName.localeCompare(b.countryName),
                  filters: countries,
                  filterMultiple: true,
                  onFilter: (value, record) => record.countryCode === value,
                },
              ]
            : []),
          {
            title: "Actions",
            key: "actions",
            render: (_, record) => (
              <div className="flex items-center justify-center gap-2">
                <Tooltip title={record.url}>
                  <Button
                    type="text"
                    icon={<ExternalLink className="w-4 h-4" />}
                    onClick={() => window.open(record.url, "_blank")}
                    disabled={!record.url}
                    title="View Blog"
                  />
                </Tooltip>
              </div>
            ),
            align: "center",
          },
        ];

  // Format number helper
  const formatNumber = (num) => new Intl.NumberFormat().format(num);

  // Render UpgradeModal if user is on free or basic plan
  // if (userPlan === "free" || userPlan === "basic") {
  //   return <UpgradeModal featureName={"Google Search Console"} />;
  // }

  // Show reconnection UI only if not authenticated or invalid_grant error
  if (!isAuthenticated || isInvalidGrantError(connectErr)) {
    return (
      <div
        className="p-6 flex items-center justify-center"
        style={{ minHeight: "calc(100vh - 250px)" }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 max-w-md w-full text-center"
        >
          <div className="mb-6">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto">
              <FcGoogle size={40} />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {isInvalidGrantError(connectErr)
              ? "Reconnect Google Search Console"
              : "Connect Google Search Console"}
          </h2>
          <p className="text-gray-600 text-sm mb-6">
            {isInvalidGrantError(connectErr)
              ? "Your Google Search Console connection has expired or is invalid. Please reconnect to continue monitoring your blog performance."
              : "Connect your Google Search Console account to monitor your blog performance, track search analytics, and optimize your content for better visibility."}
          </p>
          {connectErr && (
            <div className="bg-red-100 text-red-800 p-3 rounded-lg text-sm mb-4">
              {isInvalidGrantError(connectErr)
                ? "Invalid grant: Your authentication token is no longer valid."
                : typeof connectErr === "string"
                ? connectErr
                : connectErr.message || connectErr.error || "An error occurred"}
            </div>
          )}
          <button
            onClick={() => connectGscMutation.mutate()}
            disabled={isConnecting}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed w-full"
          >
            {isConnecting ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                {isInvalidGrantError(connectErr) ? "Reconnect GSC" : "Connect GSC"}
              </>
            )}
          </button>
        </motion.div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-300px)] bg-white border rounded-lg">
        <Loading />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-transparent p-5">
      <Helmet>
        <title>Blog Performance | GenWrite</title>
      </Helmet>
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-5">
          <div>
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
            >
              Blog Performance
            </motion.h1>
            <p className="text-gray-600">Monitor your blog performance and search analytics</p>
          </div>
          <div className="flex items-center gap-3">
            {userPlan && (
              <Button
                icon={<Download className="w-4 h-4" />}
                onClick={handleExport}
                disabled={isLoading}
                className="flex items-center gap-2 bg-green-600 text-white hover:bg-green-700"
              >
                Export
              </Button>
            )}
            <Button
              icon={<RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />}
              onClick={() => queryClient.invalidateQueries(["gscAnalytics"])}
              disabled={isLoading}
              className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700"
            >
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <MousePointer className="w-6 h-6 text-blue-600" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{formatNumber(totals.clicks)}</h3>
            <p className="text-gray-600 text-sm">
              {selectedBlogTitle === "all" ? "Total Clicks" : "Clicks"}
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Eye className="w-6 h-6 text-purple-600" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{formatNumber(totals.impressions)}</h3>
            <p className="text-gray-600 text-sm">
              {selectedBlogTitle === "all" ? "Total Impressions" : "Impressions"}
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-green-600" />
              </div>
              <TrendingDown className="w-5 h-5 text-red-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{totals.avgCtr.toFixed(2)}%</h3>
            <p className="text-gray-600 text-sm">Average CTR</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{totals.avgPosition.toFixed(1)}</h3>
            <p className="text-gray-600 text-sm">Average Position</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            <div className="flex-1 flex items-center gap-2">
              <AntSearch
                placeholder="Search by URL, keywords, or title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onSearch={handleSearch}
                enterButton={<Search className="w-5 h-5 text-white" />}
                suffix={
                  searchTerm && (
                    <span
                      onClick={() => handleSearch("")}
                      className="cursor-pointer text-gray-400 text-xs transition"
                    >
                      <X className="w-4 h-4" />
                    </span>
                  )
                }
                className={`w-full ${searchTerm ? "border-orange-400 shadow-orange-100" : ""}`}
              />
            </div>
            <div className="flex-1">
              <Select
                value={selectedBlogTitle}
                onChange={(value) => {
                  setSelectedBlogTitle(value);
                  setCurrentPage(1);
                  setExpandedRows([]);
                  queryClient.invalidateQueries(["gscAnalytics"]);
                }}
                className="w-full"
                placeholder="Select Blog"
              >
                {blogTitles.map((title) => (
                  <Option key={title} value={title}>
                    {title === "all" ? "All Blogs" : title}
                  </Option>
                ))}
              </Select>
            </div>
            <div className="w-1/6">
              <Select
                value={customDateRange[0] ? "custom" : dateRange}
                onChange={(value) => {
                  setDateRange(value);
                  setCustomDateRange([null, null]);
                  setCurrentPage(1);
                  setExpandedRows([]);
                  queryClient.invalidateQueries(["gscAnalytics"]);
                }}
                className="w-full"
              >
                <Option value="7d">Last 7 Days</Option>
                <Option value="30d">Last 30 Days</Option>
                <Option value="180d">Last 6 Months</Option>
                <Option value="custom">Custom Range</Option>
              </Select>
            </div>
            {dateRange === "custom" && (
              <div className="flex-1">
                <RangePicker
                  value={customDateRange}
                  onChange={(dates) => {
                    setCustomDateRange(dates);
                    setCurrentPage(1);
                    setExpandedRows([]);
                    queryClient.invalidateQueries(["gscAnalytics"]);
                  }}
                  disabledDate={(current) => current && current > moment().endOf("day")}
                  className="w-full"
                  placeholder={["Start Date", "End Date"]}
                />
              </div>
            )}
            <div className="flex-2 flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Include Country</label>
              <Switch
                checked={includeCountry}
                onChange={(checked) => {
                  setIncludeCountry(checked);
                  if (!checked) setSelectedCountries([]);
                  setCurrentPage(1);
                  setExpandedRows([]);
                  queryClient.invalidateQueries(["gscAnalytics"]);
                }}
                className={`w-fit ${includeCountry ? "bg-blue-600" : "bg-gray-200"}`}
              />
            </div>
            <div className="flex-2">
              <Button
                icon={<RefreshCw className="w-4 h-4" />}
                onClick={resetAllFilters}
                className={`w-full flex items-center gap-2 ${
                  hasActiveFilters ? "border-red-400 bg-red-50 text-red-600" : ""
                }`}
              >
                Reset
              </Button>
            </div>
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={filteredBlogData}
          rowKey="id"
          pagination={{
            current: currentPage,
            pageSize: itemsPerPage,
            total: filteredBlogData.length,
            onChange: (page, pageSize) => {
              setCurrentPage(page);
              setItemsPerPage(pageSize);
            },
            pageSizeOptions: [10, 20, 50, 100],
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} results`,
          }}
          expandable={
            selectedBlogTitle === "all"
              ? {
                  expandedRowKeys: expandedRows,
                  onExpand: (expanded, record) => toggleRow(record.id),
                  expandedRowRender: (record) => (
                    <Table
                      columns={keywordColumns}
                      dataSource={record.keywordDetails}
                      rowKey="id"
                      pagination={false}
                      className="bg-gray-50 rounded-lg"
                    />
                  ),
                }
              : undefined
          }
          onChange={(pagination, filters) => {
            setSelectedCountries(filters.countryName || []);
            setCurrentPage(pagination.current);
            setItemsPerPage(pagination.pageSize);
          }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
          locale={{
            emptyText: connectErr
              ? `Error: ${connectErr.message || connectErr.error || "An error occurred"}. Please try refreshing or reconnecting GSC.`
              : "No data available. Try adjusting your filters or refreshing the data.",
          }}
        />
      </div>

      <style jsx>{`
        .ant-select-highlighted-green .ant-select-selector {
          border-color: #10b981 !important;
          box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.1) !important;
        }
        .ant-select-highlighted-purple .ant-select-selector {
          border-color: #8b5cf6 !important;
          box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.1) !important;
        }
        .ant-select-highlighted-indigo .ant-select-selector {
          border-color: #6366f1 !important;
          box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1) !important;
        }
        .ant-table-thead > tr > th {
          background: #f8fafc;
          font-weight: 600;
          color: #1f2937;
        }
        .ant-table-row {
          transition: background 0.2s;
        }
        .ant-table-row:hover {
          background: #f1f5f9;
        }
        .ant-tag {
          transition: all 0.2s;
        }
        .ant-tag:hover {
          transform: scale(1.05);
        }
      `}</style>
    </div>
  );
};

export default SearchConsole;