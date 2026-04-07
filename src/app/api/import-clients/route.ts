import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ERP Supabase — acesso direto via PostgREST (service role)
const ERP_SUPABASE_URL = process.env.PETRON_ERP_SUPABASE_URL;
const ERP_SERVICE_ROLE_KEY = process.env.PETRON_ERP_SERVICE_ROLE_KEY;

function erpClient() {
  if (!ERP_SUPABASE_URL || !ERP_SERVICE_ROLE_KEY) return null;
  return createClient(ERP_SUPABASE_URL, ERP_SERVICE_ROLE_KEY);
}

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
  const erp = erpClient();
  if (!erp) {
    return NextResponse.json(
      { error: "Integração com ERP não configurada. Verifique PETRON_ERP_SUPABASE_URL e PETRON_ERP_SERVICE_ROLE_KEY." },
      { status: 500 }
    );
  }

  try {
    // Buscar contas ativas do ERP
    const { data: erpAccounts, error: erpError } = await erp
      .from("accounts")
      .select("id, name, niche, cpf_cnpj, contact_name, contact_phone, city, state, street, street_number, neighborhood")
      .eq("status", "active")
      .is("deleted_at", null)
      .order("name")
      .limit(200);

    if (erpError) {
      return NextResponse.json(
        { error: `Erro ao buscar contas do ERP: ${erpError.message}` },
        { status: 500 }
      );
    }

    // Buscar clientes já importados no Creative Studio
    const { data: existingClients } = await supabase
      .from("clients")
      .select("erp_account_id")
      .not("erp_account_id", "is", null);

    const importedIds = new Set(
      (existingClients || []).map((c: { erp_account_id: string }) => c.erp_account_id)
    );

    // Marcar quais já foram importados
    const accounts = (erpAccounts || []).map((acc: Record<string, unknown>) => ({
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
  } catch {
    return NextResponse.json(
      { error: "Erro de conexão com o ERP" },
      { status: 500 }
    );
  }
}

// POST — importar contas selecionadas
export async function POST(request: Request) {
  const erp = erpClient();
  if (!erp) {
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

    // Buscar todos os dados de uma vez
    const { data: erpAccounts, error: erpError } = await erp
      .from("accounts")
      .select("*")
      .in("id", account_ids);

    if (erpError || !erpAccounts) {
      return NextResponse.json(
        { error: "Erro ao buscar dados do ERP" },
        { status: 500 }
      );
    }

    const results: { imported: string[]; skipped: string[]; errors: string[] } = {
      imported: [],
      skipped: [],
      errors: [],
    };

    for (const account of erpAccounts) {
      // Verificar se já foi importado
      const { data: existing } = await supabase
        .from("clients")
        .select("id")
        .eq("erp_account_id", account.id)
        .maybeSingle();

      if (existing) {
        results.skipped.push(account.id);
        continue;
      }

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
          erp_account_id: account.id,
          service: account.service_contracted || null,
        })
        .select()
        .single();

      if (clientError) {
        results.errors.push(account.id);
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
  } catch {
    return NextResponse.json(
      { error: "Erro interno ao importar clientes" },
      { status: 500 }
    );
  }
}
