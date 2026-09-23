import {
  deliverAccountDeleted,
  deliverAlreadyRegistered,
  deliverPasswordChanged,
  deliverResetCode,
  deliverSignupCode,
  deliverWelcome,
} from "./mailer";
import { supabaseAdmin, supabaseVerifier } from "./supabaseAdmin";

export class UnauthorizedError extends Error {}

export class MailFailedError extends Error {}

export class AccountExistsError extends Error {}

const existingAccountCodes = ["email_exists", "user_already_exists"];
const welcomeSentinel = "2000-01-01";

async function sendCodeOrThrow(delivery: Promise<boolean>): Promise<void> {
  if (!(await delivery)) {
    throw new MailFailedError();
  }
}
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
    if (password !== null) {
      throw new AccountExistsError();
    }
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
    await sendCodeOrThrow(deliverSignupCode(email, data.properties.email_otp));
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
  await sendCodeOrThrow(
    deliverSignupCode(email, issued.data.properties.email_otp),
  );
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
    await sendCodeOrThrow(
      deliverSignupCode(email, issued.data.properties.email_otp),
    );
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
  await sendCodeOrThrow(deliverResetCode(email, data.properties.email_otp));
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
  await deliverPasswordChanged(email);
}


export async function deleteAccount(accessToken: string): Promise<void> {
  const auth = supabaseAdmin().auth;
  const { data, error } = await auth.getUser(accessToken);
  if (error !== null || data.user === null) {
    throw new UnauthorizedError();
  }
  const email = data.user.email ?? null;
  const removed = await auth.admin.deleteUser(data.user.id);
  if (removed.error !== null) {
    throw removed.error;
  }
  if (email !== null) {
    await deliverAccountDeleted(email);
  }
}

export async function sendWelcome(accessToken: string): Promise<void> {
  const client = supabaseAdmin();
  const { data, error } = await client.auth.getUser(accessToken);
  if (error !== null || data.user === null || data.user.email === undefined) {
    throw new UnauthorizedError();
  }

  const claim = await client.rpc("claim_notification", {
    p_user_id: data.user.id,
    p_subscription_id: null,
    p_kind: "welcome",
    p_due_on: welcomeSentinel,
    p_channel: "email",
  });
  if (claim.error !== null) {
    throw claim.error;
  }
  if (claim.data !== true) {
    return;
  }
  await deliverWelcome(data.user.email, data.user.id);
}
