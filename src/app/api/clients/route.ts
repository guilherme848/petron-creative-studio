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
      .from("clients")
      .select("*, brand_configs(*)")
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
      return NextResponse.json({ error: "Missing client id" }, { status: 400 });
    }

    // Deletar brand_configs primeiro (cascade manual, caso não haja cascade no banco)
    await supabase.from("brand_configs").delete().eq("client_id", id);

    const { error } = await supabase.from("clients").delete().eq("id", id);

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

    const logoFile = formData.get("logo") as File | null;
    const clientDataRaw = formData.get("data") as string | null;

    if (!clientDataRaw) {
      return NextResponse.json(
        { error: "Missing client data" },
        { status: 400 }
      );
    }

    const clientData = JSON.parse(clientDataRaw);

    if (!clientData.name || !clientData.name.trim()) {
      return NextResponse.json(
        { error: "O nome do cliente é obrigatório" },
        { status: 400 }
      );
    }

    let logoUrl: string | null = null;

    if (logoFile) {
      const fileName = generateUniqueName(logoFile.name);
      const arrayBuffer = await logoFile.arrayBuffer();
      const buffer = new Uint8Array(arrayBuffer);

      const { error: uploadError } = await supabase.storage
        .from("logos")
        .upload(fileName, buffer, {
          contentType: logoFile.type,
          upsert: false,
        });

      if (uploadError) {
        return NextResponse.json(
          { error: `Logo upload failed: ${uploadError.message}` },
          { status: 500 }
        );
      }

      logoUrl = `${SUPABASE_URL}/storage/v1/object/public/logos/${fileName}`;
    }

    // Insert client
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .insert({
        name: clientData.name,
        segment: clientData.segment || null,
        cnpj: clientData.cnpj || null,
        contact: clientData.contact || null,
        address: clientData.address || null,
        whatsapp_link: clientData.whatsapp_link || null,
      })
      .select()
      .single();

    if (clientError) {
      return NextResponse.json(
        { error: `Client creation failed: ${clientError.message}` },
        { status: 500 }
      );
    }

    // Insert brand_config
    const { data: brandConfig, error: brandError } = await supabase
      .from("brand_configs")
      .insert({
        client_id: client.id,
        logo_url: logoUrl,
        colors: clientData.colors || [],
        fonts: clientData.fonts || [],
      })
      .select()
      .single();

    if (brandError) {
      return NextResponse.json(
        { error: `Brand config creation failed: ${brandError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { ...client, brand_configs: [brandConfig] },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const formData = await request.formData();

    const logoFile = formData.get("logo") as File | null;
    const clientDataRaw = formData.get("data") as string | null;

    if (!clientDataRaw) {
      return NextResponse.json(
        { error: "Missing client data" },
        { status: 400 }
      );
    }

    const clientData = JSON.parse(clientDataRaw);

    if (!clientData.id) {
      return NextResponse.json(
        { error: "Missing client id" },
        { status: 400 }
      );
    }

    if (!clientData.name || !clientData.name.trim()) {
      return NextResponse.json(
        { error: "O nome do cliente é obrigatório" },
        { status: 400 }
      );
    }

    let logoUrl: string | undefined = undefined;

    if (logoFile) {
      const fileName = generateUniqueName(logoFile.name);
      const arrayBuffer = await logoFile.arrayBuffer();
      const buffer = new Uint8Array(arrayBuffer);

      const { error: uploadError } = await supabase.storage
        .from("logos")
        .upload(fileName, buffer, {
          contentType: logoFile.type,
          upsert: false,
        });

      if (uploadError) {
        return NextResponse.json(
          { error: `Logo upload failed: ${uploadError.message}` },
          { status: 500 }
        );
      }

      logoUrl = `${SUPABASE_URL}/storage/v1/object/public/logos/${fileName}`;
    }

    // Update client
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .update({
        name: clientData.name,
        segment: clientData.segment || null,
        cnpj: clientData.cnpj || null,
        contact: clientData.contact || null,
        address: clientData.address || null,
        whatsapp_link: clientData.whatsapp_link || null,
      })
      .eq("id", clientData.id)
      .select()
      .single();

    if (clientError) {
      return NextResponse.json(
        { error: `Client update failed: ${clientError.message}` },
        { status: 500 }
      );
    }

    // Update brand_config
    const brandUpdateData: Record<string, unknown> = {
      colors: clientData.colors || [],
      fonts: clientData.fonts || [],
    };

    if (logoUrl !== undefined) {
      brandUpdateData.logo_url = logoUrl;
    }

    const { data: brandConfig, error: brandError } = await supabase
      .from("brand_configs")
      .update(brandUpdateData)
      .eq("client_id", clientData.id)
      .select()
      .single();

    if (brandError) {
      // Se não existe brand_config, criar uma nova
      const { data: newBrandConfig, error: newBrandError } = await supabase
        .from("brand_configs")
        .insert({
          client_id: clientData.id,
          logo_url: logoUrl || null,
          colors: clientData.colors || [],
          fonts: clientData.fonts || [],
        })
        .select()
        .single();

      if (newBrandError) {
        return NextResponse.json(
          { error: `Brand config update failed: ${newBrandError.message}` },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { ...client, brand_configs: [newBrandConfig] },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { ...client, brand_configs: [brandConfig] },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
