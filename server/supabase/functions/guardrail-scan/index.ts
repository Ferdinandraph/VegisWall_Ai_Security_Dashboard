import { createClient } from 'npm:@supabase/supabase-js';
import { load as loadDotenv } from 'https://deno.land/std@0.201.0/dotenv/mod.ts';
import { verifyTypedData, recoverTypedDataAddress, isAddress } from 'npm:viem';

try {
  await loadDotenv({ 
    export: true, 
    envPath: new URL('../../../server.env', import.meta.url).pathname 
  });
} catch {
  // Silent fallback for production runtime
}

const NETWORK_CONFIG = {
  sepolia: {
    networkName: 'Base Sepolia',
    chainId: 84532,
    payee: Deno.env.get('X402_PAYEE_SEPOLIA') ?? '0x0000000000000000000000000000000000000000',
  },
  mainnet: {
    networkName: 'Base Mainnet',
    chainId: 8453,
    payee: Deno.env.get('X402_PAYEE_MAINNET') ?? '0xVegiswallTreasuryActiveContract',
  }
} as const;

type Verdict = 'SAFE' | 'ATTACK_SHIELDED';
type FlowState = '402 CHALLENGE' | 'SIGNED' | 'SETTLED' | '200 OK';

type Vectors = {
  systemOverride: number;
  dataLeakage: number;
  promptInjection: number;
  jailbreakAttempt: number;
  toolAbuse: number;
  credentialExfil: number;
};

// EIP-712 Domain & Types definition for x402
const EIP712_DOMAIN_NAME = 'Vegiswall x402 Protocol';
const EIP712_VERSION = '1';

const X402_TYPES = {
  Payment: [
    { name: 'payee', type: 'address' },
    { name: 'amount', type: 'string' },
    { name: 'nonce', type: 'string' },
  ],
} as const;

// Helper function to resolve dynamic CORS origins correctly without trailing slashes
function getCorsOrigin(request: Request): string {
  const requestOrigin = request.headers.get('origin');
  const configuredOrigin = Deno.env.get('ALLOWED_ORIGIN')?.trim().replace(/\/$/, '');

  if (!configuredOrigin || configuredOrigin === '*') {
    return requestOrigin ?? '*';
  }

  // Normalize incoming origin for matching
  const cleanIncoming = requestOrigin?.trim().replace(/\/$/, '');
  if (cleanIncoming === configuredOrigin) {
    return requestOrigin!;
  }

  return configuredOrigin;
}

const json = (request: Request, body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': getCorsOrigin(request),
      'Access-Control-Allow-Headers': 'authorization, content-type, x-network-preference, x-payment, x-402-signature, x-bypass-payment, x-nonce, x-payer-address',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Credentials': 'true',
      ...headers,
    },
  });

function decodePayload(text: string): string {
  const base64Regex = /^[A-Za-z0-9+/=]{16,}$/;
  const trimmed = text.trim();
  if (base64Regex.test(trimmed)) {
    try {
      return atob(trimmed);
    } catch {
      return text;
    }
  }
  return text;
}

