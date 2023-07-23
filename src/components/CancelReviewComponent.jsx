import React, { Component } from 'react'
import Grid from '@material-ui/core/Grid'
import Button from '@material-ui/core/Button'
import { withStyles } from '@material-ui/core/styles'
import Typography from '@material-ui/core/Typography'
import CircularProgress from '@material-ui/core/CircularProgress'
import DialogTitle from '@material-ui/core/DialogTitle'
import Dialog from '@material-ui/core/Dialog'
import { getCryptoSymbol, getTxFeesCryptoType } from '../tokens'
import TextField from '@material-ui/core/TextField'
import Divider from '@material-ui/core/Divider'
import * as TransferInfoCommon from './TransferInfoCommon'
import numeral from 'numeral'

class CancelReviewComponent extends Component {
  state = {
    open: false,
    cancelMessage: ''
  }

  handleReviewNext = () => {
    const { transfer, escrowAccount, txFee } = this.props
    const { transferId, sendTxHash, transferAmount, walletId } = transfer
    const { cancelMessage } = this.state
    this.props.cancelTransfer({
      senderAccount: transfer.senderAccount,
      escrowAccount: escrowAccount,
      transferId: transferId,
      sendTxHash: sendTxHash,
      transferAmount: transferAmount,
      txFee: txFee,
      cancelMessage: cancelMessage,
      walletId: walletId
    })
  }

  handleInputChange = name => event => {
    let _cancelMessage = this.state.cancelMessage
    if (name === 'message') {
      _cancelMessage = event.target.value
      // removes whitespaces at the beginning
      _cancelMessage = _cancelMessage.replace(/^\s+/g, '')
    }
    this.setState({ cancelMessage: _cancelMessage })
  }

  handleModalOpen = () => {
    this.setState({ open: true })
  }

  handleModalClose = () => {
    this.setState({ open: false })
  }

  renderModal = () => {
    let { classes, actionsPending } = this.props
    let { cancelMessage } = this.state
    return (
      <Dialog
        aria-labelledby='cancel-dialog-title'
        open={this.state.open}
        onClose={this.handleClose}
      >
        <DialogTitle id='cancel-dialog-title'>
          <Typography varaint='h3'>Cancel Payment</Typography>
        </DialogTitle>
        <Grid container direction='column' justify='center' className={classes.modalContainer}>
          <Grid item className={classes.modalDescSection}>
            <Typography variant='body2'>
              You are going to cancel the arranged payment. Recepient will receive an email
              notification and won’t be able to accept the payment anymore. Gas fee will be
              applied.
            </Typography>
          </Grid>
          <Grid item style={{ width: '100%' }}>
            <TextField
              fullWidth
              id='message'
              label='Message (Optional)'
              className={classes.textField}
              margin='normal'
              variant='outlined'
              error={cancelMessage.length > 72}
              onChange={this.handleInputChange('message')}
              value={cancelMessage || ''}
              inputProps={{ maxLength: 72 }} // message max length
            />
          </Grid>
          <Grid item className={classes.modalBtnSection}>
            <Grid container direction='row' justify='flex-end' alignItems='center'>
              <Grid item>
                <Button color='primary' onClick={this.handleModalClose} id='close'>
                  Let me think again
                </Button>
              </Grid>
              <Grid item>
                <div className={classes.wrapper}>
                  <Button
                    variant='contained'
                    color='primary'
                    disabled={actionsPending.cancelTransfer || actionsPending.getTxFee}
                    onClick={this.handleReviewNext}
                    id='confirmCancel'
                    data-test-id='modal_cancel_btn'
                  >
                    Cancel Payment
                  </Button>
                  {(actionsPending.verifyEscrowAccountPassword ||
                    actionsPending.cancelTransfer) && (
                    <CircularProgress
                      size={24}
                      color='primary'
                      className={classes.buttonProgress}
                    />
                  )}
                </div>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Dialog>
    )
  }

