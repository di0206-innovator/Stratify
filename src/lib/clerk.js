// Clerk configuration and helpers preparation

export const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || '';

if (!clerkPublishableKey) {
  console.warn('Clerk publishable key is missing. Auth will run in offline/placeholder mode.');
}
