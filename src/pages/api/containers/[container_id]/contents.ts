import type { APIRoute } from "astro";
import { ContainerService } from "../../../../lib/services/container.service.js";
import { createErrorResponse, createSuccessResponse, validateAuthToken } from "../../../../lib/auth.utils.js";
import { createSupabaseServerClient } from "../../../../lib/auth/supabase-server.js";
import { isValidUUID } from "../../../../lib/validation.utils.js";

// GET /api/containers/{container_id}/contents - Get container contents
export const GET: APIRoute = async ({ request, params }) => {
  try {
    // Validate authentication
    const authResult = await validateAuthToken(request);
    if (!authResult.success) {
      return createErrorResponse(401, authResult.error || "Unauthorized");
    }

    // Validate container_id
    const { container_id } = params;
    if (!container_id || !isValidUUID(container_id)) {
      return createErrorResponse(400, "Invalid container ID format");
    }

    // Get container contents using service
    const supabase = createSupabaseServerClient(request);
    const containerService = new ContainerService(supabase);
    const containerContents = await containerService.getContainerContents(container_id);

    if (!containerContents) {
      return createErrorResponse(404, "Container not found");
    }

    return createSuccessResponse(containerContents);
  } catch (error) {
    console.error("Get container contents error:", error);
    return createErrorResponse(500, "Internal server error");
  }
};
