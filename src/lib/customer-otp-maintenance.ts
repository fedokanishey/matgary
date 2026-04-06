import { prisma } from "@/lib/prisma";

type SignupOtpDeleteDelegate = {
  deleteMany: (args: { where: { expiresAt: { lt: Date } } }) => Promise<unknown>;
};

let ttlEnsured = false;

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return String(error);
}

async function ensureCollectionTtlIndex(collectionName: string) {
  try {
    await prisma.$runCommandRaw({
      collMod: collectionName,
      index: {
        keyPattern: { expiresAt: 1 },
        expireAfterSeconds: 0,
      },
    });
    return;
  } catch (error) {
    const message = getErrorMessage(error).toLowerCase();
    const canCreateIndex =
      message.includes("namespace does not exist") ||
      message.includes("ns does not exist") ||
      message.includes("cannot find index") ||
      message.includes("index not found");

    if (!canCreateIndex) {
      throw error;
    }
  }

  await prisma.$runCommandRaw({
    createIndexes: collectionName,
    indexes: [
      {
        key: { expiresAt: 1 },
        name: `${collectionName}_expiresAt_idx`,
        expireAfterSeconds: 0,
      },
    ],
  });
}

export async function maintainCustomerOtpStorage() {
  const now = new Date();

  const signupOtpModel = (
    prisma as unknown as { customerSignupOtp: SignupOtpDeleteDelegate }
  ).customerSignupOtp;

  await Promise.all([
    prisma.customerPasswordOtp.deleteMany({
      where: {
        expiresAt: { lt: now },
      },
    }),
    signupOtpModel.deleteMany({
      where: {
        expiresAt: { lt: now },
      },
    }),
  ]);

  if (ttlEnsured) return;
  ttlEnsured = true;

  try {
    await ensureCollectionTtlIndex("CustomerPasswordOtp");
    await ensureCollectionTtlIndex("CustomerSignupOtp");
  } catch (error) {
    console.warn("[OTP_MAINTENANCE] Failed to ensure TTL indexes", error);
  }
}
