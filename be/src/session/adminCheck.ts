import { getSession } from "./index";
import { ApiRequest } from "../types";
import { ddb } from "../__generated/db";

// Hardcoded admin provider IDs  
const ADMIN_PROVIDER_IDS = new Set([
  "google:108731783381066958153", // namse's Google ID
  "twitter:1323617848879583233", // namse's Twitter ID
]);

export const isAdmin = async (req: ApiRequest): Promise<boolean> => {
  const session = await getSession(req);
  if (!session) {
    return false; // 로그인하지 않은 것은 비즈니스 로직상 관리자가 아님
  }

  // 에러가 발생하면 그대로 throw하여 호출자가 적절히 처리하도록 함
  const { items: identities } = await ddb.queryIdentitiesOfUser({
    id: session.userId,
    limit: 10
  });

  // Check if any identity matches admin provider IDs
  return identities.some(identity => 
    ADMIN_PROVIDER_IDS.has(`${identity.provider}:${identity.providerId}`)
  );
};