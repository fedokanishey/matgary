import { jwtVerify, SignJWT } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "super_secret_for_development_only";
const encodedSecret = new TextEncoder().encode(JWT_SECRET);

export interface CustomerJwtPayload {
  customerId: string;
  storeId: string;
  iat?: number;
  exp?: number;
}

export async function signCustomerAccessToken(payload: Partial<CustomerJwtPayload>) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(encodedSecret);
}

export async function signCustomerRefreshToken(payload: Partial<CustomerJwtPayload>) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    // By default 7 days, could be longer if "Remember Me"
    .setExpirationTime(payload.exp ? payload.exp : "7d")
    .sign(encodedSecret);
}

export async function verifyCustomerToken(token: string): Promise<CustomerJwtPayload> {
  const { payload } = await jwtVerify(token, encodedSecret);
  return payload as unknown as CustomerJwtPayload;
}
