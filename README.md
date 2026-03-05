# Stackline Full Stack Assignment

## Author

**Sumit Rodrigues**

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Getting Started](#getting-started)
3. [Bugs Identified](#bugs-identified)
4. [Detailed Fix Documentation](#detailed-fix-documentation)
   - [Critical Bugs](#1-critical-bugs-functionality-broken)
   - [Major Bugs](#2-major-bugs-ux--design-issues)
   - [Moderate Bugs](#3-moderate-bugs-security-performance--seo)
   - [Minor Bugs](#4-minor-bugs-architecture--polish)
5. [Enhancements Beyond Bug Fixes](#enhancements-beyond-bug-fixes)
6. [Architecture Decisions](#architecture-decisions)

---

## Project Overview

StackShop is a sample eCommerce application built with **Next.js 15**, **React 19**, **TypeScript**, and **Tailwind CSS**. It includes a product listing page, search/filter functionality, and a product detail page.

Through a thorough code review and manual testing, I identified **26 bugs** spanning functionality, UX/design, security, performance, and architecture.

---

## Getting Started

```bash
yarn install
yarn dev
```

The app runs at [http://localhost:3000](http://localhost:3000).

---

## Bugs Identified

| #   | Severity | Bug                                                       | Status          |
| --- | -------- | --------------------------------------------------------- | --------------- |
| 1   | Critical | Search fires on every keystroke (no debounce)             | ✅ Fixed        |
| 2   | Critical | Subcategory API ignores selected category                 | ✅ Fixed        |
| 3   | Critical | Full product JSON passed in URL                           | ✅ Fixed        |
| 4   | Critical | Clear Filters doesn't reset category dropdown             | ✅ Fixed        |
| 5   | Major    | Prices not displayed anywhere                             | ✅ Fixed        |
| 6   | Major    | No pagination (only first 20 products accessible)         | ✅ Fixed        |
| 7   | Major    | Redundant "View Details" button on clickable card         | ✅ Fixed        |
| 8   | Major    | Card footer / price misaligned across cards               | ✅ Fixed        |
| 9   | Major    | No "All Categories" reset option in dropdown              | ✅ Fixed        |
| 10  | Major    | Category dropdown not searchable (136 categories)         | ✅ Fixed        |
| 11  | Major    | No fallback for products with missing images              | ✅ Fixed        |
| 12  | Major    | No left/right arrow navigation on product images          | ✅ Fixed        |
| 13  | Major    | Hover cursor missing on buttons                           | ✅ Fixed        |
| 14  | Major    | Excessive whitespace above Features section               | ✅ Fixed        |
| 15  | Moderate | XSS / data tampering via URL product data                 | ✅ Fixed        |
| 16  | Moderate | No error handling on any API fetch calls                  | ✅ Fixed        |
| 17  | Moderate | No input validation on API `limit`/`offset`               | ✅ Fixed        |
| 18  | Moderate | Default SEO metadata ("Create Next App")                  | ✅ Fixed        |
| 19  | Moderate | No caching strategy on API responses                      | ✅ Fixed        |
| 20  | Minor    | Product detail not using dynamic route (`/product/[sku]`) | ✅ Fixed        |
| 21  | Minor    | Duplicate `Product` interface defined in 3 files          | ✅ Fixed        |
| 22  | Minor    | Plain text "Loading..." instead of skeleton UI            | ✅ Fixed        |
| 23  | Minor    | No site footer                                            | ✅ Fixed        |
| 24  | Minor    | Missing eCommerce features on detail page                 | ✅ Fixed        |
| 25  | Minor    | Image thumbnails overflow without scrolling               | ✅ Fixed        |
| 26  | Critical | Missing image hostname in Next.js config                  | ✅ Fixed        |

---

## Detailed Fix Documentation

### 1. Critical Bugs (Functionality Broken)

---

#### Bug 1: Search Fires on Every Keystroke

**Problem:** The `useEffect` in `page.tsx` triggered a product API call on every keystroke with no debounce. Typing "kindle" would fire 6 separate API requests, causing race conditions where results from an earlier request could overwrite results from a later one.

**Root Cause:** Direct dependency on the `search` state variable in the useEffect without any delay mechanism.

**Fix:** Implemented a debounce pattern using `useRef` and `setTimeout`:

```typescript
const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

useEffect(() => {
  if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
  debounceTimerRef.current = setTimeout(() => {
    setDebouncedSearch(search);
  }, 400);
  return () => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
  };
}, [search]);
```

**Why this approach:** A 400ms debounce is the industry standard, long enough to batch keystrokes but short enough to feel responsive. Using `useRef` for the timer avoids re-renders. I separated `search` (immediate UI state) from `debouncedSearch` (triggers API call) so the input remains responsive while the API call is delayed.

**File:** `app/page.tsx`

---

#### Bug 2: Subcategory API Ignores Selected Category

**Problem:** When selecting a category (e.g., "Tablets"), the subcategory dropdown showed all 203 subcategories from the entire dataset instead of only subcategories belonging to "Tablets".

**Root Cause:** The frontend called `/api/subcategories` without passing the `?category=` query parameter, even though the API route already supported it.

**Fix:** Updated the fetch call to include the selected category:

```typescript
fetch(`/api/subcategories?category=${encodeURIComponent(selectedCategory)}`);
```

**Why this approach:** The simplest possible fix, the backend already supported category filtering; the frontend just wasn't using it. Also added `encodeURIComponent` to handle category names with special characters (e.g., "3D Printers & Supplies").

**File:** `app/page.tsx`

---

#### Bug 3: Full Product JSON Passed in URL

**Problem:** Clicking a product card navigated to `/product?product={"stacklineSku":"...", "title":"...", ...}` , passing the entire product object as a JSON string in the URL. This caused:

- URLs exceeding browser limits (~2,000 characters)
- Security vulnerability (users could tamper with product data in the URL)
- Broken shareability (URLs are unreadable)
- Poor SEO (search engines can't index dynamic query-string pages)

**Root Cause:** The `Link` component serialized the product object with `JSON.stringify` into the URL query string.

**Fix:** Created a new dynamic route at `app/product/[sku]/page.tsx` that:

1. Extracts the SKU from the URL path (`/product/E8ZVY2BP3`)
2. Fetches the product from the existing `/api/products/[sku]` API route
3. Renders the product detail page from server-fetched data

```typescript
// Old: /product?product={"stacklineSku":"E8ZVY2BP3","title":"...","imageUrls":[...]}
// New: /product/E8ZVY2BP3
```

**Why this approach:** Dynamic routes (`/product/[sku]`) are the idiomatic Next.js pattern. It leverages the existing `api/products/[sku]` route (which was already built but unused), produces clean SEO-friendly URLs, and eliminates the data tampering risk since the product is always fetched from the server.

**Files:** `app/product/[sku]/page.tsx` (new), `app/product/page.tsx` (deleted), `app/page.tsx` (updated links)

---

#### Bug 4: Clear Filters Doesn't Reset Category Dropdown

**Problem:** Clicking "Clear Filters" set `selectedCategory` to `undefined`, which cleared the internal state but did not visually reset the Radix Select component's displayed label. The dropdown still showed the previously selected category.

**Root Cause:** Radix UI's `Select` component treats `undefined` as "no controlled value" rather than "reset to placeholder." The component's displayed value is not governed by the React state when set to `undefined`.

**Fix:** Changed from `undefined` to a sentinel value `"all"`:

```typescript
const [selectedCategory, setSelectedCategory] = useState<string>("all");

const handleClearFilters = () => {
  setSelectedCategory("all"); // Visually resets dropdown
  setSelectedSubCategory("all"); // Resets subcategory too
  setSearch("");
};
```

Added `"All Categories"` as a selectable option in the dropdown with value `"all"`, and the API fetch logic skips the category parameter when value is `"all"`.

**Why this approach:** Using a sentinel value (`"all"`) instead of `undefined` keeps the component fully controlled at all times, which is more predictable with Radix UI components. It also gives users a way to deselect a category directly from the dropdown (without needing the "Clear Filters" button).

**File:** `app/page.tsx`

---

#### Bug 26: Missing Image Hostname in Next.js Config

**Problem:** Navigating to pages with certain products threw a runtime error: `hostname "images-na.ssl-images-amazon.com" is not configured under images in your next.config.js`. Products on page 2+ triggered this because they used a different Amazon CDN hostname.

**Root Cause:** `next.config.ts` only whitelisted `m.media-amazon.com`, but some products use `images-na.ssl-images-amazon.com`.

**Fix:** Added the additional hostname to the `remotePatterns` configuration:

```typescript
remotePatterns: [
  { protocol: 'https', hostname: 'm.media-amazon.com' },
  { protocol: 'https', hostname: 'images-na.ssl-images-amazon.com' },
],
```

**Why this approach:** Next.js requires explicit whitelisting of external image domains for security. Adding the specific hostname is the correct and secure approach (rather than using wildcards).

**File:** `next.config.ts`

---

### 2. Major Bugs (UX & Design Issues)

---

#### Bug 5: Prices Not Displayed

**Problem:** Product prices (`retailPrice`) existed in the JSON data but were never shown to users. An eCommerce site without prices is fundamentally broken.

**Root Cause:** The `Product` TypeScript interface was missing the `retailPrice` field, and no component rendered it.

**Fix:**

1. Added `retailPrice: number` to the `Product` interface in `lib/products.ts`
2. Rendered formatted prices on product cards (`$149.99`) and the detail page
3. Used `Intl.NumberFormat` for proper currency formatting:

```typescript
const formatPrice = (price: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    price,
  );
```

**Why this approach:** `Intl.NumberFormat` is the browser's built-in internationalization API; it handles currency symbols, decimal separators, and grouping automatically. No external library needed.

**Files:** `lib/products.ts`, `app/page.tsx`, `app/product/[sku]/page.tsx`

---

#### Bug 6: No Pagination

**Problem:** The API was hardcoded to `limit: 20` with no offset controls. Only the first 20 of 500 products were ever visible.

**Root Cause:** No pagination state, no pagination UI, and no mechanism to change the `offset` parameter.

**Fix:** Implemented full client-side pagination with 8 items per page:

- Added `currentPage` state with `ITEMS_PER_PAGE = 8`
- Computes `offset` from page number: `(currentPage - 1) * ITEMS_PER_PAGE`
- Built pagination UI with Previous/Next buttons and numbered page buttons
- Auto-resets to page 1 when filters change (search, category, subcategory)
- Shows "Showing 1–8 of 500 products" counter

**Why this approach:** 8 items per page provides a good density without overwhelming the user (fills two rows of 4 on desktop). Smart page number display shows up to 7 page buttons, centered around the current page, avoiding an overwhelming number of buttons for 63 pages.

**File:** `app/page.tsx`

---

#### Bug 7: Redundant "View Details" Button

**Problem:** The entire product card was wrapped in a `<Link>` component (making it fully clickable), yet a "View Details" button was also placed inside the card. This created:

- Redundant click targets
- A nested `<a>` inside `<a>` (invalid HTML)
- Confusing UX ("Do I click the card or the button?")

**Fix:** Removed the "View Details" button entirely. The card itself is the click target, with `hover:shadow-lg` and `cursor-pointer` providing clear visual affordance.

**Why this approach:** Following the principle of "one element, one action." The card hover effect makes it clear the entire card is interactive, eliminating the need for a separate button.

**File:** `app/page.tsx`

---

#### Bug 8: Card Footer / Price Misaligned

**Problem:** Product cards with different title lengths caused prices to appear at different vertical positions, creating an uneven grid layout.

**Root Cause:** Cards lacked flex layout properties. Content was just flowing top-to-bottom with no mechanism to push the footer to the bottom.

**Fix:** Two changes:

1. Added `flex flex-col` to the Card component and `flex-1` to CardContent
2. Moved the price into its own `<div className="mt-auto">` container so it always sticks to the card bottom

Additionally, added `mt-auto` to the `CardFooter` component in `card.tsx` as a global fix.

**Why this approach:** Using `mt-auto` inside a flex column is the standard CSS pattern for pushing content to the bottom of a flexible container. It works regardless of content height above it.

**Files:** `app/page.tsx`, `components/ui/card.tsx`

---

#### Bug 9: No "All Categories" Reset Option

**Problem:** Once a category was selected, the only way to deselect it was the "Clear Filters" button. There was no option within the dropdown itself to return to "All Categories."

**Fix:** Added `"All Categories"` as the first option in the category dropdown (value `"all"`), and `"All Subcategories"` in the subcategory dropdown.

**Why this approach:** Standard UX pattern, users expect to find a "show all" option at the top of any filter dropdown. It's intuitive and doesn't require discovering a separate "Clear Filters" button.

**File:** `app/page.tsx`

---

#### Bug 10: Category Dropdown Not Searchable

**Problem:** With 136 categories, users had to scroll through a long alphabetical list to find what they wanted. This is very poor UX.

**Fix:** Built a custom `Combobox` component (`components/ui/combobox.tsx`) that replaces the plain `Select` for categories. It features:

- A search input that filters options in real-time
- Click-outside-to-close behavior
- Checkmark indicator on the selected item
- "No results found" empty state
- Clear search button (×)


**Why this approach:** I built a custom component rather than adding a library (like `cmdk`) to avoid introducing new dependencies for a single use case. The component uses only Lucide icons and the existing `cn` utility: zero new dependencies. It's lightweight (~130 lines) and fully controlled.

**File:** `components/ui/combobox.tsx` (new), `app/page.tsx` (integration)

---

#### Bug 11: No Fallback for Missing Images

**Problem:** At least one product in the dataset has an empty `imageUrls` array, resulting in a blank space where the image should be.

**Fix:** Added a conditional check that renders a "No image" placeholder when no image URL is available:

```tsx
{product.imageUrls && product.imageUrls[0] ? (
  <Image src={product.imageUrls[0]} ... />
) : (
  <div className="flex items-center justify-center h-full text-muted-foreground">
    No image
  </div>
)}
```

**Why this approach:** A simple conditional render is all that's needed. The placeholder maintains the card's layout dimensions and communicates to the user that the image is intentionally absent (not broken).

**Files:** `app/page.tsx`, `app/product/[sku]/page.tsx`

---

#### Bug 12: No Left/Right Arrow Navigation on Product Images

**Problem:** The product detail page displayed image thumbnails for navigation but lacked the standard left/right arrow buttons that users expect on a product image gallery.

**Fix:** Added Previous (‹) and Next (›) arrow buttons overlaid on the main product image:

- Circular semi-transparent buttons positioned at the center-left and center-right edges
- Cycle through images (last → first when pressing next on final image)
- Only shown when the product has more than one image
- Accessible with `aria-label` attributes

**Why this approach:** Overlay arrows are the industry standard for product image galleries (used by Amazon, eBay, etc.). The wrap-around behavior (cycling from last to first) is expected by users.

**File:** `app/product/[sku]/page.tsx`

---

#### Bug 13: Hover Cursor Missing on Buttons

**Problem:** Buttons and clickable elements did not show the pointer cursor on hover, breaking the standard web affordance that tells users "this is clickable."

**Root Cause:** The `buttonVariants` in the Button component's `cva` definition did not include `cursor-pointer`.

**Fix:** Added `cursor-pointer` to the base button variant styles.

**Why this approach:** Single-line fix at the component level ensures all buttons across the entire app get the pointer cursor automatically, no need to add it to individual instances.

**File:** `components/ui/button.tsx`

---

#### Bug 14: Excessive Whitespace Above Features Section

**Problem:** On the product detail page, there was a large gap above the "Features" section due to stacked padding from the `Card` and `CardContent` components.

**Root Cause:** `CardContent` had default `pt-6` padding that combined with the `Card`'s own padding.

**Fix:** In the reimplemented product detail page, Features are rendered inside a `Card` with explicit `p-6` on `CardContent`, avoiding the double-padding issue from the original layout hierarchy.

**File:** `app/product/[sku]/page.tsx`

---

### 3. Moderate Bugs (Security, Performance & SEO)

---

#### Bug 15: XSS / Data Tampering via URL

**Problem:** Product data embedded in the URL could be modified by users to inject malicious content or display fake information (e.g., changing the price to $0.01).

**Fix:** Eliminated entirely by Bug #3 fix. Product data is now always fetched from the server by SKU, never from client-provided URL data.

**File:** `app/product/[sku]/page.tsx`

---

#### Bug 16: No Error Handling on API Fetch Calls

**Problem:** All `fetch()` calls in the application lacked `.catch()` handlers. If the API failed (network error, server error), the UI would silently fail with no user feedback.

**Fix:** Added comprehensive error handling throughout:

```typescript
fetch(`/api/products?${params}`)
  .then((res) => {
    if (!res.ok) throw new Error("Failed to fetch products");
    return res.json();
  })
  .then((data) => {
    setProducts(data.products);
    setLoading(false);
  })
  .catch((err) => {
    setError(err.message);
    setLoading(false);
  });
```

- Error state with "Try Again" button on the home page
- "Product not found" message with back navigation on the detail page
- Console warnings for non-critical failures (categories/subcategories)

**Why this approach:** Graceful degradation, users see a clear error message with an actionable recovery path instead of a blank or broken page.

**Files:** `app/page.tsx`, `app/product/[sku]/page.tsx`

---

#### Bug 17: No Input Validation on API `limit`/`offset`

**Problem:** The products API accepted any values for `limit` and `offset` without validation. A malicious user could request `?limit=999999` to dump the entire dataset, or use negative values causing unexpected behavior.

**Fix:** Added server-side validation and clamping:

```typescript
let limit = rawLimit ? parseInt(rawLimit, 10) : 20;
let offset = rawOffset ? parseInt(rawOffset, 10) : 0;

if (isNaN(limit) || limit < 1) limit = 1;
if (limit > 100) limit = 100; // Cap at 100
if (isNaN(offset) || offset < 0) offset = 0;
```

**Why this approach:** Defense in depth — even if the frontend sends valid values, the API should never trust client input. The 100-item cap prevents data dumping while being generous enough for legitimate use cases. Added `10` as the radix to `parseInt` to prevent octal parsing edge cases.

**File:** `app/api/products/route.ts`

---

#### Bug 18: Default SEO Metadata

**Problem:** The page title was "Create Next App" and the description was "Generated by create next app", the Next.js boilerplate defaults.

**Fix:** Updated to proper StackShop branding:

```typescript
export const metadata: Metadata = {
  title: "StackShop",
  description:
    "Browse thousands of products across categories. Find electronics, home goods, toys, and more at StackShop.",
};
```

**File:** `app/layout.tsx`

---

#### Bug 19: No Caching Strategy

**Problem:** Every page load triggered fresh API requests with no caching, even for data that rarely changes (categories, subcategories).

**Fix:** Added `Cache-Control` headers to all API responses:

- **Products:** `s-maxage=60, stale-while-revalidate=120` (1 minute cache, serves stale for up to 2 minutes while revalidating)
- **Categories/Subcategories:** `s-maxage=300, stale-while-revalidate=600` (5 minute cache, since category data rarely changes)

**Why this approach:** `stale-while-revalidate` provides the best of both worlds — immediate responses from cache plus background revalidation for freshness. The shorter TTL on products balances freshness with performance.

**Files:** `app/api/products/route.ts`, `app/api/categories/route.ts`, `app/api/subcategories/route.ts`

---

### 4. Minor Bugs (Architecture & Polish)

---

#### Bug 20: Product Detail Not Using Dynamic Route

**Problem:** The product detail page used `/product?product={...}` (static route with query parameter) instead of the Next.js convention of `/product/[sku]` (dynamic route). This hurt SEO and produced ugly, non-shareable URLs.

**Fix:** Created `app/product/[sku]/page.tsx` as a proper dynamic route. The SKU is extracted from the URL path using `useParams()`.

**File:** `app/product/[sku]/page.tsx` (new)

---

#### Bug 21: Duplicate Product Interface

**Problem:** The `Product` TypeScript interface was defined inconsistently in three files: `lib/products.ts`, `app/page.tsx`, and `app/product/page.tsx`. Each had slightly different fields, leading to type safety gaps (e.g., `retailPrice` was in the data but missing from the interfaces in page files).

**Fix:** Consolidated to a single `export interface Product` in `lib/products.ts` with all fields including `retailPrice`. All other files import from this single source:

```typescript
import type { Product } from "@/lib/products";
```

**Why this approach:** Single source of truth, any future field additions only need to be made in one place. Using `import type` ensures the interface is tree-shaken from production bundles.

**Files:** `lib/products.ts`, `app/page.tsx`, `app/product/[sku]/page.tsx`

---

#### Bug 22: Plain Text Loading State

**Problem:** While data loaded, users saw a bare "Loading products..." text string. This looked unfinished and gave no indication of the page layout to come.

**Fix:** Implemented skeleton loading screens for both pages:

- **Home page:** 8 animated skeleton cards matching the final product card layout (image placeholder, title lines, badge placeholders, price placeholder)
- **Detail page:** Skeleton image area, thumbnail row, and text blocks matching the final layout

**Why this approach:** Skeleton screens reduce perceived loading time because users see the page "structure" immediately. The pulsing animation (`animate-pulse`) communicates that content is loading without being distracting.

**Files:** `app/page.tsx`, `app/product/[sku]/page.tsx`

---

#### Bug 23: No Site Footer

**Problem:** The page had no footer, which is expected on any professional website for navigation links, legal information, and branding.

**Fix:** Added a responsive three-column footer with:

- Brand description
- Quick Links (Home, Products, Categories)
- Customer Service (Contact, Shipping, Returns)
- Copyright notice with dynamic year

**File:** `app/page.tsx`

---

#### Bug 24: Missing eCommerce Features on Detail Page

**Problem:** The product detail page lacked essential eCommerce elements — no price, no "Add to Cart" button, no wishlist, and no seller information.

**Fix:** Added to the product detail page:

- **Price display** — large formatted price (e.g., "$149.99")
- **"Add to Cart" button** — prominent primary button with shopping cart icon
- **Wishlist button** — heart icon outline button
- **Category badges** — showing both category and subcategory
- **SKU display** — product identifier below the title

**File:** `app/product/[sku]/page.tsx`

---

#### Bug 25: Image Thumbnail Overflow

**Problem:** Products with many images had thumbnails overflowing their container and breaking the layout.

**Fix:** Added horizontal scrolling to the thumbnail container:

```tsx
<div className="flex gap-2 overflow-x-auto pb-2">
```

Each thumbnail uses `flex-shrink-0` to prevent compression, and the `pb-2` provides space for the scrollbar.

**File:** `app/product/[sku]/page.tsx`

---


## Enhancements Beyond Bug Fixes

While primarily focused on fixing bugs, I also introduced several quality-of-life improvements:

1. **Searchable Category Combobox** — Custom component supporting real-time filtering across 136 categories, built with zero new dependencies
2. **Skeleton Loading Screens** — Skeleton UIs on both pages for better perceived performance
3. **Responsive Design** — Filters stack vertically on mobile, grid adjusts from 1 to 4 columns
4. **Smart Pagination** — Displays up to 7 page buttons intelligently centered around the current page
5. **Image Cycling** — Wrap-around image navigation (last → first) for continuous browsing
6. **Product Count Display** — "Showing 1–8 of 500 products" indicator for user orientation
7. **Automatic Filter Reset** — Page resets to 1 when any filter changes, preventing empty result sets

---

## Architecture Decisions

### Why a custom Combobox instead of a library?

Adding a library like `cmdk` (~15KB) for a single dropdown felt excessive. The custom component is ~130 lines, uses only existing project dependencies (Lucide icons, `cn` utility), and is tailored to the exact use case.

### Why `"all"` sentinel values instead of `undefined`?

Radix UI's `Select` component doesn't reliably reset its display when the controlled value is set to `undefined`. Using `"all"` as a sentinel value keeps the component fully controlled and provides a better mental model — the filter always has a value.

### Why client-side pagination instead of server-side?

The product dataset is 500 items loaded from a JSON file in memory; there's no database query cost to offset. Client-side pagination with proper `limit`/`offset` passed to the API is straightforward and avoids adding unnecessary complexity.

### Why fetch product by SKU instead of passing data via URL?

Server-fetching by SKU is the correct architectural pattern because:

- URLs stay clean and shareable
- Data integrity is guaranteed (can't be tampered with)
- The existing `/api/products/[sku]` route was already built but unused
- SEO benefits from semantic URLs

---
