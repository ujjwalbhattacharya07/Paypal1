import MetamaskPage from './metamask.page'
import { getElementTextContent, getNewPopupPage } from '../testUtils'

class AccountsManagementPage {
  async getAccountsList () {
    const accountsElementList = await page.$$('[data-test-id^="account_list_item"]')
    const accounts = await Promise.all(
      accountsElementList.map(async elementHandle => {
        const walletPlatformHandle = await elementHandle.$('[data-test-id="wallet_platform"]')
        const assetsHandle = await elementHandle.$('[data-test-id="assets_cell"]')
        const walletType = (await getElementTextContent(walletPlatformHandle)).split(', ')[0]
        const platformType = (await getElementTextContent(walletPlatformHandle)).split(', ')[1]
        const name = await getElementTextContent(
          await elementHandle.$('[data-test-id="account_name"]')
        )
        let assets = await getElementTextContent(assetsHandle)
        while (!assets) {
          // ledger BTC takes time to sync
          assets = await getElementTextContent(assetsHandle)
          await page.waitFor(500)
        }
        return {
          walletType,
          platformType,
          assets,
          name
        }
      })
    )
    return accounts
  }

  async expandAccountListItem (accountIndex) {
    await page.click(`[data-test-id="account_list_item_${accountIndex}"]`)
  }

  async sendFromAccount (accountIndex) {
    await this.expandAccountListItem(accountIndex)
    await Promise.all([
      page.$eval('[data-test-id="send_from_account_btn"]', elem => elem.click()),
      page.waitForNavigation({
        waitUntil: 'networkidle0'
      })
    ])
  }

  async deleteAccounts (accountIndex) {
    await this.expandAccountListItem(accountIndex)
    await page.$eval('[data-test-id="delete_account_btn"]', elem => elem.click())
    await page.waitFor(500) // animation
    await page.$eval('[data-test-id="delete_confirm_btn"]', elem => elem.click())
  }

  async changeAccountsName (accountIndex, newName) {
    await this.expandAccountListItem(accountIndex)
    await page.$eval('[data-test-id="edit_account_btn"]', elem => elem.click())
    await page.waitFor(500) // animation

    await page.click('[data-test-id="new_name_text_field"]')
    await page.keyboard.type(newName)
    await page.$eval('[data-test-id="rename_confirm_btn"]', elem => elem.click())
  }

  async addMetaMaskAccount (name) {
    const metamaskPage = new MetamaskPage()
    await page.click('[data-test-id="connect_account_btn"]')
    await page.waitFor(500) // animation
    await page.click('[data-test-id="wallet_item_metamask"]')
    await page.click('[data-test-id="authorize_btn"]')

    // 1. if metamask has not previously connected, the popup will be shown
    // 2. otherwise, popup will not be shown and we should skip the metamask
    // connect procedure
    await Promise.race([
      metamaskPage.connect(),
      page.waitFor('[data-test-id="new_accounts_name_text_field"]', { timeout: 30000 })
    ])

    // somehow we have to wait again for the selector in order to avoid
    // selector not found errors
    await page.waitFor('[data-test-id="new_accounts_name_text_field"]', { timeout: 5000 })
    
    // click three times and backspace to clear any default value
    await page.click('[data-test-id="new_accounts_name_text_field"]')
    await page.keyboard.press('Backspace')
    await page.keyboard.type(name)
    await page.click('[data-test-id="save_btn"]')
  }

  async showAccountQRCode (accountIndex) {
    await this.expandAccountListItem(accountIndex)
    await page.$eval('[data-test-id="address_qr_code"]', elem => elem.click())
    await page.waitFor(500) // animation
    const qrCodeElement = await page.$('[data-test-id="qr_code_img"]')
    const address = await getElementTextContent(await page.$('[data-test-id="qr_code_img"]'))
    return { qrCodeElement, address }
  }

  async closeQRCodeModal () {
    await page.click('[data-test-id="close_qr_code"]')
    await page.waitFor(500) // animation
  }
}

export default AccountsManagementPage
