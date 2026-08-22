# GenWrite Server-to-Server Integration Guide

> **For Developers** - Connect Your Website to GenWrite's AI Blog Generator

This guide explains how to integrate your website with GenWrite's blog publishing system. Once integrated, GenWrite
users can publish AI-generated blogs directly to your platform through our server-to-server communication.

---

## Table of Contents

1. [Overview](#overview)
2. [How It Works](#how-it-works)
3. [Integration Requirements](#integration-requirements)
4. [API Endpoints You Must Implement](#api-endpoints-you-must-implement)
5. [Authentication](#authentication)
6. [Request/Response Formats](#requestresponse-formats)
7. [Implementation Examples](#implementation-examples)
8. [Testing Your Integration](#testing-your-integration)
9. [Error Handling](#error-handling)
10. [Security Best Practices](#security-best-practices)

---

## Overview

### What is GenWrite?

GenWrite is an AI-powered blog generation platform that creates SEO-optimized, human-quality blog posts. Users can
publish their generated blogs to various platforms including WordPress, Shopify, Wix, and **custom servers** (your
website).

### What Does This Integration Enable?

By implementing our Server Endpoint integration, you allow GenWrite users to:

- ✅ Publish AI-generated blogs directly to your platform
- ✅ Update existing posts programmatically
- ✅ Sync categories between GenWrite and your platform
- ✅ Automate content publishing workflows

---

## How It Works

### Architecture Flow

```
┌─────────────────┐                                    ┌─────────────────┐
│                 │  1. User Connects Integration      │                 │
│   GenWrite      │─────────────────────────────────▶ │   Your Server   │
│   Backend       │                                    │                 │
│                 │  2. GenWrite Verifies Connectivity │                 │
│                 │◀─────────────────────────────────  │                 │
│                 │         (Ping Endpoint)            │                 │
│                 │                                    │                 │
│                 │  3. User Publishes Blog            │                 │
│                 │─────────────────────────────────▶ │                 │
│                 │       (POST /post)                 │                 │
│                 │                                    │                 │
│                 │  4. Your Server Creates Post       │                 │
│                 │◀─────────────────────────────────  │                 │
│                 │   Returns: {post_id, link}         │                 │
└─────────────────┘                                    └─────────────────┘
```

### Integration Steps

1. **Developer (You):**
   - Implement 4 required API endpoints on your server
   - Generate a secure authentication token
   - Provide your base URL and token to your users

2. **GenWrite User:**
   - Adds your integration in their GenWrite dashboard
   - Enters your server URL and authentication token
   - Publishes blogs with one click

3. **GenWrite Backend:**
   - Validates connection via `/ping` endpoint
   - Sends formatted blog content to your `/post` endpoint
   - Stores returned post ID and link for future updates

---

## Integration Requirements

### Mandatory Endpoints

You must implement **4 HTTP endpoints** on your server:

| Method | Endpoint      | Purpose                          | Required |
| ------ | ------------- | -------------------------------- | -------- |
| GET    | `/ping`       | Health check / connectivity test | ✅ Yes   |
| POST   | `/post`       | Create new blog post             | ✅ Yes   |
| PUT    | `/post`       | Update existing blog post        | ✅ Yes   |
| GET    | `/categories` | List available categories        | ✅ Yes   |

### Technical Requirements

- **HTTPS Only:** All endpoints must use HTTPS (SSL/TLS)
- **Authentication:** Bearer token authentication (you generate and provide to users)
- **Content-Type:** Accept and return `application/json`
- **Timeout Tolerance:** Respond within 100 seconds (preferably < 10s)
- **CORS:** Not required (server-to-server communication)

---

## API Endpoints You Must Implement

### 1. Ping Endpoint

**Purpose:** Verify that your server is reachable and authentication is valid.

**Request:**

```http
GET /ping
Authorization: Bearer YOUR_GENERATED_TOKEN
```

**Response:**

```json
{ "status": "ok" }
```

**Status Codes:**

- `200 OK` - Integration is active and authenticated
- `401 Unauthorized` - Invalid or missing token
- `500 Internal Server Error` - Server issue

**Implementation Notes:**

- This endpoint is called when users connect their integration
- Must verify the Bearer token
- Can return any valid JSON; GenWrite only checks for HTTP 200

---

### 2. Create Post Endpoint

**Purpose:** Receive blog content from GenWrite and create a new post on your platform.

**Request:**

```http
POST /post
Authorization: Bearer YOUR_GENERATED_TOKEN
Content-Type: application/json

{
  "title": "10 Best AI Tools for Content Creation in 2026",
  "slug": "10-best-ai-tools-content-creation-2026",
  "content": "<h1>Introduction</h1><p>Artificial intelligence has...</p>...",
  "status": "publish",
  "category": "Technology",
  "tags": ["AI", "Content Creation", "Marketing"],
  "focusKeywords": ["AI tools", "content creation"],
  "keywords": ["artificial intelligence", "blogging tools", "automation"],
  "custom_summary": "Discover the top AI-powered tools that are revolutionizing content creation...",
  "meta_title": "10 Best AI Tools for Content Creation | 2026 Guide",
  "meta_description": "Explore the leading AI tools for content creation in 2026. Boost productivity...",
  "meta_keywords": "AI tools, content creation, marketing automation",
  "featured_image_url": "https://cdn.genwrite.ai/images/featured-image.jpg",
  "featured_image_alt": "AI tools dashboard interface",
  "schema_markup": "{\"@context\":\"https://schema.org\",\"@type\":\"Article\",...}"
}
```

**Response:**

```json
{ "success": true, "post_id": "12345", "link": "https://yourdomain.com/blog/10-best-ai-tools-content-creation-2026" }
```

**Status Codes:**

- `200 OK` or `201 Created` - Post created successfully
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Invalid token
- `500 Internal Server Error` - Server error

**Required Response Fields:**

- `success` (boolean) - Must be `true` for successful creation
- `post_id` (string) - Your platform's unique post identifier
- `link` (string) - Public URL where the post is accessible

**Implementation Notes:**

- The `content` field contains **fully-rendered HTML** (ready to display)
- You don't need to convert markdown or process content
- `schema_markup` is JSON-LD for SEO (inject into `<head>` for best results)
- `slug` is SEO-friendly URL slug (use for permalink generation)
- Handle `featured_image_url` as an external URL (hotlink or download)

---

### 3. Update Post Endpoint

**Purpose:** Update an existing post with new content.

**Request:**

```http
PUT /post
Authorization: Bearer YOUR_GENERATED_TOKEN
Content-Type: application/json

{
  "id": "12345",
  "title": "10 Best AI Tools for Content Creation in 2026 [Updated]",
  "content": "<h1>Introduction</h1><p>Updated content...</p>...",
  "status": "publish",
  "category": "Technology",
  "tags": ["AI", "Content Creation", "Marketing", "2026"],
  "meta_title": "10 Best AI Tools for Content Creation | 2026 Updated Guide",
  "featured_image_url": "https://cdn.genwrite.ai/images/featured-image-updated.jpg",
  // ... (same fields as POST /post)
}
```

**Response:**

```json
{ "success": true, "post_id": "12345", "link": "https://yourdomain.com/blog/10-best-ai-tools-content-creation-2026" }
```

**Status Codes:**

- `200 OK` - Post updated successfully
- `404 Not Found` - Post ID doesn't exist
- `401 Unauthorized` - Invalid token
- `500 Internal Server Error` - Server error

**Implementation Notes:**

- The `id` field matches the `post_id` you returned in POST response
- Update the existing post; don't create a duplicate
- Return the same `post_id` and updated `link`

---

### 4. Categories Endpoint

**Purpose:** Provide a list of available categories for blog posts.

**Request:**

```http
GET /categories
Authorization: Bearer YOUR_GENERATED_TOKEN
```

**Response:**

```json
["Technology", "Marketing", "Business", "AI & Machine Learning", "Tutorials"]
```

**Status Codes:**

- `200 OK` - Categories returned successfully
- `401 Unauthorized` - Invalid token
- `500 Internal Server Error` - Server error

**Implementation Notes:**

- Return an array of category names (strings)
- GenWrite users will select from this list when publishing
- If you don't use categories, return an empty array `[]`
- Categories are case-sensitive

---

## Authentication

### Bearer Token Authentication

GenWrite uses **Bearer token authentication** for all requests to your server.

**How It Works:**

1. **You Generate Token:** Create a secure, random token (recommended: 32+ characters)
2. **User Provides Token:** Your users enter the token in GenWrite's integration settings
3. **GenWrite Sends Token:** Every request includes `Authorization: Bearer YOUR_TOKEN`
4. **You Validate Token:** Verify the token matches your stored value

**Example Header:**

```http
Authorization: Bearer sk_live_a8f3b9c2d1e4f7g6h5i9j8k7l6m5n4o3p2
```

### Token Security Best Practices

✅ **Generate Strong Tokens:**

```javascript
// Node.js example
const crypto = require("crypto")
const token = crypto.randomBytes(32).toString("hex")
// Result: "a8f3b9c2d1e4f7g6h5i9j8k7l6m5n4o3p2..."
```

✅ **Store Securely:**

- Hash tokens before storing in database (use bcrypt or similar)
- Never commit tokens to version control
- Use environment variables for token storage

✅ **Rotate Regularly:**

- Allow users to regenerate tokens
- Expire old tokens after regeneration grace period

❌ **Don't:**

- Use predictable tokens (e.g., "admin123")
- Share tokens across multiple users
- Log tokens in plaintext

---

## Request/Response Formats

### Post Object Fields

GenWrite sends the following fields in POST/PUT requests:

| Field                | Type     | Required | Description                                 |
| -------------------- | -------- | -------- | ------------------------------------------- |
| `id`                 | string   | PUT only | Your post ID (for updates)                  |
| `title`              | string   | Yes      | Post title                                  |
| `slug`               | string   | Yes      | SEO-friendly URL slug                       |
| `content`            | string   | Yes      | Fully-rendered HTML content                 |
| `status`             | string   | Yes      | Publication status (always "publish")       |
| `category`           | string   | No       | Selected category (from your `/categories`) |
| `tags`               | string[] | No       | Array of tag strings                        |
| `focusKeywords`      | string[] | No       | Primary SEO keywords                        |
| `keywords`           | string[] | No       | Additional keywords                         |
| `custom_summary`     | string   | No       | Post excerpt/summary                        |
| `meta_title`         | string   | No       | SEO meta title                              |
| `meta_description`   | string   | No       | SEO meta description                        |
| `meta_keywords`      | string   | No       | Comma-separated keywords                    |
| `featured_image_url` | string   | No       | Featured image URL (external CDN)           |
| `featured_image_alt` | string   | No       | Alt text for featured image                 |
| `schema_markup`      | string   | No       | JSON-LD schema markup for SEO               |

### Content Format

**HTML Structure:**

The `content` field contains semantic HTML with the following elements:

```html
<!-- Headings -->
<h1>Main Title</h1>
<h2>Section Heading</h2>
<h3>Subsection Heading</h3>

<!-- Paragraphs -->
<p>Text content with <strong>bold</strong> and <em>italic</em> formatting.</p>

<!-- Lists -->
<ul>
  <li>Unordered list item</li>
</ul>

<ol>
  <li>Ordered list item</li>
</ol>

<!-- Images -->
<img src="https://cdn.genwrite.ai/images/example.jpg" alt="Descriptive alt text" />

<!-- Links -->
<a href="https://example.com">Anchor text</a>

<!-- Blockquotes -->
<blockquote>
  <p>Quote content</p>
</blockquote>

<!-- Code blocks -->
<pre><code>const example = "code block";</code></pre>

<!-- Tables (optional) -->
<table>
  <thead>
    <tr>
      <th>Header</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Data</td>
    </tr>
  </tbody>
</table>
```

**Table of Contents (Optional):**

If the user enables "Include Table of Contents", the HTML will include:

```html
<div class="toc">
  <h2>Table of Contents</h2>
  <ul>
    <li><a href="#section-1">Section 1</a></li>
    <li><a href="#section-2">Section 2</a></li>
  </ul>
</div>
```

### Schema Markup Format

The `schema_markup` field contains JSON-LD structured data:

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Article",
      "headline": "10 Best AI Tools for Content Creation in 2026",
      "description": "Discover the top AI-powered tools...",
      "author": { "@type": "Person", "name": "John Doe" },
      "publisher": {
        "@type": "Organization",
        "name": "GenWrite",
        "logo": { "@type": "ImageObject", "url": "https://genwrite.ai/logo.png" }
      },
      "datePublished": "2026-01-27T12:00:00Z",
      "image": "https://cdn.genwrite.ai/images/featured-image.jpg"
    },
    {
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "What are the best AI tools?",
          "acceptedAnswer": { "@type": "Answer", "text": "The best AI tools include..." }
        }
      ]
    }
  ]
}
```

**How to Use:**

Inject into your HTML `<head>` section:

```html
<script type="application/ld+json">
  <!-- Paste schema_markup value here -->
</script>
```

---

## Implementation Examples

### Node.js (Express)

```javascript
const express = require("express")
const app = express()

app.use(express.json())

// Authentication middleware
const authToken = process.env.GENWRITE_AUTH_TOKEN
function authenticate(req, res, next) {
  const token = req.headers.authorization?.replace("Bearer ", "")
  if (token !== authToken) {
    return res.status(401).json({ error: "Unauthorized" })
  }
  next()
}

// Ping endpoint
app.get("/ping", authenticate, (req, res) => {
  res.json({ status: "ok" })
})

// Create post endpoint
app.post("/post", authenticate, async (req, res) => {
  try {
    const { title, slug, content, category, tags, meta_title, meta_description, featured_image_url, schema_markup } =
      req.body

    // Your database logic to create post
    const post = await YourDatabase.createPost({
      title,
      slug,
      content,
      category,
      tags,
      seo: { metaTitle: meta_title, metaDescription: meta_description, schemaMarkup: schema_markup },
      featuredImage: featured_image_url,
      status: "published"
    })

    res.status(201).json({ success: true, post_id: String(post.id), link: `https://yourdomain.com/blog/${slug}` })
  } catch (error) {
    console.error("Post creation error:", error)
    res.status(500).json({ error: "Failed to create post" })
  }
})

// Update post endpoint
app.put("/post", authenticate, async (req, res) => {
  try {
    const { id, title, content, meta_title, ...rest } = req.body

    const post = await YourDatabase.updatePost(id, { title, content, seo: { metaTitle: meta_title }, ...rest })

    if (!post) {
      return res.status(404).json({ error: "Post not found" })
    }

    res.json({ success: true, post_id: String(post.id), link: post.url })
  } catch (error) {
    console.error("Post update error:", error)
    res.status(500).json({ error: "Failed to update post" })
  }
})

// Categories endpoint
app.get("/categories", authenticate, (req, res) => {
  // Return your platform's categories
  const categories = ["Technology", "Marketing", "Business", "AI & Machine Learning"]
  res.json(categories)
})

app.listen(3000, () => console.log("Integration server running"))
```

### Python (FastAPI)

```python
from fastapi import FastAPI, HTTPException, Header
from pydantic import BaseModel
from typing import List, Optional
import os

app = FastAPI()

AUTH_TOKEN = os.getenv("GENWRITE_AUTH_TOKEN")

# Request models
class PostRequest(BaseModel):
    id: Optional[str] = None
    title: str
    slug: str
    content: str
    status: str
    category: Optional[str] = None
    tags: Optional[List[str]] = None
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    featured_image_url: Optional[str] = None
    schema_markup: Optional[str] = None

# Response model
class PostResponse(BaseModel):
    success: bool
    post_id: str
    link: str

def verify_token(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing authorization")

    token = authorization.replace("Bearer ", "")
    if token != AUTH_TOKEN:
        raise HTTPException(status_code=401, detail="Invalid token")

@app.get("/ping")
async def ping(authorization: str = Header(None)):
    verify_token(authorization)
    return {"status": "ok"}

@app.post("/post", response_model=PostResponse)
async def create_post(
    post: PostRequest,
    authorization: str = Header(None)
):
    verify_token(authorization)

    # Your database logic
    post_id = await your_db.create_post(
        title=post.title,
        slug=post.slug,
        content=post.content,
        category=post.category,
        meta_title=post.meta_title
    )

    return PostResponse(
        success=True,
        post_id=str(post_id),
        link=f"https://yourdomain.com/blog/{post.slug}"
    )

@app.put("/post", response_model=PostResponse)
async def update_post(
    post: PostRequest,
    authorization: str = Header(None)
):
    verify_token(authorization)

    if not post.id:
        raise HTTPException(status_code=400, detail="Post ID required")

    updated = await your_db.update_post(post.id, post.dict())

    if not updated:
        raise HTTPException(status_code=404, detail="Post not found")

    return PostResponse(
        success=True,
        post_id=post.id,
        link=updated.url
    )

@app.get("/categories")
async def get_categories(authorization: str = Header(None)):
    verify_token(authorization)
    return ["Technology", "Marketing", "Business", "AI & Machine Learning"]
```

### PHP (Laravel)

```php
<?php

// routes/api.php
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::middleware('genwrite.auth')->group(function () {
    Route::get('/ping', [IntegrationController::class, 'ping']);
    Route::post('/post', [IntegrationController::class, 'createPost']);
    Route::put('/post', [IntegrationController::class, 'updatePost']);
    Route::get('/categories', [IntegrationController::class, 'getCategories']);
});

// app/Http/Middleware/GenWriteAuth.php
namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class GenWriteAuth
{
    public function handle(Request $request, Closure $next)
    {
        $token = $request->bearerToken();
        $validToken = env('GENWRITE_AUTH_TOKEN');

        if ($token !== $validToken) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        return $next($request);
    }
}

// app/Http/Controllers/IntegrationController.php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Post;

class IntegrationController extends Controller
{
    public function ping()
    {
        return response()->json(['status' => 'ok']);
    }

    public function createPost(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string',
            'slug' => 'required|string',
            'content' => 'required|string',
            'category' => 'nullable|string',
            'meta_title' => 'nullable|string'
        ]);

        $post = Post::create([
            'title' => $validated['title'],
            'slug' => $validated['slug'],
            'content' => $validated['content'],
            'category' => $validated['category'],
            'meta_title' => $validated['meta_title'],
            'status' => 'published'
        ]);

        return response()->json([
            'success' => true,
            'post_id' => (string) $post->id,
            'link' => url('/blog/' . $post->slug)
        ], 201);
    }

    public function updatePost(Request $request)
    {
        $post = Post::find($request->id);

        if (!$post) {
            return response()->json(['error' => 'Post not found'], 404);
        }

        $post->update($request->all());

        return response()->json([
            'success' => true,
            'post_id' => (string) $post->id,
            'link' => url('/blog/' . $post->slug)
        ]);
    }

    public function getCategories()
    {
        return response()->json([
            'Technology',
            'Marketing',
            'Business',
            'AI & Machine Learning'
        ]);
    }
}
```

---

## Testing Your Integration

### Step 1: Local Testing with cURL

Test each endpoint before connecting to GenWrite:

```bash
# Set your token
export TOKEN="your-test-token-here"

# Test ping
curl -X GET https://yourdomain.com/ping \
  -H "Authorization: Bearer $TOKEN"

# Test categories
curl -X GET https://yourdomain.com/categories \
  -H "Authorization: Bearer $TOKEN"

# Test post creation
curl -X POST https://yourdomain.com/post \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Post",
    "slug": "test-post",
    "content": "<h1>Test</h1><p>This is a test.</p>",
    "status": "publish",
    "category": "Technology",
    "meta_title": "Test Post | My Site"
  }'

# Test post update (use returned post_id)
curl -X PUT https://yourdomain.com/post \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "12345",
    "title": "Updated Test Post",
    "content": "<h1>Updated</h1><p>This is updated.</p>",
    "status": "publish"
  }'
```

### Step 2: Connect to GenWrite

1. **Log in to GenWrite** (your users will do this)
2. **Navigate to Integrations** → Add Integration
3. **Select "Custom Server Endpoint"**
4. **Enter Configuration:**
   - **Base URL:** `https://yourdomain.com`
   - **Authentication Token:** Your generated token
5. **Click "Test Connection"** - GenWrite will ping your server
6. **Save Integration**

### Step 3: Test Publishing

1. **Create a blog** in GenWrite
2. **Click "Publish"** → Select your integration
3. **Choose category** (from your `/categories` endpoint)
4. **Click "Publish to [Your Platform]"**
5. **Verify:** Check your platform for the new post

### Step 4: Test Updating

1. **Modify the blog** in GenWrite
2. **Click "Update"** → Select same integration
3. **Verify:** Existing post should be updated, not duplicated

---

## Error Handling

### Common Error Scenarios

#### 1. Authentication Failure

**Scenario:** Invalid or missing Bearer token

**Your Response:**

```json
{ "error": "Unauthorized", "message": "Invalid authentication token" }
```

**HTTP Status:** `401 Unauthorized`

#### 2. Post Not Found (Update)

**Scenario:** Update request with non-existent post ID

**Your Response:**

```json
{ "error": "Not Found", "message": "Post with ID '12345' does not exist" }
```

**HTTP Status:** `404 Not Found`

#### 3. Validation Error

**Scenario:** Missing required fields

**Your Response:**

```json
{ "error": "Bad Request", "message": "Missing required field: title", "fields": { "title": "This field is required" } }
```

**HTTP Status:** `400 Bad Request`

#### 4. Server Error

**Scenario:** Database or internal error

**Your Response:**

```json
{ "error": "Internal Server Error", "message": "Failed to create post. Please try again later." }
```

**HTTP Status:** `500 Internal Server Error`

**Important:** Don't expose sensitive error details in production!

### Error Handling Best Practices

✅ **Log Errors Internally:**

```javascript
try {
  // Post creation logic
} catch (error) {
  console.error("[GenWrite Integration] Error:", error)
  // Log to your monitoring system (Sentry, Datadog, etc.)
  res.status(500).json({ error: "Internal error" })
}
```

✅ **Return User-Friendly Messages:**

```javascript
// Good
return { error: "Failed to create post. Please check your category." }

// Bad (exposes internals)
return { error: 'SQL error: Table "posts" violates constraint...' }
```

✅ **Use Proper HTTP Status Codes:**

- `200 OK` - Success
- `201 Created` - Resource created
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Auth failure
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server issue

---

## Security Best Practices

### 1. HTTPS Only

❌ **Never** use HTTP for production integrations

✅ **Always** use HTTPS with valid SSL certificate

```javascript
// Enforce HTTPS in Express
app.use((req, res, next) => {
  if (req.headers["x-forwarded-proto"] !== "https") {
    return res.redirect(`https://${req.hostname}${req.url}`)
  }
  next()
})
```

### 2. Rate Limiting

Protect your server from abuse:

```javascript
// Express rate limiting
const rateLimit = require("express-rate-limit")

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: "Too many requests, please try again later"
})

