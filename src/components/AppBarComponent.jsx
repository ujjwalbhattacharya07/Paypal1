// @flow
import React, { useState } from 'react'
import { makeStyles } from '@material-ui/core/styles'
import AppBar from '@material-ui/core/AppBar'
import Box from '@material-ui/core/Box'
import Dialog from '@material-ui/core/Dialog'
import Toolbar from '@material-ui/core/Toolbar'
import Button from '@material-ui/core/Button'
import { Link } from 'react-router-dom'
import path from '../Paths.js'
import Typography from '@material-ui/core/Typography'
import UserAvatar from './MicroComponents/UserAvatar'
import Divider from '@material-ui/core/Divider'
import Hidden from '@material-ui/core/Hidden'
import IconButton from '@material-ui/core/IconButton'
import ChainsfrLogoSVG from '../images/logo_chainsfr_617_128.svg'
import ChainsfrLogoDemoSVG from '../images/logo_chainsfr_demo_852_128.svg'
import Stepper from './Stepper'
import Popover from '@material-ui/core/Popover'
import Paper from '@material-ui/core/Paper'

// Icons
import CloseIcon from '@material-ui/icons/Close'
import ExitIcon from '@material-ui/icons/ExitToApp'
import MenuIcon from '@material-ui/icons/Menu'
import SettingsIcon from '@material-ui/icons/Settings'

type Props = {
  disabled?: boolean,
  backToHome: Function,
  profile: Object,
  location: Object,
  isolate: boolean,
  step: number,
  handleDrawerToggle: Function,
  onSetting: Function,
  isMainNet: boolean
}

type ProfileButtonProps = {
  disabled?: boolean,
  profile: Object
}

const profileBtnStyle = makeStyles({
  avatar: {
    width: '32px',
    height: '32px',
    border: 'solid 1px #ffffff',
    borderColor: 'transparent'
  },
  iconButton: {
    padding: 0
  },
  icon: {
    marginRight: 10
  },
  menuItem: {
    padding: '10px 20px 10px 20px',
    display: 'flex',
    justifyContent: 'flex-start'
  },
  paper: {
    margin: 0
  }
})

const PaperComponent = props => {
  const {
    onClose,
    anchorEl,
    anchorOrigin,
    transformOrigin,
    getContentAnchorEl,
    open,
    ...otherProps
  } = props
  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      anchorOrigin={anchorOrigin}
      transformOrigin={transformOrigin}
      getContentAnchorEl={getContentAnchorEl}
      onClose={onClose}
    >
      <Paper {...otherProps} />
    </Popover>
  )
}
const ProfileButton = (props: ProfileButtonProps) => {
  const classes = profileBtnStyle()
  const { profile, disabled } = props
  const [anchorEl, setAnchorEl] = useState(null)

  if (!profile || !profile.profileObj) return null
  const { profileObj } = profile

  const handleClose = action => event => {
    setAnchorEl(null)
  }

  return (
    <>
      <IconButton
        aria-owns={anchorEl ? 'simple-menu' : undefined}
        aria-haspopup='true'
        onClick={event => setAnchorEl(event.currentTarget)}
        id='avatarBtn'
        style={{ textTransform: 'none' }}
        disabled={disabled}
        className={classes.iconButton}
      >
        <UserAvatar
          src={profileObj.imageUrl}
          style={{
            width: '24px',
            height: '24px'
          }}
          name={profileObj.name}
        />
      </IconButton>
      <Dialog
        id='simple-menu'
        PaperComponent={PaperComponent}
        PaperProps={{
          anchorOrigin: {
            vertical: 'bottom',
            horizontal: 'right'
          },
          transformOrigin: {
            vertical: 'top',
            horizontal: 'right'
          },
          getContentAnchorEl: null,
          anchorEl: anchorEl,
          open: Boolean(anchorEl),
          onClose: handleClose()
        }}
        classes={{ paper: classes.paper }}
        open={Boolean(anchorEl)}
        onClose={handleClose()}
      >
        <Box display='flex' flexDirection='column'>
          <Box padding={2} display='flex' flexDirection='row' alignItems='center'>
            <Box mr={1}>
              <UserAvatar
                src={profileObj.imageUrl}
                style={{
                  width: '32px'
                }}
                name={profileObj.name}
              />
            </Box>
            <Box display='flex' flexDirection='column'>
              <Typography variant='h4'>{profileObj.name}</Typography>
              <Typography variant='caption'>{profileObj.email}</Typography>
            </Box>
          </Box>
          <Divider />
          <Box display='flex' flexDirection='column' pt={1} pb={1}>
            <Button onClick={handleClose('setting')} id='setting' className={classes.menuItem}>
              <SettingsIcon color='primary' className={classes.icon} />
              Setting
            </Button>
            <Button onClick={handleClose('logout')} id='logout' className={classes.menuItem}>
              <ExitIcon color='primary' className={classes.icon} />
              Logout
            </Button>
          </Box>
        </Box>
      </Dialog>
    </>
  )
}

