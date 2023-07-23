import { getElementTextContent } from '../testUtils'
class SendReviewPage {
  async dispatchFormActions (action) {
    if (action === 'continue') {
      await page.click('[data-test-id="continue"]')
    } else if (action === 'back') {
      await page.click('[data-test-id="back"]')
    } else if (action === 'showSenderAddress') {
      await page.click('[data-test-id="show_from_address_btn"]')
    } else if (action === 'showReceiverAddress') {
      await page.click('[data-test-id="show_to_address_btn"]')
    } else {
      throw new Error(`Invalid action: ${action}`)
    }
  }

  async waitTillReady () {
    await page.waitFor('[data-test-id="title"]')
  }

  async getReviewFormInfo (field) {
    switch (field) {
      case 'title': {
        const titleElement = await page.$('[data-test-id="title"]')
        const title = await getElementTextContent(titleElement)
        return title
      }
      case 'sender': {
        const senderNameElement = await page.$('[data-test-id="from_name"]')
        const senderEmailElement = await page.$('[data-test-id="from_email"]')
        const name = await getElementTextContent(senderNameElement)
        const email = await getElementTextContent(senderEmailElement)
        return { name, email }
      }
      case 'recipient': {
        const recipientNameElement = await page.$('[data-test-id="to_name"]')
        const recipientEmailElement = await page.$('[data-test-id="to_email"]')
        const name = await getElementTextContent(recipientNameElement)
        const email = await getElementTextContent(recipientEmailElement)
        return { name, email }
      }
      case 'senderAccount': {
        const senderAccountNameElement = await page.$('[data-test-id="from_account_name"]')
        const accountWalletPlatformTypeElement = await page.$(
          '[data-test-id="from_wallet_platform"]'
        )
        const WalletPlatform = (
          await getElementTextContent(accountWalletPlatformTypeElement)
        ).split(', ')

        await this.dispatchFormActions('showSenderAddress')
        await page.waitFor('[data-test-id="from_address"]')
        const addressElement = await page.$('[data-test-id="from_address"]')
        const address = await getElementTextContent(addressElement)

        const name = await getElementTextContent(senderAccountNameElement)
        const walletType = WalletPlatform[0]
        const platformType = WalletPlatform[1]
        return { name, walletType, platformType, address }
      }
      case 'receiverAccount': {
        const senderAccountNameElement = await page.$('[data-test-id="to_account_name"]')
        const accountWalletPlatformTypeElement = await page.$('[data-test-id="to_wallet_platform"]')
        const WalletPlatform = (
          await getElementTextContent(accountWalletPlatformTypeElement)
        ).split(', ')

        await this.dispatchFormActions('showReceiverAddress')
        await page.waitFor('[data-test-id="from_address"]')
        const addressElement = await page.$('[data-test-id="to_address"]')
        const address = await getElementTextContent(addressElement)

        const name = await getElementTextContent(senderAccountNameElement)
        const walletType = WalletPlatform[0]
        const platformType = WalletPlatform[1]
        return { name, walletType, platformType, address }
      }
      case 'transferAmount': {
        const transferAmountElement = await page.$('[data-test-id="transfer_amount"]')
        const currencyAmountElement = await page.$('[data-test-id="currency_amount"]')
        const transferAmount = (await getElementTextContent(transferAmountElement)).split(' ')[0]
        const symbol = (await getElementTextContent(transferAmountElement)).split(' ')[1]
        const currencyAmount = (await getElementTextContent(currencyAmountElement)).split(' ')[2]
        return { transferAmount, currencyAmount, symbol }
      }
      case 'txFee': {
        const txFeeElement = await page.$('[data-test-id="tx_fee"]')
        const currencyTxFeeElement = await page.$('[data-test-id="currency_tx_fee"]')
        const txFee = (await getElementTextContent(txFeeElement)).split(' ')[0]
        const symbol = (await getElementTextContent(txFeeElement)).split(' ')[1]
        const currencyTxFee = (await getElementTextContent(currencyTxFeeElement)).split(' ')[2]
        return { txFee, currencyTxFee, symbol }
      }
      case 'securityAnswer': {
        const securityAnswerElement = await page.$('[data-test-id="security_answer"]')
        const securityAnswer = await getElementTextContent(securityAnswerElement)
        return { securityAnswer }
      }
      case 'sendMessage': {
        const messageElement = await page.$('[data-test-id="send_msg"]')
        const message = await getElementTextContent(messageElement)
        return { message }
      }
    }
  }
}

export default SendReviewPage
