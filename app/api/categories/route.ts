import { NextResponse } from "next/server";
import { productService } from "@/lib/products";

export async function GET() {
  const categories = productService.getCategories();
  return NextResponse.json(
    { categories },
    {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    },
  );
}
