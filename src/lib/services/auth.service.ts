import type { Session, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";
import type {
  ChangePasswordCommandDTO,
  ChangePasswordResponseDTO,
  LoginCommandDTO,
  LoginResponseDTO,
  LogoutResponseDTO,
  RefreshTokenCommandDTO,
  RefreshTokenResponseDTO,
  RegisterCommandDTO,
  RegisterResponseDTO,
  ResendVerificationCommandDTO,
  ResendVerificationResponseDTO,
  ResetPasswordConfirmCommandDTO,
  ResetPasswordConfirmResponseDTO,
  ResetPasswordRequestCommandDTO,
  ResetPasswordRequestResponseDTO,
  UpdateProfileCommandDTO,
  UpdateProfileResponseDTO,
  UserProfileDTO,
  VerifyEmailCommandDTO,
  VerifyEmailResponseDTO,
} from "../../types.js";

export class AuthService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Register a new user with email and password
   * Returns session data for cookie setting if user is auto-confirmed
   */
  async register(command: RegisterCommandDTO): Promise<RegisterResponseDTO & { session?: Session }> {
    try {
      const { data, error } = await this.supabase.auth.signUp({
        email: command.email,
        password: command.password,
        options: {
          data: {
            firstName: command.firstName,
            lastName: command.lastName,
          },
        },
      });

      if (error) {
        throw new Error(this.mapAuthError(error.message));
      }

      if (!data.user) {
        throw new Error("Registration failed - no user data returned");
      }

      return {
        user: {
          user_id: data.user.id,
          email: data.user.email || "",
          firstName: command.firstName,
          lastName: command.lastName,
        },
        message: "Registration successful. Please check your email for verification.",
        email_confirmation_required: !data.user.email_confirmed_at,
        // Include session if user is auto-confirmed (for cookie setting)
        session: data.session || undefined,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Registration failed";
      throw new Error(message);
    }
  }

  /**
   * Sign in user with email and password
   * Returns session data for cookie setting in API route
   */
  async login(command: LoginCommandDTO): Promise<LoginResponseDTO & { session: Session }> {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email: command.email,
        password: command.password,
      });

      if (error) {
        throw new Error(this.mapAuthError(error.message));
      }

      if (!data.user || !data.session) {
        throw new Error("Login failed - invalid credentials");
      }

      return {
        user: {
          user_id: data.user.id,
          email: data.user.email as string,
          firstName: data.user.user_metadata?.firstName,
          lastName: data.user.user_metadata?.lastName,
        },
        // Keep existing fields for backward compatibility during transition
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_in: data.session.expires_in,
        token_type: "Bearer",
        // Add session for cookie setting
        session: data.session,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Login failed";
      throw new Error(message);
    }
  }

  /**
   * Sign out the current user
   */
  async logout(accessToken: string): Promise<LogoutResponseDTO> {
    try {
      // Set the access token for the current request
      await this.supabase.auth.getUser(accessToken);

      const { error } = await this.supabase.auth.signOut();

      if (error) {
        throw new Error(this.mapAuthError(error.message));
      }

      return {
        message: "Logout successful",
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Logout failed";
      throw new Error(message);
    }
  }

  /**
   * Request password reset email
   */
  async requestPasswordReset(command: ResetPasswordRequestCommandDTO): Promise<ResetPasswordRequestResponseDTO> {
    try {
      const { error } = await this.supabase.auth.resetPasswordForEmail(command.email, {
        redirectTo: `${process.env.SITE_URL || "http://localhost:3000"}/auth/reset-password`,
      });

      if (error) {
        throw new Error(this.mapAuthError(error.message));
      }

      return {
        message: "Password reset email sent. Please check your inbox.",
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Password reset request failed";
      throw new Error(message);
    }
  }

  /**
   * Confirm password reset with token
   */
  async confirmPasswordReset(command: ResetPasswordConfirmCommandDTO): Promise<ResetPasswordConfirmResponseDTO> {
    try {
      const { error } = await this.supabase.auth.updateUser({
        password: command.password,
      });

      if (error) {
        throw new Error(this.mapAuthError(error.message));
      }

      return {
        message: "Password updated successfully",
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Password reset failed";
      throw new Error(message);
    }
  }

  /**
   * Change password for authenticated user
   */
  async changePassword(command: ChangePasswordCommandDTO, userId: string): Promise<ChangePasswordResponseDTO> {
    try {
      // First verify current password by attempting to sign in
      const { data: user } = await this.supabase.auth.getUser();

      if (!user.user || user.user.id !== userId) {
        throw new Error("User not authenticated");
      }

      // Update password
      const { error } = await this.supabase.auth.updateUser({
        password: command.newPassword,
      });

      if (error) {
        throw new Error(this.mapAuthError(error.message));
      }

      return {
        message: "Password changed successfully",
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Password change failed";
      throw new Error(message);
    }
  }

  /**
   * Update user profile information
   */
  async updateProfile(command: UpdateProfileCommandDTO, userId: string): Promise<UpdateProfileResponseDTO> {
    try {
      // Verify the user is authenticated and matches the provided userId
      const { data: user } = await this.supabase.auth.getUser();
      if (!user.user || user.user.id !== userId) {
        throw new Error("User not authenticated");
      }

      const updateData: {
        data?: { firstName?: string; lastName?: string };
        email?: string;
      } = {};

      if (command.firstName !== undefined || command.lastName !== undefined) {
        updateData.data = {
          firstName: command.firstName,
          lastName: command.lastName,
        };
      }

      if (command.email !== undefined) {
        updateData.email = command.email;
      }

      const { data, error } = await this.supabase.auth.updateUser(updateData);

      if (error) {
        throw new Error(this.mapAuthError(error.message));
      }

      if (!data.user) {
        throw new Error("Profile update failed");
      }

      return {
        user: {
          user_id: data.user.id,
          email: data.user.email || "",
          firstName: data.user.user_metadata?.firstName || command.firstName,
          lastName: data.user.user_metadata?.lastName || command.lastName,
        },
        message: "Profile updated successfully",
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Profile update failed";
      throw new Error(message);
    }
  }

  /**
   * Verify email with token
   */
  async verifyEmail(command: VerifyEmailCommandDTO): Promise<VerifyEmailResponseDTO> {
    try {
      const { error } = await this.supabase.auth.verifyOtp({
        token_hash: command.token,
        type: "email",
      });

      if (error) {
        throw new Error(this.mapAuthError(error.message));
      }

      return {
        message: "Email verified successfully",
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Email verification failed";
      throw new Error(message);
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(command: RefreshTokenCommandDTO): Promise<RefreshTokenResponseDTO> {
    try {
      const { data, error } = await this.supabase.auth.refreshSession({
        refresh_token: command.refreshToken,
      });

      if (error) {
        throw new Error(this.mapAuthError(error.message));
      }

      if (!data.session) {
        throw new Error("Token refresh failed");
      }

      return {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_in: data.session.expires_in,
        token_type: "Bearer",
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Token refresh failed";
      throw new Error(message);
    }
  }

  /**
   * Resend verification email
   */
  async resendVerificationEmail(command: ResendVerificationCommandDTO): Promise<ResendVerificationResponseDTO> {
    try {
      const { error } = await this.supabase.auth.resend({
        type: "signup",
        email: command.email,
      });

      if (error) {
        throw new Error(this.mapAuthError(error.message));
      }

      return {
        message: "Verification email sent successfully",
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Resend verification failed";
      throw new Error(message);
    }
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(userId: string): Promise<UserProfileDTO> {
    try {
      const { data, error } = await this.supabase.auth.getUser();

      if (error) {
        throw new Error(this.mapAuthError(error.message));
      }

      if (!data.user || data.user.id !== userId) {
        throw new Error("User not found");
      }

      return {
        user_id: data.user.id,
        email: data.user.email || "",
        firstName: data.user.user_metadata?.firstName,
        lastName: data.user.user_metadata?.lastName,
        email_verified: !!data.user.email_confirmed_at,
        created_at: data.user.created_at,
        updated_at: data.user.updated_at || data.user.created_at,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to get user profile";
      throw new Error(message);
    }
  }

  /**
   * Map Supabase auth errors to user-friendly messages
   */
  private mapAuthError(errorMessage: string): string {
    const errorMap: Record<string, string> = {
      "Invalid login credentials": "Invalid email or password",
      "User already registered": "An account with this email already exists",
      "Email not confirmed": "Please verify your email address before signing in",
      "Password should be at least 6 characters": "Password must be at least 6 characters long",
      "Signup requires a valid password": "Please provide a valid password",
      "Invalid email": "Please provide a valid email address",
      "User not found": "No account found with this email address",
      "Token has expired or is invalid": "The verification token has expired or is invalid",
      "New password should be different from the old password": "New password must be different from current password",
    };

    return errorMap[errorMessage] || errorMessage;
  }
}
