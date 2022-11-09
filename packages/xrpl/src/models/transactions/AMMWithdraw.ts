/* eslint-disable complexity -- required for validateAMMWithdraw */
import { ValidationError } from '../../errors'
import { Amount, Issue, IssuedCurrencyAmount } from '../common'

import {
  BaseTransaction,
  isAmount,
  isIssuedCurrency,
  validateBaseTransaction,
} from './common'

/**
 * AMMWithdraw is the withdraw transaction used to remove liquidity from the AMM
 * instance pool, thus redeeming some share of the pools that one owns in the form
 * of LPTokenIn.
 *
 * The following are the recommended valid combinations:
 * - LPTokenIn
 * - Amount
 * - Amount and Amount2
 * - Amount and LPTokenIn
 * - Amount and EPrice
 */
export interface AMMWithdraw extends BaseTransaction {
  TransactionType: 'AMMWithdraw'

  /**
   * Specifies one of the pool assets (XRP or token) of the AMM instance.
   */
  Asset: Issue

  /**
   * Specifies the other pool asset of the AMM instance.
   */
  Asset2: Issue

  /**
   * Specifies the amount of shares of the AMM instance pools that the trader
   * wants to redeem or trade in.
   */
  LPTokenIn?: IssuedCurrencyAmount

  /**
   * Specifies one of the pools assets that the trader wants to remove.
   * If the asset is XRP, then the Amount is a string specifying the number of drops.
   * Otherwise it is an IssuedCurrencyAmount object.
   */
  Amount?: Amount

  /**
   * Specifies the other pool asset that the trader wants to remove.
   */
  Amount2?: Amount

  /**
   * Specifies the effective-price of the token out after successful execution of
   * the transaction.
   */
  EPrice?: Amount
}

/**
 * Verify the form and type of an AMMWithdraw at runtime.
 *
 * @param tx - An AMMWithdraw Transaction.
 * @throws When the AMMWithdraw is Malformed.
 */
export function validateAMMWithdraw(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  if (tx.Amount2 != null && tx.Amount == null) {
    throw new ValidationError('AMMWithdraw: must set Amount with Amount2')
  } else if (tx.EPrice != null && tx.Amount == null) {
    throw new ValidationError('AMMWithdraw: must set Amount with EPrice')
  } else if (tx.LPTokenIn == null && tx.Amount == null) {
    throw new ValidationError(
      'AMMWithdraw: must set at least LPTokenIn or Amount',
    )
  }

  if (tx.LPTokenIn != null && !isIssuedCurrency(tx.LPTokenIn)) {
    throw new ValidationError(
      'AMMWithdraw: LPTokenIn must be an IssuedCurrencyAmount',
    )
  }

  if (tx.Amount != null && !isAmount(tx.Amount)) {
    throw new ValidationError('AMMWithdraw: Amount must be an Amount')
  }

  if (tx.Amount2 != null && !isAmount(tx.Amount2)) {
    throw new ValidationError('AMMWithdraw: Amount2 must be an Amount')
  }

  if (tx.EPrice != null && !isAmount(tx.EPrice)) {
    throw new ValidationError('AMMWithdraw: EPrice must be an Amount')
  }
}