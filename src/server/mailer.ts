function assertDevelopment(): void {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Email delivery is not configured");
  }
}

export async function deliverCode(email: string, code: string): Promise<void> {
  assertDevelopment();
  console.log(`[bruno auth] verification code for ${email}: ${code}`);
}

export async function deliverAlreadyRegistered(email: string): Promise<void> {
  assertDevelopment();
  console.log(`[bruno auth] ${email} is already registered, no code issued`);
}
