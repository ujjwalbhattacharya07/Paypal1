// @flow
import type { AccountData } from '../types/account.flow.js'
import MetamaskWallet from './metamask.js'
import DriveWallet from './drive.js'
import LedgerWallet from './ledger.js'
import EscrowWallet from './escrow.js'
import MetamaskWalletConnect from './metamaskWalletConnect'
import TrustWalletConnect from './trustWalletConnect'
import CoinbaseWalletLink from './coinbaseWalletLink'
import CoinbaseOAuthWallet from './coinbaseOAuthWallet'

export function createWallet (accountData: AccountData) {
  switch (accountData.walletType) {
    case 'metamask':
      return new MetamaskWallet(accountData)
    case 'ledger':
      return new LedgerWallet(accountData)
    case 'drive':
      return new DriveWallet(accountData)
    case 'escrow':
      return new EscrowWallet(accountData)
    case 'metamaskWalletConnect':
      return new MetamaskWalletConnect(accountData)
    case 'trustWalletConnect':
      return new TrustWalletConnect(accountData)
    case 'coinbaseWalletLink':
      return new CoinbaseWalletLink(accountData)
    case 'coinbaseOAuthWallet':
      return new CoinbaseOAuthWallet(accountData)
    default:
      throw new Error(`Invalid wallet type: ${accountData.walletType}`)
  }
}
