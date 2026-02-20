import { NextResponse } from "next/server";

class ApiResponse<T = unknown> {
  constructor(
    public statusCode: number,
    public data: T,
    public message: string = "Success",
  ) {}

  success = this.statusCode < 400;
}

export function apiSuccess<T>(statusCode: number, data: T, message?: string) {
  const response = new ApiResponse(statusCode, data, message);
  return NextResponse.json(response, { status: statusCode });
}
