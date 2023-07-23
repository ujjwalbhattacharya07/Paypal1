// @flow
const env = ((process.env: any): { [string]: string }) // if you're sure that everything will be defined

export default {
  NODE_ENV: env.NODE_ENV,
  REACT_APP_GOOGLE_CLIENT_ID: env.REACT_APP_GOOGLE_CLIENT_ID,
  REACT_APP_GOOGLE_API_SCOPE: env.REACT_APP_GOOGLE_API_SCOPE,
  REACT_APP_GOOGLE_API_DISCOVERY_DOCS: env.REACT_APP_GOOGLE_API_DISCOVERY_DOCS,
  REACT_APP_ETHEREUM_NETWORK: env.REACT_APP_ETHEREUM_NETWORK,
  REACT_APP_INFURA_API_KEY: env.REACT_APP_INFURA_API_KEY,
  REACT_APP_BTC_NETWORK: env.REACT_APP_BTC_NETWORK,
  REACT_APP_CHAINSFER_API_ENDPOINT: env.REACT_APP_CHAINSFER_API_ENDPOINT,
  REACT_APP_PREFILLED_ACCOUNT_ENDPOINT: env.REACT_APP_PREFILLED_ACCOUNT_ENDPOINT,
  REACT_APP_ENV: env.REACT_APP_ENV,
  REACT_APP_BITCOIN_JS_LIB_NETWORK:
    env.REACT_APP_BTC_NETWORK === 'mainnet' ? 'bitcoin' : 'testnet',
  REACT_APP_BTC_PATH: env.REACT_APP_BTC_NETWORK === 'mainnet' ? "49'/0'" : "49'/1'",
  REACT_APP_TERMS_URL: env.REACT_APP_TERMS_URL,
  REACT_APP_PRIVACY_URL: env.REACT_APP_PRIVACY_URL,
  REACT_APP_GA_TRACKING_ID: env.REACT_APP_GA_TRACKING_ID,
  REACT_APP_FAQ_URL: env.REACT_APP_FAQ_URL,
  REACT_APP_COINBASE_ACCESS_TOKEN_ENDPOINT: env.REACT_APP_COINBASE_ACCESS_TOKEN_ENDPOINT,
  REACT_APP_COINBASE_CLIENT_ID: env.REACT_APP_COINBASE_CLIENT_ID,
  REACT_APP_ETHERSCAN_API_KEY: env.REACT_APP_ETHERSCAN_API_KEY,
  REACT_APP_E2E_TEST_MOCK_USER: env.REACT_APP_E2E_TEST_MOCK_USER === 'true',
  REACT_APP_E2E_TEST_MAIL_TAG_SUFFIX: env.REACT_APP_E2E_TEST_MAIL_TAG_SUFFIX,
  REACT_APP_VERSION: env.REACT_APP_VERSION,
  REACT_APP_HOTJAR_ID: env.REACT_APP_HOTJAR_ID,
  REACT_APP_HOTJAR_SV: env.REACT_APP_HOTJAR_SV,
  REACT_APP_INTERCOM_APP_ID: env.REACT_APP_INTERCOM_APP_ID,
  REACT_APP_SENTRY_ID: env.REACT_APP_SENTRY_ID
}
