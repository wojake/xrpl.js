import { assert } from 'chai'
import _ from 'lodash'
import { TxRequest } from 'xrpl'

import {
  convertStringToHex,
  ensureDecodedMeta,
  getNFTokenID,
  NFTokenMint,
} from '../../../src'
import { hashSignedTx } from '../../../src/utils/hashes'
import serverUrl from '../serverUrl'
import {
  setupClient,
  teardownClient,
  type XrplIntegrationTestContext,
} from '../setup'
import { testTransaction } from '../utils'

// how long before each test case times out
const TIMEOUT = 20000

describe('NFTokenMint', function () {
  let testContext: XrplIntegrationTestContext

  beforeEach(async () => {
    testContext = await setupClient(serverUrl)
  })
  afterEach(async () => teardownClient(testContext))

  it(
    'get NFTokenID',
    async function () {
      const tx: NFTokenMint = {
        TransactionType: 'NFTokenMint',
        Account: testContext.wallet.address,
        URI: convertStringToHex('https://www.google.com'),
        NFTokenTaxon: 0,
      }

      const response = await testTransaction(
        testContext.client,
        tx,
        testContext.wallet,
      )
      assert.equal(response.type, 'response')

      const txRequest: TxRequest = {
        command: 'tx',
        transaction: hashSignedTx(response.result.tx_blob),
      }
      const txResponse = await testContext.client.request(txRequest)

      assert.equal(
        ensureDecodedMeta(txResponse.result.meta)?.TransactionResult,
        'tesSUCCESS',
      )

      const accountNFTs = await testContext.client.request({
        command: 'account_nfts',
        account: testContext.wallet.address,
      })

      const nftokenID = getNFTokenID(txResponse.result.meta) ?? 'undefined'
      const accountHasNFT = accountNFTs.result.account_nfts.some(
        (value) => value.NFTokenID === nftokenID,
      )

      assert.isTrue(
        accountHasNFT,
        `Expected to find an NFT with NFTokenID ${nftokenID} in account ${
          testContext.wallet.address
        } but did not find it.
      \n\nHere's what was returned from 'account_nfts' for ${
        testContext.wallet.address
      }: ${JSON.stringify(accountNFTs)}`,
      )
    },
    TIMEOUT,
  )
})
