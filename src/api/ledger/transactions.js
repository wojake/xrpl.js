/* @flow */
/* eslint-disable max-params */
'use strict';
const _ = require('lodash');
const binary = require('ripple-binary-codec');
const {computeTransactionHash} = require('ripple-hashes');
const utils = require('./utils');
const parseTransaction = require('./parse/transaction');
const getTransaction = require('./transaction');
const {validate, composeAsync, convertErrors} = utils.common;
import type {Remote} from '../../core/remote';
import type {TransactionType} from './transaction-types';


type TransactionsOptions = {
  start?: string,
  limit?: number,
  minLedgerVersion?: number,
  maxLedgerVersion?: number,
  earliestFirst?: boolean,
  excludeFailures?: boolean,
  initiated?: boolean,
  counterparty?: string,
  types?: Array<string>,
  binary?: boolean,
  startTx?: TransactionType
}

type GetTransactionsResponse = Array<TransactionType>

type CallbackType = (err?: ?Error, data?: GetTransactionsResponse) => void

function parseBinaryTransaction(transaction) {
  const tx = binary.decode(transaction.tx_blob);
  tx.hash = computeTransactionHash(tx);
  tx.ledger_index = transaction.ledger_index;
  return {
    tx: tx,
    meta: binary.decode(transaction.meta),
    validated: transaction.validated
  };
}

function parseAccountTxTransaction(tx) {
  const _tx = tx.tx_blob ? parseBinaryTransaction(tx) : tx;
  // rippled uses a different response format for 'account_tx' than 'tx'
  return parseTransaction(_.assign({}, _tx.tx,
    {meta: _tx.meta, validated: _tx.validated}));
}

function counterpartyFilter(filters, tx: TransactionType) {
  if (!filters.counterparty) {
    return true;
  }
  if (tx.address === filters.counterparty || (
    tx.specification && (
      (tx.specification.destination &&
        tx.specification.destination.address === filters.counterparty) ||
      (tx.specification.counterparty === filters.counterparty)
    ))) {
    return true;
  }
  return false;
}

function transactionFilter(address: string, filters: TransactionsOptions,
                           tx: TransactionType
) {
  if (filters.excludeFailures && tx.outcome.result !== 'tesSUCCESS') {
    return false;
  }
  if (filters.types && !_.includes(filters.types, tx.type)) {
    return false;
  }
  if (filters.initiated === true && tx.address !== address) {
    return false;
  }
  if (filters.initiated === false && tx.address === address) {
    return false;
  }
  if (filters.counterparty && !counterpartyFilter(filters, tx)) {
    return false;
  }
  return true;
}

function orderFilter(options: TransactionsOptions, tx: TransactionType) {
  return !options.startTx || (options.earliestFirst ?
    utils.compareTransactions(tx, options.startTx) > 0 :
    utils.compareTransactions(tx, options.startTx) < 0);
}

function formatPartialResponse(address: string,
  options: TransactionsOptions, data
) {
  return {
    marker: data.marker,
    results: data.transactions
      .filter((tx) => tx.validated)
      .map(parseAccountTxTransaction)
      .filter(_.partial(transactionFilter, address, options))
      .filter(_.partial(orderFilter, options))
  };
}

function getAccountTx(remote: Remote, address: string,
  options: TransactionsOptions, marker: string, limit: number, callback
) {
  const request = {
    command: 'account_tx',
    account: address,
    // -1 is equivalent to earliest available validated ledger
    ledger_index_min: options.minLedgerVersion || -1,
    // -1 is equivalent to most recent available validated ledger
    ledger_index_max: options.maxLedgerVersion || -1,
    forward: options.earliestFirst,
    binary: options.binary,
    limit: utils.clamp(limit, 10, 400),
    marker: marker
  };

  remote.rawRequest(request,
    composeAsync(_.partial(formatPartialResponse, address, options),
      convertErrors(callback)));
}

function checkForLedgerGaps(remote: Remote, options: TransactionsOptions,
                            transactions: GetTransactionsResponse
) {
  let {minLedgerVersion, maxLedgerVersion} = options;

  // if we reached the limit on number of transactions, then we can shrink
  // the required ledger range to only guarantee that there are no gaps in
  // the range of ledgers spanned by those transactions
  if (options.limit && transactions.length === options.limit) {
    if (options.earliestFirst) {
      maxLedgerVersion = _.last(transactions).outcome.ledgerVersion;
    } else {
      minLedgerVersion = _.last(transactions).outcome.ledgerVersion;
    }
  }

  if (!utils.hasCompleteLedgerRange(remote, minLedgerVersion,
      maxLedgerVersion)) {
    throw new utils.common.errors.MissingLedgerHistoryError();
  }
}

function formatResponse(remote: Remote, options: TransactionsOptions,
                        transactions: GetTransactionsResponse
) {
  const compare = options.earliestFirst ? utils.compareTransactions :
    _.rearg(utils.compareTransactions, 1, 0);
  const sortedTransactions = transactions.sort(compare);
  checkForLedgerGaps(remote, options, sortedTransactions);
  return sortedTransactions;
}

function getTransactionsInternal(remote: Remote, address: string,
                                 options: TransactionsOptions, callback
) {
  const getter = _.partial(getAccountTx, remote, address, options);
  const format = _.partial(formatResponse, remote, options);
  utils.getRecursive(getter, options.limit, composeAsync(format, callback));
}

function getTransactionsAsync(account: string,
  options: TransactionsOptions, callback: CallbackType
) {
  validate.address(account);
  validate.getTransactionsOptions(options);

  const defaults = {maxLedgerVersion: -1};
  if (options.start) {
    getTransaction.call(this, options.start).then(tx => {
      const ledgerVersion = tx.outcome.ledgerVersion;
      const bound = options.earliestFirst ?
        {minLedgerVersion: ledgerVersion} : {maxLedgerVersion: ledgerVersion};
      const newOptions = _.assign(defaults, options, {startTx: tx}, bound);
      getTransactionsInternal(this.remote, account, newOptions, callback);
    }).catch(callback);
  } else {
    const newOptions = _.assign(defaults, options);
    getTransactionsInternal(this.remote, account, newOptions, callback);
  }
}

function getTransactions(account: string, options: TransactionsOptions = {}
): Promise<GetTransactionsResponse> {
  return utils.promisify(getTransactionsAsync).call(this, account, options);
}

module.exports = getTransactions;
