import { NextRequest, NextResponse } from "next/server";
import { productService } from "@/lib/products";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const category = searchParams.get("category") || undefined;

  const subCategories = productService.getSubCategories(category);
  return NextResponse.json(
    { subCategories },
    {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    },
  );
}
