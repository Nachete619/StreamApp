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
  
  if (!isBuildTime && !apiKey) {
    // Only warn in runtime, not during build
    console.warn('⚠️ LIVEPEER_API_KEY is not set. Please configure it in Vercel environment variables.')
  }
}