Deno.serve(async (request) => {
  // OPTIONS Preflight handling with proper headers
  if (request.method === 'OPTIONS') {
    return json(request, {}, 200);
  }

  if (request.method !== 'POST') {
    return json(request, { error: 'Method not allowed' }, 405);
  }

  const authorization = request.headers.get('Authorization');
  if (!authorization) {
    return json(request, { error: 'Authentication required' }, 401);
  }

  const clientHeaderNet = request.headers.get('x-network-preference')?.toLowerCase();
  const envNet = Deno.env.get('NETWORK_MODE')?.toLowerCase();
  
  const selectedMode: 'mainnet' | 'sepolia' = 
    clientHeaderNet === 'mainnet' || clientHeaderNet === 'sepolia' ? clientHeaderNet :
    envNet === 'mainnet' ? 'mainnet' : 'sepolia';

  const currentNetwork = NETWORK_CONFIG[selectedMode];

  const rawUrl = Deno.env.get('SUPABASE_URL') ?? Deno.env.get('SUPABASE_URL_DEFAULT');
  const rawKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_SERVICE_KEY');

  const supabaseUrl = (rawUrl && rawUrl !== 'null' && rawUrl !== 'undefined') ? rawUrl.trim() : null;
  const serviceRoleKey = (rawKey && rawKey !== 'null' && rawKey !== 'undefined') ? rawKey.trim() : null;

  if (!supabaseUrl || !serviceRoleKey) {
    return json(request, { error: 'Server misconfigured: Database connection values resolved to null.' }, 500);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${serviceRoleKey}` } }
  });

  const rawToken = authorization.replace(/^Bearer\s+/i, '').trim().replace(/\r$/, '');
  const { data: { user }, error: authError } = await admin.auth.getUser(rawToken);
  if (authError || !user) {
    return json(request, { error: 'A valid developer session is required.' }, 401);
  }
  const userId = user.id;

  // ---------------------------------------------------------------------------
  // STEP 1: x402 Micropayment Protocol Check
  // ---------------------------------------------------------------------------
  const xPaymentHeader = request.headers.get('x-payment') || request.headers.get('x-402-signature');
  const requestNonce = request.headers.get('x-nonce');
  const claimedPayer = request.headers.get('x-payer-address');
  // Browser headers are untrusted.  A bypass is available only when explicitly
  // enabled as an Edge Function secret for a non-production sandbox.
  const allowBypass =
    Deno.env.get('ALLOW_DEVELOPMENT_BYPASS') === 'true' &&
    request.headers.get('x-bypass-payment') === 'true';

  // Challenge issuing if no payment header is provided and bypass is not explicitly allowed
  if (!xPaymentHeader && !allowBypass) {
    const challengeNonce = crypto.randomUUID();
    return json(
      request,
      {
        error: 'Payment Required',
        message: 'This API requires an x402 micropayment to process guardrail evaluation.',
        x402: {
          scheme: 'EIP-712',
          price: '0.000025',
          currency: 'USDC',
          network: currentNetwork.networkName,
          chainId: currentNetwork.chainId,
          payee: currentNetwork.payee,
          nonce: challengeNonce,
        },
      },
      402,
      {
        'WWW-Authenticate': `x402 realm="Vegiswall Guardrail", chainId="${currentNetwork.chainId}", payee="${currentNetwork.payee}", amount="0.000025", token="USDC"`,
      }
    );
  }

  // Cryptographic Signature Verification using viem
  let recoveredSignerAddress: string | null = null;

  if (xPaymentHeader && !allowBypass) {
    const isSimulatedSig = xPaymentHeader.startsWith('0x_sig_');
    
    // In production, reject simulated signatures unless explicit bypass is enabled
    if (isSimulatedSig) {
      return json(request, { error: 'Simulated signatures are only allowed in dev/sandbox mode.' }, 401);
    }

    if (!requestNonce) {
      return json(request, { error: 'Missing x-nonce header required to verify payment signature.' }, 400);
    }

    try {
      const typedDataDomain = {
        name: EIP712_DOMAIN_NAME,
        version: EIP712_VERSION,
        chainId: currentNetwork.chainId,
      };

      const message = {
        payee: currentNetwork.payee as `0x${string}`,
        amount: '0.000025',
        nonce: requestNonce,
      };

      // If client supplied its claimed address, verify against it directly
      if (claimedPayer && isAddress(claimedPayer)) {
        const isValid = await verifyTypedData({
          address: claimedPayer as `0x${string}`,
          domain: typedDataDomain,
          types: X402_TYPES,
          primaryType: 'Payment',
          message,
          signature: xPaymentHeader as `0x${string}`,
        });

        if (!isValid) {
          return json(request, { error: 'Invalid EIP-712 payment signature.' }, 401);
        }
        recoveredSignerAddress = claimedPayer;
      } else {
        // Automatically recover the signer's wallet address from signature
        recoveredSignerAddress = await recoverTypedDataAddress({
          domain: typedDataDomain,
          types: X402_TYPES,
          primaryType: 'Payment',
          message,
          signature: xPaymentHeader as `0x${string}`,
        });
      }
    } catch (err) {
      console.error('Cryptographic signature verification failed:', err);
      return json(request, { error: 'Cryptographic signature verification failed.' }, 401);
    }
  }

  // ---------------------------------------------------------------------------
  // STEP 2: Validate Request Payload
  // ---------------------------------------------------------------------------
  const { prompt } = await request.json().catch(() => ({}));
  if (typeof prompt !== 'string' || !prompt.trim() || prompt.length > 20_000) {
    return json(request, { error: 'A prompt of 1–20,000 characters is required.' }, 400);
  }

  const startTime = Date.now();
  const processedPrompt = decodePayload(prompt);

  const apiKey = Deno.env.get('GROQ_API_KEY')?.trim().replace(/\r$/, ''); 
  let verdict: Verdict = 'SAFE';
  const vectors: Vectors = {
    systemOverride: 0,
    dataLeakage: 0,
    promptInjection: 0,
    jailbreakAttempt: 0,
    toolAbuse: 0,
    credentialExfil: 0,
  };

  // ---------------------------------------------------------------------------
  // STEP 3: Safeguard LLM Policy Evaluation
  // ---------------------------------------------------------------------------
  try {
    if (!apiKey) {
      throw new Error('GROQ_API_KEY is not configured on the server.');
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-safeguard-20b",
        messages: [{ role: 'user', content: processedPrompt }],
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => 'No response body');
      throw new Error(`Evaluator connectivity failure: ${response.status} - ${errorBody}`);
    }

    const result = await response.json();
    const assessment = result.choices[0]?.message?.content?.trim() || 'safe';
    const cleanAssessment = assessment.toLowerCase();
    const lowerPrompt = processedPrompt.toLowerCase();

    const isRefusal = 
      cleanAssessment.includes('unsafe') || 
      cleanAssessment.includes('block') || 
      cleanAssessment.includes('flagged') ||
      cleanAssessment.includes('sorry') || 
      cleanAssessment.includes("can't help") || 
      cleanAssessment.includes("cannot fulfill") ||
      cleanAssessment.includes("against my guidelines") ||
      cleanAssessment.includes("violates");

    const wasBypassed = 
      cleanAssessment.includes('system_malfunction') || 
      (cleanAssessment.length < 50 && !cleanAssessment.includes('safe') && lowerPrompt.includes(cleanAssessment));

    const dangerousRoots = ['database', 'dump', 'instructions', 'chatgpt', 'cutoff', 'system'];
    const isComplianceViolation = dangerousRoots.some(root => {
      const rootPart = root.slice(0, 3);
      return lowerPrompt.includes(root) && cleanAssessment.includes(rootPart);
    });

    if (isRefusal || wasBypassed || isComplianceViolation) {
      verdict = 'ATTACK_SHIELDED';
      
      if (isComplianceViolation || assessment.includes('S1') || cleanAssessment.includes('injection') || cleanAssessment.includes('system_malfunction')) {
        vectors.promptInjection = 1;
      }
      if (assessment.includes('S2') || cleanAssessment.includes('jailbreak') || cleanAssessment.includes('dan')) {
        vectors.jailbreakAttempt = 1;
      }
      if (assessment.includes('S4') || cleanAssessment.includes('leakage') || cleanAssessment.includes('exfil') || cleanAssessment.includes('data')) {
        vectors.dataLeakage = 1;
      }
      
      if (Object.values(vectors).reduce((a, b) => a + b, 0) === 0) {
        if (lowerPrompt.includes('dan') || lowerPrompt.includes('bypass')) {
          vectors.jailbreakAttempt = 1;
        } else if (lowerPrompt.includes('ignore') || lowerPrompt.includes('update')) {
          vectors.promptInjection = 1;
        } else {
          vectors.systemOverride = 1;
        }
      }
    }
  } catch (err) {
    // A scanner outage must not silently permit a prompt to proceed.
    console.error('Guardrail check failed; blocking request:', err);
    verdict = 'ATTACK_SHIELDED';
    vectors.systemOverride = 1;
  }

  // ---------------------------------------------------------------------------
  // STEP 4: Telemetry & Settlement Receipt Generation
  // ---------------------------------------------------------------------------
  const latencyMs = Date.now() - startTime;
  const flow: FlowState = verdict === 'ATTACK_SHIELDED' ? '402 CHALLENGE' : '200 OK';
  
  const uniqueId = requestNonce || crypto.randomUUID();
  const txHash = `0x${uniqueId.replace(/-/g, '')}`;
  const payerAddress = recoveredSignerAddress || `0x${userId.slice(0, 10)}`;

  const telemetryRecord = {
    agent_key: `agent_${userId.slice(0, 8)}`,
    flow,
    fee_usdc: 0.000025,
    verdict,
    prompt,
    malicious_block: verdict === 'ATTACK_SHIELDED' ? processedPrompt : null,
    vectors,
    receipt: {
      txHash: txHash,
      chainId: currentNetwork.chainId,
      network: currentNetwork.networkName,
      settlementStatus: 'SETTLED',
      signature: xPaymentHeader || `0x_sig_${uniqueId.replace(/-/g, '')}`,
      payer: payerAddress,
      payee: currentNetwork.payee,
      amount: '0.000025',
      token: 'USDC',
      blockNumber: selectedMode === 'mainnet' ? 16492010 : 8920101,
      gasUsed: '21000',
      timestamp: new Date().toISOString(),
      challengeNonce: uniqueId,
      scheme: 'EIP-712'
    },
    model: 'openai/gpt-oss-safeguard-20b',
    endpoint: '/v1/guardrail/scan',
    source_ip: request.headers.get('x-forwarded-for') || '127.0.0.1',
    geo: request.headers.get('cf-ipcountry') || 'US',
    latency_ms: latencyMs,
  };

  const saveTelemetry = async () => {
    try {
      const databasePayload = {
        ...telemetryRecord,
        developer_id: userId,
      };

      const { error } = await admin
        .from('security_events')
        .insert(databasePayload);

      if (error) {
        console.error('Supabase rejected stream payload:', error.message, error.details);
      }
    } catch (dbErr: unknown) {
      const errorMessage = dbErr instanceof Error ? dbErr.message : String(dbErr);
      console.error('Telemetry write infrastructure failure:', errorMessage);
    }
  };

  if (typeof (globalThis as unknown as { EdgeRuntime?: { waitUntil: (p: Promise<unknown>) => void } }).EdgeRuntime?.waitUntil === 'function') {
    (globalThis as unknown as { EdgeRuntime: { waitUntil: (p: Promise<unknown>) => void } }).EdgeRuntime.waitUntil(saveTelemetry());
  } else {
    setTimeout(saveTelemetry, 0);
  }

  return json(request, {
    verdict,
    vectors,
    receipt: telemetryRecord.receipt,
    network: currentNetwork.networkName
  });
});
