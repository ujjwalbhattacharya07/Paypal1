// @flow
import 'regenerator-runtime' // required by @ledgerhq/hw-transport-webusb
import type { IWallet } from '../types/wallet.flow.js'
import type { IAccount, AccountData } from '../types/account.flow.js'
import type { TxFee, TxHash, Signature } from '../types/transfer.flow'
import type { BasicTokenUnit, Address } from '../types/token.flow'

import EthereumAccount from '../accounts/EthereumAccount.js'
import BitcoinAccount from '../accounts/BitcoinAccount.js'
import WebUsbTransport from '@ledgerhq/hw-transport-webusb'
import { Transaction as EthTx } from 'ethereumjs-tx'
import EthApp from '@ledgerhq/hw-app-eth'
import BtcApp from '@ledgerhq/hw-app-btc'
import { address, networks } from 'bitcoinjs-lib'
import Web3 from 'web3'
import ERC20 from '../ERC20'

import url from '../url'
import env from '../typedEnv'
import WalletUtils from './utils.js'
import { getAccountXPub } from './addressFinderUtils'
import WalletErrors from './walletErrors'

const ledgerErrors = WalletErrors.ledger
const baseEtherPath = "44'/60'/0'/0"
const baseBtcPath = env.REACT_APP_BTC_PATH

const DEFAULT_ACCOUNT = 0

let networkId: number = WalletUtils.networkIdMap[env.REACT_APP_ETHEREUM_NETWORK]

export default class LedgerWallet implements IWallet<AccountData> {
  static webUsbTransport: any

  WALLET_TYPE = 'ledger'
  ethApp: any
  web3: any
  btcApp: any

  account: IAccount

  constructor (accountData?: AccountData) {
    if (accountData && accountData.cryptoType) {
      if (accountData.cryptoType === 'bitcoin') {
        this.account = new BitcoinAccount(accountData)
      } else {
        this.account = new EthereumAccount(accountData)
      }
    }
  }

  getAccount = (): IAccount => {
    if (!this.account) {
      throw new Error('Account is undefined')
    }
    return this.account
  }

  _getWebUsbTransport = async (): Promise<any> => {
    if (
      !LedgerWallet.webUsbTransport ||
      !LedgerWallet.webUsbTransport.device ||
      !LedgerWallet.webUsbTransport.device.opened
    ) {
      try {
        LedgerWallet.webUsbTransport = await WebUsbTransport.create()
        LedgerWallet.webUsbTransport.setExchangeTimeout(300000) // 5 mins
        setTimeout(async () => {
          if (
            LedgerWallet.webUsbTransport !== null ||
            LedgerWallet.webUsbTransport !== undefined
          ) {
            await LedgerWallet.webUsbTransport.close()
            LedgerWallet.webUsbTransport = null
          }
        }, 300000)
      } catch (err) {
        throw new Error(ledgerErrors.deviceNotConnected)
      }
    }
    return LedgerWallet.webUsbTransport
  }

  _getEtherLedger = async (): Promise<any> => {
    this.ethApp = new EthApp(await this._getWebUsbTransport())
    return this.ethApp
  }

  _getWeb3 = (): any => {
    if (!this.web3) {
      this.web3 = new Web3(new Web3.providers.HttpProvider(url.INFURA_API_URL))
    }
    return this.web3
  }

  _getEthAddress = async (accountIndex: number): Promise<string> => {
    const accountPath = baseEtherPath + `/${accountIndex}`
    const ethApp = await this._getEtherLedger()
    const MAX_ATTEMPTS = 15
    let attemp = 0
    let result = {}
    while (attemp < MAX_ATTEMPTS) {
      try {
        result = await ethApp.getAddress(accountPath)
        break
      } catch (e) {
        console.warn(e)
        attemp += 1
        await this._sleep(2000)
      }
    }
    if (!result.address) throw new Error(ledgerErrors.ledgerAppCommunicationFailed)
    return result.address
  }

  _getBtcLedger = async (): Promise<any> => {
    this.btcApp = new BtcApp(await this._getWebUsbTransport())
    return this.btcApp
  }

  _getBtcAddresss = async (accountIndex: number): Promise<Object> => {
    const btcApp = await this._getBtcLedger()
    const accountPath = `${baseBtcPath}/${accountIndex}'/0/0`
    const MAX_ATTEMPTS = 15
    let attemp = 0
    let addr = {}
    while (attemp < MAX_ATTEMPTS) {
      try {
        addr = await btcApp.getWalletPublicKey(accountPath, false, true)
        break
      } catch (e) {
        console.warn(e)
        attemp += 1
        await this._sleep(2000)
      }
    }

    if (!addr.bitcoinAddress) throw new Error(ledgerErrors.ledgerAppCommunicationFailed)
    const xpub = await getAccountXPub(btcApp, baseBtcPath, `${accountIndex}'`, true)
    return { address: addr.bitcoinAddress, xpub: xpub }
  }

