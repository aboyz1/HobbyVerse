import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "./AuthContext";
import { STORAGE_KEYS } from "../constants";
import AuthService from "../services/AuthService";

// Check if we're running in Expo Go
const isExpoGo = Constants.appOwnership === "expo";

// Configure notification behavior only if not in Expo Go
if (!isExpoGo) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

interface NotificationContextType {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
  requestPermissions: () => Promise<boolean>;
  registerForPushNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
}) => {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] =
    useState<Notifications.Notification | null>(null);
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    // Load stored push token
    loadStoredPushToken();

    // Register for push notifications if authenticated and not in Expo Go
    if (isAuthenticated && user && !isExpoGo) {
      registerForPushNotifications();
    }

    // Only set up listeners if not in Expo Go
    if (!isExpoGo) {
      // Listen for incoming notifications
      const notificationListener =
        Notifications.addNotificationReceivedListener((notification) => {
          setNotification(notification);
        });

      // Listen for notification responses (when user taps notification)
      const responseListener =
        Notifications.addNotificationResponseReceivedListener((response) => {
          console.log("Notification response:", response);
          // Handle navigation based on notification data
          const data = response.notification.request.content.data;
          if (data?.action_url) {
            // Navigate to the specified URL/screen
            // This would be handled by your navigation logic
          }
        });

      return () => {
        Notifications.removeNotificationSubscription(notificationListener);
        Notifications.removeNotificationSubscription(responseListener);
      };
    }
  }, [isAuthenticated, user]);

  const loadStoredPushToken = async () => {
    try {
      const storedToken = await AsyncStorage.getItem(
        STORAGE_KEYS.EXPO_PUSH_TOKEN
      );
      if (storedToken) {
        setExpoPushToken(storedToken);
      }
    } catch (error) {
      console.error("Error loading stored push token:", error);
    }
  };

  const requestPermissions = async (): Promise<boolean> => {
    if (!Device.isDevice) {
      console.log("Must use physical device for Push Notifications");
      return false;
    }

    // Skip permission request in Expo Go for SDK 53+
    if (isExpoGo) {
      console.log(
        "Push notifications not available in Expo Go. Use development build for full functionality."
      );
      return false;
    }

    try {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        console.log("Failed to get push token for push notification!");
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error requesting notification permissions:", error);
      return false;
    }
  };

  const registerForPushNotifications = async () => {
    try {
      // Skip registration in Expo Go for SDK 53+
      if (isExpoGo) {
        console.log(
          "Push notifications not available in Expo Go. Use development build for full functionality."
        );
        return;
      }

      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        return;
      }

      // Get the push token
      const token = (await Notifications.getExpoPushTokenAsync()).data;
      console.log("Expo push token:", token);

      setExpoPushToken(token);

      // Store token locally
      await AsyncStorage.setItem(STORAGE_KEYS.EXPO_PUSH_TOKEN, token);

      // Send token to backend if authenticated
      if (isAuthenticated && user) {
        try {
          await AuthService.updateExpoPushToken(token);
          console.log("Push token updated on server");
        } catch (error) {
          console.error("Failed to update push token on server:", error);
        }
      }

      // Configure notification channel for Android
      if (Platform.OS === "android") {
        Notifications.setNotificationChannelAsync("default", {
          name: "default",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#FF231F7C",
        });
      }
    } catch (error) {
      console.error("Error registering for push notifications:", error);
    }
  };

  const value: NotificationContextType = {
    expoPushToken,
    notification,
    requestPermissions,
    registerForPushNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
