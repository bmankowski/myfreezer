// ============================================================================
// Database Entity Types
// ============================================================================

/** Base Container entity from the database */
export interface Container {
  container_id: string;
  user_id: string;
  name: string;
  type: "freezer" | "fridge";
  created_at: string;
}

/** Base Shelf entity from the database */
export interface Shelf {
  shelf_id: string;
  container_id: string;
  name: string;
  position: number;
  created_at: string;
}

/** Base Item entity from the database */
export interface Item {
  item_id: string;
  shelf_id: string;
  name: string;
  quantity: number;
  created_at: string;
}

/** Base UserPreferences entity from the database */
export interface UserPreferences {
  user_id: string;
  default_shelf_id: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Common Response Types
// ============================================================================

/** Generic success message response */
export interface DeleteResponseDTO {
  message: string;
}

/** Health check endpoint response */
export interface HealthCheckResponseDTO {
  status: "ok";
  authenticated: boolean;
  user_id: string | null;
}

// ============================================================================
// Container DTOs and Commands
// ============================================================================

/** Container response with computed counts for list endpoint */
export interface ContainerSummaryDTO extends Omit<Container, "user_id"> {
  shelves_count: number;
  items_count: number;
}

/** Basic container response (excludes user_id for security) */
export type ContainerDTO = Omit<Container, "user_id">;

/** Command for creating a new container */
export interface CreateContainerCommandDTO {
  name: string;
  type: "freezer" | "fridge";
}

/** Command for updating an existing container */
export interface UpdateContainerCommandDTO {
  name: string;
  type: "freezer" | "fridge";
}

/** Shelf with nested items for container details */
export interface ShelfWithItemsDTO extends Omit<Shelf, "container_id"> {
  items: Pick<Item, "item_id" | "name" | "quantity" | "created_at">[];
}

/** Container details response with shelves and all items */
export interface ContainerDetailsDTO extends Omit<Container, "user_id"> {
  shelves: ShelfWithItemsDTO[];
  total_items: number;
}

/** Container contents response (different structure from details) */
export interface ContainerContentsDTO {
  container: Pick<Container, "container_id" | "name" | "type">;
  shelves: ShelfWithItemsDTO[];
  total_items: number;
}

/** Response wrapper for container list */
export interface ContainerListResponseDTO {
  containers: ContainerDetailsDTO[];
}

// ============================================================================
// Shelf DTOs and Commands
// ============================================================================

/** Basic shelf response */
export type ShelfDTO = Shelf;

/** Command for creating a new shelf */
export interface CreateShelfCommandDTO {
  name: string;
  position: number;
}

/** Command for updating a shelf */
export interface UpdateShelfCommandDTO {
  name: string;
  position: number;
}

// ============================================================================
// Item DTOs and Commands
// ============================================================================

/** Basic item response */
export type ItemDTO = Item;

/** Item with location information for search results */
export interface ItemWithLocationDTO extends Pick<Item, "item_id" | "name" | "quantity" | "created_at"> {
  shelf: Pick<Shelf, "shelf_id" | "name" | "position">;
  container: Pick<Container, "container_id" | "name" | "type">;
}

/** Command for adding a new item */
export interface AddItemCommandDTO {
  name: string;
  quantity: number;
}

/** Response for add item with action indicator */
export interface ItemActionResponseDTO extends Pick<Item, "item_id" | "shelf_id" | "name" | "quantity" | "created_at"> {
  action: "created" | "updated";
}

/** Command for updating item quantity */
export interface UpdateItemQuantityCommandDTO {
  quantity: number;
}

/** Command for removing item quantity */
export interface RemoveItemQuantityCommandDTO {
  quantity: number;
}

/** Response for remove quantity operation */
export interface RemoveItemQuantityResponseDTO extends Pick<Item, "item_id" | "name" | "quantity"> {
  action: "updated" | "deleted";
}

/** Command for moving item to different shelf */
export interface MoveItemCommandDTO {
  shelf_id: string;
}

/** Search response with pagination */
export interface ItemSearchResponseDTO {
  items: ItemWithLocationDTO[];
  total: number;
  limit: number;
  offset: number;
}

// ============================================================================
// Voice Command DTOs
// ============================================================================

/** Command for processing voice commands */
export interface VoiceProcessCommandDTO {
  default_shelf_id?: string;
  command: string;
}

/** Details of a voice action result */
export interface VoiceActionDetailsDTO {
  item_name: string;
  quantity: number;
  shelf_name: string;
  container_name: string;
}

/** Individual voice action result */
export interface VoiceActionDTO {
  type: "add_item" | "remove_item" | "update_item" | "query_item";
  status: "success" | "failed";
  details: VoiceActionDetailsDTO;
}

/** Response for voice command processing */
export interface VoiceProcessResponseDTO {
  success: boolean;
  actions: VoiceActionDTO[];
  message: string;
  ai_response: string;
}

/** Command for voice queries */
export interface VoiceQueryCommandDTO {
  query: string;
  context: {
    containers?: string[];
  };
}

/** Location information for voice query responses */
export interface ItemLocationDTO {
  container_name: string;
  shelf_name: string;
  shelf_position: number;
}

/** Item result for voice queries */
export interface VoiceQueryItemDTO {
  name: string;
  quantity: number;
  locations: ItemLocationDTO[];
}

/** Response for voice queries */
export interface VoiceQueryResponseDTO {
  found: boolean;
  items: VoiceQueryItemDTO[];
  message: string;
  ai_response: string;
}

// ============================================================================
// API Query Parameters
// ============================================================================

/** Query parameters for item search */
export interface ItemSearchParams {
  q?: string;
  container_id?: string;
  shelf_id?: string;
  limit?: number;
  offset?: number;
}

// ============================================================================
// Type Unions and Helpers
// ============================================================================

/** All possible container types */
export type ContainerType = Container["type"];

/** All possible action types for item operations */
export type ItemActionType = "created" | "updated" | "deleted";

/** All possible voice action types */
export type VoiceActionType = VoiceActionDTO["type"];

/** All possible action statuses */
export type ActionStatus = "success" | "failed";

// ============================================================================
// Database Insert/Update Types
// ============================================================================

/** Type for creating a container in the database (with user_id) */
export interface CreateContainerEntity extends CreateContainerCommandDTO {
  user_id: string;
}

/** Type for creating a shelf in the database */
export interface CreateShelfEntity extends CreateShelfCommandDTO {
  container_id: string;
}

/** Type for creating an item in the database */
export interface CreateItemEntity extends AddItemCommandDTO {
  shelf_id: string;
}

/** Partial update types for database operations */
export type UpdateContainerEntity = Partial<Pick<Container, "name" | "type">>;
export type UpdateShelfEntity = Partial<Pick<Shelf, "name" | "position">>;
export type UpdateItemEntity = Partial<Pick<Item, "name" | "quantity" | "shelf_id">>;

// ============================================================================
// Authentication DTOs and Commands
// ============================================================================

/** User profile information */
export interface UserProfileDTO {
  user_id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
}

/** Registration command */
export interface RegisterCommandDTO {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
}

/** Registration response */
export interface RegisterResponseDTO {
  user: Pick<UserProfileDTO, "user_id" | "email" | "firstName" | "lastName">;
  message: string;
  email_confirmation_required: boolean;
}

/** Login command */
export interface LoginCommandDTO {
  email: string;
  password: string;
}

/** Login response */
export interface LoginResponseDTO {
  user: Pick<UserProfileDTO, "user_id" | "email" | "firstName" | "lastName">;
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: "Bearer";
}

/** Logout response */
export interface LogoutResponseDTO {
  message: string;
}

/** Password reset request command */
export interface ResetPasswordRequestCommandDTO {
  email: string;
}

/** Password reset request response */
export interface ResetPasswordRequestResponseDTO {
  message: string;
}

/** Password reset confirm command */
export interface ResetPasswordConfirmCommandDTO {
  token: string;
  password: string;
  confirmPassword: string;
}

/** Password reset confirm response */
export interface ResetPasswordConfirmResponseDTO {
  message: string;
}

/** Change password command (for authenticated users) */
export interface ChangePasswordCommandDTO {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/** Change password response */
export interface ChangePasswordResponseDTO {
  message: string;
}

/** Update profile command */
export interface UpdateProfileCommandDTO {
  firstName?: string;
  lastName?: string;
  email?: string;
}

/** Update profile response */
export interface UpdateProfileResponseDTO {
  user: Pick<UserProfileDTO, "user_id" | "email" | "firstName" | "lastName">;
  message: string;
}

/** Email verification command */
export interface VerifyEmailCommandDTO {
  token: string;
}

/** Email verification response */
export interface VerifyEmailResponseDTO {
  message: string;
}

/** Refresh token command */
export interface RefreshTokenCommandDTO {
  refreshToken: string;
}

/** Refresh token response */
export interface RefreshTokenResponseDTO {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: "Bearer";
}

/** Resend verification email command */
export interface ResendVerificationCommandDTO {
  email: string;
}

/** Resend verification email response */
export interface ResendVerificationResponseDTO {
  message: string;
}

// ============================================================================
// User Preferences DTOs and Commands
// ============================================================================

/** User preferences response */
export interface UserPreferencesDTO {
  user_id: string;
  default_shelf_id: string | null;
  default_shelf?: {
    shelf_id: string;
    name: string;
    position: number;
    container_id: string;
    container_name: string;
  } | null;
  created_at: string;
  updated_at: string;
}

/** Set default shelf command */
export interface SetDefaultShelfCommandDTO {
  shelf_id: string;
}

/** Set default shelf response */
export interface SetDefaultShelfResponseDTO {
  message: string;
  default_shelf: {
    shelf_id: string;
    name: string;
    position: number;
    container_name: string;
  };
}
