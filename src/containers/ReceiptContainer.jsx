// @flow
import React, { Component } from 'react'
import { connect } from 'react-redux'
import Receipt from '../components/ReceiptComponent'
import moment from 'moment'
import { createLoadingSelector, createErrorSelector } from '../selectors'
import { getTransfer, getTransferPassword, twitterShareReceipt } from '../actions/transferActions'
import { backToHome } from '../actions/navigationActions'
import queryString from 'query-string'
import paths from '../Paths'
import type { Recipient } from '../types/transfer.flow.js'

type Props = {
  history: Object,
  location: Object,
  profile: Object,
  transfer: Object,
  recipients: Array<Recipient>,
  receipt: Object,
  actionsPending: Object,
  cryptoPrice: Object,
  currency: string,
  error: string,
  getTransfer: Function,
  getTransferPassword: Function,
  backToHome: Function,
  twitterShareReceipt: Function
}

type State = {
  transferId: ?string,
  receivingId: ?string
}

class ReceiptContainer extends Component<Props, State> {
  componentDidMount () {
    let { receipt, history, location } = this.props
    // recover '&' from encoded '&amp;'
    // used for intercom product tour
    const value = queryString.parse(location.search.replace(/amp%3B|amp;/g, ''))

    if (location.search === '' && !receipt) return

    const { transferId, receivingId } = location.search !== '' ? value : receipt
    this.getTransfer(transferId, receivingId)

    if (location.search === '') {
      // add receipt id (if available) to url param and replace url
      history.replace(
        `${paths.receipt}?${transferId ? 'transferId' : 'receivingId'}=${transferId || receivingId}`
      )
    }
  }

  componentDidUpdate (prevProps) {
    const { getTransferPassword, transfer, actionsPending, error } = this.props
    if (transfer)
    if (
      prevProps.actionsPending.getTransfer &&
      !actionsPending.getTransfer &&
      !error &&
      !actionsPending.getTransferPassword &&
      transfer.transferMethod === 'EMAIL_TRANSFER' &&
      transfer.transferType === 'SENDER' // only fetch pwd for sender 
    ) {
      // after fetching transfer data
      // fetch password only for transferMethod == 'EMAIL_TRANSFER'
      getTransferPassword(transfer.transferId)
    }
  }

  getTransfer = (transferId, receivingId) => {
    let { getTransfer, actionsPending } = this.props
    if (!actionsPending.getTransfer) {
      getTransfer(transferId, receivingId)
    }
  }

  render () {
    const { transfer, recipients, error, backToHome, twitterShareReceipt } = this.props

    if (transfer) {
      const { sendTimestamp, receiveTimestamp, cancelTimestamp } = transfer
      var sendTime = moment.unix(sendTimestamp).format('MMM Do YYYY, HH:mm:ss')
      if (receiveTimestamp) {
        var receiveTime = moment.unix(receiveTimestamp).format('MMM Do YYYY, HH:mm:ss')
      }
      if (cancelTimestamp)
        var cancelTime = moment.unix(cancelTimestamp).format('MMM Do YYYY, HH:mm:ss')
    }
    return (
      <Receipt
        transfer={transfer}
        sendTime={sendTime}
        receiveTime={receiveTime}
        cancelTime={cancelTime}
        recipients={recipients}
        error={error}
        backToHome={backToHome}
        twitterShareReceipt={twitterShareReceipt}
      />
    )
  }
}

const getTransferSelector = createLoadingSelector(['GET_TRANSFER'])
const getTransferPasswordSelector = createLoadingSelector(['GET_TRANSFER_PASSWORD'])
const errorSelector = createErrorSelector(['GET_TRANSFER', 'GET_TRANSFER_PASSWORD'])

const mapStateToProps = state => {
  return {
    transfer: state.transferReducer.transfer,
    receipt: state.transferReducer.receipt,
    recipients: state.userReducer.recipients,
    cryptoPrice: state.cryptoPriceReducer.cryptoPrice,
    currency: state.cryptoPriceReducer.currency,
    actionsPending: {
      getTransfer: getTransferSelector(state),
      getTransferPassword: getTransferPasswordSelector(state)
    },
    error: errorSelector(state)
  }
}

const mapDispatchToProps = dispatch => {
  return {
    getTransfer: (transferId, receivingId) => dispatch(getTransfer(transferId, receivingId)),
    getTransferPassword: transferId => dispatch(getTransferPassword(transferId)),
    twitterShareReceipt: (transfer) => dispatch(twitterShareReceipt(transfer)),
    backToHome: () => dispatch(backToHome())
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ReceiptContainer)
