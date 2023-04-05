import { assert } from 'chai'

import { validate, ValidationError } from '../../src'
import { validateXChainAccountCreateCommit } from '../../src/models/transactions/XChainAccountCreateCommit'

9

/**
 * XChainAccountCreateCommit Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('XChainAccountCreateCommit', function () {
  let tx

  beforeEach(function () {
    tx = {
      Account: 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh',
      XChainBridge: {
        LockingChainDoor: 'rGzx83BVoqTYbGn7tiVAnFw7cbxjin13jL',
        LockingChainIssue: {
          currency: 'XRP',
        },
        IssuingChainDoor: 'r3kmLJN5D28dHuH8vZNUZpMC43pEHpaocV',
        IssuingChainIssue: {
          currency: 'XRP',
        },
      },
      Amount: '1000000',
      Fee: '10',
      Flags: 2147483648,
      Destination: 'rGzx83BVoqTYbGn7tiVAnFw7cbxjin13jL',
      Sequence: 1,
      SignatureReward: '10000',
      TransactionType: 'XChainAccountCreateCommit',
    } as any
  })

  it('verifies valid XChainAccountCreateCommit', function () {
    assert.doesNotThrow(() => validateXChainAccountCreateCommit(tx))
    assert.doesNotThrow(() => validate(tx))
  })

  it(`throws w/ missing XChainBridge`, function () {
    delete tx.XChainBridge

    assert.throws(
      () => validateXChainAccountCreateCommit(tx),
      ValidationError,
      'XChainAccountCreateCommit: missing field XChainBridge',
    )
    assert.throws(
      () => validate(tx),
      ValidationError,
      'XChainAccountCreateCommit: missing field XChainBridge',
    )
  })

  it(`throws w/ invalid XChainBridge`, function () {
    tx.XChainBridge = { XChainDoor: 'test' }

    assert.throws(
      () => validateXChainAccountCreateCommit(tx),
      ValidationError,
      'XChainAccountCreateCommit: invalid field XChainBridge',
    )
    assert.throws(
      () => validate(tx),
      ValidationError,
      'XChainAccountCreateCommit: invalid field XChainBridge',
    )
  })

  it(`throws w/ missing SignatureReward`, function () {
    delete tx.SignatureReward

    assert.throws(
      () => validateXChainAccountCreateCommit(tx),
      ValidationError,
      'XChainAccountCreateCommit: missing field SignatureReward',
    )
    assert.throws(
      () => validate(tx),
      ValidationError,
      'XChainAccountCreateCommit: missing field SignatureReward',
    )
  })

  it(`throws w/ invalid SignatureReward`, function () {
    tx.SignatureReward = { currency: 'ETH' }

    assert.throws(
      () => validateXChainAccountCreateCommit(tx),
      ValidationError,
      'XChainAccountCreateCommit: invalid field SignatureReward',
    )
    assert.throws(
      () => validate(tx),
      ValidationError,
      'XChainAccountCreateCommit: invalid field SignatureReward',
    )
  })

  it(`throws w/ missing Destination`, function () {
    delete tx.Destination

    assert.throws(
      () => validateXChainAccountCreateCommit(tx),
      ValidationError,
      'XChainAccountCreateCommit: missing field Destination',
    )
    assert.throws(
      () => validate(tx),
      ValidationError,
      'XChainAccountCreateCommit: missing field Destination',
    )
  })

  it(`throws w/ invalid Destination`, function () {
    tx.Destination = 123

    assert.throws(
      () => validateXChainAccountCreateCommit(tx),
      ValidationError,
      'XChainAccountCreateCommit: invalid field Destination',
    )
    assert.throws(
      () => validate(tx),
      ValidationError,
      'XChainAccountCreateCommit: invalid field Destination',
    )
  })

  it(`throws w/ missing Amount`, function () {
    delete tx.Amount

    assert.throws(
      () => validateXChainAccountCreateCommit(tx),
      ValidationError,
      'XChainAccountCreateCommit: missing field Amount',
    )
    assert.throws(
      () => validate(tx),
      ValidationError,
      'XChainAccountCreateCommit: missing field Amount',
    )
  })

  it(`throws w/ invalid Amount`, function () {
    tx.Amount = { currency: 'ETH' }

    assert.throws(
      () => validateXChainAccountCreateCommit(tx),
      ValidationError,
      'XChainAccountCreateCommit: invalid field Amount',
    )
    assert.throws(
      () => validate(tx),
      ValidationError,
      'XChainAccountCreateCommit: invalid field Amount',
    )
  })
})
