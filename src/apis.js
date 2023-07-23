// @flow
import axios from 'axios'
import { Base64 } from 'js-base64'
import env from './typedEnv'
import type { TxHash, Recipient } from './types/transfer.flow.js'
import type { UserProfile, CloudWalletFolderMetaType } from './types/user.flow.js'
import type {
  AccountData,
  BackEndCryptoAccountType,
  EthContractType
} from './types/account.flow.js'
import type { CoinBaseAccessObject } from './wallets/CoinbaseClient'
import { store } from './configureStore.js'
import paths from './Paths'

const chainsferApi = axios.create({
  baseURL: env.REACT_APP_CHAINSFER_API_ENDPOINT,
  headers: {
    'Content-Type': 'application/json'
  },
  validateStatus: status => {
    if (status === 405 || status === 503) {
      // maintenance mode is on, redirect to status page
      window.location.replace('http://status.chainsfr.com')
    }
    return status >= 200 && status < 300 // default
  }
})

const coinbaseAccessTokenApi = axios.create({
  baseURL: env.REACT_APP_COINBASE_ACCESS_TOKEN_ENDPOINT,
  headers: {
    'Content-Type': 'application/json'
  }
})

// account to account transfers
async function directTransfer (request: {|
  senderAccount: string,
  destinationAccount: string,
  transferAmount: string,
  transferFiatAmountSpot: string,
  fiatType: string,
  exchangeRate: { cryptoExchangeRate: string, txFeeCryptoExchangeRate: string },
  cryptoType: string,
  sendMessage: ?string,
  sendTxHash: TxHash
|}) {
  let apiResponse = await chainsferApi.post('/transfer', {
    clientId: 'test-client',
    action: 'DIRECT_TRANSFER',
    ...request
  })
  return apiResponse.data
}

async function transfer (request: {|
  transferId: ?string,
  senderName: string,
  senderAvatar: string,
  sender: string,
  senderAccount: string,
  destination: string,
  receiverName: string,
  receiverAvatar: ?string,
  transferAmount: string,
  transferFiatAmountSpot: string,
  fiatType: string,
  exchangeRate: { cryptoExchangeRate: string, txFeeCryptoExchangeRate: string },
  sendMessage: ?string,
  cryptoType: string,
  data: string,
  sendTxHash: ?TxHash,
  walletId?: string
|}) {
  let apiResponse = await chainsferApi.post('/transfer', {
    clientId: 'test-client',
    action: 'SEND',
    ...request
  })
  return apiResponse.data
}

async function accept (request: {|
  receivingId: string,
  receiverAccount: string,
  receiveMessage: ?string,
  clientSig: string
|}) {
  let apiResponse = await chainsferApi.post('/transfer', {
    clientId: 'test-client',
    action: 'RECEIVE',
    ...request
  })
  return apiResponse.data
}

async function cancel (request: {|
  transferId: string,
  cancelMessage: ?string,
  clientSig: string
|}) {
  let apiResponse = await chainsferApi.post('/transfer', {
    clientId: 'test-client',
    action: 'CANCEL',
    ...request
  })
  return apiResponse.data
}

async function getMultiSigSigningData (request: {|
  transferId?: string,
  receivingId?: string,
  destinationAddress: string
|}) {
  let apiResponse = await chainsferApi.post('/transfer', {
    clientId: 'test-client',
    action: 'GET_MULTISIG_SIGNING_DATA',
    ...request
  })
  return apiResponse.data
}

function normalizeTransferData (transferData) {
  transferData.sendTxState = null
  transferData.receiveTxState = null
  transferData.cancelTxState = null

  if (transferData['senderToChainsfer']) {
    const stage = transferData['senderToChainsfer']
    transferData.sendTimestamp = stage.txTimestamp
    transferData.sendTxState = stage.txState
    transferData.sendTxHash = stage.txHash
  }

  if (transferData['chainsferToReceiver']) {
    const stage = transferData['chainsferToReceiver']
    transferData.receiveTimestamp = stage.txTimestamp
    transferData.receiveTxState = stage.txState
    transferData.receiveTxHash = stage.txHash
  }

  if (transferData['chainsferToSender']) {
    const stage = transferData['chainsferToSender']
    transferData.cancelTimestamp = stage.txTimestamp
    transferData.cancelTxState = stage.txState
    transferData.cancelTxHash = stage.txHash
  }

  // direct transfer
  if (transferData['senderToReceiver']) {
    const stage = transferData['senderToReceiver']
    transferData.sendTimestamp = stage.txTimestamp
    transferData.sendTxState = stage.txState
    transferData.sendTxHash = stage.txHash
  }

  return transferData
}

