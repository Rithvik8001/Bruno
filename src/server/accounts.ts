import { deliverAlreadyRegistered, deliverCode } from "./mailer";
import { supabaseAdmin, supabaseVerifier } from "./supabaseAdmin";

const existingAccountCodes = ["email_exists", "user_already_exists"];
const signupMarker = { signup_started: true };
const strayWindowMs = 30 * 1000;

async function issueCodeForExisting(
  email: string,
  password: string | null,
): Promise<void> {
  const admin = supabaseAdmin().auth.admin;
  const { data, error } = await admin.generateLink({
    type: "magiclink",
    email,
  });

  if (error !== null) {
    if (error.code === "user_not_found") {
      return;
    }
    throw error;
  }

  const user = data.user;
  const confirmed =
    user.email_confirmed_at !== undefined && user.email_confirmed_at !== null;

  if (confirmed) {
    await deliverAlreadyRegistered(email);
    return;
  }

  const startedSignUp = user.app_metadata?.signup_started === true;
  if (!startedSignUp && password === null) {
    const age = Date.now() - new Date(user.created_at).getTime();
    if (age < strayWindowMs) {
      await admin.deleteUser(user.id);
    }
    return;
  }

  if (password === null) {
    await deliverCode(email, data.properties.email_otp);
    return;
  }

  const update = await admin.updateUserById(user.id, {
    password,
    app_metadata: signupMarker,
  });
  if (update.error !== null) {
    throw update.error;
  }
  const issued = await admin.generateLink({ type: "magiclink", email });
  if (issued.error !== null) {
    throw issued.error;
  }
  await deliverCode(email, issued.data.properties.email_otp);
}

export async function startSignUp(
  email: string,
  password: string,
): Promise<void> {
  const admin = supabaseAdmin().auth.admin;
  const { data, error } = await admin.generateLink({
    type: "signup",
    email,
    password,
  });

  if (error === null) {
    const update = await admin.updateUserById(data.user.id, {
      password,
      app_metadata: signupMarker,
    });
    if (update.error !== null) {
      throw update.error;
    }
    const issued = await admin.generateLink({ type: "signup", email, password });
    if (issued.error !== null) {
      throw issued.error;
    }
    await deliverCode(email, issued.data.properties.email_otp);
    return;
  }

  if (error.code !== undefined && existingAccountCodes.includes(error.code)) {
    await issueCodeForExisting(email, password);
    return;
  }

  throw error;
}

export async function resendSignUpCode(email: string): Promise<void> {
  await issueCodeForExisting(email, null);
}

export async function startPasswordReset(email: string): Promise<void> {
  const admin = supabaseAdmin().auth.admin;
  const { data, error } = await admin.generateLink({ type: "recovery", email });

  if (error !== null) {
    if (error.code === "user_not_found") {
      return;
    }
    throw error;
  }
  await deliverCode(email, data.properties.email_otp);
}

export class InvalidResetCodeError extends Error {}

export async function confirmPasswordReset(
  email: string,
  token: string,
  password: string,
): Promise<void> {
  const verifier = supabaseVerifier();
  const { data, error } = await verifier.auth.verifyOtp({
    email,
    token,
    type: "recovery",
  });

  if (error !== null || data.session === null) {
    throw new InvalidResetCodeError();
  }

  const admin = supabaseAdmin().auth.admin;
  const update = await admin.updateUserById(data.session.user.id, { password });
  if (update.error !== null) {
    throw update.error;
  }
  await admin.signOut(data.session.access_token, "global");
}
