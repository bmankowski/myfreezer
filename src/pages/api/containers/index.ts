import type { APIRoute } from "astro";
import type { ContainerListResponseDTO, CreateContainerCommandDTO } from "../../../types.js";
import { ContainerService } from "../../../lib/services/container.service.js";
import { createErrorResponse, createSuccessResponse, validateAuthToken } from "../../../lib/auth.utils.js";
import { createSupabaseServerClient } from "../../../lib/auth/supabase-server.js";

// GET /api/containers - List user containers
export const GET: APIRoute = async ({ request }) => {
  try {
    // Validate authentication
    const authResult = await validateAuthToken(request);
    if (!authResult.success) {
      return createErrorResponse(401, authResult.error || "Unauthorized");
    }

    // Get containers using service
    const supabase = createSupabaseServerClient(request);
    const containerService = new ContainerService(supabase);

    if (!authResult.user_id) {
      return createErrorResponse(401, "User ID not found in authentication result");
    }

    const containers = await containerService.getUserContainers(authResult.user_id);

    const response: ContainerListResponseDTO = {
      containers,
    };

    return createSuccessResponse(response);
  } catch (error) {
    console.error("List containers error:", error);
    return createErrorResponse(500, "Internal server error");
  }
};

// POST /api/containers - Create new container
export const POST: APIRoute = async ({ request }) => {
  try {
    // Validate authentication
    const authResult = await validateAuthToken(request);
    if (!authResult.success) {
      return createErrorResponse(401, authResult.error || "Unauthorized");
    }

    // Parse request body
    let body: CreateContainerCommandDTO;
    try {
      body = await request.json();
    } catch {
      return createErrorResponse(400, "Invalid JSON body");
    }

    // Validate required fields
    if (!body.name || typeof body.name !== "string" || body.name.trim() === "") {
      return createErrorResponse(400, "Name is required and cannot be empty");
    }

    if (body.name.length > 255) {
      return createErrorResponse(400, "Name cannot exceed 255 characters");
    }

    if (body.type && !["freezer", "fridge"].includes(body.type)) {
      return createErrorResponse(400, 'Type must be either "freezer" or "fridge"');
    }

    // Create container using service
    const supabase = createSupabaseServerClient(request);
    const containerService = new ContainerService(supabase);

    if (!authResult.user_id) {
      return createErrorResponse(401, "User ID not found in authentication result");
    }

    const container = await containerService.createContainer(
      {
        name: body.name.trim(),
        type: body.type || "freezer",
      },
      authResult.user_id
    );

    return createSuccessResponse(container, 201);
  } catch (error) {
    console.error("Create container error:", error);
    return createErrorResponse(500, "Internal server error");
  }
};
