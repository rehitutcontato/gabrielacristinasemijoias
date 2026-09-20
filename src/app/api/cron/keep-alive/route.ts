import { supabase } from '../../../../lib/supabase.js';

// Força execução dinâmica no Next.js App Router (desativa cache da Vercel)
export const dynamic = 'force-dynamic';

export interface KeepAliveResponse {
  status: 'success' | 'error';
  message: string;
  timestamp: string;
  error?: unknown;
}

/**
 * Endpoint de Keep-Alive executado periodicamente via Vercel Cron.
 * Realiza uma consulta ultraleve no banco Supabase para prevenir
 * o congelamento automático por inatividade no plano gratuito.
 */
export async function GET(req: Request): Promise<Response> {
  // 1. Validação opcional de segurança com CRON_SECRET
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return Response.json(
      {
        status: 'error',
        message: 'Unauthorized: token inválido ou ausente',
        timestamp: new Date().toISOString(),
      } satisfies KeepAliveResponse,
      { status: 401 }
    );
  }

  // 2. Consulta ultraleve no Supabase (apenas o id de 1 registro)
  try {
    const { data, error } = await supabase
      .from('produtos')
      .select('id')
      .limit(1);

    if (error) {
      console.error('[CRON Keep-Alive] Erro na consulta do Supabase:', error);
      return Response.json(
        {
          status: 'error',
          message: 'Database query failed',
          error: error.message || error,
          timestamp: new Date().toISOString(),
        } satisfies KeepAliveResponse,
        { status: 500 }
      );
    }

    // 3. Sucesso na execução do ping
    return Response.json(
      {
        status: 'success',
        message: 'Database pinged successfully',
        timestamp: new Date().toISOString(),
      } satisfies KeepAliveResponse,
      { status: 200 }
    );
  } catch (err: any) {
    console.error('[CRON Keep-Alive] Exceção não tratada:', err);
    return Response.json(
      {
        status: 'error',
        message: 'Internal server error during keep-alive ping',
        error: err?.message || String(err),
        timestamp: new Date().toISOString(),
      } satisfies KeepAliveResponse,
      { status: 500 }
    );
  }
}
