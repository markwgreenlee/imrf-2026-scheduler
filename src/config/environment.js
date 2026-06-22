/**
 * Environment configuration
 *
 * Public variables (prefixed with EXPO_PUBLIC_) are safe to use in client code.
 * Secret variables are only available on EAS servers and during builds.
 */

const config = {
  // Public app information
  appName: process.env.EXPO_PUBLIC_APP_NAME || 'VSS 2026 Schedule Organizer',
  vssYear: process.env.EXPO_PUBLIC_VSS_YEAR || '2026',
  vssDates: process.env.EXPO_PUBLIC_VSS_DATES || 'May 15–19, 2026',
  vssLocation: process.env.EXPO_PUBLIC_VSS_LOCATION || 'Fort Lauderdale, FL',
  totalPresentations: process.env.EXPO_PUBLIC_TOTAL_PRESENTATIONS || '1191',

  // External links
  githubRepo: process.env.EXPO_PUBLIC_GITHUB_REPO || 'https://github.com/markwgreenlee/vss-2026-scheduler',
  vssWebsite: process.env.EXPO_PUBLIC_VSS_WEBSITE || 'https://www.visionsciences.org',
};

export default config;
