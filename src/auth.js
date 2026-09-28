import { authConfig } from './auth-config.js';

export function authConfigured(config = authConfig) {
  try {
    const url = new URL(config.url);
    return url.protocol === 'https:' && /^[a-z0-9-]+\.supabase\.co$/.test(url.hostname)
      && url.pathname === '/' && !url.username && !url.password && !url.search && !url.hash
      && /^sb_publishable_[A-Za-z0-9_-]+$/.test(config.publishableKey);
  } catch { return false; }
}

// Keep provider session handling in the maintained SDK. Load it only when configured.
const loadClient = async () => import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.2/+esm');

export function createEmailAuth(config = authConfig, loader = loadClient) {
  let client, subscription;
  return {
    configured: authConfigured(config),
    async start(onUser) {
      if (!authConfigured(config)) { onUser(null); return; }
      const { createClient } = await loader();
      client = createClient(config.url, config.publishableKey, {
        auth: { storageKey: 'gharka-auth-v1', persistSession: true, autoRefreshToken: true,
          detectSessionInUrl: true, flowType: 'implicit' }
      });
      const { data, error } = await client.auth.getSession();
      if (error) throw error;
      onUser(data.session?.user || null);
      subscription = client.auth.onAuthStateChange((_event, session) => {
        onUser(session?.user || null);
      }).data.subscription;
    },
    async sendLink(email, pageUrl) {
      if (!client) throw new Error('Email sign-in is unavailable. You can continue as a guest.');
      const address = email.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) throw new Error('Enter a valid email address.');
      // Preserve the deployed /gharka/ directory; never redirect from user-supplied query data.
      const redirect = new URL('./', pageUrl);
      if (!['http:', 'https:'].includes(redirect.protocol)) throw new Error('Open GharKa from its website to sign in.');
      const { error } = await client.auth.signInWithOtp({ email: address,
        options: { emailRedirectTo: redirect.href, shouldCreateUser: true } });
      if (error) throw new Error('We could not send the link. Please wait a minute and try again, or continue as a guest.');
    },
    async signOut() {
      if (!client) return;
      const { error } = await client.auth.signOut({ scope: 'local' });
      if (error) throw new Error('Could not sign out. Please try again.');
    },
    stop() { subscription?.unsubscribe(); }
  };
}
