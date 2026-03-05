import { NextRequest, NextResponse } from "next/server";
import { productService } from "@/lib/products";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  // Validate and clamp limit/offset to safe ranges
  const rawLimit = searchParams.get("limit");
  const rawOffset = searchParams.get("offset");

  let limit = rawLimit ? parseInt(rawLimit, 10) : 20;
  let offset = rawOffset ? parseInt(rawOffset, 10) : 0;

  // Guard against invalid or malicious values
  if (isNaN(limit) || limit < 1) limit = 1;
  if (limit > 100) limit = 100;
  if (isNaN(offset) || offset < 0) offset = 0;

  const filters = {
    category: searchParams.get("category") || undefined,
    subCategory: searchParams.get("subCategory") || undefined,
    search: searchParams.get("search") || undefined,
    limit,
    offset,
  };

  const products = productService.getAll(filters);
  const total = productService.getTotalCount({
    category: filters.category,
    subCategory: filters.subCategory,
    search: filters.search,
  });

  return NextResponse.json(
    {
      products,
      total,
      limit: filters.limit,
      offset: filters.offset,
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    },
  );
}
