// @flow
import React, { Component } from 'react'
import { connect } from 'react-redux'
import Review from '../components/ReviewComponent'
import { submitTx } from '../actions/transferActions'
import { createLoadingSelector, createErrorSelector } from '../selectors'
import utils from '../utils'
import { push } from 'connected-react-router'
import type { AccountData } from '../types/account.flow'
import type { Recipient } from '../types/transfer.flow.js'

type Props = {
  submitTx: Function,
  getTxFee: Function,
  transferForm: Object,
  accountSelection: AccountData,
  receiveAccountSelection: AccountData,
  wallet: Object,
  txFee: Object,
  cryptoPrice: Object,
  currency: string,
  directTransfer: boolean,
  actionsPending: {
    submitTx: boolean,
    getTxFee: boolean
  },
  error: any,
  userProfile: Object,
  recipients: Array<Recipient>,
  push: Function
}

class ReviewContainer extends Component<Props> {
  render () {
    const { cryptoPrice, txFee, transferForm, currency } = this.props
    const toCurrencyAmount = (cryptoAmount: string, usePlatformType?: boolean) => {
      // usePlatformType flag decision whether to use platformType or cryptoType
      // This is intended for getting txFee for ERC20 tokens
      return usePlatformType
        ? utils.toCurrencyAmount(
            cryptoAmount,
            cryptoPrice[JSON.parse(transferForm.accountId).platformType],
            currency
          )
        : utils.toCurrencyAmount(
            cryptoAmount,
            cryptoPrice[JSON.parse(transferForm.accountId).cryptoType],
            currency
          )
    }
    return (
      <Review
        {...this.props}
        currencyAmount={{
          // transferCurrencyAmount should not be updated by cryptoPrice
          // tracker
          transferAmount: transferForm && utils.formatNumber(transferForm.transferCurrencyAmount),
          txFee: txFee && toCurrencyAmount(txFee.costInStandardUnit, true)
        }}
      />
    )
  }
}

const submitTxSelector = createLoadingSelector(['SUBMIT_TX', 'TRANSACTION_HASH_RETRIEVED'])

const errorSelector = createErrorSelector(['SUBMIT_TX', 'TRANSACTION_HASH_RETRIEVED'])

const mapDispatchToProps = dispatch => {
  return {
    submitTx: txRequest => dispatch(submitTx(txRequest)),
    push: path => dispatch(push(path))
  }
}

const mapStateToProps = state => {
  return {
    userProfile: state.userReducer.profile.profileObj,
    transferForm: state.formReducer.transferForm,
    recipients: state.userReducer.recipients,
    accountSelection: state.accountReducer.cryptoAccounts.find(_account =>
      utils.accountsEqual(_account, { id: state.formReducer.transferForm.accountId })
    ),
    // for direct transfer
    receiveAccountSelection: state.accountReducer.cryptoAccounts.find(_account =>
      utils.accountsEqual(_account, { id: state.formReducer.transferForm.receiveAccountId })
    ),
    txFee: state.transferReducer.txFee,
    cryptoPrice: state.cryptoPriceReducer.cryptoPrice,
    currency: state.cryptoPriceReducer.currency,
    actionsPending: {
      submitTx: submitTxSelector(state)
    },
    error: errorSelector(state)
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ReviewContainer)
