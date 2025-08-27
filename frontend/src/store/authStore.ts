import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import toast from 'react-hot-toast';
import { apiService } from '@/services/api';
import { User, LoginCredentials, RegisterData, GoogleOAuthData, AuthState, ApiResponse } from '@/types';

interface LoginResponse {
  loggedInUser: User;
}

interface RegisterResponse {
  loggedInUser: User;
  isExistingUser: boolean;
  isNewUser: boolean;
}

interface ExtendedAuthState extends AuthState {
  initializeAuth: () => Promise<void>;
  googleLogin: (data: GoogleOAuthData) => Promise<void>;
  updateProfile: (data: { fullName: string; email: string }) => Promise<void>;
  updateAvatar: (file: File) => Promise<void>;
  updateCoverImage: (file: File) => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
  sendVerificationEmail: (email: string) => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  resendVerificationEmail: (email: string) => Promise<void>;
}

export const useAuthStore = create<ExtendedAuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (credentials: LoginCredentials) => {
        try {
          set({ isLoading: true });

          const response = await apiService.login(credentials);

          if (response.success && (response as ApiResponse<LoginResponse>).data.loggedInUser) {
            const user = (response as ApiResponse<LoginResponse>).data.loggedInUser;
            set({
              user,
              isAuthenticated: true,
              isLoading: false
            });

            toast.success('Login successful!');
          } else {
            throw new Error('Login failed');
          }
        } catch (error: any) {
          set({ isLoading: false });
          // Login error handled
          throw error;
        }
      },

      register: async (data: RegisterData) => {
        try {
          set({ isLoading: true });

          const formData = new FormData();
          formData.append('fullName', data.fullName);
          formData.append('email', data.email);
          formData.append('username', data.username);
          formData.append('password', data.password);
          formData.append('avatar', data.avatar);

          if (data.coverImage) {
            formData.append('coverImage', data.coverImage);
          }

          console.log('Attempting registration with data:', {
            fullName: data.fullName,
            email: data.email,
            username: data.username,
            hasAvatar: !!data.avatar,
            hasCoverImage: !!data.coverImage
          });

          const response = await apiService.register(formData);


          // Check for both 'success' and 'sucess' (backend typo) and also check status
          if (response.success && response.data && (response.data as any).loggedInUser) {
            const user = response.data.loggedInUser;
            set({
              user,
              isAuthenticated: true,
              isLoading: false
            });

            toast.success('Registration successful!');


            // Send verification email after successful registration
            try {
              const emailToVerify = user.email || data.email;
              if (emailToVerify) {
                await apiService.sendVerificationEmail(emailToVerify);
                toast.success('Verification email sent! Please check your inbox.');
              }
            } catch (emailError) {
              console.error('Failed to send verification email:', emailError);
              // Don't throw error here as registration was successful
            }
          } else if (response.status === 200 && response.data && response.data.loggedInUser) {
            // Handle case where status is 200 but success flag might be missing
            const user = response.data.loggedInUser;
            set({
              user,
              isAuthenticated: true,
              isLoading: false
            });

            toast.success('Registration successful!');


            // Send verification email after successful registration
            try {
              const emailToVerify = user.email || data.email;
              if (emailToVerify) {
                await apiService.sendVerificationEmail(emailToVerify);
                toast.success('Verification email sent! Please check your inbox.');
              }
            } catch (emailError) {
              console.error('Failed to send verification email:', emailError);
              // Don't throw error here as registration was successful
            }
          } else {
            throw new Error(response.message || 'Registration failed');
          }
        } catch (error: any) {
          set({ isLoading: false });

          // Extract meaningful error message based on status code and backend response
          let errorMessage = 'Registration failed. Please try again.';

          if (error.response?.status === 409) {
            // Use the specific error message from the backend
            errorMessage = error.response?.data?.message || 'A user with this email or username already exists. Please try different credentials.';
          } else if (error.response?.status === 400) {
            errorMessage = error.response?.data?.message || 'Invalid registration data. Please check all fields.';
          } else if (error.response?.data?.message) {
            errorMessage = error.response.data.message;
          } else if (error.message) {
            errorMessage = error.message;
          }

          throw new Error(errorMessage);
        }
      },

      googleLogin: async (data: GoogleOAuthData) => {
        try {
          set({ isLoading: true });

          const response = await apiService.googleAuth(data);

          if (response.success && response.data) {
            const { loggedInUser, isExistingUser, isNewUser } = response.data;
            const user = loggedInUser || response.data;

            set({
              user,
              isAuthenticated: true,
              isLoading: false
            });

            // Provide specific feedback based on user status
            if (isExistingUser) {
              toast.success('Account exists. Signing you in...');
            } else if (isNewUser) {
              toast.success('Account created successfully with Google!');
            } else {
              toast.success('Google sign-in successful!');
            }
          } else {
            throw new Error(response.message || 'Google sign-in failed');
          }
        } catch (error: any) {
          set({ isLoading: false });

          // Extract meaningful error message
          const errorMessage = error.response?.data?.message ||
                              error.message ||
                              'Google sign-in failed. Please try again.';

          throw new Error(errorMessage);
        }
      },

      logout: async () => {
        try {
          await apiService.logout();
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false
          });
          toast.success('Logged out successfully');
        } catch (error) {
          console.error('Logout error:', error);
          // Even if logout fails on server, clear local state
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false
          });
        }
      },

      refreshToken: async () => {
        try {
          const response = await apiService.post('/users/refreshToken');
          if (response.success) {
            // Token refreshed successfully
            return;
          }
        } catch (error) {
          console.error('Token refresh failed:', error);
          // Clear auth state if refresh fails
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false
          });
          throw error;
        }
      },

      updateUser: (user: User) => {
        set({ user });
      },

      // Initialize auth state by checking current user
      initializeAuth: async () => {
        try {
          set({ isLoading: true });

          console.log('🔄 Initializing authentication...');

          // Try to get current user from backend (which will use HTTP-only cookies)
          const response = await apiService.getCurrentUser();
          console.log('🔄 Current user response:', response);

          if (response.success && response.data) {
            const user = response.data;
            set({
              user,
              isAuthenticated: true,
              isLoading: false
            });
            console.log('✅ User authenticated on initialization:', user);
          } else {
            console.log('❌ No authenticated user found');
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false
            });
          }
        } catch (error: any) {
          console.log('❌ Auth initialization failed:', error.message);
          // If getCurrentUser fails, user is not authenticated
          // Don't show error toast during initialization to avoid spam
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false
          });
        }
      },

      // Update user profile
      updateProfile: async (data: { fullName: string; email: string }) => {
        try {
          console.log('🔄 Updating profile with data:', data);
          const response = await apiService.updateAccountDetails(data);

          console.log('📡 Profile update response:', response);

          if (response.success && response.data) {
            // Update the user state with the response data from the server
            set({
              user: response.data
            });
            toast.success('Profile updated successfully');
            console.log('✅ Profile updated in store:', response.data.fullName);
          } else {
            throw new Error('Failed to update profile');
          }
        } catch (error) {
          console.error('Profile update error:', error);
          toast.error('Failed to update profile');
          throw error;
        }
      },

      // Update avatar
      updateAvatar: async (file: File) => {
        try {
          const formData = new FormData();
          formData.append('avatar', file);
          
          const response = await apiService.updateAvatar(formData);
          
          if (response.success && response.data) {
            const currentUser = get().user;
            if (currentUser) {
              set({ 
                user: { 
                  ...currentUser, 
                  avatar: response.data.secure_url || response.data.url 
                } 
              });
            }
            toast.success('Avatar updated successfully');
          }
        } catch (error) {
          console.error('Avatar update error:', error);
          throw error;
        }
      },

      // Update cover image
      updateCoverImage: async (file: File) => {
        try {
          const formData = new FormData();
          formData.append('coverImage', file);
          
          const response = await apiService.updateCoverImage(formData);
          
          if (response.success && response.data) {
            const currentUser = get().user;
            if (currentUser) {
              set({ 
                user: { 
                  ...currentUser, 
                  coverImage: response.data.secure_url || response.data.url 
                } 
              });
            }
            toast.success('Cover image updated successfully');
          }
        } catch (error) {
          console.error('Cover image update error:', error);
          throw error;
        }
      },

      // Change password
      changePassword: async (oldPassword: string, newPassword: string) => {
        try {
          const response = await apiService.changePassword({ oldPassword, newPassword });

          if (response.success) {
            toast.success('Password changed successfully');
          }
        } catch (error) {
          console.error('Password change error:', error);
          throw error;
        }
      },

      // Email verification methods
      sendVerificationEmail: async (email: string) => {
        try {
          const response = await apiService.sendVerificationEmail(email);

          if (response.success) {
            toast.success('Verification email sent! Please check your inbox.');
          }
        } catch (error) {
          console.error('Send verification email error:', error);
          throw error;
        }
      },

      verifyEmail: async (token: string) => {
        try {
          const response = await apiService.verifyEmail(token);

          if (response.success) {
            toast.success('Email verified successfully!');
            // Update user verification status if needed
            const currentUser = get().user;
            if (currentUser) {
              set({
                user: { ...currentUser, isEmailVerified: true }
              });
            }
          }
        } catch (error) {
          console.error('Email verification error:', error);
          throw error;
        }
      },

      resendVerificationEmail: async (email: string) => {
        try {
          const response = await apiService.resendVerificationEmail(email);

          if (response.success) {
            toast.success('Verification email resent! Please check your inbox.');
          }
        } catch (error) {
          console.error('Resend verification email error:', error);
          throw error;
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);
