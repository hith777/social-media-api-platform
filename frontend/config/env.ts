/**
 * Environment configuration
 * All environment variables that start with NEXT_PUBLIC_ are exposed to the browser
 */

const requiredEnvVars = ['NEXT_PUBLIC_API_URL'] as const

type RequiredEnvVar = (typeof requiredEnvVars)[number]

function getEnvVar(key: RequiredEnvVar, defaultValue?: string): string {
  const value = process.env[key]
  if (!value) {
    if (defaultValue !== undefined) {
      console.warn(`Environment variable ${key} not set, using default: ${defaultValue}`)
      return defaultValue
    }
    // Only throw in production, in development provide a helpful default
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Missing required environment variable: ${key}`)
    }
    // Development default
    const devDefaults: Record<string, string> = {
      'NEXT_PUBLIC_API_URL': 'http://localhost:3000/api',
    }
    const devValue = devDefaults[key]
    if (devValue) {
      console.warn(`⚠️  ${key} not set in .env.local, using default: ${devValue}`)
      console.warn(`   Please create .env.local with: ${key}=${devValue}`)
      return devValue
    }
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value
}

function getOptionalEnvVar(key: string, defaultValue: string = ''): string {
  return process.env[key] || defaultValue
}

export const env = {
  // API Configuration
  apiUrl: getEnvVar('NEXT_PUBLIC_API_URL', 'http://localhost:3000/api'),
  wsUrl: getOptionalEnvVar('NEXT_PUBLIC_WS_URL', 'http://localhost:3000'),

  // App Configuration
  appName: getOptionalEnvVar('NEXT_PUBLIC_APP_NAME', 'Social Media Platform'),
  appUrl: getOptionalEnvVar('NEXT_PUBLIC_APP_URL', 'http://localhost:3001'),

  // Feature Flags
  enableAnalytics: getOptionalEnvVar('NEXT_PUBLIC_ENABLE_ANALYTICS', 'false') === 'true',
  enableDebug: getOptionalEnvVar('NEXT_PUBLIC_ENABLE_DEBUG', 'false') === 'true',
  
  // Analytics Configuration
  gaMeasurementId: getOptionalEnvVar('NEXT_PUBLIC_GA_MEASUREMENT_ID', ''),
  analyticsEndpoint: getOptionalEnvVar('NEXT_PUBLIC_ANALYTICS_ENDPOINT', ''),
  errorTrackingEndpoint: getOptionalEnvVar('NEXT_PUBLIC_ERROR_TRACKING_ENDPOINT', ''),

  // Environment
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
} as const

