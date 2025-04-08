import ReactGA from 'react-ga4';

// Replace G-XXXXXXXXXX with your actual Measurement ID
const MEASUREMENT_ID = 'G-9VRRYCRS61';

// Initialize Google Analytics
export const initGA = () => {
  // Only initialize in production or when explicitly testing analytics
  if (process.env.NODE_ENV === 'production' || process.env.REACT_APP_ENABLE_GA === 'true') {
    ReactGA.initialize(MEASUREMENT_ID);
    console.log('GA initialized');
  } else {
    console.log('GA not initialized: development environment');
  }
};

// Track page views
export const pageView = (path) => {
  if (process.env.NODE_ENV === 'production' || process.env.REACT_APP_ENABLE_GA === 'true') {
    ReactGA.send({ hitType: 'pageview', page: path });
    console.log(`GA pageview: ${path}`);
  }
};

// Track events
export const trackEvent = (category, action, label, value) => {
  if (process.env.NODE_ENV === 'production' || process.env.REACT_APP_ENABLE_GA === 'true') {
    ReactGA.event({
      category,
      action,
      label,
      value
    });
    console.log(`GA event: ${category} - ${action} - ${label}`);
  }
};