import React, { Component } from 'react'
import Box from '@material-ui/core/Box'
import Button from '@material-ui/core/Button'
import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'
import Link from '@material-ui/core/Link'
import { withStyles } from '@material-ui/core/styles'
import GoogleLoginButton from './GoogleLoginButton'
import classNames from 'classnames'
import env from '../typedEnv'
import { ReceiveTransferDataSection } from './ReceiveFormComponent'

// Assets
import ChainsfrLogoSVG from '../images/logo_chainsfr_617_128.svg'
import ChainsfrLogoDemoSVG from '../images/logo_chainsfr_demo_852_128.svg'
import ReceiptSVG from '../images/receipt.svg'

const data = {
  descriptions: [
    {
      title: 'Pay Crypto via Email',
      content: 'No more nonsensical crypto address.'
    },
    {
      title: 'Control Your Payment',
      content: 'Send in seconds. Cancel if needed.'
    },
    {
      title: 'Connect to Popular Wallets',
      content: 'Coinbase, MetaMask, Ledger, and more.'
    },
    {
      title: 'Own Your Asset',
      content: 'Non-Custodial, end-to-end encrypted.'
    },
    {
      title: 'All within Google',
      content: 'Login, manage, auto-backup.'
    }
  ],
  termURL: env.REACT_APP_TERMS_URL,
  privacyURL: env.REACT_APP_PRIVACY_URL
}

class LoginComponent extends Component {
  loginSuccess = async response => {
    this.props.onGoogleLoginReturn(response)
  }

  loginFailure = async response => {
    console.log(response)
  }

  renderLoginBtn = () => {
    const { classes, path } = this.props
    return (
      <Grid className={classes.btnContainer}>
        <GoogleLoginButton onSuccess={this.loginSuccess} onFailure={this.loginFailure} path={path}/>
      </Grid>
    )
  }

  renderFaq = () => {
    const { classes } = this.props
    return (
      <>
        {data.descriptions.map((item, i) => (
          <Grid className={classes.leftContainer} key={i}>
            <Typography
              align='left'
              className={classNames(classes.faqTitle, classes.faqFontColor)}
            >
              {item.title}
            </Typography>
            <Typography
              align='left'
              className={classNames(classes.faqContent, classes.faqFontColor)}
            >
              {item.content}
            </Typography>
          </Grid>
        ))}
      </>
    )
  }

  renderReceiveLogin = () => {
    let {
      transfer,
      sendTime,
      receiveTime,
      cancelTime,
      currencyAmount,
      classes,
      isMainNet
    } = this.props

    let isInvalidTransfer = false
    if (transfer) {
      var { receiveTxHash, cancelTxHash } = transfer
      if (receiveTxHash || cancelTxHash) isInvalidTransfer = true
    }

    return (
      <Grid container className={classNames(classes.container, classes.containerInfo)}>
        <Grid item md={6} className={classes.faqContainer}>
          {this.renderFaq()}
        </Grid>
        <Grid item md={6} className={classes.loginContainer}>
          <Box
            display='flex'
            flexDirection='column'
            alignItems='center'
            mx='auto'
            my={6}
            width='100%'
          >
            <Box mb={2}>
              <img
                className={classes.chainsfrLogo}
                src={isMainNet ? ChainsfrLogoSVG : ChainsfrLogoDemoSVG}
                alt='Chainsfr Logo'
              />
            </Box>
            <Box maxWidth={360} width={'90%'} mx={2}>
              <ReceiveTransferDataSection
                transfer={transfer}
                sendTime={sendTime}
                receiveTime={receiveTime}
                cancelTime={cancelTime}
                currencyAmount={currencyAmount}
              />
            </Box>
            {!isInvalidTransfer && (
              <>
                <Box maxWidth={480} width='100%' alignSelf='center'>
                  {this.renderLoginBtn()}
                </Box>
                <Box mt={3} maxWidth={350}>
                  <Typography
                    variant='caption'
                    component='p' // otherwise component does not align center
                    className={classes.loginText}
                    align='center'
                  >
                    By signing in, you agree to our{' '}
                    <Link
                      className={classes.linkText}
                      variant='caption'
                      align='center'
                      color='textSecondary'
                      href={data.termURL}
                      target='_blank'
                    >
                      Term of Service
                    </Link>{' '}
                    and{' '}
                    <Link
                      className={classes.linkText}
                      variant='caption'
                      align='center'
                      color='textSecondary'
                      href={data.privacyURL}
                      target='_blank'
                    >
                      Privacy Policy
                    </Link>{' '}
                    and to receive Chainsfr emails, newsletters & updates.
                  </Typography>
                </Box>
              </>
            )}
          </Box>
        </Grid>
      </Grid>
    )
  }

