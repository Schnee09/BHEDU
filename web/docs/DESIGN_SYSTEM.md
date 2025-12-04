# BH-EDU Design System
## Professional Education Admin Platform - Bright Gold Theme

### Overview
This design system is optimized for admin staff and teachers in an educational environment. The bright gold color scheme conveys trust, achievement, and professionalism while maintaining excellent readability and accessibility.

---

## Color Palette

### Primary Colors (Bright Gold)
```css
--gold-50:  #FFFBEB   /* Lightest background tint */
--gold-100: #FEF3C7   /* Light background */
--gold-200: #FDE68A   /* Soft highlight */
--gold-300: #FCD34D   /* Light accent */
--gold-400: #FBBF24   /* Primary light */
--gold-500: #F59E0B   /* PRIMARY - Main brand color */
--gold-600: #D97706   /* Primary dark */
--gold-700: #B45309   /* Dark accent */
--gold-800: #92400E   /* Very dark */
--gold-900: #78350F   /* Darkest text */
```

**Usage:**
- Primary buttons: `from-amber-400 to-yellow-600`
- Hover states: `from-amber-500 to-yellow-700`
- Focus rings: `ring-amber-500`
- Backgrounds: `bg-amber-50` or `bg-amber-100`

### Secondary Colors (Professional Navy)
```css
--secondary:       #1E40AF   /* Professional blue */
--secondary-dark:  #1E3A8A   /* Dark blue */
--secondary-light: #3B82F6   /* Light blue */
```

**Usage:**
- Teacher role indicators
- Secondary buttons
- Alternative CTAs

### Status Colors
```css
--success: #16A34A   /* Green - Success states */
--warning: #F59E0B   /* Gold - Warning states */
--error:   #DC2626   /* Red - Error states */
--info:    #2563EB   /* Blue - Info states */
```

### Neutral Colors (Stone)
```css
--background:  #FAFAF9   /* Page background */
--surface:     #FFFFFF   /* Card backgrounds */
--text-primary:   #1C1917   /* Primary text (stone-900) */
--text-secondary: #57534E   /* Secondary text (stone-600) */
--text-tertiary:  #78716C   /* Tertiary text (stone-500) */
--border-light:   #E7E5E4   /* Light borders (stone-200) */
--border-default: #D6D3D1   /* Default borders (stone-300) */
```

---

## Typography

### Font Families
```css
--font-heading: 'Poppins', sans-serif;     /* Headlines, titles */
--font-primary: 'Open Sans', sans-serif;   /* Body text, UI */
```

**Google Fonts Import:**
```css
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&family=Open+Sans:wght@300;400;500;600;700&display=swap');
```

### Heading Scale
```
H1: 2.5rem (40px) - font-weight: 700
H2: 2rem (32px)   - font-weight: 600
H3: 1.75rem (28px) - font-weight: 600
H4: 1.5rem (24px)  - font-weight: 600
H5: 1.25rem (20px) - font-weight: 600
H6: 1.125rem (18px) - font-weight: 600
```

### Body Text
- Base: 16px / 1.6 line-height
- Small: 14px / 1.5 line-height
- Extra small: 12px / 1.4 line-height

---

## Component Styles

### Buttons

#### Primary (Gold)
```tsx
className="px-5 py-2.5 bg-gradient-to-br from-amber-400 to-yellow-600 
  hover:from-amber-500 hover:to-yellow-700 text-white font-semibold 
  rounded-lg shadow-md hover:shadow-lg hover:shadow-amber-500/50 
  transition-all focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
```

#### Secondary
```tsx
className="px-5 py-2.5 bg-gradient-to-br from-blue-600 to-blue-700 
  hover:from-blue-700 hover:to-blue-800 text-white font-semibold 
  rounded-lg shadow-md hover:shadow-lg transition-all"
```

#### Outline
```tsx
className="px-5 py-2.5 border-2 border-amber-500 text-amber-700 
  hover:bg-amber-50 hover:border-amber-600 rounded-lg font-semibold 
  shadow-sm hover:shadow-md transition-all"
```

#### Ghost
```tsx
className="px-5 py-2.5 text-stone-700 hover:bg-amber-50 
  hover:text-amber-700 rounded-lg font-medium transition-all"
```

### Cards

#### Default Card
```tsx
className="bg-white border border-stone-200 rounded-xl shadow-md p-6"
```

