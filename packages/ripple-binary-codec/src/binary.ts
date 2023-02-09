/* eslint-disable func-style */

import { coreTypes } from './types'
import { BinaryParser } from './serdes/binary-parser'
import { AccountID } from './types/account-id'
import { HashPrefix } from './hash-prefixes'
import { BinarySerializer, BytesList } from './serdes/binary-serializer'
import { sha512Half, transactionID } from './hashes'
import { FieldInstance } from './enums'
import { STObject } from './types/st-object'
import { JsonObject } from './types/serialized-type'
import { Buffer } from 'buffer/'
import bigInt = require('big-integer')
import { Amount } from './types/amount'

/**
 * Construct a BinaryParser
 *
 * @param bytes hex-string to construct BinaryParser from
 * @returns A BinaryParser
 */
const makeParser = (bytes: string): BinaryParser => new BinaryParser(bytes)

/**
 * Parse BinaryParser into JSON
 *
 * @param parser BinaryParser object
 * @returns JSON for the bytes in the BinaryParser
 */
const readJSON = (parser: BinaryParser): JsonObject =>
  (parser.readType(coreTypes.STObject) as STObject).toJSON()

/**
 * Parse a hex-string into its JSON interpretation
 *
 * @param bytes hex-string to parse into JSON
 * @returns JSON
 */
const binaryToJSON = (bytes: string): JsonObject => readJSON(makeParser(bytes))

/**
 * Interface for passing parameters to SerializeObject
 *
 * @field set signingFieldOnly to true if you want to serialize only signing fields
 */
interface OptionObject {
  prefix?: Buffer
  suffix?: Buffer
  signingFieldsOnly?: boolean
}

/**
 * Function to serialize JSON object representing a transaction
 *
 * @param object JSON object to serialize
 * @param opts options for serializing, including optional prefix, suffix, and signingFieldOnly
 * @returns A Buffer containing the serialized object
 */
function serializeObject(object: JsonObject, opts: OptionObject = {}): Buffer {
  const { prefix, suffix, signingFieldsOnly = false } = opts
  const bytesList = new BytesList()

  if (prefix) {
    bytesList.put(prefix)
  }

  const filter = signingFieldsOnly
    ? (f: FieldInstance): boolean => f.isSigningField
    : undefined

  coreTypes.STObject.from(object, filter).toBytesSink(bytesList)

  if (suffix) {
    bytesList.put(suffix)
  }

  return bytesList.toBytes()
}

/**
 * Serialize an object for signing
 *
 * @param transaction Transaction to serialize
 * @param prefix Prefix bytes to put before the serialized object
 * @returns A Buffer with the serialized object
 */
function signingData(
  transaction: JsonObject,
  prefix: Buffer = HashPrefix.transactionSig,
): Buffer {
  return serializeObject(transaction, { prefix, signingFieldsOnly: true })
}

/**
 * Interface describing fields required for a Claim
 */
interface ClaimObject {
  channel: string
  amount: Amount
}

/**
 * Serialize a signingClaim
 *
 * @param claim A claim object to serialize
 * @returns the serialized object with appropriate prefix
 */
function signingClaimData(claim: ClaimObject): Buffer {
  const prefix = HashPrefix.paymentChannelClaim
  const channel = coreTypes.Hash256.from(claim.channel).toBytes()
  const bytesList = new BytesList()
  bytesList.put(prefix)
  bytesList.put(channel)
  if (typeof claim.amount === 'object') {
    const amount = coreTypes.Amount.from(claim.amount).toBytes()
    bytesList.put(amount)
  } else {
    const num = bigInt(String(claim.amount))
    const amount = coreTypes.UInt64.from(num).toBytes()
    bytesList.put(amount)
  }
  return bytesList.toBytes()
}

/**
 * Serialize a transaction object for multiSigning
 *
 * @param transaction transaction to serialize
 * @param signingAccount Account to sign the transaction with
 * @returns serialized transaction with appropriate prefix and suffix
 */
function multiSigningData(
  transaction: JsonObject,
  signingAccount: string | AccountID,
): Buffer {
  const prefix = HashPrefix.transactionMultiSig
  const suffix = coreTypes.AccountID.from(signingAccount).toBytes()
  return serializeObject(transaction, {
    prefix,
    suffix,
    signingFieldsOnly: true,
  })
}

export {
  BinaryParser,
  BinarySerializer,
  BytesList,
  ClaimObject,
  makeParser,
  serializeObject,
  readJSON,
  multiSigningData,
  signingData,
  signingClaimData,
  binaryToJSON,
  sha512Half,
  transactionID,
}
