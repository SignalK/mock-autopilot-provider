/*********************************
  Autopilot communication methods.
  ********************************
  This is where communication with the autopilot device
  is managed.
  Update the sections below as required to for the autopilot
  device in use.
  **********************************************************/

/***********************************************************
 * autopilot type identifier - set a value that is unique.
 * The value must be valid for use in URI path  as it is 
 * used to target commands to a specific device.
 * 
 * e.g.  * AP_TYPE= 'mypilot'
 * 
 * usage "./autopilots/mypilot/*"
 ************************************************************/
const AP_TYPE = 'mockPilotSK'


/** Available autopilot device options.
 * These are returned to the API.
 * See API documentation.
*/
const AP_OPTIONS = {
  states: [
    {name: 'on', engaged: true},
    {name: 'off', engaged: false}
  ],
  modes: ['compass','wind','route', 'gps']
}

/***********************************************************
 * Define the states to use for engage / disengage commands
 ***********************************************************/
const defaultState = {
  engaged: 'on',
  disengaged: 'off'
}

// device status
const apStatus = {         
  state: null,
  mode: null,
  engaged: false,
  target: null
}

module.exports = function(app) {

  let pilot = {type: AP_TYPE }
  let preDodgeMode

  pilot.start = () => {
    app.debug(`**** Intialising autopilot device (${pilot.type}) *****`)
    // connect to autopilot
    try {
      // connect to autopilot and update apStatus
      apStatus.state= defaultState.disengaged
      apStatus.mode = 'compass'
    } catch (err) {
      app.debug(`**** ERROR connecting to autopilot device (${pilot.type}) *****`)
      app.debug(err)
      setState('off-line')
    } finally {
      sendUpdateToSignalK()
      raiseAlarm()
    }
  }

  pilot.stop = () => {
    app.debug('**** stopping mock autopilot *****')
    // clean up here
  }

  pilot.status = () => { 
    return  {options: {...AP_OPTIONS}, ...apStatus}
  }

  setState = (value) => {
    if (apStatus.target === null) {
      apStatus.target = 0
    }
    apStatus.state = value
    apStatus.engaged = defaultState.engaged === value ? true : false
  }

  pilot.setState = (value) => {
    // Check for valid state value
    if ( AP_OPTIONS.states.filter( i => i.name === value).length === 0 ) {
      throw new Error(`Invalid state: ${value}`)
    } else {
      setState(value)
      sendUpdateToSignalK()
      return
    }
  }

  pilot.engage = () => {
    // Determine the state to set when engage is requested
    setState(defaultState.engaged)
    sendUpdateToSignalK()
    return
  }

  pilot.disengage = () => {
    // Determine the state to set when dis-engage is requested
    setState(defaultState.disengaged)
    sendUpdateToSignalK()
    return
  }

  pilot.setMode = (value) => {
    // Check for valid mode value
    if ( !AP_OPTIONS.modes.includes(value)) {
      throw new Error(`Invalid mode: ${value}`)
    } else {
      apStatus.mode = value
      sendUpdateToSignalK()
      return
    }
  }

  /**********************************************
   * Update function for target autopilot device 
  ***********************************************/
  pilot.setTarget = (value) => {
    // validate value against current mode, throw if invalid.
    if (value < 0 && apStatus.mode !== 'wind') {
      const errMsg = `I** ERROR: nvalid value ${value} for current mode ${apStatus.mode}`
        console.log(errMsg)
      throw new Error(errMsg)
    }
    apStatus.target = value
    sendUpdateToSignalK()
    return
  }

  /**********************
   * Adjust target value
  ***********************/
  pilot.adjustTarget = (value)  => {
    // validate resultant target value against current mode, throw if invalid.
    const v = apStatus.target + value
    const errMsg = `** ERROR: Value ${v} out of bounds for current mode ${apStatus.mode}`
    if (apStatus.mode === 'wind') {
      if (v > Math.PI || v < (0 - Math.PI)) {
        console.log(errMsg)
        throw new Error(errMsg)
      }
    } else {
      if (v > (2 * Math.PI) || v < 0) {
        console.log(errMsg)
        throw new Error(errMsg)
      }
    }
    apStatus.target = v
    sendUpdateToSignalK()
    return
  }

  /**********************
   * Dodge mode operation
  ***********************/
  pilot.dodge = (value)  => {
    // determine operation.
    if (typeof value === 'number') {
       if (apStatus.mode !== 'dodge') {
            preDodgeMode = apStatus.mode
            app.debug(`** Enter Dodge Mode (${value}) <-`, preDodgeMode)
            apStatus.mode = 'dodge'
      }
    } else {
      app.debug('** Exit Dodge Mode ->', preDodgeMode)
      apStatus.mode = preDodgeMode || apStatus.mode
      preDodgeMode = null
    }
    sendUpdateToSignalK()
    return
  }

  /*****************************
   * Autopilot provider settings
  ******************************/
  pilot.properties = () => {
    return {
      properties: {}
    }
  }

  /***************************************
   * Send update from Autopilot to SKserver
  ****************************************/
  const sendUpdateToSignalK = () => {
    // pilot.state should be set to 'off-line' if device is unavailable
    app.autopilotUpdate(pilot.type, {
        target: typeof apStatus.target === 'number' ? apStatus.target : null,
        mode: apStatus.mode,
        state: apStatus.state,
        engaged: apStatus.engaged
    })
  }

  // Raise alarm message
  const raiseAlarm = () => {
    setTimeout(
      () => {
        const alarm = {
          alarm: {
            path: 'waypointArrival',
            value: {
              state: 'alert',
              method: ['visual'],
              message: 'Soon to be here....'
            }
          }
        }
        app.autopilotUpdate(pilot.type, alarm)
      }, Math.random() * 20000
    )
  }


  /**********************************************
  * Normalise incoming alarm name from Autopilot
  ***********************************************/
  const normaliseAlarm = (alarmId) => {
    /** AP device alarm text mapped to Autopilot API alarm ids */
    AP_ALARMS = {
        'WP Arrival': 'waypointArrival',
        'Pilot Way Point Advance': 'waypointAdvance',
        'Pilot Route Complete': 'routeComplete',
        'XTE Alarm': 'xte',
        'Heading Drift Alarm': 'heading',
        'Wind Alarm': 'wind'
    }
    return !(alarmId in AP_ALARMS) ? 'unknown' : AP_ALARMS[alarmId]
  }

  return pilot

}



