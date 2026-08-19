import { privateKeyToAccount } from 'viem/accounts';

export interface VegiswallConfig {
  apiUrl: string;
  authToken: string;
  privateKey: `0x${string}`;
  networkPreference?: 'sepolia' | 'mainnet';
}

export interface ScanResult {
  verdict: 'SAFE' | 'ATTACK_SHIELDED';
  vectors: Record<string, number>;
  receipt: {
    txHash: string;
    payer: string;
    payee: string;
    amount: string;
    timestamp: string;
  };
}

export class VegiswallClient {
  private apiUrl: string;
  private authToken: string;
  private account: ReturnType<typeof privateKeyToAccount>;
  private networkPreference: string;

  constructor(config: VegiswallConfig) {
    this.apiUrl = config.apiUrl;
    this.authToken = config.authToken;
    this.account = privateKeyToAccount(config.privateKey);
    this.networkPreference = config.networkPreference ?? 'sepolia';
  }

  /**
   * Evaluates a prompt against Vegiswall Safeguards and automatically handles x402 EIP-712 payments programmatically.
   */
  async scan(prompt: string): Promise<ScanResult> {
    const baseHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.authToken}`,
      'x-network-preference': this.networkPreference,
    };

    // 1. Send initial request
    let response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: baseHeaders,
      body: JSON.stringify({ prompt }),
    });

    // 2. Handle x402 Payment Challenge autonomously
    if (response.status === 402) {
      const challengeData = await response.json();
      const challenge = challengeData.x402;

      // Sign EIP-712 typed data programmatically with local agent key
      const signature = await this.account.signTypedData({
        domain: {
          name: 'Vegiswall x402 Protocol',
          version: '1',
          chainId: challenge.chainId,
        },
        types: {
          Payment: [
            { name: 'payee', type: 'address' },
            { name: 'amount', type: 'string' },
            { name: 'nonce', type: 'string' },
          ],
        },
        primaryType: 'Payment',
        message: {
          payee: challenge.payee,
          amount: challenge.price,
          nonce: challenge.nonce,
        },
      });

      // 3. Resubmit request with payment signature + header metadata
      response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          ...baseHeaders,
          'x-payment': signature,
          'x-nonce': challenge.nonce,
          'x-payer-address': this.account.address,
        },
        body: JSON.stringify({ prompt }),
      });
    }

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Unknown request error' }));
      throw new Error(`Vegiswall Guardrail Error [${response.status}]: ${err.error || 'Failed request'}`);
    }

    return response.json();
  }
}