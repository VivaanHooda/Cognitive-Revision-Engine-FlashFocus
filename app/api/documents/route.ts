import { NextRequest } from "next/server";
import { GET as ingestGET } from "../ingest/route";

export async function GET(req: NextRequest) {
  return ingestGET(req);
}
