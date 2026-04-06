import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Helmet } from "react-helmet"
import { useQuery } from "@tanstack/react-query"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { FileText, Share2, Sparkles, TrendingUp } from "lucide-react"
import { getBlogPublicly } from "@api/blogApi"
import TipTapEditor from "@/layout/TextEditor/TipTapEditor"
import LoadingScreen from "@components/ui/LoadingScreen"
import useBlogStore from "@store/useBlogStore"
import useAuthStore from "@store/useAuthStore"
import "../layout/TextEditor/editor.css"

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

  const getAuthorId = blogData => {
    if (!blogData) return null

    return (
      blogData?.author?._id ||
      blogData?.author?.id ||
      blogData?.author ||
      blogData?.user?._id ||
      blogData?.user?.id ||
      blogData?.createdBy?._id ||
      blogData?.createdBy?.id ||
      blogData?.userId ||
      blogData?.authorId ||
      blogData?.ownerId ||
      null
    )
  }

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

  useEffect(() => {
    if (fetchedBlog) {
      setSelectedBlog(fetchedBlog)

      const authorId = getAuthorId(fetchedBlog)
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

  const getWordCount = text => {
    if (!text) return 0
    const strippedText = text.replace(/<[^>]*>/g, " ")
    return strippedText
      .trim()
      .split(/\s+/)
      .filter(word => word.length > 0).length
  }

  const hasMatchingBlog = blog?._id === id

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

  return (
    <div className="min-h-screen bg-slate-50/30 selection:bg-indigo-100 selection:text-indigo-900">
      <Helmet>
        <title>{editorTitle || "Blog"} | GenWrite</title>
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
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 leading-[1.05] tracking-tight text-pretty break-words">
                  {editorTitle}
                </h1>
              </header>

              {/* High-Quality Prose Body */}
              <div className="prose-wrapper">
                <div className="prose prose-lg sm:prose-xl prose-slate max-w-none prose-headings:font-black prose-headings:tracking-tight prose-a:text-blue-600 prose-img:rounded-md prose-img:shadow-none prose-blockquote:border-l-blue-600 prose-blockquote:bg-blue-50/30 prose-blockquote:py-2 prose-blockquote:px-8 prose-blockquote:rounded-md">
                  <TipTapEditor
                    blog={blog}
                    content={editorContent}
                    setContent={() => {}}
                    setUnsavedChanges={() => {}}
                    isPublicMode={true}
                  />
                </div>
              </div>

              {/* Tags / Keywords Section */}
              {keywords.length > 0 && (
                <div className="mt-20 flex flex-wrap gap-2">
                  {keywords.map((kw, i) => (
                    <span
                      key={i}
                      className="px-4 py-2 bg-slate-100 text-slate-600 border border-slate-200 text-sm font-bold rounded-md hover:bg-slate-200 transition-colors cursor-default"
                    >
                      #{kw}
                    </span>
                  ))}
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
                    Search Preview
                  </span>
                  <button className="text-[10px] font-black text-blue-600 hover:underline uppercase tracking-widest transition-colors cursor-pointer">
                    Edit Slug
                  </button>
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
                    Growth Keywords
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  {(keywords?.length > 0
                    ? keywords
                    : [
                        "digital music platforms",
                        "music distribution case study",
                        "online music platforms",
                        "streaming platform success",
                        "artist growth study",
                        "music platform strategy",
                        "user engagement in music",
                      ]
                  ).map((kw, i) => (
                    <div
                      key={i}
                      className="group relative flex items-center gap-3 p-3 bg-blue-50/50 border border-blue-100/50 rounded-md hover:bg-blue-600 transition-all duration-300"
                    >
                      <div className="w-1.5 h-1.5 bg-blue-600 group-hover:bg-white transition-colors rounded" />
                      <span className="text-[11px] font-black text-blue-900 group-hover:text-white transition-colors uppercase tracking-tight">
                        {kw}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* Branding Footer */}
            <div className="text-center space-y-4 opacity-50 hover:opacity-100 transition-opacity mt-12 pb-10">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                Generated via GenWrite Intelligence
              </p>
              <div className="flex justify-center gap-4">
                <div className="w-1 h-1 bg-slate-300 rounded" />
                <div className="w-1 h-1 bg-slate-300 rounded" />
                <div className="w-1 h-1 bg-slate-300 rounded" />
              </div>
            </div>
          </aside>
        </div>

        {/* Premium CTA Footer - Only for guests */}
        {!user?._id && (
          <footer className="mt-32">
            <div className="relative">
              <div className="relative bg-white rounded-md p-8 md:p-14 border border-slate-200 text-center space-y-8 overflow-hidden">
                <div className="w-20 h-20 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-2 border border-blue-100">
                  <Sparkles size={40} strokeWidth={2.5} />
                </div>
                <div className="space-y-3">
                  <h3 className="text-3xl md:text-4xl font-black text-slate-900">
                    Craft Stories That Matter
                  </h3>
                  <p className="text-slate-500 text-lg max-w-lg mx-auto leading-relaxed">
                    This article was built with{" "}
                    <span className="text-indigo-600 font-bold">GenWrite</span> – the world’s most
                    advanced AI writing orchestration platform.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button
                    onClick={() => navigate("/signup")}
                    className="w-full sm:w-auto px-10 py-4 bg-blue-600 text-white font-black rounded-md hover:bg-blue-700 active:scale-95 transition-all border border-blue-700"
                  >
                    Start Writing Free
                  </button>
                  <button
                    onClick={() => navigate("/")}
                    className="w-full sm:w-auto px-8 py-4 bg-white text-slate-600 font-bold border border-slate-200 rounded-md hover:bg-slate-50 transition-all"
                  >
                    Learn More
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-20 text-center text-slate-400 text-sm font-medium pb-20 uppercase tracking-widest">
              &copy; {new Date().getFullYear()} GenWrite AI. All rights reserved.
            </div>
          </footer>
        )}
      </div>
    </div>
  )
}

export default PublicBlogReader
