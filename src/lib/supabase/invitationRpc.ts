import type { SupabaseClient } from '@supabase/supabase-js';

const SIGNATURE_MISMATCH = /Could not find the function|schema cache/i;

type RpcError = {
  code?: string | null;
  message?: string | null;
} | null;

function isSignatureMismatch(error: RpcError) {
  return Boolean(
    error &&
    (error.code === 'PGRST202' || SIGNATURE_MISMATCH.test(error.message || ''))
  );
}

export async function verifyInvitationRpc(supabase: SupabaseClient, token: string) {
  const primary = await supabase.rpc('verify_invitation', { p_token: token });
  if (!isSignatureMismatch(primary.error)) {
    return primary;
  }
  return supabase.rpc('verify_invitation', { token });
}

export async function consumeInvitationRpc(
  supabase: SupabaseClient,
  params: { token: string; userId: string; firstName: string; lastName: string }
) {
  const primary = await supabase.rpc('consume_invitation', {
    p_token: params.token,
    p_user_id: params.userId,
    p_first_name: params.firstName,
    p_last_name: params.lastName,
  });

  if (!isSignatureMismatch(primary.error)) {
    return primary;
  }

  return supabase.rpc('consume_invitation', {
    token: params.token,
    user_id: params.userId,
    first_name: params.firstName,
    last_name: params.lastName,
  });
}
