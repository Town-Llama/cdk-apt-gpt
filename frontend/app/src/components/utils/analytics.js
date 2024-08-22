import ReactGA from "react-ga4";

const initializeAnalytics = () => {
  ReactGA.initialize("G-FXK6SWN1F2");
};

const logPageView = () => {
  ReactGA.send({
    hitType: "pageview",
    page: window.location.pathname + window.location.search,
    title: window.title,
  });
};

const trackEvent = (category, action, value = null) => {
  ReactGA.event({
    category,
    action,
    value,
  });
};

const setUser = (userId) => {
  ReactGA.set({ userId: userId });
};

const trackFilledInput = (action, userId = null) => {
  const eventData = {
    category: "Input",
    action: "Filled_" + action,
  };

  if (userId) {
    eventData.userId = userId;
  }

  ReactGA.event(eventData);
};

// New function to track button clicks
const trackButtonClick = (buttonName, userId = null) => {
  const eventData = {
    category: "Button",
    action: "Click_" + buttonName,
  };

  if (userId) {
    eventData.userId = userId;
  }

  ReactGA.event(eventData);
};

export {
  initializeAnalytics,
  logPageView,
  setUser,
  trackButtonClick,
  trackEvent,
  trackFilledInput,
};