#### Elevated Card (with hover)
```tsx
className="bg-white border border-amber-100/50 rounded-xl shadow-lg 
  hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer 
  hover:shadow-amber-500/20 p-6"
```

#### Glass Card
```tsx
className="bg-white/95 backdrop-blur-lg border border-amber-100/50 
  rounded-xl shadow-2xl shadow-amber-500/20 p-6"
```

### Modals

#### Modal Container
```tsx
<div className="fixed inset-0 z-50 overflow-y-auto animate-fade-in">
  {/* Backdrop */}
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
  
  {/* Modal */}
  <div className="flex min-h-full items-center justify-center p-4">
    <div className="bg-white rounded-2xl shadow-2xl shadow-amber-500/20 
      border border-amber-100/50 max-w-lg w-full">
      
      {/* Header */}
      <div className="px-6 py-5 border-b border-amber-100/50 
        bg-gradient-to-br from-amber-50 to-yellow-50 rounded-t-2xl">
        <h3 className="text-xl font-semibold text-stone-900">Title</h3>
      </div>
      
      {/* Body */}
      <div className="px-6 py-5">Content</div>
      
      {/* Footer */}
      <div className="px-6 py-4 border-t border-stone-200 bg-stone-50/50 
        rounded-b-2xl flex gap-3 justify-end">
        Buttons
      </div>
    </div>
  </div>
</div>
```

### Form Inputs

#### Text Input
```tsx
className="w-full border-2 border-stone-200 px-4 py-3 rounded-lg 
  focus:ring-2 focus:ring-amber-500 focus:border-amber-500 
  transition-all bg-white text-stone-900 placeholder-stone-400"
```

#### Select
```tsx
className="w-full border-2 border-stone-200 px-4 py-3 rounded-lg 
  focus:ring-2 focus:ring-amber-500 focus:border-amber-500 
  transition-all bg-white text-stone-900"
```

### Navigation

#### NavBar
```tsx
<header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md 
  border-b border-amber-100 shadow-sm">
  <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 
    flex items-center justify-between">
    {/* Content */}
  </nav>
</header>
```

#### Sidebar Link (Active)
```tsx
className="flex items-center gap-3 px-4 py-3 rounded-lg 
  bg-gradient-to-br from-amber-500 to-yellow-600 text-white 
  font-semibold shadow-md shadow-amber-500/50"
```

#### Sidebar Link (Inactive)
```tsx
className="flex items-center gap-3 px-4 py-3 rounded-lg 
  text-stone-700 hover:bg-amber-50 hover:text-amber-700 
  transition-all font-medium"
```

### Badges

#### Role Badge (Admin)
```tsx
className="px-3 py-1 rounded-full text-xs font-semibold 
  bg-gradient-to-br from-amber-400 to-yellow-600 text-white shadow-sm"
```

#### Role Badge (Teacher)
```tsx
className="px-3 py-1 rounded-full text-xs font-semibold 
  bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-sm"
```

#### Status Badge (Success)
```tsx
className="px-3 py-1 rounded-full text-xs font-semibold 
  bg-green-100 text-green-800 border border-green-300"
```

---

## Shadows

### Shadow Scale
```css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05)
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)
--shadow-gold: 0 10px 25px -5px rgba(245, 158, 11, 0.3)
```

**Usage:**
- Cards: `shadow-md`
- Elevated cards: `shadow-lg`
- Modals: `shadow-xl` or `shadow-gold`
- Buttons on hover: `shadow-lg hover:shadow-amber-500/50`

---

## Border Radius

```css
--border-radius-sm: 0.375rem (6px)
--border-radius-md: 0.5rem (8px)
--border-radius-lg: 0.75rem (12px)
--border-radius-xl: 1rem (16px)
```

**Usage:**
- Buttons: `rounded-lg` (8px)
- Cards: `rounded-xl` (16px)
- Modals: `rounded-2xl` (24px)
- Badges: `rounded-full`

---

## Spacing

### Container Max Width
- Desktop: `max-w-7xl` (1280px)
- Forms/Modals: `max-w-md` (448px) or `max-w-lg` (512px)

### Responsive Padding
```tsx
className="px-4 sm:px-6 lg:px-8"  // Horizontal padding
className="py-4 sm:py-6 lg:py-8"  // Vertical padding
```

---

## Animations