async function getTransfer (request: { transferId: ?string, receivingId: ?string }) {
  let rv = await chainsferApi.post('/transfer', {
    clientId: 'test-client',
    action: 'GET',
    transferId: request.transferId,
    receivingId: request.receivingId
  })

  let responseData = normalizeTransferData(rv.data)

  // data is not availble to direct transfers
  // need check if data exists first
  responseData.data = responseData.data ? JSON.parse(Base64.decode(responseData.data)) : undefined
  return responseData
}

async function getBatchTransfers (request: {
  transferIds: Array<string>,
  receivingIds: Array<string>
}) {
  let rv = await chainsferApi.post('/transfer', {
    clientId: 'test-client',
    action: 'BATCH_GET',
    transferIds: request.transferIds,
    receivingIds: request.receivingIds
  })

  let responseData = rv.data
  responseData = responseData.map(item => {
    if (!item.error) {
      item = normalizeTransferData(item)
      item.data = item.data ? JSON.parse(Base64.decode(item.data)) : undefined
      return item
    } else {
      console.warn('Transfer detail not found.')
      item.data = { error: 'Transfer detail not found.' }
      return item
    }
  })
  return responseData
}

async function getPrefilledAccount () {
  try {
    var rv = await axios.get(env.REACT_APP_PREFILLED_ACCOUNT_ENDPOINT)
    return rv.data.privateKey
  } catch (e) {
    console.warn(e)
    return null
  }
}

async function getRecipients (request: { idToken: string }): Promise<any> {
  try {
    let rv = await chainsferApi.post('/user', {
      clientId: 'test-client',
      action: 'GET_RECIPIENTS',
      idToken: request.idToken
    })
    return rv.data.recipients
  } catch (err) {
    throw new Error(`Get contacts failed: ${err.response.data}`)
  }
}

async function addRecipient (request: { idToken: string, recipient: Recipient }) {
  try {
    let rv = await chainsferApi.post('/user', {
      clientId: 'test-client',
      action: 'ADD_RECIPIENT',
      idToken: request.idToken,
      recipient: request.recipient
    })
    return rv.data
  } catch (err) {
    throw new Error(`Add contact failed: ${err.response.data}`)
  }
}

async function removeRecipient (request: { idToken: string, recipient: Recipient }) {
  try {
    let rv = await chainsferApi.post('/user', {
      clientId: 'test-client',
      action: 'REMOVE_RECIPIENT',
      idToken: request.idToken,
      recipient: request.recipient
    })
    return rv.data.recipients
  } catch (err) {
    throw new Error(`Remove contact failed: ${err.response.data}`)
  }
}

async function register (idToken: string, userProfile: UserProfile): Promise<any> {
  const { email, ...otherInfo } = userProfile
  if (!idToken || !email) throw new Error('Invalid user to register')
  try {
    let rv = await chainsferApi.post('/user', {
      clientId: 'test-client',
      action: 'REGISTER',
      idToken: idToken,
      email: email,
      profile: otherInfo
    })
    return rv.data
  } catch (e) {
    console.warn(e)
  }
}

async function referralBalance () {
  const { idToken } = store.getState().userReducer.profile
  let rv = await chainsferApi.post('/referralWallet', {
    action: 'BALANCE',
    idToken
  })
  return rv.data
}

async function referralSend (request: { destination: string, transferAmount: string }) {
  const { idToken } = store.getState().userReducer.profile
  let rv = await chainsferApi.post('/referralWallet', {
    action: 'SEND',
    idToken,
    destination: request.destination,
    transferAmount: request.transferAmount
  })
  return rv.data
}

async function referralCreate () {
  const { idToken } = store.getState().userReducer.profile
  let rv = await chainsferApi.post('/referralWallet', {
    action: 'CREATE',
    idToken
  })
  return rv.data
}

async function addCryptoAccounts (
  accounts: Array<AccountData>
): Promise<{ cryptoAccounts: Array<BackEndCryptoAccountType> }> {
  const { idToken } = store.getState().userReducer.profile
  let tobeAdded = accounts.map((accountData: AccountData) => {
    const {
      cryptoType,
      name,
      email,
      verified,
      receivable,
      sendable,
      walletType,
      platformType
    } = accountData
    let newAccount = {}
    if (cryptoType === 'bitcoin' && accountData.hdWalletVariables.xpub) {
      newAccount.xpub = accountData.hdWalletVariables.xpub
    } else {
      newAccount.address = accountData.address
    }
    newAccount = {
      ...newAccount,
      walletType: walletType,
      cryptoType: cryptoType,
      platformType: platformType,
      name: name,
      email: email,
      verified: verified || false,
      receivable: receivable || false,
      sendable: sendable || false
    }
    return newAccount
  })

  try {
    let rv = await chainsferApi.post('/user', {
      action: 'ADD_CRYPTO_ACCOUNTS',
      payloadAccounts: tobeAdded,
      idToken: idToken
    })
    return rv.data
  } catch (err) {
    throw new Error(`Add crypto account failed: ${err.response.data}`)
  }
}

