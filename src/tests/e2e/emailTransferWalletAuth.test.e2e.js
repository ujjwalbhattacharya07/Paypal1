import LoginPage from './pages/login.page'
import EmailTransferFormPage from './pages/emailTransferForm.page'
import EmailTransferReviewPage from './pages/sendReview.page'
import EmailTransferAuthPage from './pages/emailTransferAuth.page'
import ReceiptPage from './pages/receipt.page'
import DisconnectPage from './pages/disconnect.page'
import ReduxTracker from './utils/reduxTracker'
import { resetUserDefault } from './utils/reset'
import { getTransfer, getCryptoSymbol } from './testUtils'
import { INFURA_API_URL } from './config'
import { DATA, WALLET_FOLDER_NAME, WALLET_FILE_NAME } from './mocks/drive.js'
import { INVALID_RECIPIENT } from './mocks/recipients'
import log from 'loglevel'
import BN from 'bn.js'
import pWaitFor from 'p-wait-for'
import Web3 from 'web3'
import TestMailsClient from './email/testMailClient'
import { SELECTORS, EmailParser, getEmailSubject } from './email/emailParser'

log.setDefaultLevel('info')

// 3 min
const timeout = 180000
const reduxTracker = new ReduxTracker()

describe('Transfer Auth Tests', () => {
  let loginPage
  let emtPage
  let emtReviewPage
  let emtAuthPage
  let receiptPage
  let disconnectPage
  const web3 = new Web3(new Web3.providers.HttpProvider(INFURA_API_URL))

  const FORM_BASE = {
    recipient: 'chainsfre2etest@gmail.com',
    currencyAmount: '1',
    securityAnswer: '123456',
    sendMessage: 'Send Message'
  }

  const NETWORK_ID = 4

  const checkSenderErrorEmail = async transferData => {
    const testMailClient = new TestMailsClient('sender')

    const subjectFilterValue = getEmailSubject('sender', 'error', transferData)
    const email = await testMailClient.liveEmailQuery(subjectFilterValue)

    const emailParser = new EmailParser(email.html)
    const selectors = SELECTORS.SENDER.ERROR
    const emailMessage = emailParser.getEmailElementText(selectors.MESSAGE)
    const btnLink = emailParser.getEmailElementAttribute(selectors.CANCEL_BTN, 'href')

    expect(emailMessage).toMatch(new RegExp(transferData.transferAmount))
    expect(emailMessage).toMatch(new RegExp(getCryptoSymbol(transferData.cryptoType)))
    expect(emailMessage).toMatch(new RegExp(transferData.transferFiatAmountSpot))
    expect(emailMessage).toMatch(new RegExp(transferData.fiatType))
    expect(emailMessage).toMatch(new RegExp(transferData.receiverName))
    expect(emailMessage).toMatch(new RegExp(transferData.destination))
    expect(btnLink).toMatch(`testnet.chainsfr.com%2Fcancel%3Fid=${transferData.transferId}`)
  }

  beforeAll(async () => {
    await resetUserDefault()
    await jestPuppeteer.resetBrowser()

    emtPage = new EmailTransferFormPage()
    emtReviewPage = new EmailTransferReviewPage()
    emtAuthPage = new EmailTransferAuthPage()
    receiptPage = new ReceiptPage()
    disconnectPage = new DisconnectPage()

    await requestInterceptor.setRequestInterception(true)

    await page.goto(process.env.E2E_TEST_URL, {
      waitUntil: 'networkidle0'
    })
    // login to app
    const loginPage = new LoginPage()
    await loginPage.login(
      process.env.E2E_TEST_GOOGLE_LOGIN_USERNAME,
      process.env.E2E_TEST_GOOGLE_LOGIN_PASSWORD,
      true
    )
  }, timeout)

  afterAll(async () => {
    requestInterceptor.showStats()
    await jestPuppeteer.resetBrowser()
  })

  const gotoAuthPage = async () => {
    // go to review page
    await emtPage.dispatchFormActions('continue')

    // go to auth page
    await emtReviewPage.dispatchFormActions('continue')
  }

  const waitForTxConfirmation = async () => {
    // due to us manually setting allowance using web3, as well as reseting the browser storage,
    // the pending txs are not tracked properly in txController which causes incorrecet nonce
    // errors
    //
    // we wait for all txs in each test to be mined before procedding to the next test
    const { sendOnExplorerLink } = await receiptPage.getReceiptFormInfo('sendOn')
    const txHash = sendOnExplorerLink
      .split('/')
      .slice(-1)
      .pop()

    log.info('Waiting for the pending tx to be mined...')
    await pWaitFor(
      async () => {
        const receipt = await web3.eth.getTransactionReceipt(txHash)
        return !!receipt
      },
      {
        interval: 1000
      }
    )
    log.info('Tx mined.')
  }

  test(
    'Send ETH from drive wallet',
    async () => {
      await page.goto(`${process.env.E2E_TEST_URL}/send`, { waitUntil: 'networkidle0' })

      await emtPage.fillForm({
        ...FORM_BASE,
        formPage: emtPage,
        walletType: 'drive',
        platformType: 'ethereum',
        cryptoType: 'ethereum'
      })

      await gotoAuthPage()

      // click connect
      await Promise.all([
        reduxTracker.waitFor(
          [
            {
              action: {
                type: 'CHECK_WALLET_CONNECTION_FULFILLED'
              }
            },
            {
              action: {
                type: 'VERIFY_ACCOUNT_FULFILLED'
              }
            },
            {
              action: {
                type: 'SUBMIT_TX_FULFILLED'
              }
            },
            {
              action: {
                type: 'GET_TRANSFER_FULFILLED'
              }
            }
          ],
          [
            // should not have any errors
            {
              action: {
                type: 'ENQUEUE_SNACKBAR',
                notification: {
                  options: {
                    variant: 'error'
                  }
                }
              }
            }
          ]
        ),
        emtAuthPage.connect()
      ])

      await waitForTxConfirmation()
    },
    timeout
  )

  test(
    'Send DAI from drive wallet (insufficient allowance)',
    async () => {
      requestInterceptor.byPass({
        platform: 'ethereum',
        method: 'eth_call',
        funcSig: 'allowance',
        addresses: [
          '0x259ec51efaa03c33787752e5a99becbf7f8526c4',
          '0xdccf3b5910e936b7bfda447f10530713c2420c5d'
        ]
      })

      // reset metamask dai allowance
      await page.goto(`${process.env.E2E_TEST_URL}/disconnect`, { waitUntil: 'networkidle0' })

      await disconnectPage.setAllowance('0', 'drive')
      log.info(`Reset allowance to 0 successfully`)

      // go back to transfer form
      await page.goto(`${process.env.E2E_TEST_URL}/send`, { waitUntil: 'networkidle0' })

      const CRYPTO_AMOUNT = '1'
      await emtPage.fillForm({
        ...FORM_BASE,
        formPage: emtPage,
        cryptoAmount: CRYPTO_AMOUNT,
        currencyAmount: null,
        walletType: 'drive',
        platformType: 'ethereum',
        cryptoType: 'dai'
      })

      await gotoAuthPage()

      await expect(page).toMatch('Insufficient transaction limit to complete the transaction.')
      const allowance = await emtAuthPage.getAllowance()

      // allowance should match transfer crypto amount exactly
      expect(allowance).toBe(CRYPTO_AMOUNT)

      // click connect
      await Promise.all([
        reduxTracker.waitFor(
          [
            {
              action: {
                type: 'CHECK_WALLET_CONNECTION_FULFILLED'
              }
            },
            {
              action: {
                type: 'VERIFY_ACCOUNT_FULFILLED'
              }
            },
            {
              action: {
                type: 'SET_TOKEN_ALLOWANCE_FULFILLED'
              }
            },
            {
              action: {
                type: 'SET_TOKEN_ALLOWANCE_WAIT_FOR_CONFIRMATION_FULFILLED'
              }
            },
            {
              action: {
                type: 'SUBMIT_TX_FULFILLED'
              }
            },
            {
              action: {
                type: 'GET_TRANSFER_FULFILLED'
              }
            }
          ],
          [
            // should not have any errors
            {
              action: {
                type: 'ENQUEUE_SNACKBAR',
                notification: {
                  options: {
                    variant: 'error'
                  }
                }
              }
            }
          ],
          75000 // sometime it take longer.
        ),
        emtAuthPage.connect()
      ])

      await waitForTxConfirmation()
      requestInterceptor.byPass(null)
    },
    timeout
  )

  test(
    'Send DAI from drive wallet (sufficient allowance)',
    async () => {
      requestInterceptor.byPass({
        platform: 'ethereum',
        method: 'eth_call',
        funcSig: 'allowance',
        addresses: [
          '0x259ec51efaa03c33787752e5a99becbf7f8526c4',
          '0xdccf3b5910e936b7bfda447f10530713c2420c5d'
        ]
      })

      const CRYPTO_AMOUNT = '1'

      // reset metamask dai allowance
      await page.goto(`${process.env.E2E_TEST_URL}/disconnect`, { waitUntil: 'networkidle0' })

      // dai has decimals of 18
      const cryptoAmountBasicTokenUnit = new BN(10).pow(new BN(18)).toString()

      await disconnectPage.setAllowance(cryptoAmountBasicTokenUnit, 'drive')

      log.info(`Reset allowance to ${CRYPTO_AMOUNT} successfully`)

      // go back to transfer form
      await page.goto(`${process.env.E2E_TEST_URL}/send`, { waitUntil: 'networkidle0' })

      await emtPage.fillForm({
        ...FORM_BASE,
        formPage: emtPage,
        cryptoAmount: CRYPTO_AMOUNT,
        currencyAmount: null,
        walletType: 'drive',
        platformType: 'ethereum',
        cryptoType: 'dai'
      })

      await gotoAuthPage()

      await expect(page).toMatch(`Your remaining DAI transaction limit is ${CRYPTO_AMOUNT}`, {
        timeout: 5000
      })

      // click connect
      await Promise.all([
        reduxTracker.waitFor(
          [
            {
              action: {
                type: 'CHECK_WALLET_CONNECTION_FULFILLED'
              }
            },
            {
              action: {
                type: 'VERIFY_ACCOUNT_FULFILLED'
              }
            },
            {
              action: {
                type: 'SUBMIT_TX_FULFILLED'
              }
            },
            {
              action: {
                type: 'GET_TRANSFER_FULFILLED'
              }
            }
          ],
          [
            // should not have any errors
            {
              action: {
                type: 'ENQUEUE_SNACKBAR',
                notification: {
                  options: {
                    variant: 'error'
                  }
                }
              }
            }
          ]
        ),
        emtAuthPage.connect()
      ])

      await waitForTxConfirmation()
      requestInterceptor.byPass(null)
    },
    timeout
  )

  test(
    'Send BTC from drive wallet',
    async () => {
      requestInterceptor.byPass({
        platform: 'bitcoin',
        method: 'txs'
      })
      await page.goto(`${process.env.E2E_TEST_URL}/send`, { waitUntil: 'networkidle0' })

      const CRYPTO_AMOUNT = '0.001'
      await emtPage.fillForm({
        ...FORM_BASE,
        formPage: emtPage,
        cryptoAmount: CRYPTO_AMOUNT,
        walletType: 'drive',
        platformType: 'bitcoin',
        cryptoType: 'bitcoin'
      })

      await gotoAuthPage()

      // click connect
      await Promise.all([
        reduxTracker.waitFor(
          [
            {
              action: {
                type: 'CHECK_WALLET_CONNECTION_FULFILLED'
              }
            },
            {
              action: {
                type: 'VERIFY_ACCOUNT_FULFILLED'
              }
            },
            {
              action: {
                type: 'SUBMIT_TX_FULFILLED'
              }
            },
            {
              action: {
                type: 'GET_TRANSFER_FULFILLED'
              }
            }
          ],
          [
            // should not have any errors
            {
              action: {
                type: 'ENQUEUE_SNACKBAR',
                notification: {
                  options: {
                    variant: 'error'
                  }
                }
              }
            }
          ]
        ),
        emtAuthPage.connect()
      ])
      requestInterceptor.byPass(null)
    },
    timeout
  )

  test(
    'Send ETH from metamask extension',
    async () => {
      await page.goto(`${process.env.E2E_TEST_URL}/send`, { waitUntil: 'networkidle0' })

      await emtPage.fillForm({
        ...FORM_BASE,
        formPage: emtPage,
        walletType: 'metamask',
        platformType: 'ethereum',
        cryptoType: 'ethereum'
      })

      await gotoAuthPage()

      await Promise.all([
        reduxTracker.waitFor(
          [
            {
              action: {
                type: 'CHECK_WALLET_CONNECTION_FULFILLED'
              }
            },
            {
              action: {
                type: 'VERIFY_ACCOUNT_FULFILLED'
              }
            },
            {
              action: {
                type: 'SUBMIT_TX_FULFILLED'
              }
            },
            {
              action: {
                type: 'GET_TRANSFER_FULFILLED'
              }
            }
          ],
          [
            // should not have any errors
            {
              action: {
                type: 'ENQUEUE_SNACKBAR',
                notification: {
                  options: {
                    variant: 'error'
                  }
                }
              }
            }
          ]
        ),
        emtAuthPage.connect('metamask', 'ethereum')
      ])
      await waitForTxConfirmation()
    },
    timeout
  )

  test(
    'Send DAI from metamask wallet (insufficient allowance)',
    async () => {
      requestInterceptor.byPass({
        platform: 'ethereum',
        method: 'eth_call',
        funcSig: 'allowance',
        addresses: [
          '0xd3ced3b16c8977ed0e345d162d982b899e978588',
          '0xdccf3b5910e936b7bfda447f10530713c2420c5d'
        ]
      })

      // reset metamask dai allowance
      await page.goto(`${process.env.E2E_TEST_URL}/disconnect`, { waitUntil: 'networkidle0' })

      await disconnectPage.setAllowance('0', 'metamask')
      log.info(`Reset allowance to 0 successfully`)

      // go back to transfer form
      await page.goto(`${process.env.E2E_TEST_URL}/send`, { waitUntil: 'networkidle0' })

      const CRYPTO_AMOUNT = '1'
      await emtPage.fillForm({
        ...FORM_BASE,
        formPage: emtPage,
        cryptoAmount: CRYPTO_AMOUNT,
        currencyAmount: null,
        walletType: 'metamask',
        platformType: 'ethereum',
        cryptoType: 'dai'
      })

      await gotoAuthPage()

      await expect(page).toMatch('Insufficient transaction limit to complete the transaction.', {
        timeout: 10000
      })
      const allowance = await emtAuthPage.getAllowance()

      // allowance should match transfer crypto amount exactly
      expect(allowance).toBe(CRYPTO_AMOUNT)

      // click connect
      await Promise.all([
        reduxTracker.waitFor(
          [
            {
              action: {
                type: 'CHECK_WALLET_CONNECTION_FULFILLED'
              }
            },
            {
              action: {
                type: 'VERIFY_ACCOUNT_FULFILLED'
              }
            },
            {
              action: {
                type: 'SET_TOKEN_ALLOWANCE_FULFILLED'
              }
            },
            {
              action: {
                type: 'SET_TOKEN_ALLOWANCE_WAIT_FOR_CONFIRMATION_FULFILLED'
              }
            },
            {
              action: {
                type: 'SUBMIT_TX_FULFILLED'
              }
            },
            {
              action: {
                type: 'GET_TRANSFER_FULFILLED'
              }
            }
          ],
          [
            // should not have any errors
            {
              action: {
                type: 'ENQUEUE_SNACKBAR',
                notification: {
                  options: {
                    variant: 'error'
                  }
                }
              }
            }
          ],
          75000 // sometime it take longer.
        ),
        emtAuthPage.connect('metamask', 'dai', true)
      ])
      await waitForTxConfirmation()
      requestInterceptor.byPass(null)
    },
    timeout
  )

  test(
    'Send DAI from metamask wallet (sufficient allowance)',
    async () => {
      requestInterceptor.byPass({
        platform: 'ethereum',
        method: 'eth_call',
        funcSig: 'allowance',
        addresses: [
          '0xd3ced3b16c8977ed0e345d162d982b899e978588',
          '0xdccf3b5910e936b7bfda447f10530713c2420c5d'
        ]
      })

      const CRYPTO_AMOUNT = '1'

      // reset metamask dai allowance
      await page.goto(`${process.env.E2E_TEST_URL}/disconnect`, { waitUntil: 'networkidle0' })

      // dai has decimals of 18
      const cryptoAmountBasicTokenUnit = new BN(10).pow(new BN(18)).toString()

      await disconnectPage.setAllowance(cryptoAmountBasicTokenUnit, 'metamask')

      log.info(`Reset allowance to ${CRYPTO_AMOUNT} successfully`)

      // go back to transfer form
      await page.goto(`${process.env.E2E_TEST_URL}/send`, { waitUntil: 'networkidle0' })

      await emtPage.fillForm({
        ...FORM_BASE,
        formPage: emtPage,
        cryptoAmount: CRYPTO_AMOUNT,
        currencyAmount: null,
        walletType: 'metamask',
        platformType: 'ethereum',
        cryptoType: 'dai'
      })

      await gotoAuthPage()

      await expect(page).toMatch(`Your remaining DAI transaction limit is ${CRYPTO_AMOUNT}.`, {
        timeout: 5000
      })

      // click connect
      await Promise.all([
        reduxTracker.waitFor(
          [
            {
              action: {
                type: 'CHECK_WALLET_CONNECTION_FULFILLED'
              }
            },
            {
              action: {
                type: 'VERIFY_ACCOUNT_FULFILLED'
              }
            },
            {
              action: {
                type: 'SUBMIT_TX_FULFILLED'
              }
            },
            {
              action: {
                type: 'GET_TRANSFER_FULFILLED'
              }
            }
          ],
          [
            // should not have any errors
            {
              action: {
                type: 'ENQUEUE_SNACKBAR',
                notification: {
                  options: {
                    variant: 'error'
                  }
                }
              }
            }
          ]
        ),
        emtAuthPage.connect('metamask', 'dai', false)
      ])
      await waitForTxConfirmation()
      requestInterceptor.byPass(null)
    },
    timeout
  )

  test(
    'Send MetaMask ETH to recipient unreachabled (check error email)',
    async () => {
      // go back to transfer form
      await page.goto(`${process.env.E2E_TEST_URL}/send`, { waitUntil: 'networkidle0' })

      await emtPage.fillForm({
        ...FORM_BASE,
        formPage: emtPage,
        currencyAmount: '0.5',
        walletType: 'metamask',
        platformType: 'ethereum',
        cryptoType: 'ethereum',
        recipient: INVALID_RECIPIENT.email
      })

      await gotoAuthPage()

      // click connect
      await Promise.all([
        reduxTracker.waitFor(
          [
            {
              action: {
                type: 'CHECK_WALLET_CONNECTION_FULFILLED'
              }
            },
            {
              action: {
                type: 'VERIFY_ACCOUNT_FULFILLED'
              }
            },
            {
              action: {
                type: 'SUBMIT_TX_FULFILLED'
              }
            },
            {
              action: {
                type: 'GET_TRANSFER_FULFILLED'
              }
            }
          ],
          [
            // should not have any errors
            {
              action: {
                type: 'ENQUEUE_SNACKBAR',
                notification: {
                  options: {
                    variant: 'error'
                  }
                }
              }
            }
          ]
        ),
        emtAuthPage.connect('metamask', 'ethereum')
      ])
      const { transferId } = await receiptPage.getReceiptFormInfo('transferId')
      log.info('Transfer ID: ', transferId)
      const transferData = await getTransfer({ transferId: transferId })
      log.info('Waiting for error email to be resolved')
      await checkSenderErrorEmail(transferData)
      log.info('Error email resolved')
    },
    1000 * 60 * 20 // this may take longer than other tests
  )
})
