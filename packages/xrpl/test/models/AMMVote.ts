import { assert } from 'chai'
import { validate, ValidationError } from 'xrpl-local'

/**
 * AMMVote Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('AMMVote', function () {
  let vote

  beforeEach(function () {
    vote = {
      TransactionType: 'AMMVote',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      TradingFee: 25,
      Sequence: 1337,
    } as any
  })

  it(`verifies valid AMMVote`, function () {
    assert.doesNotThrow(() => validate(vote))
  })

  it(`throws w/ missing field TradingFee`, function () {
    delete vote.TradingFee
    assert.throws(
      () => validate(vote),
      ValidationError,
      'AMMVote: missing field TradingFee',
    )
  })

  it(`throws w/ TradingFee must be a number`, function () {
    vote.TradingFee = '25'
    assert.throws(
      () => validate(vote),
      ValidationError,
      'AMMVote: TradingFee must be a number',
    )
  })

  it(`throws when TradingFee is greater than AMM_MAX_TRADING_FEE`, function () {
    vote.TradingFee = 1001
    assert.throws(
      () => validate(vote),
      ValidationError,
      'AMMVote: TradingFee must be between 0 and 1000',
    )
  })

  it(`throws when TradingFee is a negative number`, function () {
    vote.TradingFee = -1
    assert.throws(
      () => validate(vote),
      ValidationError,
      'AMMVote: TradingFee must be between 0 and 1000',
    )
  })
})