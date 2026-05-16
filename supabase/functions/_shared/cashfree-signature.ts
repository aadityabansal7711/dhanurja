// Cashfree VRS signature-based auth.
//
// Setup (per https://www.cashfree.com/docs/api-reference/vrs/getting-started):
//   1. Cashfree dashboard → Developers → Two-Factor Authentication → Public Key
//      → Generate Public Key → download the PEM file (this is Cashfree's public key
//      for your account; they hold the matching private key).
//   2. Store it as a Supabase secret:
//        supabase secrets set CASHFREE_PUBLIC_KEY="$(cat cashfree_public_key.pem)"
//
// Per Cashfree spec:
//   data    = `${clientId}.${unixSeconds}`
//   cipher  = RSA-OAEP with SHA-1 hash and MGF1-SHA-1 (matches PHP openssl_public_encrypt
//             default and Java RSA/ECB/OAEPWithSHA-1AndMGF1Padding)
//   header  = `X-Cf-Signature: ${base64(cipher(data))}`
// The encrypted value is valid for 5 minutes; we regenerate per request.

let cachedKey: CryptoKey | null = null;
let cachedKeyPem = '';

function pemToDer(pem: string) {
  const cleaned = pem
    .replace(/-----BEGIN [^-]+-----/g, '')
    .replace(/-----END [^-]+-----/g, '')
    .replace(/\s+/g, '');
  const binary = atob(cleaned);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

async function importPublicKey(pem: string): Promise<CryptoKey> {
  if (cachedKey && cachedKeyPem === pem) return cachedKey;
  const key = await crypto.subtle.importKey(
    'spki',
    pemToDer(pem),
    { name: 'RSA-OAEP', hash: 'SHA-1' },
    false,
    ['encrypt'],
  );
  cachedKey = key;
  cachedKeyPem = pem;
  return key;
}

export async function cashfreeSignature(clientId: string, publicKeyPem: string): Promise<string> {
  const epoch = Math.floor(Date.now() / 1000).toString();
  const data = new TextEncoder().encode(`${clientId}.${epoch}`);
  const key = await importPublicKey(publicKeyPem);
  const cipher = await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, key, data);
  const bytes = new Uint8Array(cipher);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

export async function cashfreeAuthHeaders(extra: Record<string, string> = {}): Promise<Record<string, string>> {
  const clientId = Deno.env.get('CASHFREE_CLIENT_ID');
  const clientSecret = Deno.env.get('CASHFREE_CLIENT_SECRET');
  if (!clientId) throw new Error('CASHFREE_CLIENT_ID is not configured');
  if (!clientSecret) throw new Error('CASHFREE_CLIENT_SECRET is not configured');

  const headers: Record<string, string> = {
    ...extra,
    'x-client-id': clientId,
    'x-client-secret': clientSecret,
  };

  const publicKey = Deno.env.get('CASHFREE_PUBLIC_KEY');
  if (publicKey) {
    headers['X-Cf-Signature'] = await cashfreeSignature(clientId, publicKey);
  }
  return headers;
}
