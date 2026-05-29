"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Grava o token de push do dispositivo no perfil do utilizador autenticado.
 * Chamado pelo NativeProvider depois de PushNotifications.register() emitir
 * o evento "registration". No-op silencioso se não houver sessão.
 */
export async function savePushToken(
  token: string,
  platform: string,
): Promise<{ ok: boolean }> {
  if (!token || typeof token !== "string") return { ok: false };
  const safePlatform = platform === "ios" || platform === "android" ? platform : null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  // RPC SECURITY DEFINER: só toca nas colunas de push, sem expor UPDATE em profiles.
  const { error } = await supabase.rpc("save_push_token", {
    p_token: token,
    p_platform: safePlatform,
  });

  if (error) {
    console.error("[push] savePushToken", error.message);
    return { ok: false };
  }
  return { ok: true };
}