### Transitions
```css
/* Standard transition */
transition-all duration-200 ease-in-out

/* Color transitions */
transition-colors duration-200

/* Transform transitions */
transition-transform duration-200
```

### Keyframe Animations
```css
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes slideInFromRight {
  from { opacity: 0; transform: translateX(20px); }
  to { opacity: 1; transform: translateX(0); }
}
```

**Usage:**
- Page transitions: `animate-fade-in`
- Modals: `animate-scale-in`
- Sidebar items: `animate-slide-in-right`

---

## Accessibility

### Focus States
All interactive elements must have visible focus indicators:
```css
focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2
```

### Motion Preferences
Respect `prefers-reduced-motion`:
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Color Contrast
All text meets WCAG AA standards:
- Primary text: `#1C1917` on `#FFFFFF` = 18.5:1
- Secondary text: `#57534E` on `#FFFFFF` = 7.8:1
- Gold button text: `#FFFFFF` on `#F59E0B` = 4.7:1

---

## Usage Examples

### Login Page
```tsx
<div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50">
  <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl shadow-amber-500/20 border border-amber-100/50 p-8">
    {/* Content */}
  </div>
</div>
```

### Dashboard Card
```tsx
<div className="bg-white border border-stone-200 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-1 transition-all p-6 cursor-pointer hover:shadow-amber-500/20">
  <h3 className="text-xl font-semibold text-stone-900 font-heading mb-2">Card Title</h3>
  <p className="text-stone-600">Card content goes here</p>
</div>
```

### Form Section
```tsx
<div className="space-y-5">
  <div>
    <label className="block text-sm font-semibold text-stone-700 mb-2">
      Email Address
    </label>
    <input
      type="email"
      className="w-full border-2 border-stone-200 px-4 py-3 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
      placeholder="you@example.com"
    />
  </div>
</div>
```

---

## SVG Icons

### Preferred Icon Sources
1. **Heroicons** (recommended) - https://heroicons.com
2. **Lucide Icons** - https://lucide.dev
3. **Simple Icons** (for brand logos) - https://simpleicons.org

### Icon Sizing
- Small: `w-4 h-4` (16px)
- Medium: `w-5 h-5` (20px)
- Large: `w-6 h-6` (24px)
- XL: `w-8 h-8` (32px)

### Example Icon Usage
```tsx
<svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M..." />
</svg>
```

---

## Best Practices

### DO ✅
- Use gradients for primary actions (`from-amber-400 to-yellow-600`)
- Apply shadows to create depth hierarchy
- Use semantic color tokens (primary, secondary, success, etc.)
- Implement smooth transitions (200-300ms)
- Add hover states to all interactive elements
- Include `cursor-pointer` on clickable elements
- Test both light and dark modes
- Ensure 4.5:1 minimum contrast for text

### DON'T ❌
- Don't use emojis as functional icons
- Don't apply scale transforms that shift layout
- Don't use `gray-` colors (use `stone-` instead)
- Don't create hover states without transitions
- Don't ignore focus-visible states
- Don't use the same padding on all screen sizes
- Don't mix different gold shades randomly

---

## Migration Guide

### Updating Existing Components

1. **Replace blue with gold for primary actions:**
   ```diff
   - className="bg-blue-600 hover:bg-blue-700"
   + className="bg-gradient-to-br from-amber-400 to-yellow-600 hover:from-amber-500 hover:to-yellow-700"
   ```

2. **Update borders:**
   ```diff
   - className="border-gray-300"
   + className="border-stone-200"
   ```

3. **Update text colors:**
   ```diff
   - className="text-gray-900"
   + className="text-stone-900"
   - className="text-gray-600"
   + className="text-stone-600"
   ```

4. **Add shadows and gradients:**
   ```diff
   - className="rounded-lg shadow-sm"
   + className="rounded-xl shadow-md hover:shadow-lg hover:shadow-amber-500/20"
   ```

5. **Update focus states:**
   ```diff
   - className="focus:ring-blue-500"
   + className="focus:ring-amber-500"
   ```

---

## Resources

- **Design Inspiration:** Swiss Modernism 2.0, Minimalism
- **Accessibility:** WCAG 2.1 Level AA
- **Framework:** Tailwind CSS
- **Testing Tools:**
  - Color contrast: https://contrast-ratio.com
  - Accessibility: https://wave.webaim.org

---

**Last Updated:** December 2025  
**Version:** 2.0 - Bright Gold Theme for Education Admin
