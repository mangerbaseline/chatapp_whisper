import dbConnect from "@/lib/dbConnect";
import TokenPlan from "@/models/TokenPlan";
import { apiSuccess } from "@/utils/api-response";
import { withApiHandler } from "@/utils/withApiHandler";

export const GET = withApiHandler(async () => {
  await dbConnect();
  const plans = await TokenPlan.find({ isActive: true }).sort({ price: 1 });
  return apiSuccess(200, plans, "Plans fetched successfully.");
});
