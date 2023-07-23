import React, { Component } from 'react'

import { connect } from 'react-redux'
import queryString from 'query-string'
import ReceiveLandingPageComponent from '../components/ReceiveLandingPageComponent'
import { getTransfer } from '../actions/transferActions'
import { createLoadingSelector, createErrorSelector } from '../selectors'
import { goToStep } from '../actions/navigationActions'
import { onGoogleLoginReturn } from '../actions/userActions'
import moment from 'moment'
import utils from '../utils'

class ReceiveLandingPageContainer extends Component {
  componentDidMount () {
    let { location } = this.props
    const value = queryString.parse(location.search)
    this.props.getTransfer(value.id)
  }

  render () {
    const { transfer, cryptoPrice, currency } = this.props
    let sendTime, receiveTime, cancelTime
    if (transfer) {
      const { sendTimestamp, receiveTimestamp, cancelTimestamp } = transfer
      sendTime = moment.unix(sendTimestamp).format('MMM Do YYYY, HH:mm:ss')
      if (receiveTimestamp) { receiveTime = moment.unix(receiveTimestamp).format('MMM Do YYYY, HH:mm:ss') }
      if (cancelTimestamp) cancelTime = moment.unix(cancelTimestamp).format('MMM Do YYYY, HH:mm:ss')
    }
    
    return (
      <ReceiveLandingPageComponent
        {...this.props}
        sendTime={sendTime}
        receiveTime={receiveTime}
        cancelTime={cancelTime}
        currencyAmount={{
          transferAmount: transfer && utils.toCurrencyAmount(
            transfer.transferAmount,
            cryptoPrice[transfer.cryptoType],
            currency
          )
        }}
      />
    )
  }
}

const getTransferSelector = createLoadingSelector(['GET_TRANSFER'])
const errorSelector = createErrorSelector(['GET_TRANSFER'])

const mapDispatchToProps = dispatch => {
  return {
    onGoogleLoginReturn: loginData => dispatch(onGoogleLoginReturn(loginData)),
    getTransfer: id => dispatch(getTransfer(null, id)),
    goToStep: n => dispatch(goToStep('receive', n))
  }
}

const mapStateToProps = state => {
  return {
    transfer: state.transferReducer.transfer,
    isAuthenticated: state.userReducer.profile.isAuthenticated,
    cryptoPrice: state.cryptoPriceReducer.cryptoPrice,
    currency: state.cryptoPriceReducer.currency,
    actionsPending: {
      getTransfer: getTransferSelector(state)
    },
    error: errorSelector(state)
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ReceiveLandingPageContainer)