const ChainsfrLogoStyle = makeStyles({
  chainsfrLogo: {
    height: 24
  }
})

type ChainsfrLogoProps = {
  disabled: ?boolean,
  onClick: Function,
  isMainNet: boolean
}

const ChainsfrLogo = (props: ChainsfrLogoProps) => {
  const { onClick, disabled, isMainNet } = props
  const classes = ChainsfrLogoStyle()
  return (
    <Button
      classes={{ root: classes.homeButton }}
      component={Link}
      to={path.home}
      onClick={() => {
        onClick()
      }}
      id='back'
      disabled={disabled}
    >
      <img
        className={classes.chainsfrLogo}
        src={isMainNet ? ChainsfrLogoSVG : ChainsfrLogoDemoSVG}
        alt='Chainsfr Logo'
      />
    </Button>
  )
}

const IsolateAppBarContent = (props: Props) => {
  const { profile, disabled, backToHome, step, location, isMainNet } = props
  return (
    <Box
      display='flex'
      flexDirection='row'
      alignItems='center'
      justifyContent='space-between'
      width='100%'
    >
      <Box display='flex' flexDirection='row' alignItems='center'>
        <ChainsfrLogo disabled onClick={() => {}} isMainNet={isMainNet} />
        {/* vertical divider does not work in our Material UI version */}
        <Box borderLeft='0.5px solid #e9e9e9' pr={2} height='24px' />
        <ProfileButton profile={profile} disabled />
      </Box>
      <Hidden only={['xs', 'sm']}>
        <Box flexGrow={1} maxWidth={660} justifyContent='center'>
          {location.pathname === path.transfer && <Stepper actionType='transfer' step={step} />}
        </Box>
      </Hidden>
      <Box width={204} display='flex' justifyContent='flex-end'>
        <IconButton
          onClick={() => {
            backToHome()
          }}
          component={Link}
          to={location.pathname === path.directTransfer ? path.wallet : path.home}
          disabled={disabled}
        >
          <CloseIcon fontSize='small' color='secondary' />
        </IconButton>
      </Box>
    </Box>
  )
}

const NormalAppBarContent = (props: Props) => {
  const { handleDrawerToggle, profile, disabled, backToHome, isMainNet } = props
  return (
    <Box
      display='flex'
      flexDirection='row'
      alignItems='center'
      justifyContent='space-between'
      width='100%'
    >
      <Box ml={-1}>
        <ChainsfrLogo
          onClick={() => {
            backToHome()
          }}
          disabled={disabled}
          isMainNet={isMainNet}
        />
      </Box>
      <Box display='flex' align='items'>
        <ProfileButton profile={profile} disabled />
        <Box ml={1} mt={1} borderLeft='0.5px solid #A8A8A8' pr={1} height='24px' />
        <IconButton
          color='secondary'
          aria-label='Open drawer'
          edge='start'
          onClick={handleDrawerToggle}
        >
          <MenuIcon />
        </IconButton>
      </Box>
    </Box>
  )
}

const AppBarStyle = makeStyles({
  appBar: {
    backgroundColor: '#ffffff',
    boxShadow: `0px 2px 2px  rgba(51, 51, 51, 0.1)`
  }
})

const AppBarComponent = (props: Props) => {
  const classes = AppBarStyle()
  const { isolate } = props
  return (
    <AppBar position='static' color='primary' className={classes.appBar}>
      <Toolbar className={classes.toolbar} variant='dense'>
        {isolate ? <IsolateAppBarContent {...props} /> : <NormalAppBarContent {...props} />}
      </Toolbar>
    </AppBar>
  )
}

export default AppBarComponent
export { ProfileButton }
