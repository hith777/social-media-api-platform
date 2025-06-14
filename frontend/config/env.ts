/**
 * Environment configuration
 * All environment variables that start with NEXT_PUBLIC_ are exposed to the browser
 */

const requiredEnvVars = ['NEXT_PUBLIC_API_URL'] as const

type RequiredEnvVar = (typeof requiredEnvVars)[number]

function getEnvVar(key: RequiredEnvVar): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value
}

function getOptionalEnvVar(key: string, defaultValue: string = ''): string {
  return process.env[key] || defaultValue
}

export const env = {
  // API Configuration
  apiUrl: getEnvVar('NEXT_PUBLIC_API_URL'),
  wsUrl: getOptionalEnvVar('NEXT_PUBLIC_WS_URL', 'http://localhost:3000'),

  // App Configuration
  appName: getOptionalEnvVar('NEXT_PUBLIC_APP_NAME', 'Social Media Platform'),
  appUrl: getOptionalEnvVar('NEXT_PUBLIC_APP_URL', 'http://localhost:3001'),

  // Feature Flags
  enableAnalytics: getOptionalEnvVar('NEXT_PUBLIC_ENABLE_ANALYTICS', 'false') === 'true',
  enableDebug: getOptionalEnvVar('NEXT_PUBLIC_ENABLE_DEBUG', 'false') === 'true',

  // Environment
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
} as const

