import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const WEBHOOK_SECRET = process.env.ERP_WEBHOOK_SECRET;

// ERP Supabase — para buscar dados completos
const ERP_SUPABASE_URL = process.env.PETRON_ERP_SUPABASE_URL;
const ERP_SERVICE_ROLE_KEY = process.env.PETRON_ERP_SERVICE_ROLE_KEY;

function buildAddress(account: Record<string, unknown>): string | null {
  const parts = [
    account.street,
    account.street_number,
    account.neighborhood,
    account.city,
    account.state,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : null;
}

// POST — chamado pelo trigger do ERP quando uma conta é criada/atualizada
export async function POST(request: Request) {
  // Validar webhook secret
  const authHeader = request.headers.get("x-webhook-secret");
  if (!WEBHOOK_SECRET || authHeader !== WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = await request.json();
    const { type, record } = payload;

    if (!record || !record.id) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const accountId = record.id;
    const status = record.status;

    // Se o status não for active, ignorar
    if (status !== "active") {
      return NextResponse.json({ skipped: true, reason: "not active" });
    }

    // Verificar se já existe no Creative Studio
    const { data: existing } = await supabase
      .from("clients")
      .select("id")
      .eq("erp_account_id", accountId)
      .maybeSingle();

    if (existing && type === "INSERT") {
      return NextResponse.json({ skipped: true, reason: "already exists" });
    }

    // Buscar dados completos da conta no ERP via Supabase client
    let account = record;
    if (ERP_SUPABASE_URL && ERP_SERVICE_ROLE_KEY) {
      const erp = createClient(ERP_SUPABASE_URL, ERP_SERVICE_ROLE_KEY);
      const { data } = await erp
        .from("accounts")
        .select("*")
        .eq("id", accountId)
        .single();
      if (data) account = data;
    }

    if (existing) {
      // UPDATE — atualizar dados do cliente existente
      await supabase
        .from("clients")
        .update({
          name: account.name,
          segment: account.niche || null,
          cnpj: account.cpf_cnpj || null,
          contact: account.contact_name || null,
          address: buildAddress(account),
          whatsapp_link: account.contact_phone || null,
          service: account.service_contracted || null,
        })
        .eq("erp_account_id", accountId);

      return NextResponse.json({ updated: true, name: account.name });
    }

    // INSERT — criar novo cliente
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .insert({
        name: account.name,
        segment: account.niche || null,
        cnpj: account.cpf_cnpj || null,
        contact: account.contact_name || null,
        address: buildAddress(account),
        whatsapp_link: account.contact_phone || null,
        erp_account_id: accountId,
        service: account.service_contracted || null,
      })
      .select()
      .single();

    if (clientError) {
      return NextResponse.json(
        { error: clientError.message },
        { status: 500 }
      );
    }

    // Criar brand_config vazia
    await supabase.from("brand_configs").insert({
      client_id: client.id,
      logo_url: null,
      colors: [],
      fonts: {},
    });

    return NextResponse.json({ created: true, name: account.name });
  } catch {
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
