import LandingPage from './pages/landing.page'
import LoginPage from './pages/login.page'

import { sleep } from './testUtils'

const timeout = 180000

describe('Landing page tests', () => {
  beforeAll(async () => {
    await jestPuppeteer.resetBrowser()

    // setup interceptor
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
  })

  afterAll(async () => {
    requestInterceptor.showStats()
  })

  beforeEach(async () => {
    await page.goto(process.env.E2E_TEST_URL, {
      waitUntil: 'networkidle0'
    })
  })

  it(
    'Navigate to email transfer',
    async () => {
      const landingPage = new LandingPage()
      await landingPage.startEmailTransfer()
    },
    timeout
  )

  it(
    'NavDrawer part',
    async () => {
      const landingPage = new LandingPage()
      await landingPage.navigateToAccounts()
      await landingPage.navigateToContacts()
      await landingPage.navigateToWallet()
      await landingPage.navigateToOverview()
      await landingPage.checkCopyRight()
      await landingPage.checkBuild()
    },
    timeout
  )

  it(
    'Landing page static elements',
    async () => {
      const landingPage = new LandingPage()
      await landingPage.checkEmailTransferTitle()
      await landingPage.checkEmailTransferTitleSubtitle()
    },
    timeout
  )
})
