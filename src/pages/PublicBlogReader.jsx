import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Helmet } from "react-helmet"
import { useQuery } from "@tanstack/react-query"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { FileText, Share2, Sparkles, TrendingUp, ChevronRight } from "lucide-react"
import { getBlogPublicly } from "@api/blogApi"
import TipTapEditor from "@/layout/TextEditor/TipTapEditor"
import LoadingScreen from "@components/ui/LoadingScreen"
import useBlogStore from "@store/useBlogStore"
import useAuthStore from "@store/useAuthStore"
import "../layout/TextEditor/editor.css"

import { getWordCount, getEstimatedReadTime } from "@/utils/wordUtils"

const PublicBlogReader = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user, token, loading: authLoading, loadAuthenticatedUser } = useAuthStore()
  const { selectedBlog: blog, setSelectedBlog } = useBlogStore()
  const [hasResolvedViewer, setHasResolvedViewer] = useState(!token)

  const {
    data: fetchedBlog,
    isLoading: isBlogFetching,
    isError,
    error,
  } = useQuery({
    queryKey: ["blog", id, "public"],
    queryFn: () => getBlogPublicly(id),
    enabled: !!id,
    retry: false,
  })

  const getAuthor = blogData => {
    if (!blogData) return { name: "GenWrite Author", avatar: null }

    // Priority: author object > user object > createdBy object
    const source = blogData.author || blogData.user || blogData.createdBy || {}

    return {
      name: source.name || source.displayName || blogData.authorName || "GenWrite Author",
      avatar: source.avatar || source.photoURL || source.image || blogData.authorAvatar || null,
      id:
        source._id ||
        source.id ||
        blogData.authorId ||
        blogData.userId ||
        blogData.createdBy?._id ||
        null,
    }
  }

  const authorData = getAuthor(blog)

  useEffect(() => {
    let isMounted = true

    const hydrateViewer = async () => {
      if (!token) {
        if (isMounted) setHasResolvedViewer(true)
        return
      }

      if (user?._id) {
        if (isMounted) setHasResolvedViewer(true)
        return
      }

      try {
        await loadAuthenticatedUser()
      } catch {
        // Public reader can still continue as guest if auth hydration fails.
      } finally {
        if (isMounted) setHasResolvedViewer(true)
      }
    }

    hydrateViewer()

    return () => {
      isMounted = false
    }
  }, [loadAuthenticatedUser, token, user?._id])

  const hasMatchingBlog = blog?._id === id

  useEffect(() => {
    if (fetchedBlog) {
      setSelectedBlog(fetchedBlog)

      const authorId = authorData.id
      if (hasResolvedViewer && user?._id && authorId && user._id === authorId) {
        queryClient.setQueryData(["blog", id], fetchedBlog)
        navigate(`/editor/${id}`, { replace: true })
      }
    }
  }, [fetchedBlog, hasResolvedViewer, id, navigate, queryClient, setSelectedBlog, user?._id])

  useEffect(() => {
    if (isError) {
      const status = error?.response?.status || 404
      const message =
        status === 403
          ? "Access Restricted: This blog is not public."
          : "Blog Not Available: The requested blog doesn't exist or has been deleted."

      toast.error(message)
      navigate("/login", { replace: true })
    }
  }, [isError, error, navigate])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const formatDate = dateString => {
    if (!dateString) return ""
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  if (
    isBlogFetching ||
    (token && !hasResolvedViewer) ||
    !hasMatchingBlog ||
    blog?.status === "pending"
  ) {
    return (
      <div className="fixed inset-0 z-999 flex items-center justify-center bg-white/90 backdrop-blur-sm">
        <LoadingScreen />
      </div>
    )
  }

  const editorContent = blog?.content || ""
  const editorTitle = blog?.title || ""
  const keywords = blog?.keywords || []
  const focusKeywords = blog?.focusKeywords || []

  return (
    <div className="min-h-screen bg-slate-50/30 selection:bg-indigo-100 selection:text-indigo-900">
      <Helmet>
        <title>{editorTitle || "Blog"} | GenWrite</title>
        <meta
          name="description"
          content={blog?.seoMetadata?.description || blog?.summary || ""}
        />
        <meta property="og:title" content={`${editorTitle} | GenWrite`} />
        <meta
          property="og:description"
          content={blog?.seoMetadata?.description || blog?.summary || ""}
        />
        <meta property="og:type" content="article" />
      </Helmet>

      {/* Premium Reader NavBar - Visible only for guest users (who don't have the standard app header) */}
      {!user?._id && (
        <nav className="fixed top-0 w-full z-100 bg-white/70 backdrop-blur-xl border-b border-slate-100 h-16 sm:h-20 flex items-center justify-between px-4 md:px-12 transition-all">
          <div onClick={() => navigate("/")} className="flex items-center gap-2 cursor-pointer group">
            <img src="/Images/genwriteIcon.webp" alt="GenWrite" className="w-8 h-8 object-contain" />
            <span className="font-black text-xl sm:text-2xl tracking-tighter text-slate-900">
              Gen<span className="text-blue-600">Write</span>
            </span>
          </div>

          <div className="flex items-center gap-3 sm:gap-6">
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href)
                toast.success("Link copied to clipboard!")
              }}
              className="p-2.5 hover:bg-slate-100 rounded-md transition-colors group border border-transparent hover:border-slate-200"
              title="Share Link"
            >
              <Share2 className="w-5 h-5 text-slate-500 group-hover:text-blue-600" />
            </button>
            <div className="h-6 w-px bg-slate-200 hidden sm:block" />
            <button
              onClick={() => navigate("/signup")}
              className="px-5 sm:px-7 py-2.5 bg-slate-900 text-white font-bold rounded-md text-sm hover:bg-slate-800 transition-all hover:shadow-xl hover:shadow-slate-200 active:scale-95"
            >
              Get Started
            </button>
          </div>
        </nav>
      )}

      {/* Article & Sidebar Container */}
      <div className={`max-w-7xl mx-auto px-4 pb-20 ${user?._id ? "pt-10" : "pt-32"}`}>
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Main Content Column */}
          <main className="flex-1 min-w-0">
            <article className="max-w-3xl">
              {/* Minimalist Reader Header */}
              <header className="mb-12 space-y-6">
                <div className="space-y-4">
                  <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 leading-[1.05] tracking-tight text-pretty wrap-break-words">
                    {editorTitle}
                  </h1>
                  {blog?.summary && (
                    <p className="text-base sm:text-lg text-slate-500 font-medium leading-relaxed max-w-3xl italic">
                      {blog.summary}
                    </p>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-6 py-8 border-y border-slate-100">
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="w-12 h-12 rounded-full overflow-hidden border border-slate-100 shrink-0 bg-slate-50 shadow-xs ring-2 ring-white">
                      {authorData?.avatar ? (
                        <img
                          src={authorData.avatar}
                          alt={authorData.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400">
                          <FileText size={20} />
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="text-base font-black text-slate-900 tracking-tight leading-none mb-1.5">
                        {authorData?.name}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">
                        Article Author
                      </p>
                    </div>
                  </div>

                  <div className="hidden sm:block h-8 w-px bg-slate-100 mx-2" />

                  <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">
                        Published
                      </span>
                      <span className="text-sm font-bold text-slate-700">
                        {formatDate(blog?.createdAt)}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">
                        Read Time
                      </span>
                      <span className="text-sm font-bold text-slate-700">
                        {getEstimatedReadTime(editorContent)} min
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">
                        Word Count
                      </span>
                      <span className="text-sm font-bold text-slate-700">
                        {getWordCount(editorContent).toLocaleString()} words
                      </span>
                    </div>
                  </div>
                </div>
              </header>

              {/* High-Quality Prose Body */}
              <div className={!user?._id ? "relative mb-30" : ""}>
                <div
                  className={`prose prose-lg sm:prose-xl prose-slate max-w-none prose-headings:font-black prose-headings:tracking-tight prose-a:text-blue-600 prose-img:rounded-md prose-img:shadow-none prose-blockquote:border-l-blue-600 prose-blockquote:bg-blue-50/30 prose-blockquote:py-2 prose-blockquote:px-8 prose-blockquote:rounded-md ${
                    !user?._id ? "select-none pointer-events-none" : ""
                  }`}
                >
                  <TipTapEditor
                    blog={blog}
                    content={editorContent}
                    setContent={() => {}}
                    setUnsavedChanges={() => {}}
                    isPublicMode={true}
                  />
                </div>

                {!user?._id && (
                  <div className="relative">
                    {/* The Blur Transition Area */}

                    <div className="space-y-6 blur-[10px] opacity-20 select-none pointer-events-none pt-4">
                      <div className="h-4 bg-slate-300 rounded-full w-full" />
                      <div className="h-4 bg-slate-300 rounded-full w-[94%]" />
                      <div className="h-4 bg-slate-300 rounded-full w-[98%]" />
                      <div className="h-4 bg-slate-300 rounded-full w-[91%]" />
                      <div className="h-8 bg-slate-400 rounded-lg w-[40%] mt-8 mb-4" />
                      <div className="h-4 bg-slate-300 rounded-full w-full" />
                      <div className="h-4 bg-slate-300 rounded-full w-[96%]" />
                    </div>

                    {/* Centered Sign-Up Card */}
                    <div className="absolute inset-0 z-20 flex items-start justify-center">
                      <div className="bg-white/95 backdrop-blur-3xl border border-slate-200 p-8 md:p-10 rounded-[2.5rem] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.15)] text-center max-w-lg mx-4 group transition-all duration-500 hover:shadow-[0_48px_96px_-12px_rgba(0,0,0,0.2)]">
                        <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">
                          Continue Reading Full Blog
                        </h3>
                        <p className="text-slate-500 mb-10 leading-relaxed text-base">
                          This article preview is limited. Join GenWrite now to unlock the complete
                          article, detailed SEO insights, and high-resolution images.
                        </p>
                        <button
                          onClick={() => navigate("/signup")}
                          className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-black transition-all shadow-xl shadow-slate-200 hover:shadow-2xl active:scale-[0.98] flex items-center justify-center gap-3 group/btn text-lg"
                        >
                          Sign Up to Read Full Blog
                          <ChevronRight className="w-5 h-5 group-hover/btn:translate-x-1.5 transition-transform" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>


              {/* Tags / Keywords Section */}
              {(focusKeywords.length > 0 || keywords.length > 0) && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-px bg-slate-200" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                      Article Context
                    </span>
                    <div className="flex-1 h-px bg-slate-200" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {focusKeywords.map((kw, i) => (
                      <span
                        key={`focus-${i}`}
                        className="px-4 py-2 bg-blue-600 text-white border border-blue-700 text-sm font-black rounded-md shadow-sm cursor-default"
                      >
                        #{kw}
                      </span>
                    ))}
                    {keywords.map((kw, i) => (
                      <span
                        key={`keyword-${i}`}
                        className="px-4 py-2 bg-slate-100 text-slate-600 border border-slate-200 text-sm font-bold rounded-md hover:bg-slate-200 transition-colors cursor-default"
                      >
                        #{kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </article>
          </main>

          {/* Public Technical Insights Sidebar */}
          <aside className="lg:w-96 shrink-0 h-fit lg:sticky lg:top-32 space-y-6">
            <div className="bg-white border border-slate-100 overflow-hidden p-8 space-y-10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-600 shadow-none border border-blue-700 rounded-md">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                    Technical Data
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    Optimized Profile
                  </p>
                </div>
              </div>

              {/* Blog Slug - Google Search Style Preview */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                    Slug
                  </span>
                </div>
                <div className="p-5 bg-slate-50/50 rounded-md border border-slate-100 group transition-all">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-4 h-4 bg-white border border-slate-200 rounded-md flex items-center justify-center p-0.5">
                      <img
                        src="/Images/genwriteIcon.webp"
                        alt=""
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <span className="text-[10px] font-medium text-slate-400 truncate">
                      genwrite.ai › article
                    </span>
                  </div>
                  <p className="text-sm font-bold text-blue-600 break-all leading-relaxed line-clamp-2 hover:underline cursor-pointer">
                    {blog?.slug || "when-a-song-goes-viral-breaking-down-its-hidden-success-story"}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-2 line-clamp-2">
                    Exploring the deep mechanics behind viral song success and distribution
                    strategies...
                  </p>
                </div>
              </div>

              {/* Template & Category - Duo Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-5 bg-linear-to-br from-slate-50 to-white border border-slate-100 rounded-md space-y-2 group transition-all relative overflow-hidden">
                  <FileText className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
                  <img
                    src="/images/genwriteIcon.webp"
                    alt=""
                    className="absolute -right-2 -bottom-2 w-10 h-10 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity"
                  />
                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">
                      Template
                    </span>
                    <p className="text-sm font-black text-slate-900 capitalize tracking-tight">
                      {blog?.template || "Case Study"}
                    </p>
                  </div>
                </div>
                <div className="p-5 bg-linear-to-br from-slate-50 to-white border border-slate-100 rounded-md space-y-2 group transition-all relative overflow-hidden">
                  <Sparkles className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                  <img
                    src="/Images/genwriteIcon.webp"
                    alt=""
                    className="absolute -right-2 -bottom-2 w-10 h-10 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity"
                  />
                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">
                      Category
                    </span>
                    <p className="text-sm font-black text-slate-900 capitalize tracking-tight">
                      {blog?.category || "Music Marketing"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tags Section - Color Gradients */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Metadata Tags
                  </span>
                  <span className="text-[10px] font-bold text-slate-300">
                    {blog?.tags?.length || 10} Tags
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-2 gap-y-3">
                  {(blog?.tags?.length > 0
                    ? blog.tags
                    : [
                        "viral music",
                        "music marketing strategy",
                        "song success factors",
                        "music trend analysis",
                        "artist breakout story",
                        "sonic meme",
                        "conversion gap",
                        "music industry analysis",
                        "hit song case study",
                        "algorithm trap",
                      ]
                  ).map((tag, i) => (
                    <span
                      key={i}
                      className="px-3.5 py-1.5 bg-white text-slate-600 text-[11px] font-bold border border-slate-100 rounded-md hover:border-blue-200 transition-all cursor-default"
                    >
                      #{tag.replace(/\s+/g, "")}
                    </span>
                  ))}
                </div>
              </div>

              {/* Keywords Section - Hero Palette */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded" />
                  <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">
                    Primary focus
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  {(focusKeywords.length > 0 ? focusKeywords : keywords.slice(0, 3)).map((kw, i) => (
                    <div
                      key={i}
                      className="group relative flex items-center gap-3 p-3 bg-blue-600 text-white border border-blue-700 rounded-md shadow-lg shadow-blue-100/50"
                    >
                      <div className="w-1.5 h-1.5 bg-white rounded animate-pulse" />
                      <span className="text-[11px] font-black uppercase tracking-tight">
                        {kw}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Growth Keywords */}
              {keywords.length > 0 && (
                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      Secondary Keywords
                    </span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {keywords.map((kw, i) => (
                      <div
                        key={i}
                        className="group relative flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-md hover:border-blue-200 transition-all duration-300"
                      >
                        <div className="w-1.5 h-1.5 bg-slate-300 group-hover:bg-blue-600 transition-colors rounded" />
                        <span className="text-[11px] font-bold text-slate-600 group-hover:text-blue-900 transition-colors tracking-tight">
                          {kw}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>

        {/* Minimal Copyright Footer */}
        {!user?._id && (
          <div className="mt-20 text-center text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] pb-20">
            &copy; {new Date().getFullYear()} GenWrite Intelligence. All rights reserved.
          </div>
        )}
      </div>
    </div>
  )
}

export default PublicBlogReader
