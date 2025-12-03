import { Livepeer } from 'livepeer'

const apiKey = process.env.LIVEPEER_API_KEY || process.env.NEXT_PUBLIC_LIVEPEER_API_KEY

if (!apiKey) {
  throw new Error('LIVEPEER_API_KEY is not set')
}

export const livepeer = new Livepeer({
  apiKey,
})
