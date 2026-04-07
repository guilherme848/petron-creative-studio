import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const ERP_API_URL = process.env.PETRON_ERP_API_URL;
const ERP_API_KEY = process.env.PETRON_ERP_API_KEY;

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

// GET — lista contas do ERP para seleção
export async function GET() {
  if (!ERP_API_URL || !ERP_API_KEY) {
    return NextResponse.json(
      { error: "Integração com ERP não configurada. Verifique PETRON_ERP_API_URL e PETRON_ERP_API_KEY." },
      { status: 500 }
    );
  }

  try {
    // Buscar contas ativas do ERP
    const erpRes = await fetch(`${ERP_API_URL}/accounts?status=active&deleted_at=null&limit=200`, {
      headers: { "x-api-key": ERP_API_KEY },
    });

    if (!erpRes.ok) {
      const err = await erpRes.json().catch(() => ({}));
      return NextResponse.json(
        { error: `Erro ao buscar contas do ERP: ${err.error || erpRes.statusText}` },
        { status: erpRes.status }
      );
    }

    const erpAccounts = await erpRes.json();

    // Buscar clientes já importados no Creative Studio
    const { data: existingClients } = await supabase
      .from("clients")
      .select("erp_account_id")
      .not("erp_account_id", "is", null);

    const importedIds = new Set(
      (existingClients || []).map((c: { erp_account_id: string }) => c.erp_account_id)
    );

    // Marcar quais já foram importados
    const accounts = erpAccounts.map((acc: Record<string, unknown>) => ({
      id: acc.id,
      name: acc.name,
      niche: acc.niche,
      cpf_cnpj: acc.cpf_cnpj,
      contact_name: acc.contact_name,
      contact_phone: acc.contact_phone,
      city: acc.city,
      state: acc.state,
      already_imported: importedIds.has(acc.id as string),
    }));

    return NextResponse.json(accounts);
  } catch (err) {
    return NextResponse.json(
      { error: "Erro de conexão com o ERP" },
      { status: 500 }
    );
  }
}

// POST — importar contas selecionadas
export async function POST(request: Request) {
  if (!ERP_API_URL || !ERP_API_KEY) {
    return NextResponse.json(
      { error: "Integração com ERP não configurada." },
      { status: 500 }
    );
  }

  try {
    const { account_ids } = await request.json();

    if (!Array.isArray(account_ids) || account_ids.length === 0) {
      return NextResponse.json(
        { error: "Selecione ao menos uma conta para importar." },
        { status: 400 }
      );
    }

    const results: { imported: string[]; skipped: string[]; errors: string[] } = {
      imported: [],
      skipped: [],
      errors: [],
    };

    for (const accountId of account_ids) {
      // Verificar se já foi importado
      const { data: existing } = await supabase
        .from("clients")
        .select("id")
        .eq("erp_account_id", accountId)
        .maybeSingle();

      if (existing) {
        results.skipped.push(accountId);
        continue;
      }

      // Buscar dados completos da conta no ERP
      const erpRes = await fetch(`${ERP_API_URL}/accounts/${accountId}`, {
        headers: { "x-api-key": ERP_API_KEY },
      });

      if (!erpRes.ok) {
        results.errors.push(accountId);
        continue;
      }

      const account = await erpRes.json();

      // Criar cliente no Creative Studio
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
        })
        .select()
        .single();

      if (clientError) {
        results.errors.push(accountId);
        continue;
      }

      // Criar brand_config vazia (será preenchida depois com logo e cores)
      await supabase.from("brand_configs").insert({
        client_id: client.id,
        logo_url: null,
        colors: [],
        fonts: {},
      });

      results.imported.push(account.name);
    }

    return NextResponse.json(results);
  } catch (err) {
    return NextResponse.json(
      { error: "Erro interno ao importar clientes" },
      { status: 500 }
    );
  }
}
