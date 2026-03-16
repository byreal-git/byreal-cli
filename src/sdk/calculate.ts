// CLI-specific calculation utilities built on top of @byreal-io/byreal-clmm-sdk

import BN from 'bn.js';
import { Decimal } from 'decimal.js';
import { PublicKey } from '@solana/web3.js';

import {
  MAX_TICK,
  MIN_TICK,
  PoolUtils,
  SqrtPriceMath,
  TickMath,
  PersonalPositionLayout,
  getAmountBFromAmountA,
} from '@byreal-io/byreal-clmm-sdk';
import type { IPoolLayout, IPersonalPositionLayout } from '@byreal-io/byreal-clmm-sdk';

import { getConnection } from '../core/solana.js';

/**
 * Calculate tick-aligned price range
 */
export function calculateTickAlignedPriceRange(info: {
  tickSpacing: number;
  mintDecimalsA: number;
  mintDecimalsB: number;
  startPrice: string | number;
  endPrice: string | number;
}) {
  const priceInTickLower = TickMath.getTickAlignedPriceDetails(
    new Decimal(info.startPrice),
    info.tickSpacing,
    info.mintDecimalsA,
    info.mintDecimalsB
  );
  const priceInTickUpper = TickMath.getTickAlignedPriceDetails(
    new Decimal(info.endPrice),
    info.tickSpacing,
    info.mintDecimalsA,
    info.mintDecimalsB
  );
  return {
    priceInTickLower,
    priceInTickUpper,
  };
}

/**
 * Calculate a price from tick + tickSpacing
 */
export function calculatePriceFromTick(
  tick: number | string,
  mintDecimalsA: number,
  mintDecimalsB: number,
  tickSpacing: number | string
) {
  let tickWithSpacing = Number(tick) + Number(tickSpacing);

  if (tickWithSpacing < MIN_TICK || tickWithSpacing > MAX_TICK) {
    console.warn(`!!! tickWithSpacing ${tickWithSpacing} is out of range, using the nearest tick !!!`);
    tickWithSpacing = Number(tick);
  }
  const sqrtPriceX64 = SqrtPriceMath.getSqrtPriceX64FromTick(tickWithSpacing);
  const price = SqrtPriceMath.sqrtPriceX64ToPrice(sqrtPriceX64, mintDecimalsA, mintDecimalsB);
  return {
    price: price.toString(),
    tick: tickWithSpacing,
  };
}

/**
 * Calculate the available price range from a TickSpacing
 */
export function calculatePriceRangeFromTickSpacing(tickSpacing: number, mintDecimalsA: number, mintDecimalsB: number) {
  const { minTickBoundary, maxTickBoundary } = PoolUtils.tickRange(tickSpacing);
  return {
    min: calculatePriceFromTick(minTickBoundary, mintDecimalsA, mintDecimalsB, tickSpacing),
    max: calculatePriceFromTick(maxTickBoundary, mintDecimalsA, mintDecimalsB, tickSpacing),
  };
}

/**
 * Given a total USD amount, calculate the optimal tokenA/tokenB split
 * within the given CLMM price range using binary search.
 */
export function calculateTokenAmountsFromUsd(params: {
  capitalUsd: number;
  tokenAPriceUsd: number;
  tokenBPriceUsd: number;
  priceLower: Decimal | number | string;
  priceUpper: Decimal | number | string;
  poolInfo: IPoolLayout;
}): { amountA: BN; amountB: BN } {
  const { capitalUsd, tokenAPriceUsd, tokenBPriceUsd, priceLower, priceUpper, poolInfo } = params;

  const capital = new Decimal(capitalUsd);
  const priceA = new Decimal(tokenAPriceUsd);
  const priceB = new Decimal(tokenBPriceUsd);

  if (priceA.lte(0) || priceB.lte(0)) {
    throw new Error('Token USD prices must be greater than 0');
  }

  const decimalsA = poolInfo.mintDecimalsA;
  const decimalsB = poolInfo.mintDecimalsB;

  // Get current price from pool state
  const currentPrice = TickMath.getPriceFromTick({
    tick: poolInfo.tickCurrent,
    decimalsA,
    decimalsB,
  });

  const priceLowerDec = new Decimal(priceLower);
  const priceUpperDec = new Decimal(priceUpper);

  // Case 1: Current price is below the range → all tokenA
  if (currentPrice.lte(priceLowerDec)) {
    const amountAUi = capital.div(priceA);
    const amountA = new BN(amountAUi.mul(new Decimal(10).pow(decimalsA)).toFixed(0));
    return { amountA, amountB: new BN(0) };
  }

  // Case 2: Current price is above the range → all tokenB
  if (currentPrice.gte(priceUpperDec)) {
    const amountBUi = capital.div(priceB);
    const amountB = new BN(amountBUi.mul(new Decimal(10).pow(decimalsB)).toFixed(0));
    return { amountA: new BN(0), amountB };
  }

  // Case 3: Current price is within range → binary search
  let low = new Decimal(0);
  let high = capital.div(priceA).mul(2);
  let bestAmountA = high.div(2);

  const tolerance = new Decimal(0.0001);
  const maxIterations = 50;

  for (let i = 0; i < maxIterations; i++) {
    const amountAUi = bestAmountA;
    const amountARaw = new BN(amountAUi.mul(new Decimal(10).pow(decimalsA)).toFixed(0));

    const amountBRaw = getAmountBFromAmountA({
      priceLower,
      priceUpper,
      amountA: amountARaw,
      poolInfo,
    });

    const amountBUi = new Decimal(amountBRaw.toString()).div(new Decimal(10).pow(decimalsB));

    const totalUsd = amountAUi.mul(priceA).plus(amountBUi.mul(priceB));
    const diff = totalUsd.minus(capital);
    const diffRatio = capital.gt(0) ? diff.div(capital).abs() : new Decimal(0);

    if (diffRatio.lte(tolerance)) {
      return { amountA: amountARaw, amountB: amountBRaw };
    }

    if (totalUsd.gt(capital)) {
      high = bestAmountA;
    } else {
      low = bestAmountA;
    }

    bestAmountA = low.plus(high).div(2);
  }

  const amountARaw = new BN(bestAmountA.mul(new Decimal(10).pow(decimalsA)).toFixed(0));
  const amountBRaw = getAmountBFromAmountA({
    priceLower,
    priceUpper,
    amountA: amountARaw,
    poolInfo,
  });

  return { amountA: amountARaw, amountB: amountBRaw };
}

/**
 * Get raw position info by position account address (PDA)
 */
export async function getRawPositionInfoByAddress(
  positionAddress: PublicKey
): Promise<IPersonalPositionLayout | null> {
  const connection = getConnection();
  const positionRes = await connection.getAccountInfo(positionAddress);
  if (!positionRes) return null;
  return PersonalPositionLayout.decode(positionRes.data);
}
