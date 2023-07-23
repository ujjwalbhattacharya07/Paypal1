import env from './typedEnv'
import { isERC20 } from './tokens'
import { store } from './configureStore'
const getEthContracts = () => store.getState().accountReducer.ethContracts

const INFURA_API_URL = `https://${env.REACT_APP_ETHEREUM_NETWORK}.infura.io/v3/${
  env.REACT_APP_INFURA_API_KEY
}`

const LEDGER_API_URL =
  env.REACT_APP_BTC_NETWORK === 'mainnet'
    ? `https://api.ledgerwallet.com/blockchain/v2/btc`
    : `https://api.ledgerwallet.com/blockchain/v2/btc_testnet`

const ETHEREUM_EXPLORER_BASE_URL =
  env.REACT_APP_ETHEREUM_NETWORK === 'mainnet'
    ? `https://etherscan.io/`
    : `https://${env.REACT_APP_ETHEREUM_NETWORK}.etherscan.io/`

const ETHERSCAN_API_URL =
  env.REACT_APP_BTC_NETWORK === 'mainnet'
    ? 'https://api.etherscan.io'
    : 'https://api-rinkeby.etherscan.io'

const ETHEREUM_EXPLORER_ADDRESS_BASE_URL = ETHEREUM_EXPLORER_BASE_URL + 'address/'
const ETHEREUM_EXPLORER_TOKEN_BASE_URL = ETHEREUM_EXPLORER_BASE_URL + 'token/'
const ETHEREUM_EXPLORER_TX_BASE_URL = ETHEREUM_EXPLORER_BASE_URL + 'tx/'

const REACT_APP_BTC_NETWORK = env.REACT_APP_BTC_NETWORK

const BITCOIN_EXPLORER_BASE_URL =
  env.REACT_APP_BTC_NETWORK === 'mainnet'
    ? `https://live.blockcypher.com/btc/`
    : `https://live.blockcypher.com/btc-testnet/`

const BITCOIN_EXPLORER_ADDRESS_BASE_URL = BITCOIN_EXPLORER_BASE_URL + 'address/'
const BITCOIN_EXPLORER_TX_BASE_URL = BITCOIN_EXPLORER_BASE_URL + 'tx/'

const BTC_FEE_ENDPOINT = 'https://bitcoinfees.earn.com/api/v1/fees/recommended'

function getEthExplorerAddress (address) {
  return ETHEREUM_EXPLORER_ADDRESS_BASE_URL + address
}

function getEthExplorerTx (txHash) {
  return ETHEREUM_EXPLORER_TX_BASE_URL + txHash
}

function getEthExplorerToken (tokenAddress, address) {
  return ETHEREUM_EXPLORER_TOKEN_BASE_URL + tokenAddress + '?a=' + address
}

function getBtcExplorerAddress (address) {
  return BITCOIN_EXPLORER_ADDRESS_BASE_URL + address
}

function getBtcExplorerTx (txHash) {
  return BITCOIN_EXPLORER_TX_BASE_URL + txHash
}

function getExplorerTx (cryptoType, txHash) {
  if (cryptoType === 'bitcoin') {
    return getBtcExplorerTx(txHash)
  } else if (cryptoType === 'ethereum' || isERC20(cryptoType)) {
    return getEthExplorerTx(txHash)
  } else {
    throw new Error(`Invalid cryptoType: ${cryptoType}`)
  }
}

function getExplorerAddress (cryptoType, address) {
  if (cryptoType === 'bitcoin') {
    return getBtcExplorerAddress(address)
  } else if (cryptoType === 'ethereum') {
    return getEthExplorerAddress(address)
  } else if (isERC20(cryptoType)) {
    return getEthExplorerToken(getEthContracts()[cryptoType].address, address)
  } else {
    throw new Error(`Invalid cryptoType: ${cryptoType}`)
  }
}

export default {
  REACT_APP_BTC_NETWORK,
  INFURA_API_URL,
  LEDGER_API_URL,
  ETHERSCAN_API_URL,
  BTC_FEE_ENDPOINT,
  getEthExplorerAddress,
  getEthExplorerToken,
  getEthExplorerTx,
  getBtcExplorerAddress,
  getBtcExplorerTx,
  getExplorerTx,
  getExplorerAddress
}
