import { Livepeer } from 'livepeer'

// Function to get the current API key (reads from env each time)
const getApiKey = () => {
  return process.env.LIVEPEER_API_KEY || process.env.NEXT_PUBLIC_LIVEPEER_API_KEY
}

// During build time (when Next.js analyzes modules), we need a valid key
// Use a dummy key that won't cause initialization errors
// The actual key will be validated and used at runtime
const buildTimeKey = 'build-time-dummy-key-for-nextjs-build'

// Create a function that returns a new Livepeer instance with current API key
// This ensures we always use the latest API key from environment variables
export const getLivepeerClient = () => {
  const apiKey = getApiKey()
  return new Livepeer({
    apiKey: apiKey || buildTimeKey,
  })
}

// For backward compatibility, export a singleton that reads the key dynamically
// Note: This still has the limitation that it's initialized once, but at least
// we can force re-initialization by calling getLivepeerClient() directly
export const livepeer = getLivepeerClient()

// Runtime validation (only in server-side execution, not during build)
if (typeof window === 'undefined') {
  // Check if we're in a build context by checking for Next.js build indicators
  const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build' || 
                      process.env.NEXT_PHASE === 'phase-development-build'
  
  if (!isBuildTime) {
    const currentApiKey = getApiKey()
    if (!currentApiKey || currentApiKey === 'build-time-dummy-key-for-nextjs-build') {
      // Only warn in runtime, not during build
      console.error('⚠️ ERROR: LIVEPEER_API_KEY is not set or is using dummy key.')
      console.error('⚠️ Please configure LIVEPEER_API_KEY in your .env.local file or environment variables.')
      console.error('⚠️ This will cause 400 Bad Request errors when trying to create streams.')
    } else {
      // Log first 10 and last 4 characters of API key for debugging (without exposing full key)
      const maskedKey = currentApiKey.length > 14 
        ? `${currentApiKey.substring(0, 10)}...${currentApiKey.substring(currentApiKey.length - 4)}`
        : '***'
      console.log(`✅ Livepeer API Key loaded: ${maskedKey} (length: ${currentApiKey.length})`)
      
      // Validate API key format (Livepeer API keys typically start with specific prefixes)
      if (currentApiKey.length < 20) {
        console.warn('⚠️ WARNING: LIVEPEER_API_KEY seems too short. Please verify it is correct.')
      }
    }
  }
}
