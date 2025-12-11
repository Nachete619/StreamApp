import { Livepeer } from 'livepeer'

const apiKey = process.env.LIVEPEER_API_KEY || process.env.NEXT_PUBLIC_LIVEPEER_API_KEY

// During build time (when Next.js analyzes modules), we need a valid key
// Use a dummy key that won't cause initialization errors
// The actual key will be validated and used at runtime
const buildTimeKey = 'build-time-dummy-key-for-nextjs-build'

// Initialize with the key (dummy during build, real at runtime)
// Livepeer will accept any string during initialization, validation happens on API calls
export const livepeer = new Livepeer({
  apiKey: apiKey || buildTimeKey,
})

// Runtime validation (only in server-side execution, not during build)
if (typeof window === 'undefined') {
  // Check if we're in a build context by checking for Next.js build indicators
  const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build' || 
                      process.env.NEXT_PHASE === 'phase-development-build'
  
  if (!isBuildTime) {
    if (!apiKey || apiKey === 'build-time-dummy-key-for-nextjs-build') {
      // Only warn in runtime, not during build
      console.error('⚠️ ERROR: LIVEPEER_API_KEY is not set or is using dummy key.')
      console.error('⚠️ Please configure LIVEPEER_API_KEY in your .env.local file or environment variables.')
      console.error('⚠️ This will cause 400 Bad Request errors when trying to create streams.')
    } else {
      // Validate API key format (Livepeer API keys typically start with specific prefixes)
      if (apiKey.length < 20) {
        console.warn('⚠️ WARNING: LIVEPEER_API_KEY seems too short. Please verify it is correct.')
      }
    }
  }
}
