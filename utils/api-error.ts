import { ZodError } from "zod";

// --------------zod validation error type---------------
export type ValidationError = {
  path: string;
  message: string;
};

//-------------------api error type----------------------
export type ApiErrorResponse = {
  statusCode: number;
  message: string;
  success: false;
  errors: ValidationError[];
  data: null;
};

//-------------------ApiError Class----------------------
export class ApiError extends Error {
  public statusCode: number;
  public success: false = false;
  public errors: ValidationError[];
  public data: null = null;

  constructor(
    statusCode: number,
    message: string = "Something went wrong.",
    errors: ValidationError[] = [],
    stack?: string,
  ) {
    super(message);

    this.statusCode = statusCode;
    this.errors = errors;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  toJSON(): ApiErrorResponse {
    return {
      statusCode: this.statusCode,
      message: this.message,
      success: false,
      errors: this.errors,
      data: null,
    };
  }
}

//---------------zod -> ApiError ------------------
function zodToApiError(error: ZodError): ApiError {
  const errors: ValidationError[] = error.issues.map((err) => ({
    path: err.path.join("."),
    message: err.message,
  }));

  return new ApiError(400, "Validation failed", errors);
}

//----------------prisma -> ApiError---------------------
function prismaToApiError(error: any): ApiError {
  switch (error.code) {
    case "P2002":
      return new ApiError(409, "Duplicate field value", [
        {
          path: Array.isArray(error.meta?.target)
            ? error.meta.target.join(".")
            : "unknown",
          message: "This value already exists",
        },
      ]);

    case "P2025":
      return new ApiError(404, "Record not found");

    case "P2003":
      return new ApiError(400, "Invalid reference", [
        {
          path: "foreign_key",
          message: "Referenced record does not exist",
        },
      ]);

    default:
      return new ApiError(500, "Database error");
  }
}

//---------------universal error handler-----------------
export function handleApiError(error: unknown): {
  status: number;
  body: ApiErrorResponse;
} {
  if (error instanceof ZodError) {
    const apiError = zodToApiError(error);
    return {
      status: apiError.statusCode,
      body: apiError.toJSON(),
    };
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as any).code === "string" &&
    (error as any).code.startsWith("P")
  ) {
    const apiError = prismaToApiError(error);
    return { status: apiError.statusCode, body: apiError.toJSON() };
  }

  if (error instanceof ApiError) {
    return {
      status: error.statusCode,
      body: error.toJSON(),
    };
  }

  const fallback = new ApiError(500, "Internal Server Error");
  return {
    status: 500,
    body: fallback.toJSON(),
  };
}