  _newEthereumAccount = async (
    name: string,
    cryptoType: string,
    options?: Object
  ): Promise<EthereumAccount> => {
    const address = await this._getEthAddress(DEFAULT_ACCOUNT)

    const accountData = {
      cryptoType: cryptoType,
      walletType: this.WALLET_TYPE,

      address: address,
      name: name, // the name of this account set by the user.

      // token balance for erc20 tokens/
      balance: '0',
      balanceInStandardUnit: '0',

      // eth balance only
      ethBalance: '0',

      connected: true,
      verified: true,
      receivable: true,
      sendable: true,

      lastSynced: 0
    }

    this.account = new EthereumAccount(accountData)
    return this.account
  }

  _newBitcoinAccount = async (name: string): Promise<BitcoinAccount> => {
    const { address, xpub } = await this._getBtcAddresss(DEFAULT_ACCOUNT)
    let accountData = {
      cryptoType: 'bitcoin',
      walletType: this.WALLET_TYPE,
      name: name,
      balance: '0',
      balanceInStandardUnit: '0',
      address: address,
      privateKey: undefined,
      hdWalletVariables: {
        xpriv: undefined,
        xpub: xpub,
        nextAddressIndex: 0,
        nextChangeIndex: 0,
        changeAddress: address,
        addresses: [
          {
            address: address,
            path: env.REACT_APP_BTC_PATH + `/${DEFAULT_ACCOUNT}'/0/0`,
            utxos: []
          }
        ],
        lastUpdate: 0,
        endAddressIndex: 0,
        endChangeIndex: 0
      },
      verified: true,
      receivable: true,
      sendable: true,

      lastSynced: 0
    }

    this.account = new BitcoinAccount(accountData)
    return this.account
  }

  async newAccount (name: string, cryptoType: string, options?: Object): Promise<IAccount> {
    if (cryptoType !== 'bitcoin') {
      return this._newEthereumAccount(name, cryptoType, options)
    } else {
      return this._newBitcoinAccount(name)
    }
  }

  checkWalletConnection = async (additionalInfo: ?Object): Promise<boolean> => {
    let transport = await this._getWebUsbTransport()
    return transport !== undefined || transport !== null
  }

  verifyAccount = async (additionalInfo: ?Object): Promise<boolean> => {
    let accountData = this.getAccount().getAccountData()
    if (accountData.cryptoType === 'bitcoin') {
      let { xpub } = await this._getBtcAddresss(DEFAULT_ACCOUNT)
      if (xpub !== accountData.hdWalletVariables.xpub) {
        accountData.connected = false
        throw new Error(ledgerErrors.incorrectAccount)
      }
    } else {
      let address = await this._getEthAddress(DEFAULT_ACCOUNT)
      if (address !== accountData.address) {
        accountData.connected = false
        throw new Error(ledgerErrors.incorrectAccount)
      }
    }
    accountData.verified = true
    accountData.connected = true
    return this.account.accountData.connected
  }

  sendTransaction = async ({
    to,
    value,
    txFee,
    options
  }: {
    to: Address,
    value: BasicTokenUnit,
    txFee: TxFee,
    options?: Object
  }): Promise<{ txHash?: TxHash, clientSig?: Signature }> => {
    const account = this.getAccount()
    const accountData = account.getAccountData()

    if (!accountData.connected) {
      throw new Error('Must connect and verify account first')
    }

    const { cryptoType } = accountData
    if (!txFee) throw new Error('Missing txFee')

    if (cryptoType === 'bitcoin') {
      const addressPool = accountData.hdWalletVariables.addresses
      const { fee, utxosCollected } = account._collectUtxos(
        addressPool,
        value,
        Number(txFee.price)
      )
      let signedTxRaw = ''
      try {
        signedTxRaw = await this._createNewBtcPaymentTransaction(
          utxosCollected,
          to,
          Number(value), // actual value to be sent
          Number(fee),
          accountData.hdWalletVariables.nextChangeIndex
        )
      } catch (e) {
        if (e.message.match(/has no matching Script/)) {
          // This error happens when the signing private key does
          // not match the address/pubkey
          throw new Error(ledgerErrors.incorrectSigningKey)
        }
      }
      return { txHash: await WalletUtils.broadcastBtcRawTx(signedTxRaw) }
    } else {
      // init web3
      const _web3 = new Web3(new Web3.providers.HttpProvider(url.INFURA_API_URL))

      if (!options) throw new Error('Options must not be null')
      let txObj
      if (options.directTransfer) {
        // direct transfer to another address
        txObj = await WalletUtils.getDirectTransferTxObj(
          accountData.address,
          to,
          value,
          accountData.cryptoType
        )
      } else {
        // transfer to escrow wallet
        let { multiSig } = options
        txObj = multiSig.getSendToEscrowTxObj(
          accountData.address,
          to,
          value,
          accountData.cryptoType
        )
      }

      // add txFee to txObj
      txObj = {
        ...txObj,
        gas: txFee.gas,
        gasPrice: txFee.price
      }
      return {
        txHash: await WalletUtils.web3SendTransactions(
          _web3.eth.sendSignedTransaction,
          (await this._signSendTransaction(txObj)).rawTransaction
        )
      }
    }
  }

