import axios from 'axios'
import log from 'loglevel'
import { GOOGLE_LOGIN_AUTH_OBJ, REGISTER_TIME, MASTER_KEY, EMAIL, PROFILE } from '../mocks/user.js'
import { DEFAULT_TRANSFER_DATA } from '../mocks/transfers'
import { RECIPIENTS } from '../mocks/recipients'
import { CRYPTO_ACCOUNTS } from '../mocks/cryptoAccounts.js'
import { CLOUD_WALLET_FOLDER_META } from '../mocks/cloudWalletMeta.js'

import type { BackEndCryptoAccountType } from '../../../types/account.flow'
import type { RecipientType } from '../../../types/recipients.flow'
import type { TransferDataType } from '../../../types/transfer.flow'
import type { CloudWalletFolderMetaType, UserProfile } from '../../../types/user.flow'

log.setDefaultLevel('info')

const chainsferApi = axios.create({
  baseURL: process.env.REACT_APP_CHAINSFER_API_ENDPOINT,
  headers: {
    'Content-Type': 'application/json'
  },
  validateStatus: function (status) {
    return status == 200
  }
})

/* 
  @param recipients overwrite user recipients, ignore if set to null
  @param accounts overwrite user accounts, ignore if set to null
  @param transfers clear existing transfers and add the new transfers
         ignore if set to null
 */
async function resetUser (data: {
  email: ?string,
  profile: ?UserProfile,
  registerTime: ?number,
  masterKey: ?string,
  cloudWalletFolderMeta: ?CloudWalletFolderMetaType,
  recipients: ?Array<RecipientType>,
  cryptoAccounts: ?Array<BackEndCryptoAccountType>,
  transfers: ?Array<TransferDataType>
}) {
  await chainsferApi.post('/user', {
    clientId: 'test-client',
    action: 'RESET_USER',
    idToken: GOOGLE_LOGIN_AUTH_OBJ.idToken,
    data
  })
  log.info('User data reset successfully!')
}

async function resetUserDefault () {
  await resetUser({
    email: EMAIL,
    profile: PROFILE,
    registerTime: REGISTER_TIME,
    masterKey: MASTER_KEY,
    cloudWalletFolderMeta: CLOUD_WALLET_FOLDER_META,
    recipients: RECIPIENTS,
    cryptoAccounts: CRYPTO_ACCOUNTS,
    transfers: DEFAULT_TRANSFER_DATA.transferDataList
  })
}

export { resetUser, resetUserDefault }
