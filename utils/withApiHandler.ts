import { NextResponse, NextRequest } from "next/server";
import { handleApiError } from "./api-error";

type RouteContext<T = any> = {
  params: Promise<T>;
};

export function withApiHandler<TParams = any>(
  handler: (
    req: NextRequest,
    context: RouteContext<TParams>,
  ) => Promise<NextResponse>,
) {
  return async function (
    req: NextRequest,
    context: RouteContext<TParams>,
  ): Promise<NextResponse> {
    try {
      return await handler(req, context);
    } catch (error) {
      const { status, body } = handleApiError(error);
      return NextResponse.json(body, { status });
    }
  };
}
