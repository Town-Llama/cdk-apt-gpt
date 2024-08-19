import { Auth0Provider } from "@auth0/auth0-react";
import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import { Provider as ReduxProvider } from "react-redux";
import { BrowserRouter, useLocation } from "react-router-dom";

import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";

import CssBaseline from "@mui/material/CssBaseline";

import App from "./App";
import "./index.css";
import reportWebVitals from "./reportWebVitals";

import { useAuth0 } from "@auth0/auth0-react";
import { getConfig } from "./auth/config";
import {
  initializeAnalytics,
  logPageView,
  setUser,
} from "./components/utils/analytics";
import history from "./components/utils/history";
import store from "./store/store";

initializeAnalytics();

function Analytics() {
  const location = useLocation();
  const { user, isAuthenticated } = useAuth0();

  useEffect(() => {
    logPageView();

    if (isAuthenticated && user) {
      setUser(user.sub); // Use Auth0 user ID
    }
  }, [location, isAuthenticated, user]);

  return null;
}

const onRedirectCallback = (appState) => {
  history.push(
    appState && appState.returnTo ? appState.returnTo : window.location.pathname
  );
};

const config = getConfig();

// https://community.auth0.com/t/authentication-is-lost-after-page-refresh/61030/3
const providerConfig = {
  domain: config.domain,
  clientId: config.clientId,
  onRedirectCallback,
  authorizationParams: {
    redirect_uri: window.location.origin,
    ...(config.audience ? { audience: config.audience } : null),
  },
};

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <Auth0Provider {...providerConfig}>
    <ReduxProvider store={store}>
      <BrowserRouter>
        <CssBaseline />
        <Analytics />
        <App />
      </BrowserRouter>
    </ReduxProvider>
  </Auth0Provider>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
