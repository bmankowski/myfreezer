import type { APIRoute } from "astro";
import type { UpdateContainerCommandDTO } from "../../../../types.js";
import { ContainerService } from "../../../../lib/services/container.service.js";
import { validateAuthToken, createErrorResponse, createSuccessResponse } from "../../../../lib/auth.utils.js";
import { createSupabaseServerClient } from "../../../../lib/auth/supabase-server.js";
import {
  isValidUUID,
  isNonEmptyString,
  isValidLength,
  isValidContainerType,
} from "../../../../lib/validation.utils.js";

// GET /api/containers/{container_id} - Get container details
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

    // Get container details using service
    const supabase = createSupabaseServerClient(request);
    const containerService = new ContainerService(supabase);
    const containerDetails = await containerService.getContainerDetails(container_id);

    if (!containerDetails) {
      return createErrorResponse(404, "Container not found");
    }

    return createSuccessResponse(containerDetails);
  } catch (error) {
    console.error("Get container details error:", error);
    return createErrorResponse(500, "Internal server error");
  }
};

// PUT /api/containers/{container_id} - Update container
export const PUT: APIRoute = async ({ request, params }) => {
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

    // Parse request body
    let body: UpdateContainerCommandDTO;
    try {
      body = await request.json();
    } catch {
      return createErrorResponse(400, "Invalid JSON body");
    }

    // Validate fields if provided
    if (body.name !== undefined) {
      if (!isNonEmptyString(body.name)) {
        return createErrorResponse(400, "Name must be a non-empty string");
      }
      if (!isValidLength(body.name, 255)) {
        return createErrorResponse(400, "Name cannot exceed 255 characters");
      }
    }

    if (body.type !== undefined && !isValidContainerType(body.type)) {
      return createErrorResponse(400, 'Type must be either "freezer" or "fridge"');
    }

    // Update container using service
    const supabase = createSupabaseServerClient(request);
    const containerService = new ContainerService(supabase);
    const updatedContainer = await containerService.updateContainer(container_id, {
      name: body.name?.trim(),
      type: body.type,
    });

    if (!updatedContainer) {
      return createErrorResponse(404, "Container not found");
    }

    return createSuccessResponse(updatedContainer);
  } catch (error) {
    console.error("Update container error:", error);
    return createErrorResponse(500, "Internal server error");
  }
};

// DELETE /api/containers/{container_id} - Delete container
export const DELETE: APIRoute = async ({ request, params }) => {
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

    // Check if container exists first
    const supabase = createSupabaseServerClient(request);
    const containerService = new ContainerService(supabase);
    const exists = await containerService.containerExists(container_id);

    if (!exists) {
      return createErrorResponse(404, "Container not found");
    }

    try {
      // Delete container using service
      const result = await containerService.deleteContainer(container_id);
      return createSuccessResponse(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      if (errorMessage.includes("must be empty")) {
        return createErrorResponse(400, "Container must be empty before deletion");
      }
      throw error;
    }
  } catch (error) {
    console.error("Delete container error:", error);
    return createErrorResponse(500, "Internal server error");
  }
};