app.use("/post", limiter)
```

### 3. Input Validation

Sanitize all incoming data:

```javascript
// Example: Sanitize HTML to prevent XSS
const sanitizeHtml = require("sanitize-html")

app.post("/post", authenticate, (req, res) => {
  const cleanContent = sanitizeHtml(req.body.content, {
    allowedTags: ["h1", "h2", "h3", "p", "a", "img", "ul", "ol", "li"],
    allowedAttributes: { a: ["href", "title"], img: ["src", "alt"] }
  })

  // Use cleanContent for storage
})
```

### 4. Token Storage

Store tokens securely:

```javascript
// Hash tokens before DB storage
const bcrypt = require("bcrypt")

async function saveToken(userId, token) {
  const hashedToken = await bcrypt.hash(token, 10)
  await db.saveUserToken(userId, hashedToken)
}

async function verifyToken(userId, providedToken) {
  const storedHash = await db.getUserToken(userId)
  return bcrypt.compare(providedToken, storedHash)
}
```

### 5. CORS Configuration

Server-to-server calls don't need CORS, but if you expose to browsers:

```javascript
// Only if needed for browser access
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "https://genwrite.ai")
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT")
  res.header("Access-Control-Allow-Headers", "Authorization, Content-Type")
  next()
})
```

### 6. Logging & Monitoring

Track integration usage:

```javascript
app.post("/post", authenticate, async (req, res) => {
  const startTime = Date.now()

  try {
    // Post creation logic
    const post = await createPost(req.body)

    // Log success
    logger.info("GenWrite post created", { postId: post.id, duration: Date.now() - startTime, userId: req.userId })

    res.json({ success: true, post_id: post.id, link: post.url })
  } catch (error) {
    // Log error
    logger.error("GenWrite post creation failed", {
      error: error.message,
      duration: Date.now() - startTime,
      userId: req.userId
    })

    res.status(500).json({ error: "Failed to create post" })
  }
})
```

---

## FAQ

### Q: Can users publish to multiple platforms simultaneously?

**A:** Yes, users can connect multiple integrations (WordPress, your server, Shopify, etc.) and publish to all of them
with one click.

### Q: Do you support webhooks for real-time updates?

**A:** Not currently. GenWrite uses a push model (we call your endpoints). Future webhook support is planned.

### Q: How do you handle featured images?

**A:** We send `featured_image_url` pointing to our CDN. You can:

- Hotlink the image (recommended for speed)
- Download and re-host on your server
- Skip and use your own default image

### Q: What happens if my server is down during publishing?

**A:** The request will fail with a timeout error. Users can retry the publish operation manually.

### Q: Can I customize which fields are required?

**A:** No, the request format is standardized. However, you can ignore optional fields you don't need.

### Q: Do you support draft/scheduled posts?

**A:** The `status` field is always `"publish"`. You can implement draft logic on your end by checking a custom flag or
changing the status internally.

### Q: How do I revoke access for a user?

**A:** Regenerate or delete the authentication token. All future requests with the old token will fail.

---

## Support & Resources

### Integration Checklist

Before going live, verify:

- ✅ All 4 endpoints implemented (`/ping`, `POST /post`, `PUT /post`, `/categories`)
- ✅ HTTPS enabled with valid SSL certificate
- ✅ Bearer token authentication working
- ✅ Successful test with cURL
- ✅ Successful test publish from GenWrite
- ✅ Error handling implemented
- ✅ Logging and monitoring in place
- ✅ Rate limiting configured

### Need Help?

- **Technical Issues:** Contact GenWrite support at support@genwrite.ai
- **Feature Requests:** Submit via our feedback portal
- **Security Concerns:** Email security@genwrite.ai

---

## Changelog

**v1.0.0** (January 2026)

- Initial Server Endpoint integration documentation
- Added authentication, error handling, and security guidelines
- Included code examples for Node.js, Python, and PHP

---

**Built with ❤️ by the GenWrite Team**

_Empowering developers to create seamless content publishing experiences._
