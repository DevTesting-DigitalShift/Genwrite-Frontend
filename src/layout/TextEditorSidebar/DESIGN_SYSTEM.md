# 🎨 TextEditorSidebar UI/UX Design System

## Color Palette

### Panel Headers (Gradients)

- **Overview**: `from-gray-50 to-blue-50` + Blue-600 icon bg
- **SEO**: `from-gray-50 to-blue-50` + Indigo-Purple gradient icon
- **Blog Info**: `from-gray-50 to-blue-50` + Blue-Indigo gradient icon
- **Brand Voice**: `from-purple-50 to-indigo-50` + Purple-600 icon bg
- **Posting**: `from-emerald-50 to-green-50` + Green-Emerald gradient icon
- **Regenerate**: Clean white with gradient icon background

### Status Colors

- **Active Nav**: `bg-blue-600` with `shadow-blue-500/30`
- **Hover Nav**: `bg-gray-800`
- **Success**: Emerald/Green shades
- **Warning**: Amber shades
- **Error**: Red shades
- **Pro Badge**: Amber-100/700

## Typography

### Headers

- Panel Titles: `font-bold text-gray-900`
- Subtitles: `text-xs text-gray-500 font-medium`
- Labels: `text-xs font-bold text-gray-400 uppercase tracking-widest`

### Body

- Regular text: `text-sm text-gray-700`
- Meta info: `text-xs text-gray-500`
- Links: `text-xs text-blue-600 hover:underline`

## Component Patterns

### Cards

```tsx
className =
  "p-3 bg-white border border-gray-100 rounded-xl shadow-sm hover:border-blue-100 transition-all"
```

### Buttons

```tsx
// Primary
className =
  "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg active:scale-[0.98]"

// Secondary
className = "bg-gray-50 border border-gray-200 hover:bg-white hover:border-gray-300"
```

### Input Fields

- Ant Design `Input` and `Select` components
- Small size variants
- Error states with red border

### Badges/Tags

```tsx
// Category
className = "px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium"

// Keyword
className = "px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs"
```

## Animations

### Panel Transitions

```tsx
variants={panel}
initial="initial"
animate="animate"
exit="exit"
transition={{ duration: 0.15 }}
```

### List Items (Stagger)

```tsx
<motion.div variants={stagger}>
  <motion.div variants={item}>...</motion.div>
</motion.div>
```

### Accessibility

- All animations respect `prefers-reduced-motion`
- Normal: opacity + translate animations
- Reduced: opacity-only (instant)

## Spacing

### Panel Padding

- Header: `p-3` or `p-4`
- Content: `p-3` with `space-y-4` or `space-y-6`
- Cards: `p-3` inner padding

### Gaps

- Small gaps: `gap-1.5`, `gap-2`
- Medium gaps: `gap-3`, `gap-4`
- Large gaps: `gap-6`

## Iconography

### Panel Icons

- Size: `w-4 h-4` or `w-5 h-5`
- Navigation: `w-4.5 h-4.5` (18px)
- Headers: Inside colored circle backgrounds

### States

- Default: Gray-400
- Active: Colored (blue, purple, green)
- Hover: Transition to brand color

## Responsive Breakpoints

### Mobile (< 640px)

- Single column layouts
- Stacked form fields
- Full-width buttons
- Sidebar as drawer/modal

### Tablet (640px - 1024px)

- Two-column grids for stats
- Maintained padding
- Sidebar always visible

### Desktop (> 1024px)

- Three-column export buttons
- Expanded spacing
- Hover effects enabled

## Design Principles

1. **Consistency**: Same patterns across all panels
2. **Clarity**: Clear visual hierarchy
3. **Feedback**: Hover states, loading states, success/error messages
4. **Accessibility**: Color contrast, focus states, reduced motion
5. **Performance**: GPU-accelerated animations only
6. **Simplicity**: No unnecessary decorations

## Custom Scrollbar

```css
.custom-scroll::-webkit-scrollbar {
  width: 4px;
}
.custom-scroll::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 2px;
}
```

Applied to all scrollable content areas.