async function getCryptoAccounts (): Promise<{ cryptoAccounts: Array<BackEndCryptoAccountType> }> {
  const { idToken } = store.getState().userReducer.profile
  try {
    let rv = await chainsferApi.post('/user', {
      action: 'GET_CRYPTO_ACCOUNTS',
      idToken: idToken
    })
    return rv.data
  } catch (err) {
    throw new Error(`Get crypto account failed: ${err.response.data}`)
  }
}

async function removeCryptoAccounts (
  accounts: Array<AccountData>
): Promise<{ cryptoAccounts: Array<BackEndCryptoAccountType> }> {
  const { idToken } = store.getState().userReducer.profile

  let tobeRemove = accounts.map((accountData: AccountData) => {
    const { cryptoType, walletType, hdWalletVariables, address, platformType } = accountData
    let targetAccount = {}

    if (cryptoType === 'bitcoin' && hdWalletVariables.xpub) {
      targetAccount.xpub = hdWalletVariables.xpub
    } else {
      targetAccount.address = address
    }
    targetAccount = {
      cryptoType: cryptoType,
      walletType: walletType,
      platformType: platformType,
      ...targetAccount
    }
    return targetAccount
  })

  try {
    let rv = await chainsferApi.post('/user', {
      action: 'REMOVE_CRYPTO_ACCOUNTS',
      idToken: idToken,
      payloadAccounts: tobeRemove
    })
    return rv.data
  } catch (err) {
    throw new Error(`Remove crypto account failed: ${err.response.data}`)
  }
}

async function modifyCryptoAccountsName (
  accounts: Array<AccountData>,
  newName: string
): Promise<{ cryptoAccounts: Array<BackEndCryptoAccountType> }> {
  const { idToken } = store.getState().userReducer.profile

  let toBeModified = accounts.map((accountData: AccountData) => {
    const { cryptoType, walletType, hdWalletVariables, address, platformType } = accountData
    let targetAccount = {}
    if (cryptoType === 'bitcoin' && hdWalletVariables.xpub) {
      targetAccount.xpub = hdWalletVariables.xpub
    } else {
      targetAccount.address = address
    }
    targetAccount = {
      cryptoType: cryptoType,
      walletType: walletType,
      platformType: platformType,
      name: newName,
      ...targetAccount
    }
    return targetAccount
  })

  try {
    let rv = await chainsferApi.post('/user', {
      action: 'MODIFY_CRYPTO_ACCOUNT_NAMES',
      idToken: idToken,
      payloadAccounts: toBeModified
    })
    return rv.data
  } catch (err) {
    throw new Error(`Modified crypto account name failed: ${err.response.data}`)
  }
}

async function clearCloudWalletCryptoAccounts (): Promise<{
  cryptoAccounts: Array<BackEndCryptoAccountType>
}> {
  const { idToken } = store.getState().userReducer.profile
  try {
    let rv = await chainsferApi.post('/user', {
      action: 'CLEAR_CLOUD_WALLET_CRYPTO_ACCOUNTS',
      idToken: idToken
    })
    return rv.data
  } catch (err) {
    throw new Error(`Clear cloud wallet crypto accounts failed: ${err.response.data}`)
  }
}

async function getBtcMultisigPublicKey (): Promise<{ btcPublicKey: string }> {
  try {
    let rv = await chainsferApi.post('/transfer', {
      action: 'GET_BTC_MULTI_SIG_PUBLIC_KEY'
    })
    return rv.data
  } catch (err) {
    throw new Error(`Get Chainsfr Btc public key failed: ${err.response.data}`)
  }
}

async function sendBtcMultiSigTransaction (psbt: string): Promise<{ txHash: string }> {
  try {
    let rv = await chainsferApi.post('/transfer', {
      action: 'SEND_BTC_MULTI_SIG_TRANSACTION',
      psbt: psbt
    })
    return rv.data
  } catch (err) {
    throw new Error(`Send BTC from escrow account failed: ${err.response.data}`)
  }
}

async function getCoinbaseAccessObject (code: string): Promise<CoinBaseAccessObject> {
  try {
    let rv = await coinbaseAccessTokenApi.post('/', {
      code: code,
      redireactUrl: `https://${window.location.hostname}${paths.OAuthRedirect}`
    })
    return rv.data
  } catch (err) {
    throw new Error(`Get Coinbase access token failed: ${err.response.data}`)
  }
}