  render () {
    const {
      classes,
      transfer,
      escrowAccount,
      actionsPending,
      txFee,
      sendTime,
      receiveTime,
      cancelTime,
      toCurrencyAmount
    } = this.props

    if (transfer) {
      var {
        senderAccount,
        transferId,
        transferAmount,
        receiveTxHash,
        cancelTxHash,
        senderName,
        sender,
        senderAvatar,
        destination,
        receiverName,
        receiverAvatar,
        cryptoType,
        sendMessage
      } = transfer
      var hasReceived = !!receiveTxHash
      var hasCancelled = !!cancelTxHash
    }

    if (
      actionsPending.getTransfer ||
      actionsPending.verifyEscrowAccountPassword ||
      !transfer ||
      !escrowAccount
    ) {
      return (
        <Grid container direction='column' justify='center' alignItems='center'>
          <Grid item>
            <CircularProgress
              color='primary'
              className={classes.transferProgress}
              data-test-id='cancel_review_loading'
            />
          </Grid>
        </Grid>
      )
    }
    let receiveAmount
    if (txFee) {
      receiveAmount = ['ethereum', 'bitcoin'].includes(cryptoType)
        ? parseFloat(transferAmount) - parseFloat(txFee.costInStandardUnit)
        : parseFloat(transferAmount)
    }

    return (
      <Grid container direction='column'>
        <Grid item>
          <Grid container direction='column' spacing={2}>
            <Grid item>
              <Typography variant='h3' id='title'>
                {hasReceived && 'Transfer has been received'}
                {hasCancelled && 'Transfer has already been cancelled'}
                {!hasReceived && !hasCancelled && 'Transfer details'}
              </Typography>
            </Grid>
            <Grid item>
              <TransferInfoCommon.FromAndToSection
                directionLabel='To'
                user={{
                  name: senderName,
                  email: sender,
                  avatar: senderAvatar
                }}
              />
            </Grid>
            <Grid item>
              <Divider />
            </Grid>
            <Grid item>
              <TransferInfoCommon.FromAndToSection
                directionLabel='From'
                user={{
                  name: receiverName,
                  email: destination,
                  avatar: receiverAvatar
                }}
                account={senderAccount}
              />
            </Grid>
            <Grid item>
              <Divider />
            </Grid>
            <Grid item>
              <Grid container direction='column' alignItems='flex-start'>
                <Grid item>
                  <Typography variant='caption'>Amount</Typography>
                </Grid>
                <Grid item>
                  <Grid container direction='row' alignItems='center'>
                    <Typography variant='body2' id='transferAmount' data-test-id='transfer_amount'>
                      {transferAmount} {getCryptoSymbol(cryptoType)}
                    </Typography>
                    <Typography
                      style={{ marginLeft: '10px' }}
                      variant='caption'
                      data-test-id='currency_amount'
                    >
                      ( ≈ {toCurrencyAmount(transferAmount)} )
                    </Typography>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
            <Grid item>
              <Divider />
            </Grid>
            <Grid item>
              <Grid container direction='column' alignItems='flex-start'>
                <Grid item>
                  <Typography variant='caption'>Transaction Fee</Typography>
                </Grid>
                <Grid item>
                  {!actionsPending.getTxFee && txFee ? (
                    <Grid container direction='row' alignItems='center'>
                      <Typography variant='body2' data-test-id='tx_fee'>
                        {`${numeral(txFee.costInStandardUnit).format('0.000000')} ${getCryptoSymbol(
                          getTxFeesCryptoType(cryptoType)
                        )}`}
                      </Typography>
                      <Typography
                        style={{ marginLeft: '10px' }}
                        variant='caption'
                        data-test-id='currency_tx_fee'
                      >
                        ( ≈ {toCurrencyAmount(txFee.costInStandardUnit)})
                      </Typography>
                    </Grid>
                  ) : (
                    <CircularProgress size={18} color='primary' />
                  )}
                </Grid>
              </Grid>
            </Grid>
            {!hasReceived && !hasCancelled && (
              <>
                <Grid item>
                  <Divider />
                </Grid>
                <Grid item>
                  <Grid container direction='column' alignItems='flex-start'>
                    <Grid item>
                      <Typography variant='caption'>You will receive*</Typography>
                    </Grid>
                    <Grid item>
                      {receiveAmount ? (
                        <Grid container direction='row' alignItems='center'>
                          <Typography variant='body2'>
                            {`${numeral(receiveAmount).format('0.000000')} ${getCryptoSymbol(
                              cryptoType
                            )}`}
                          </Typography>
                          <Typography style={{ marginLeft: '10px' }} variant='caption'>
                            ( ≈ {toCurrencyAmount(receiveAmount)})
                          </Typography>
                        </Grid>
                      ) : (
                        <CircularProgress size={18} color='primary' />
                      )}
                    </Grid>
                  </Grid>
                </Grid>
              </>
            )}
            {!hasReceived && !hasCancelled && sendMessage && sendMessage.length > 0 && (
              <>
                <Grid item>
                  <Divider />
                </Grid>
                <Grid item>
                  <Grid container direction='column' alignItems='flex-start'>
                    <Grid item>
                      <Typography variant='caption'>Message</Typography>
                      <Typography variant='body2' data-test-id='send_msg'>
                        {sendMessage}
                      </Typography>
                    </Grid>
                  </Grid>
                </Grid>
              </>
            )}
            <Grid item>
              <Divider />
            </Grid>
            <Grid item>
              <Grid container direction='column' spacing={1}>
                {sendTime && (
                  <Grid item>
                    <Typography variant='caption'>Sent on {sendTime}</Typography>
                  </Grid>
                )}
                {receiveTime && (
                  <Grid item>
                    <Typography variant='caption'>Received on {receiveTime}</Typography>
                  </Grid>
                )}
                {cancelTime && (
                  <Grid item>
                    <Typography variant='caption'>Cancelled on {cancelTime}</Typography>
                  </Grid>
                )}
                <Grid item>
                  <Typography variant='caption'>Transfer ID: {transferId}</Typography>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
        {!hasReceived && !hasCancelled && (
          <Grid item className={classes.btnSection}>
            <Grid container direction='row' justify='center'>
              <Grid item>
                <Button
                  fullWidth
                  color='primary'
                  size='large'
                  onClick={this.handleModalOpen}
                  id='cancel'
                  data-test-id='review_cancel_btn'
                >
                  Cancel Payment
                </Button>
              </Grid>
            </Grid>
          </Grid>
        )}
        {this.state.open && this.renderModal()}
      </Grid>
    )
  }
}

const styles = theme => ({
  btnSection: {
    marginTop: '60px'
  },
  transferProgress: {
    padding: '60px'
  },
  modalContainer: {
    padding: '0px 24px 24px 24px'
  },
  modalBtnSection: {
    width: '100%'
  },
  modalDescSection: {
    paddingBottom: '20px'
  },
  buttonProgress: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -12,
    marginLeft: -12
  },
  wrapper: {
    margin: theme.spacing(1),
    position: 'relative'
  }
})

export default withStyles(styles)(CancelReviewComponent)