  renderReceiptLogin = () => {
    let { classes, isMainNet } = this.props
    return (
      <Grid container className={classNames(classes.container, classes.containerInfo)}>
        <Grid item md={6} className={classes.faqContainer}>
          {this.renderFaq()}
        </Grid>
        <Grid item md={6} className={classes.loginContainer}>
          <Box display='flex' flexDirection='column' alignItems='center' mx='auto' my={6}>
            <Box mb={2}>
              <img
                className={classes.chainsfrLogo}
                src={isMainNet ? ChainsfrLogoSVG : ChainsfrLogoDemoSVG}
                alt='Chainsfr Logo'
              />
            </Box>
            <Box mb={1}>
              <img
                src={ReceiptSVG}
                alt='Receipt Illustration'
                data-test-id='receipt_illustration'
              />
            </Box>
            <Box mb={3}>
              <Typography
                variant='h4'
                align='center'
                color='textPrimary'
                className={classes.loginText}
              >
                Please sign in to view the receipt
              </Typography>
            </Box>
            <Box width={300}>{this.renderLoginBtn()}</Box>
            <Box mt={3} maxWidth={350}>
              <Typography
                variant='caption'
                component='p' // otherwise component does not align center
                className={classes.loginText}
                align='center'
              >
                By signing in, you agree to our{' '}
                <Link
                  className={classes.linkText}
                  variant='caption'
                  align='center'
                  color='textSecondary'
                  href={data.termURL}
                  target='_blank'
                >
                  Term of Service
                </Link>{' '}
                and{' '}
                <Link
                  className={classes.linkText}
                  variant='caption'
                  align='center'
                  color='textSecondary'
                  href={data.privacyURL}
                  target='_blank'
                >
                  Privacy Policy
                </Link>{' '}
                and to receive Chainsfr emails, newsletters & updates.
              </Typography>
            </Box>
          </Box>
        </Grid>
      </Grid>
    )
  }

  render () {
    let { classes, renderReceiveLogin, renderReceiptLogin, isMainNet, path } = this.props

    if (renderReceiveLogin) {
      return this.renderReceiveLogin()
    } else if (renderReceiptLogin) {
      return this.renderReceiptLogin()
    }

    return (
      <Grid container className={classNames(classes.container, classes.containerInfo)}>
        <Grid item md={6} className={classes.faqContainer}>
          {this.renderFaq()}
        </Grid>
        <Grid item md={6} className={classes.loginContainer}>
          <Box flexGrow={1}>
            <Box display='flex' my={10}>
              <Box display='flex' flexDirection='column' alignItems='center' mx='auto'>
                <Box width='300'>
                  <Button
                    className={classes.logoBtn}
                    component={Link}
                    href='https://www.chainsfr.com'
                    target='_blank'
                  >
                    <img
                      className={classes.chainsfrLogo}
                      src={isMainNet ? ChainsfrLogoSVG : ChainsfrLogoDemoSVG}
                      alt='Chainsfr Logo'
                    />
                  </Button>
                </Box>
                <Box mt={4} width={300}>
                  <GoogleLoginButton
                    onSuccess={this.loginSuccess}
                    onFailure={this.loginFailure}
                    path={path}
                  />
                </Box>
                {path.includes('signup') && (
                  <Box mt={3} maxWidth={350}>
                    <Typography
                      variant='caption'
                      component='p' // otherwise component does not align center
                      className={classes.loginText}
                      align='center'
                    >
                      By signing up, you agree to our{' '}
                      <Link
                        className={classes.linkText}
                        variant='caption'
                        align='center'
                        color='textSecondary'
                        href={data.termURL}
                        target='_blank'
                      >
                        Term of Service
                      </Link>{' '}
                      and{' '}
                      <Link
                        className={classes.linkText}
                        variant='caption'
                        align='center'
                        color='textSecondary'
                        href={data.privacyURL}
                        target='_blank'
                      >
                        Privacy Policy
                      </Link>{' '}
                      and to receive Chainsfr emails, newsletters & updates.
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        </Grid>
      </Grid>
    )
  }
}

const styles = theme => ({
  container: {
    width: '100%',
    flexGrow: 1
  },
  containerInfo: {
    backgroundColor: '#393386'
  },
  chainsfrLogo: {
    height: 32,
    margin: 'auto'
  },
  faqContainer: {
    paddingTop: 30,
    paddingBottom: 30,
    margin: 'auto',
    order: 3,
    '@media screen and (min-width: 960px) ': {
      order: 1
    }
  },
  loginContainer: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    backgroundColor: '#f8f8f8',
    order: 2
  },
  btnContainer: {
    display: 'flex',
    maxHeight: 40,
    position: 'relative',
    justifyContent: 'center'
  },
  leftContainer: {
    padding: 20,
    margin: 'auto',
    maxWidth: 480
  },
  faqFontColor: {
    color: '#FFF'
  },
  faqTitle: {
    fontFamily: 'Poppins',
    fontSize: 20,
    lineHeight: '40px',
    fontWeight: 500
  },
  faqContent: {
    color: '#c4c4d8',
    fontFamily: 'Poppins',
    fontSize: 16,
    lineHeight: '20px',
    fontWeight: 400
  },
  subComponent: {
    width: '100%',
    maxWidth: '680px',
    margin: '0px 0px 16px 0px',
    padding: '30px'
  },
  sectionContainer: {
    width: '100%',
    maxWidth: '1200px'
  },
  linkText: {
    fontFamily: 'Poppins',
    textDecoration: 'underline'
  },
  loginText: {
    fontFamily: 'Poppins'
  },
  logoBtn: {
    '&:hover': {
      backgroundColor: 'transparent'
    }
  }
})

export default withStyles(styles)(LoginComponent)