async function getUserProfileByEmail (email: string): Promise<UserProfile> {
  try {
    let rv = await chainsferApi.post('/user', {
      action: 'GET_USER',
      email: email
    })
    return rv.data.profile
  } catch (e) {
    return {}
  }
}

async function getUserCloudWalletFolderMeta (): Promise<CloudWalletFolderMetaType> {
  const { idToken } = store.getState().userReducer.profile
  try {
    let rv = await chainsferApi.post('/user', {
      action: 'GET_UESR_CLOUD_WALLET_FOLDER_META',
      idToken: idToken
    })
    return rv.data
  } catch (err) {
    throw new Error(`Get user cloud wallet folder meta failed:${err.response.data}`)
  }
}

async function updateUserCloudWalletFolderMeta (
  newMetaInfo: CloudWalletFolderMetaType
): Promise<CloudWalletFolderMetaType> {
  const { idToken } = store.getState().userReducer.profile
  try {
    let rv = await chainsferApi.post('/user', {
      action: 'UPDATE_UESR_CLOUD_WALLET_FOLDER_META',
      newMetaInfo: newMetaInfo,
      idToken: idToken
    })
    return rv.data
  } catch (err) {
    throw new Error(`Update user cloud wallet folder meta failed:${err.response.data}`)
  }
}

async function getUserRegisterTime () {
  const { idToken } = store.getState().userReducer.profile
  try {
    let rv = await chainsferApi.post('/user', {
      action: 'GET_USER',
      idToken: idToken
    })
    return rv.data.registerTime
  } catch (e) {
    return {}
  }
}

async function lookupTxHash (
  txHashes: Array<string>
): Promise<Array<{
    txHash: string,
    transferId: string,
    receivingId: string
  }>> {
  try {
    let rv = await chainsferApi.post('/transfer', {
      action: 'LOOKUP_TX_HASHES',
      txHashes
    })
    return rv.data
  } catch (err) {
    throw new Error('Lookup tx hashes failed')
  }
}

async function getEmailTransfers (request: {
  idToken: string,
  limit?: number,
  senderExclusiveStartKey?: { sender: string, created: number, transferId: string },
  destinationExclusiveStartKey?: { destination: string, created: number, receivingId: string }
}) {
  try {
    let rv = await chainsferApi.post('/transfer', {
      ...request,
      action: 'FETCH_EMAIL_TRANSFERS'
    })
    rv.data.data = rv.data.data.map(transferData => normalizeTransferData(transferData))
    return rv.data
  } catch (err) {
    throw new Error('Get email transfers failed.')
  }
}

async function clearTransfer (request: { transferId: string }) {
  try {
    await chainsferApi.post('/transfer', {
      ...request,
      action: 'CLEAR_TRANSFER'
    })
  } catch (err) {
    throw new Error('Clear transfer failed.')
  }
}

async function getAllEthContracts (): Promise<Array<EthContractType>> {
  try {
    const rv = await chainsferApi.post('/ethContracts', {
      action: 'GET_ALL_CONTRACTS'
    })
    return rv.data
  } catch (err) {
    throw new Error('Get eth contracts failed.')
  }
}

async function getEthContract (address: string): Promise<EthContractType> {
  try {
    const rv = await chainsferApi.post('/ethContracts', {
      action: 'GET_CONTRACT',
      address: address
    })
    return rv.data
  } catch (err) {
    throw new Error('Get eth contracts failed.')
  }
}

async function twitterShareReceipt (request: {
  idToken: string,
  transferId?: string,
  receivingId?: string
}) {
  try {
    const rv = await chainsferApi.post('/user', {
      ...request,
      action: 'TWITTER_SHARE_RECEIPT'
    })
    return rv.data
  } catch (err) {
    throw new Error('Add reward failed.')
  }
}

export default {
  directTransfer,
  transfer,
  accept,
  cancel,
  getMultiSigSigningData,
  getTransfer,
  getPrefilledAccount,
  getBatchTransfers,
  getRecipients,
  addRecipient,
  removeRecipient,
  register,
  referralBalance,
  referralSend,
  referralCreate,
  addCryptoAccounts,
  getCryptoAccounts,
  removeCryptoAccounts,
  modifyCryptoAccountsName,
  clearCloudWalletCryptoAccounts,
  getBtcMultisigPublicKey,
  sendBtcMultiSigTransaction,
  getCoinbaseAccessObject,
  getUserProfileByEmail,
  getUserCloudWalletFolderMeta,
  updateUserCloudWalletFolderMeta,
  getUserRegisterTime,
  lookupTxHash,
  getEmailTransfers,
  clearTransfer,
  getAllEthContracts,
  getEthContract,
  twitterShareReceipt
}
