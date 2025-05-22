import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import MultiDatePicker from "react-multi-date-picker";
import MultiStepModal from "../components/mutipstepmodal/DaisyUi";
import {
  deleteScheduledJob,
  editScheduledJob,
  fetchRecentProjects,
} from "../store/slices/blogSlice";

const Jobs = () => {
  const dispatch = useDispatch();
  const scheduledJobs = useSelector((state) => state.blog.scheduledJobs);
  const recentProjects = useSelector((state) => state.blog.recentProjects);
  const [showCreateJob, setShowCreateJob] = useState(false);
  const [selectedDates, setSelectedDates] = useState([]);
  const [selectedBlog, setSelectedBlog] = useState("");
  const [scheduledBlogs, setScheduledBlogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      setIsLoading(true);
      try {
        await dispatch(fetchRecentProjects()).unwrap();
      } catch (error) {
        console.error("Error fetching recent projects:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, [dispatch]);

  const handleScheduleBlog = () => {
    if (!selectedBlog) {
      alert("Please select a blog.");
      return;
    }
    if (selectedDates.length === 0) {
      alert("Please select at least one date for scheduling.");
      return;
    }

    const newScheduledBlog = {
      id: Date.now(),
      title: selectedBlog,
      aiModel: "GPT-4", // Default AI model
      dates: selectedDates,
    };

    setScheduledBlogs([...scheduledBlogs, newScheduledBlog]);
    setSelectedBlog("");
    setSelectedDates([]);
  };

  const handleDeleteScheduledBlog = (id) => {
    setScheduledBlogs(scheduledBlogs.filter((blog) => blog.id !== id));
  };

  const handleEditScheduledBlog = (id) => {
    const blogToEdit = scheduledBlogs.find((blog) => blog.id === id);
    const newTitle = prompt("Edit Blog Title:", blogToEdit.title);
    const newAiModel = prompt("Edit AI Model:", blogToEdit.aiModel);
    const newDates = prompt(
      "Edit Scheduled Dates (comma-separated):",
      blogToEdit.dates
        .map((date) => new Date(date).toLocaleDateString())
        .join(", ")
    )
      .split(",")
      .map((date) => new Date(date.trim()));

    if (newTitle && newAiModel && newDates.length > 0) {
      setScheduledBlogs(
        scheduledBlogs.map((blog) =>
          blog.id === id
            ? { ...blog, title: newTitle, aiModel: newAiModel, dates: newDates }
            : blog
        )
      );
    }
  };

  const handleCreateJob = (jobData) => {
    const newJob = {
      id: Date.now(),
      ...jobData,
    };

    dispatch(editScheduledJob(newJob));
    setShowCreateJob(false);
  };

  const handleDeleteJob = (id) => {
    dispatch(deleteScheduledJob(id));
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-semibold text-gray-800 mb-6">Jobs</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Side: Create Job Section */}
        <div>
          <button
            onClick={() => setShowCreateJob(!showCreateJob)}
            className="w-full bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
          >
            {showCreateJob ? "Close Job Creator" : "Create Job"}
          </button>
          {showCreateJob && (
            <div className="mt-4 bg-white shadow-md rounded-lg p-6">
              <MultiStepModal
                closefnc={() => setShowCreateJob(false)}
                onSubmit={handleCreateJob}
              />
            </div>
          )}
        </div>

        {/* Right Side: Select Blog Section */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            Select a Blog
          </h2>
          {isLoading ? (
            <p className="text-gray-500">Loading recent projects...</p>
          ) : (
            <>
              <select
                value={selectedBlog}
                onChange={(e) => setSelectedBlog(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a blog</option>
                {recentProjects.map((project) => (
                  <option key={project._id} value={project.title}>
                    {project.title}
                  </option>
                ))}
              </select>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Dates
                </label>
                <MultiDatePicker
                  value={selectedDates}
                  onChange={setSelectedDates}
                  minDate={new Date()}
                  multiple
                  className="border border-gray-300 rounded-md p-2 text-sm text-gray-700 bg-white shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <button
                onClick={handleScheduleBlog}
                className="w-full mt-4 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
              >
                Schedule Blog
              </button>
            </>
          )}
        </div>
      </div>

      {/* Scheduled Jobs Section */}
      <div className="mt-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          Scheduled Jobs
        </h2>
        {scheduledJobs.length === 0 ? (
          <p className="text-gray-500">No jobs scheduled yet.</p>
        ) : (
          <div className="space-y-4 grid grid-cols-3 gap-4">
            {scheduledJobs.map((job) => (
              <div key={job.id} className="bg-white shadow-md rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  Job ID: {job.id}
                </h3>
                <p className="text-gray-600 mb-2">
                  <strong>Topics:</strong> {job.topics.join(", ")}
                </p>
                <p className="text-gray-600 mb-4">
                  <strong>Dates:</strong>{" "}
                  {job.dates
                    .map((date) => new Date(date).toLocaleDateString())
                    .join(", ")}
                </p>
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() =>
                      handleEditJob(job.id, {
                        topics: prompt(
                          "Edit topics (comma-separated):",
                          job.topics.join(", ")
                        )
                          .split(",")
                          .map((topic) => topic.trim()),
                      })
                    }
                    className="bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteJob(job.id)}
                    className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Scheduled Blogs Section */}
      <div className="mt-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          Scheduled Blogs
        </h2>
        {scheduledBlogs.length === 0 ? (
          <p className="text-gray-500">No blogs scheduled yet.</p>
        ) : (
          <div className="space-y-4 grid grid-cols-3 gap-4">
            {scheduledBlogs.map((blog) => (
              <div key={blog.id} className="bg-white shadow-md rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  {blog.title}
                </h3>
                <p className="text-gray-600 mb-2">
                  <strong>AI Model:</strong> {blog.aiModel}
                </p>
                <p className="text-gray-600 mb-4">
                  <strong>Scheduled Dates:</strong>{" "}
                  {blog.dates
                    .map((date) => new Date(date).toLocaleDateString())
                    .join(", ")}
                </p>
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => handleEditScheduledBlog(blog.id)}
                    className="bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteScheduledBlog(blog.id)}
                    className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Jobs;