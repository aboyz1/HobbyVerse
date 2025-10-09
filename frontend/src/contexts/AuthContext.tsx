import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
} from "react";
import { AppState, AppStateStatus } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  User,
  AuthResponse,
  LoginRequest,
  CreateUserRequest,
} from "../types/user";
import { ApiResponse } from "../types/common";
import { STORAGE_KEYS } from "../constants";
import AuthService from "../services/AuthService";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: CreateUserRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  checkAuthValidity: () => Promise<boolean>;
  clearError: () => void;
  updateUser: (user: User) => void;
}

type AuthAction =
  | { type: "AUTH_START" }
  | {
      type: "AUTH_SUCCESS";
      payload: { user: User; accessToken: string; refreshToken: string };
    }
  | { type: "AUTH_FAILURE"; payload: string }
  | { type: "AUTH_LOGOUT" }
  | { type: "CLEAR_ERROR" }
  | { type: "UPDATE_USER"; payload: User }
  | { type: "SET_LOADING"; payload: boolean };

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case "AUTH_START":
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case "AUTH_SUCCESS":
      return {
        ...state,
        user: action.payload.user,
        accessToken: action.payload.accessToken,
        refreshToken: action.payload.refreshToken,
        isLoading: false,
        isAuthenticated: true,
        error: null,
      };
    case "AUTH_FAILURE":
      return {
        ...state,
        user: null,
        accessToken: null,
        refreshToken: null,
        isLoading: false,
        isAuthenticated: false,
        error: action.payload,
      };
    case "AUTH_LOGOUT":
      return {
        ...initialState,
        isLoading: false,
      };
    case "CLEAR_ERROR":
      return {
        ...state,
        error: null,
      };
    case "UPDATE_USER":
      return {
        ...state,
        user: action.payload,
      };
    case "SET_LOADING":
      return {
        ...state,
        isLoading: action.payload,
      };
    default:
      return state;
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Load stored auth data on app start
  useEffect(() => {
    loadStoredAuth();
  }, []);

  // Set up periodic token refresh
  useEffect(() => {
    let refreshInterval: NodeJS.Timeout;

    if (state.isAuthenticated && state.refreshToken) {
      // Refresh token every 25 minutes (assuming tokens expire in 30 minutes)
      refreshInterval = setInterval(async () => {
        try {
          await refreshAuth();
        } catch (error) {
          console.log("Periodic token refresh failed:", error);
          // Continue with existing tokens, don't logout immediately
        }
      }, 25 * 60 * 1000); // 25 minutes
    }

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [state.isAuthenticated, state.refreshToken]);

  // Check auth validity when app comes to foreground
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState === "active" && state.isAuthenticated) {
        try {
          // Small delay to ensure network is ready
          await new Promise((resolve) => setTimeout(resolve, 1000));
          await checkAuthValidity();
        } catch (error) {
          console.log("Auth validity check on app foreground failed:", error);
          // Don't logout immediately, tokens might still be valid
        }
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );
    return () => {
      subscription?.remove();
    };
  }, [state.isAuthenticated]);

  const loadStoredAuth = async () => {
    try {
      const [accessToken, refreshToken, userData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN),
        AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN),
        AsyncStorage.getItem(STORAGE_KEYS.USER_DATA),
      ]);

      if (accessToken && refreshToken && userData) {
        const user = JSON.parse(userData);

        // Set the auth service token
        AuthService.setAuthToken(accessToken);

        dispatch({
          type: "AUTH_SUCCESS",
          payload: { user, accessToken, refreshToken },
        });

        // Small delay to ensure network connectivity
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Try to refresh the token to ensure it's still valid
        try {
          await refreshAuth();
        } catch (error) {
          // Even if refresh fails, keep the user logged in with existing tokens
          // The tokens might still be valid, or the refresh will be attempted again later
          console.log(
            "Token refresh failed on app start, but keeping user logged in:",
            error
          );
          dispatch({ type: "SET_LOADING", payload: false });
        }
      } else {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    } catch (error) {
      console.error("Error loading stored auth:", error);
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const storeAuthData = async (
    user: User,
    accessToken: string,
    refreshToken: string
  ) => {
    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken),
        AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken),
        AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user)),
      ]);
    } catch (error) {
      console.error("Error storing auth data:", error);
    }
  };

  const clearAuthData = async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN),
        AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN),
        AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA),
      ]);
    } catch (error) {
      console.error("Error clearing auth data:", error);
    }
  };

  const login = async (credentials: LoginRequest) => {
    dispatch({ type: "AUTH_START" });

    try {
      const response = await AuthService.login(credentials);

      if (
        response.success &&
        response.user &&
        response.accessToken &&
        response.refreshToken
      ) {
        AuthService.setAuthToken(response.accessToken);

        await storeAuthData(
          response.user,
          response.accessToken,
          response.refreshToken
        );

        dispatch({
          type: "AUTH_SUCCESS",
          payload: {
            user: response.user,
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
          },
        });
      } else {
        throw new Error(response.error || "Login failed");
      }
    } catch (error: any) {
      dispatch({
        type: "AUTH_FAILURE",
        payload: error.message || "Login failed",
      });
      throw error;
    }
  };

  const register = async (userData: CreateUserRequest) => {
    dispatch({ type: "AUTH_START" });

    try {
      const response = await AuthService.register(userData);

      if (
        response.success &&
        response.user &&
        response.accessToken &&
        response.refreshToken
      ) {
        AuthService.setAuthToken(response.accessToken);

        await storeAuthData(
          response.user,
          response.accessToken,
          response.refreshToken
        );

        dispatch({
          type: "AUTH_SUCCESS",
          payload: {
            user: response.user,
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
          },
        });
      } else {
        throw new Error(response.error || "Registration failed");
      }
    } catch (error: any) {
      dispatch({
        type: "AUTH_FAILURE",
        payload: error.message || "Registration failed",
      });
      throw error;
    }
  };

  const logout = async () => {
    try {
      if (state.refreshToken) {
        await AuthService.logout(state.refreshToken);
      }
    } catch (error) {
      console.error("Error during logout:", error);
    } finally {
      AuthService.clearAuthToken();
      await clearAuthData();
      dispatch({ type: "AUTH_LOGOUT" });
    }
  };

  const refreshAuth = async () => {
    if (!state.refreshToken) {
      throw new Error("No refresh token available");
    }

    try {
      const response = await AuthService.refreshToken(state.refreshToken);

      if (
        response.success &&
        response.user &&
        response.accessToken &&
        response.refreshToken
      ) {
        AuthService.setAuthToken(response.accessToken);

        await storeAuthData(
          response.user,
          response.accessToken,
          response.refreshToken
        );

        dispatch({
          type: "AUTH_SUCCESS",
          payload: {
            user: response.user,
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
          },
        });
      } else {
        throw new Error("Token refresh failed");
      }
    } catch (error: any) {
      console.error("Token refresh failed:", error);
      // Don't logout immediately on refresh failure
      // The existing tokens might still be valid
      // Let the app continue with current auth state
      throw error;
    }
  };

  // Check if the access token is expired by trying to fetch current user
  const checkAuthValidity = async () => {
    if (!state.accessToken || !state.user) {
      return false;
    }

    try {
      // Set auth token and try to fetch current user
      AuthService.setAuthToken(state.accessToken);
      await AuthService.getCurrentUser();
      return true;
    } catch (error: any) {
      console.log("Auth validity check failed:", error.message);
      // If it's an auth error, we might need to refresh
      if (
        error.message.includes("Unauthorized") ||
        error.message.includes("401")
      ) {
        try {
          await refreshAuth();
          return true;
        } catch (refreshError) {
          console.log(
            "Token refresh during validity check failed:",
            refreshError
          );
          return false;
        }
      }
      // For other errors (network etc.), assume still valid
      return true;
    }
  };

  const clearError = () => {
    dispatch({ type: "CLEAR_ERROR" });
  };

  const updateUser = (user: User) => {
    dispatch({ type: "UPDATE_USER", payload: user });
    // Update stored user data
    AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
  };

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    refreshAuth,
    checkAuthValidity,
    clearError,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
