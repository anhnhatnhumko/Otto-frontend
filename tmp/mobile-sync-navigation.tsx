import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import { ActivityIndicator, View } from "react-native";
import type { HomeService } from "../api/customer";
import { OTTO_THEME } from "../constants/otto-theme";
import { useAuth } from "../providers/AuthProvider";
import Dashboard from "../screens/Dashboard";
import ForgotPassword from "../screens/ForgotPassword";
import Login from "../screens/Login";
import Notifications from "../screens/Notifications";
import Register from "../screens/Register";
import ResetPassword from "../screens/ResetPassword";
import TaskerList from "../screens/TaskerList";
import Cart from "../screens/customer/Cart";
import CreateOrder from "../screens/customer/CreateOrder";
import OrderChat from "../screens/customer/OrderChat";
import OrderDetail from "../screens/customer/OrderDetail";
import OrderThankYou from "../screens/customer/OrderThankYou";
import Orders from "../screens/customer/Orders";
import Payments from "../screens/customer/Payments";
import Profile from "../screens/customer/Profile";
import Store from "../screens/customer/Store";
import Wallet from "../screens/customer/Wallet";
import WalletDeposit from "../screens/customer/WalletDeposit";
import WalletVerify from "../screens/customer/WalletVerify";

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: undefined;
  Dashboard: undefined;
  Notifications: undefined;
  TaskerList: undefined;
  Orders: undefined;
  OrderDetail: { id: string; order?: any } | undefined;
  OrderThankYou: { orderId: string; order?: any } | undefined;
  OrderChat:
    | {
        orderId: string;
        peerName?: string;
      }
    | undefined;
  CreateOrder: { service?: HomeService } | undefined;
  Profile: undefined;
  Wallet: undefined;
  WalletDeposit:
    | {
        initialAmount?: number;
      }
    | undefined;
  Payments:
    | {
        draftOrder?: {
          service: HomeService;
          address: string;
          addressDetail: string;
          provinceId: string;
          provinceName: string;
          wardId: string;
          wardName: string;
          scheduleDate: string;
          startTime: string;
          endTime: string;
          note: string;
          totalHours: number;
          totalPrice: number;
        };
      }
    | undefined;
  WalletVerify:
    | {
        orderId: string;
        transactionId: string;
        amount: number;
        serviceName?: string;
      }
    | undefined;
  Cart: undefined;
  Store: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigation() {
  const { isAuthenticated, isBootstrapping } = useAuth();

  if (isBootstrapping) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: OTTO_THEME.background,
        }}
      >
        <ActivityIndicator size="large" color={OTTO_THEME.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        key={isAuthenticated ? "app" : "auth"}
        initialRouteName={isAuthenticated ? "Dashboard" : "Login"}
        screenOptions={{ headerShown: false }}
      >
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Login" component={Login} />
            <Stack.Screen name="Register" component={Register} />
            <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
            <Stack.Screen name="ResetPassword" component={ResetPassword} />
          </>
        ) : (
          <>
            <Stack.Screen name="Dashboard" component={Dashboard} />
            <Stack.Screen name="Notifications" component={Notifications} />
            <Stack.Screen name="TaskerList" component={TaskerList} />
            <Stack.Screen name="Orders" component={Orders} />
            <Stack.Screen name="OrderDetail" component={OrderDetail} />
            <Stack.Screen name="OrderThankYou" component={OrderThankYou} />
            <Stack.Screen name="OrderChat" component={OrderChat} />
            <Stack.Screen name="CreateOrder" component={CreateOrder} />
            <Stack.Screen name="Profile" component={Profile} />
            <Stack.Screen name="Wallet" component={Wallet} />
            <Stack.Screen name="WalletDeposit" component={WalletDeposit} />
            <Stack.Screen name="Payments" component={Payments} />
            <Stack.Screen name="WalletVerify" component={WalletVerify} />
            <Stack.Screen name="Cart" component={Cart} />
            <Stack.Screen name="Store" component={Store} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