  getTxFee = async ({
    value,
    options
  }: {
    value: BasicTokenUnit,
    options?: Object
  }): Promise<TxFee> => {
    const accountData = this.getAccount().getAccountData()
    if (accountData.cryptoType === 'bitcoin') {
      return WalletUtils.getBtcTxFee({
        value,
        addressesPool: accountData.hdWalletVariables.addresses
      })
    } else {
      return WalletUtils.getTxFee({
        value,
        cryptoType: accountData.cryptoType,
        directTransfer: !!options && options.directTransfer
      })
    }
  }

  setTokenAllowance = async (amount: BasicTokenUnit): Promise<TxHash> => {
    const accountData = this.getAccount().getAccountData()
    let txObj = ERC20.getSetAllowanceTxObj(accountData.address, amount, accountData.cryptoType)
    // estimate tx cost
    const txFee = await WalletUtils.getGasCost(txObj)
    // add txFee to txObj
    txObj = {
      ...txObj,
      gas: txFee.gas,
      gasPrice: txFee.price
    }
    // init web3
    const _web3 = new Web3(new Web3.providers.HttpProvider(url.INFURA_API_URL))
    // boardcast tx
    return WalletUtils.web3SendTransactions(
      _web3.eth.sendSignedTransaction,
      (await this._signSendTransaction(txObj)).rawTransaction
    )
  }

  _sleep = (time: number): Promise<any> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve()
      }, time)
    })
  }

  _signSendTransaction = async (txObj: any) => {
    const web3 = this._getWeb3()
    const ethApp = await this._getEtherLedger()
    const accountIndex = 0 // default first account
    const accountPath = baseEtherPath + `/${accountIndex}`
    txObj.nonce = txObj.nonce || (await web3.eth.getTransactionCount(txObj.from))
    txObj.gas = web3.utils.numberToHex(txObj.gas)
    txObj.gasPrice = web3.utils.numberToHex(txObj.gasPrice)
    txObj.value = web3.utils.numberToHex(txObj.value)
    let tx = new EthTx(txObj, { chain: networkId })
    tx.raw[6] = Buffer.from([networkId]) // v
    tx.raw[7] = Buffer.from([]) // r
    tx.raw[8] = Buffer.from([]) // s
    const rv = await ethApp.signTransaction(accountPath, tx.serialize().toString('hex'))
    tx.v = WalletUtils.getBufferFromHex(rv.v)
    tx.r = WalletUtils.getBufferFromHex(rv.r)
    tx.s = WalletUtils.getBufferFromHex(rv.s)
    const signedChainId = WalletUtils.calculateChainIdFromV(tx.v)
    if (signedChainId !== networkId) {
      console.error(
        'Invalid networkId signature returned. Expected: ' + networkId + ', Got: ' + signedChainId,
        'InvalidNetworkId'
      )
    }
    const signedTransactionObject = WalletUtils.getSignTransactionObject(tx)
    return signedTransactionObject
  }

  _createNewBtcPaymentTransaction = async (
    inputs: Array<Object>,
    to: string,
    amount: number,
    fee: number,
    changeIndex: number
  ) => {
    const btcApp = await this._getBtcLedger()
    const changeAddressPath = `${baseBtcPath}/0'/1/${changeIndex}`

    let associatedKeysets = []
    let finalInputs = []
    let inputValueTotal = 0
    for (let i = 0; i < inputs.length; i++) {
      const utxo = inputs[i]
      const utxoDetails = await WalletUtils.getUtxoDetails(utxo.txHash, true)

      const txObj = btcApp.splitTransaction(utxoDetails, true)
      const input = [txObj, utxo.outputIndex]
      finalInputs.push(input)
      associatedKeysets.push(utxo.keyPath)
      inputValueTotal += utxo.value
    }
    let outputs = []
    let amountBuffer = Buffer.alloc(8, 0)
    amountBuffer.writeUIntLE(amount, 0, 8)
    const txOutput = {
      amount: amountBuffer,
      script: address.toOutputScript(to, networks[env.REACT_APP_BITCOIN_JS_LIB_NETWORK])
    }
    outputs.push(txOutput)
    const change = inputValueTotal - amount - fee // 138 bytes for 1 input, 64 bytes per additional input

    let changeBuffer = Buffer.alloc(8, 0)
    changeBuffer.writeUIntLE(change, 0, 8)
    const changeAddress = (await btcApp.getWalletPublicKey(changeAddressPath, false, true))
      .bitcoinAddress
    const changeOutput = {
      amount: changeBuffer,
      script: address.toOutputScript(changeAddress, networks[env.REACT_APP_BITCOIN_JS_LIB_NETWORK])
    }
    outputs.push(changeOutput)

    const outputScriptHex = btcApp
      .serializeTransactionOutputs({ outputs: outputs })
      .toString('hex')
    const signedTxRaw = await btcApp.createPaymentTransactionNew(
      finalInputs,
      associatedKeysets,
      changeAddressPath,
      outputScriptHex,
      undefined,
      undefined,
      true
    )

    return signedTxRaw
  }
}
