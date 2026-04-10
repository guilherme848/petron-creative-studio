import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { getAuthUserOrNull } from "@/lib/auth";
import { logUsageEvent } from "@/lib/tracking";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET — lista criativos aprovados (default) ou todos
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("client_id");
    const showAll = searchParams.get("all") === "true";

    let query = supabase
      .from("creatives")
      .select("*, clients(name, segment)")
      .order("created_at", { ascending: false });

    if (!showAll) {
      query = query.eq("status", "approved");
    }

    if (clientId) {
      query = query.eq("client_id", clientId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH — aprovar criativos (marcar como exported/approved)
// Também grava um evento usage_events por criativo exportado, pro tracking
// no dashboard /admin (minutos economizados, custo, ranking por usuário).
export async function PATCH(request: Request) {
  try {
    const { ids } = await request.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "Missing creative ids" }, { status: 400 });
    }

    // Busca metadados dos criativos ANTES do update (pra pegar client_id)
    const { data: creatives } = await supabase
      .from("creatives")
      .select("id, client_id, promotion_id")
      .in("id", ids);

    const { error } = await supabase
      .from("creatives")
      .update({ status: "approved" })
      .in("id", ids);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Track: 1 evento export_creative por criativo aprovado
    const authUser = await getAuthUserOrNull();
    if (authUser && creatives) {
      await Promise.all(
        creatives.map((c: { id: string; client_id: string | null; promotion_id: string | null }) =>
          logUsageEvent({
            userId: authUser.localUserId,
            eventType: "export_creative",
            creativeId: c.id,
            clientId: c.client_id,
            outcome: "success",
            metadata: { promotion_id: c.promotion_id },
          })
        )
      );
    }

    return NextResponse.json({ approved: ids.length });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE — excluir criativo
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing creative id" }, { status: 400 });
    }

    const { error } = await supabase.from("creatives").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
