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

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("promotions")
      .select("*, promotion_items(*)")
      .order("created_at", { ascending: false });

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

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing promotion id" }, { status: 400 });
    }

    // Deletar promotion_items primeiro
    await supabase.from("promotion_items").delete().eq("promotion_id", id);

    const { error } = await supabase.from("promotions").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
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

    const sealFile = formData.get("seal") as File | null;
    const promotionDataRaw = formData.get("data") as string | null;

    if (!promotionDataRaw) {
      return NextResponse.json(
        { error: "Missing promotion data" },
        { status: 400 }
      );
    }

    const promotionData = JSON.parse(promotionDataRaw);

    let sealUrl: string | null = null;

    if (sealFile) {
      const fileName = generateUniqueName(sealFile.name);
      const arrayBuffer = await sealFile.arrayBuffer();
      const buffer = new Uint8Array(arrayBuffer);

      const { error: uploadError } = await supabase.storage
        .from("seals")
        .upload(fileName, buffer, {
          contentType: sealFile.type,
          upsert: false,
        });

      if (uploadError) {
        return NextResponse.json(
          { error: `Seal upload failed: ${uploadError.message}` },
          { status: 500 }
        );
      }

      sealUrl = `${SUPABASE_URL}/storage/v1/object/public/seals/${fileName}`;
    }

    // Insert promotion
    const { data: promotion, error: promotionError } = await supabase
      .from("promotions")
      .insert({
        client_id: promotionData.client_id || null,
        name: promotionData.name,
        seal_url: sealUrl || promotionData.seal_url || null,
        start_date: promotionData.start_date || null,
        end_date: promotionData.end_date || null,
        subtitle: promotionData.subtitle || null,
      })
      .select()
      .single();

    if (promotionError) {
      return NextResponse.json(
        { error: `Promotion creation failed: ${promotionError.message}` },
        { status: 500 }
      );
    }

    // Insert promotion items
    let promotionItems: unknown[] = [];

    if (promotionData.items && Array.isArray(promotionData.items) && promotionData.items.length > 0) {
      const itemsToInsert = promotionData.items.map(
        (item: {
          product_name: string;
          price_type: string;
          price: number;
          previous_price?: number;
          unit?: string;
          payment_condition?: string;
        }) => ({
          promotion_id: promotion.id,
          product_name: item.product_name,
          price_type: item.price_type,
          price: item.price,
          previous_price: item.previous_price || null,
          unit: item.unit || null,
          payment_condition: item.payment_condition || null,
        })
      );

      const { data: items, error: itemsError } = await supabase
        .from("promotion_items")
        .insert(itemsToInsert)
        .select();

      if (itemsError) {
        return NextResponse.json(
          { error: `Promotion items creation failed: ${itemsError.message}` },
          { status: 500 }
        );
      }

      promotionItems = items || [];
    }

    return NextResponse.json(
      { ...promotion, promotion_items: promotionItems },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
