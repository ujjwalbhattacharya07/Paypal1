import React from 'react'

import { makeStyles } from '@material-ui/styles'
import Typography from '@material-ui/core/Typography'
import Grid from '@material-ui/core/Grid'
import Card from '@material-ui/core/Card'
import { walletSelections, walletDisabledByCrypto } from '../wallet'

const basicWalletStyle = {
  paddingTop: '10px',
  paddingBottom: '10px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  height: '100px',
  justifyContent: 'center'
}

const useStyles = makeStyles({
  walletLogo: {
    height: '48px',
    alignSelf: 'center'
  },
  walletCard: {
    ...basicWalletStyle,
    border: '1px solid transparent',
    boxShadow: 'none',
    marginBottom: '10px',
    backgroundColor: 'transparent'
  },
  walletCardSelected: {
    ...basicWalletStyle,
    border: '1px solid #4285F4',
    borderRadius: '8px',
    backgroundColor: 'rgba(66,133,244,0.1)',
    transition: 'all .3s ease',
    marginBottom: '10px'
  },
  walletCardDisabled: {
    ...basicWalletStyle,
    opacity: 0.5,
    marginBottom: '10px'
  },
  walletSelectionContainer: {
    backgroundColor: '#FAFBFE',
    marginBottom: '20px'
  }
})

export function WalletButton (props) {
  const { walletType, handleClick, selected, disabled, disabledReason, containerStyle } = props
  const wallet = walletSelections.find(w => w.walletType === walletType)
  const classes = useStyles()
  let cardStyle = classes.walletCard
  if (selected) cardStyle = classes.walletCardSelected
  if (disabled) cardStyle = classes.walletCardDisabled
  return (
    <Card
      className={cardStyle}
      onClick={() => {
        if (!disabled && handleClick) handleClick(wallet.walletType)
      }}
      style={{ ...containerStyle }}
    >
      <img className={classes.walletLogo} src={wallet.logo} alt='wallet-logo' />
      {disabled && <Typography variant='caption'>{disabledReason}</Typography>}
    </Card>
  )
}

export default function WalletSelectionButtons (props) {
  const { handleClick, walletSelection, cryptoType, purpose } = props
  const classes = useStyles()
  return (
    <Grid
      container
      direction='row'
      alignItems='center'
      justify='center'
      spacing={1}
      className={classes.walletSelectionContainer}
    >
      {walletSelections
        .filter(w => {
          if (purpose === 'send') {
            return w.sendable && !w.hide && w.displayInHome
          } else if (purpose === 'receive') {
            return w.receivable && !w.hide
          } else if (purpose === 'addAccount') {
            return w.walletType !== 'drive' && !w.hide
          }
          return true
        })
        .map((w, i) => {
          return (
            <Grid item sm={3} md={2} xs={12} key={i}>
              <WalletButton
                id={w.walletType}
                walletType={w.walletType}
                selected={w.walletType === walletSelection}
                disabled={
                  w.disabled || (cryptoType && walletDisabledByCrypto(w.walletType, cryptoType))
                }
                handleClick={handleClick}
                disabledReason={w.disabledReason || ' '}
              />
            </Grid>
          )
        })}
    </Grid>
  )
}
