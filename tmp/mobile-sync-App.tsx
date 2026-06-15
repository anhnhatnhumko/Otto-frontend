import * as WebBrowser from "expo-web-browser";
import { StatusBar } from "expo-status-bar";
import React from "react";
import "./global.css";
import AppNavigation from "./src/navigation";
import { AuthProvider } from "./src/providers/AuthProvider";
import { RealtimeProvider } from "./src/providers/RealtimeProvider";

WebBrowser.maybeCompleteAuthSession();

export default function App() {
  return (
    <>
      <AuthProvider>
        <RealtimeProvider>
          <AppNavigation />
        </RealtimeProvider>
      </AuthProvider>
      <StatusBar style="auto" />
    </>
  );
}
