import {
  dataFailure,
  dataSuccess,
  mapDataFailure,
  supabase,
  type DataResult,
} from "@/lib/supabase";

async function call(
  name: "register_push_token" | "unregister_push_token",
  token: string,
): Promise<DataResult<null>> {
  try {
    const { error, status } = await supabase.rpc(name, { p_token: token });
    if (error !== null) {
      if (__DEV__) {
        console.log(`[bruno push] ${name} failed`, error.code, error.message);
      }
      return dataFailure(mapDataFailure(error, status));
    }
    return dataSuccess(null);
  } catch {
    return dataFailure("network");
  }
}

export function registerPushToken(token: string): Promise<DataResult<null>> {
  return call("register_push_token", token);
}

export function unregisterPushToken(token: string): Promise<DataResult<null>> {
  return call("unregister_push_token", token);
}
