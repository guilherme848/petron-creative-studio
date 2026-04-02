import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

function generateUniqueName(originalName: string): string {
  const ext = originalName.split(".").pop() || "png";
  const random = Math.random().toString(36).substring(2, 10);
  return `${Date.now()}-${random}.${ext}`;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("client_id");

    let query = supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (clientId) {
      query = query.eq("client_id", clientId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const imageFile = formData.get("image") as File | null;
    const productDataRaw = formData.get("data") as string | null;

    if (!productDataRaw) {
      return NextResponse.json(
        { error: "Missing product data" },
        { status: 400 }
      );
    }

    const productData = JSON.parse(productDataRaw);

    let imageUrl: string | null = null;

    if (imageFile) {
      const fileName = generateUniqueName(imageFile.name);
      const arrayBuffer = await imageFile.arrayBuffer();
      const buffer = new Uint8Array(arrayBuffer);

      const { error: uploadError } = await supabase.storage
        .from("products")
        .upload(fileName, buffer, {
          contentType: imageFile.type,
          upsert: false,
        });

      if (uploadError) {
        return NextResponse.json(
          { error: `Image upload failed: ${uploadError.message}` },
          { status: 500 }
        );
      }

      imageUrl = `${SUPABASE_URL}/storage/v1/object/public/products/${fileName}`;
    }

    const { data: product, error: productError } = await supabase
      .from("products")
      .insert({
        client_id: productData.client_id || null,
        name: productData.name,
        description: productData.description || null,
        category: productData.category || null,
        brand: productData.brand || null,
        image_url: imageUrl,
        image_treated_url: null,
      })
      .select()
      .single();

    if (productError) {
      return NextResponse.json(
        { error: `Product creation failed: ${productError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(product, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
