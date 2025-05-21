import React, { useState, useEffect } from "react";
import MultiDatePicker from "react-multi-date-picker";
import axios from "axios";
import axiosInstance from "@api/index";
const Jobs = () => {
  const [selectedDates, setSelectedDates] = useState([]);
  const [selectedBlog, setSelectedBlog] = useState("");
  const [recentProjects, setRecentProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [scheduledBlogs, setScheduledBlogs] = useState([]); // State for scheduled blogs

  // Fetch recent projects from the API
  useEffect(() => {
    const fetchRecentProjects = async () => {
      try {
        const response = await axiosInstance.get("/blogs");
               const allBlogs = response.data;
               const recentBlogs = allBlogs.slice(-10).reverse();
               setRecentProjects(recentBlogs);
               setIsLoading(false);
      } catch (error) {
        console.error("Error fetching recent projects:", error);
        setIsLoading(false);
      }
    };

    fetchRecentProjects();
  }, []);

  const handleSchedule = () => {
    if (!selectedBlog) {
      alert("Please select a blog.");
      return;
    }
    if (selectedDates.length === 0) {
      alert("Please select at least one date for scheduling.");
      return;
    }

    // Add the scheduled blog to the list
    const newScheduledBlog = {
      id: Date.now(), // Unique ID for the blog
      title: selectedBlog,
      aiModel: "GPT-4", // Example AI model
      content: "This is a sample blog content.", // Example content
      dates: selectedDates,
    };

    setScheduledBlogs([...scheduledBlogs, newScheduledBlog]);
    setSelectedDates([]);
    setSelectedBlog("");
  };

  const handleDelete = (id) => {
    setScheduledBlogs(scheduledBlogs.filter((blog) => blog.id !== id));
  };

  const handleEdit = (id, newDates) => {
    setScheduledBlogs(
      scheduledBlogs.map((blog) =>
        blog.id === id ? { ...blog, dates: newDates } : blog
      )
    );
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-semibold text-gray-800 mb-6">Jobs</h1>

      {/* Loading State */}
      {isLoading ? (
        <p className="text-gray-500">Loading recent projects...</p>
      ) : (
        <>
          {/* Select Blog Section */}
          <div className="bg-white shadow-md rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              Select a Blog from Recent Projects
            </h2>
            <select
              value={selectedBlog}
              onChange={(e) => setSelectedBlog(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a blog</option>
              {recentProjects.map((project) => (
                <option key={project._id} value={project.title}>
                  {project.title}
                </option>
              ))}
            </select>
          </div>

          {/* Schedule Dates Section */}
          <div className="bg-white shadow-md rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              Schedule Blog Posting Dates
            </h2>
            <MultiDatePicker
              value={selectedDates}
              onChange={setSelectedDates}
              minDate={new Date()} // Restrict to today or future dates
              multiple
              className="border border-gray-300 rounded-md p-2 text-sm text-gray-700 bg-white shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="mt-4">
              {selectedDates.length > 0 ? (
                <div className="text-gray-700">
                  <strong>Selected Dates:</strong>
                  <ul className="list-disc list-inside mt-2">
                    {selectedDates.map((date, index) => (
                      <li key={index}>
                        {new Date(date).toLocaleDateString()}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-gray-500">No dates selected.</p>
              )}
            </div>
          </div>

          {/* Schedule Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSchedule}
              className="bg-blue-500 text-white px-6 py-3 rounded-md shadow-md hover:bg-blue-600 transition duration-200"
            >
              Schedule Blog
            </button>
          </div>

          {/* Scheduled Blogs Section */}
          <div className="mt-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Scheduled Blogs
            </h2>
            {scheduledBlogs.length === 0 ? (
              <p className="text-gray-500">No blogs scheduled yet.</p>
            ) : (
              <div className="space-y-4">
                {scheduledBlogs.map((blog) => (
                  <div
                    key={blog.id}
                    className="bg-white shadow-md rounded-lg p-6"
                  >
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                      {blog.title}
                    </h3>
                    <p className="text-gray-600 mb-2">
                      <strong>AI Model:</strong> {blog.aiModel}
                    </p>
                    <p className="text-gray-600 mb-4">
                      <strong>Content:</strong> {blog.content}
                    </p>
                    <p className="text-gray-600 mb-4">
                      <strong>Scheduled Dates:</strong>
                      <ul className="list-disc list-inside mt-2">
                        {blog.dates.map((date, index) => (
                          <li key={index}>
                            {new Date(date).toLocaleDateString()}
                          </li>
                        ))}
                      </ul>
                    </p>
                    <div className="flex justify-end space-x-4">
                      <button
                        onClick={() =>
                          handleEdit(
                            blog.id,
                            prompt(
                              "Enter new dates (comma-separated):",
                              blog.dates.join(", ")
                            )
                              .split(",")
                              .map((d) => new Date(d.trim()))
                          )
                        }
                        className="bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600 transition duration-200"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(blog.id)}
                        className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition duration-200"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Jobs;