/**
 * MongoDB Seed Script for Image Gallery
 *
 * HOW TO USE:
 * ===========
 *
 * Option 1: MongoDB Compass (GUI)
 * -------------------------------
 * 1. Open MongoDB Compass
 * 2. Connect to your database
 * 3. Navigate to your database (e.g., "genwrite")
 * 4. Create or select the "imagegalleries" collection
 * 5. Click "ADD DATA" → "Import JSON or CSV file"
 * 6. Select this file or copy the data array below
 * 7. Click "Import"
 *
 * Option 2: MongoDB Shell
 * -----------------------
 * 1. Open terminal/command prompt
 * 2. Connect to MongoDB: mongosh
 * 3. Switch to your database: use genwrite
 * 4. Run: db.imagegalleries.insertMany([...paste data array...])
 *
 * Option 3: Copy-Paste Ready Command
 * -----------------------------------
 * Copy everything between the START and END markers below
 */

// ========== START: COPY FROM HERE ==========

const imageGalleryData = [
  {
    url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
    description: "Beautiful mountain landscape with clear blue sky and snow-capped peaks",
    tags: ["nature", "landscape", "mountains"],
    score: 95,
    isProcessed: true,
  },
  {
    url: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800",
    description: "Modern workspace with laptop and coffee on wooden desk",
    tags: ["technology", "workspace", "business"],
    score: 88,
    isProcessed: true,
  },
  {
    url: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800",
    description: "Delicious food platter with fresh ingredients and colorful presentation",
    tags: ["food", "cuisine"],
    score: 92,
    isProcessed: true,
  },
  {
    url: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800",
    description: "Scenic nature trail through lush green forest",
    tags: ["nature", "travel", "forest"],
    score: 90,
    isProcessed: true,
  },
  {
    url: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800",
    description: "Professional business meeting in modern office environment",
    tags: ["business", "people"],
    score: 85,
    isProcessed: true,
  },
  {
    url: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800",
    description: "Advanced technology and innovation concept with digital interface",
    tags: ["technology", "abstract"],
    score: 93,
    isProcessed: true,
  },
  {
    url: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800",
    description: "Tropical beach paradise with crystal clear water and palm trees",
    tags: ["travel", "nature"],
    score: 96,
    isProcessed: true,
  },
  {
    url: "https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?w=800",
    description: "Modern architecture with geometric design and clean lines",
    tags: ["architecture"],
    score: 89,
    isProcessed: true,
  },
  {
    url: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800",
    description: "Coding and software development workspace with multiple monitors",
    tags: ["technology", "workspace"],
    score: 87,
    isProcessed: true,
  },
  {
    url: "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=800",
    description: "Urban lifestyle and city living with modern buildings",
    tags: ["lifestyle", "people"],
    score: 84,
    isProcessed: true,
  },
  {
    url: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800",
    description: "Serene lake reflection at golden sunset hour",
    tags: ["nature", "landscape"],
    score: 94,
    isProcessed: true,
  },
  {
    url: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800",
    description: "Fresh healthy salad bowl with colorful vegetables",
    tags: ["food", "lifestyle"],
    score: 86,
    isProcessed: true,
  },
  {
    url: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=800",
    description: "Laptop and technology gadgets on modern desk setup",
    tags: ["technology", "workspace", "business"],
    score: 82,
    isProcessed: true,
  },
  {
    url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800",
    description: "Tropical island beach vacation with turquoise water",
    tags: ["travel", "nature"],
    score: 91,
    isProcessed: true,
  },
  {
    url: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=800",
    description: "Team collaboration and brainstorming in modern office",
    tags: ["business", "people"],
    score: 83,
    isProcessed: true,
  },
  {
    url: "https://images.unsplash.com/photo-1547891654-e66ed7ebb968?w=800",
    description: "Colorful abstract art background with vibrant patterns",
    tags: ["abstract"],
    score: 88,
    isProcessed: true,
  },
  {
    url: "https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=800",
    description: "Majestic mountain peaks covered in pristine snow",
    tags: ["nature", "landscape"],
    score: 97,
    isProcessed: true,
  },
  {
    url: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800",
    description: "Gourmet pizza with fresh toppings and melted cheese",
    tags: ["food"],
    score: 85,
    isProcessed: true,
  },
  {
    url: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800",
    description: "Modern office workspace with collaborative team environment",
    tags: ["business", "workspace", "people"],
    score: 81,
    isProcessed: true,
  },
  {
    url: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800",
    description: "Misty forest landscape at peaceful dawn",
    tags: ["nature", "landscape"],
    score: 93,
    isProcessed: true,
  },
  {
    url: "https://images.unsplash.com/photo-1484417894907-623942c8ee29?w=800",
    description: "MacBook Pro on minimalist wooden desk workspace",
    tags: ["technology", "workspace"],
    score: 86,
    isProcessed: true,
  },
  {
    url: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800",
    description: "Adorable puppy dog with expressive eyes",
    tags: ["animals"],
    score: 90,
    isProcessed: true,
  },
  {
    url: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800",
    description: "Minimalist modern architecture with clean geometric design",
    tags: ["architecture"],
    score: 87,
    isProcessed: true,
  },
  {
    url: "https://images.unsplash.com/photo-1533777324565-a040eb52facd?w=800",
    description: "Coffee and laptop workspace setup for productivity",
    tags: ["lifestyle", "workspace"],
    score: 84,
    isProcessed: true,
  },
]

// ========== END: COPY UNTIL HERE ==========

// For MongoDB Shell, use this command:
console.log("\n📋 MONGODB SHELL COMMAND:")
console.log("==========================\n")
console.log("db.imagegalleries.insertMany(" + JSON.stringify(imageGalleryData, null, 2) + ")")

console.log("\n\n✅ SUCCESS INDICATORS:")
console.log("======================")
console.log("After running the command, you should see:")
console.log("{ acknowledged: true, insertedIds: { ... } }")
console.log("\nTotal images to insert: " + imageGalleryData.length)
