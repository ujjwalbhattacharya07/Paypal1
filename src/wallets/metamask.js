// @flow
import type { IWallet } from '../types/wallet.flow.js'
import type { IAccount, AccountData } from '../types/account.flow.js'
import type { TxFee, TxHash, Signature } from '../types/transfer.flow'
import type { BasicTokenUnit, Address } from '../types/token.flow'

import EthereumAccount from '../accounts/EthereumAccount.js'
import Web3 from 'web3'
import ERC20 from '../ERC20'
import env from '../typedEnv'
import WalletUtils from './utils.js'
import WalletErrors from './walletErrors'

const metamaskErrors = WalletErrors.metamask
const DEFAULT_ACCOUNT = 0

export default class MetamaskWallet implements IWallet<AccountData> {
  WALLET_TYPE = 'metamask'

  account: IAccount

  constructor (accountData?: AccountData) {
    if (accountData && accountData.cryptoType) {
      this.account = new EthereumAccount(accountData)
    }
  }

  getAccount = (): IAccount => {
    if (!this.account) {
      throw new Error('Account is undefined')
    }
    return this.account
  }

  _getMetamaskAddresses = async (additionalInfo: ?Object) => {
    if (typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask) {
      window._web3 = new Web3(window.ethereum)
      if (
        window.ethereum.networkVersion !==
        WalletUtils.networkIdMap[env.REACT_APP_ETHEREUM_NETWORK].toString()
      ) {
        throw new Error(metamaskErrors.incorrectNetwork)
      }
      let address
      try {
        address = await window.ethereum.enable()
      } catch (err) {
        throw new Error(metamaskErrors.authorizationDenied)
      }
      return address
    } else {
      throw new Error(metamaskErrors.extendsionNotFound)
    }
  }

  _newEthereumAccount = async (
    name: string,
    cryptoType: string,
    options?: Object
  ): Promise<EthereumAccount> => {
    const addresses = await this._getMetamaskAddresses()
    const accountData = {
      cryptoType: cryptoType,
      walletType: this.WALLET_TYPE,

      address: addresses[0],
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

  async newAccount (name: string, cryptoType: string, options?: Object): Promise<IAccount> {
    return this._newEthereumAccount(name, cryptoType, options)
  }

  checkWalletConnection = async (additionalInfo: ?Object): Promise<boolean> => {
    if (typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask) {
      return true
    }
    return false
  }

  verifyAccount = async (additionalInfo: ?Object): Promise<boolean> => {
    let accountData = this.getAccount().getAccountData()

    const metamaskAddresses = await this._getMetamaskAddresses(additionalInfo)
    if (metamaskAddresses[DEFAULT_ACCOUNT].toLowerCase() === accountData.address.toLowerCase()) {
      this.account.accountData.connected = true
      this.account.accountData.verified = true
      return this.account.accountData.connected
    } else {
      this.account.accountData.connected = false
      throw new Error(metamaskErrors.incorrectAccount)
    }
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

    if (!options) throw new Error(metamaskErrors.noOptions)
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
      txObj = multiSig.getSendToEscrowTxObj(accountData.address, to, value, accountData.cryptoType)
    }

    // boardcast tx
    return {
      txHash: await WalletUtils.web3SendTransactions(window._web3.eth.sendTransaction, txObj)
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
    return WalletUtils.getTxFee({
      value,
      cryptoType: accountData.cryptoType,
      directTransfer: !!options && options.directTransfer
    })
  }

  setTokenAllowance = async (amount: BasicTokenUnit): Promise<TxHash> => {
    const accountData = this.getAccount().getAccountData()
    const txObj = ERC20.getSetAllowanceTxObj(accountData.address, amount, accountData.cryptoType)
    // boardcast tx
    return WalletUtils.web3SendTransactions(window._web3.eth.sendTransaction, txObj)
  }
}
