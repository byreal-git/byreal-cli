/**
 * CLMM SDK initialization for Byreal CLI
 * Singleton pattern - lazily initializes Chain instance
 */

import { Chain, BYREAL_CLMM_PROGRAM_ID } from '@byreal-io/byreal-clmm-sdk';
import { getConnection } from '../core/solana.js';

let chainInstance: Chain | null = null;

/**
 * Get the Chain singleton instance
 * Uses connection from config and the Byreal CLMM program ID
 */
export function getChain(): Chain {
  if (chainInstance) return chainInstance;
  chainInstance = new Chain({
    connection: getConnection(),
    programId: BYREAL_CLMM_PROGRAM_ID,
  });
  return chainInstance;
}
