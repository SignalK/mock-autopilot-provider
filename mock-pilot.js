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
    }
  }

  pilot.stop = () => {
    app.debug('**** stopping mock autopilot *****')
    // clean up here
  }

  pilot.status = () => { 
    return  {...AP_OPTIONS, ...apStatus}
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
      // return boolean indicating whether the entered state is actively steering the vessel.
      return apStatus.engaged
    }
  }

  pilot.engage = () => {
    // Determine the state to set when engage is requested
    setState(defaultState.engaged)
    return
  }

  pilot.disengage = () => {
    // Determine the state to set when dis-engage is requested
    setState(defaultState.disengaged)
    return
  }

  pilot.setMode = (value) => {
    // Check for valid mode value
    if ( !AP_OPTIONS.modes.includes(value)) {
      throw new Error(`Invalid mode: ${value}`)
    } else {
      apStatus.mode = value
      return
    }
  }

  /**********************************************
   * Update function for target autopilot device 
  ***********************************************/
  pilot.setTarget = (value) => {
    // validate value against current mode, throw if invalid.
    if (value < 0 && pilot.mode !== 'wind') {
      throw new Error(`Invalid value ${value} for current mode ${apStatus.mode}`)
    }
    apStatus.target = value
    return
  }

  /**********************
   * Adjust target value
  ***********************/
  pilot.adjustTarget = (value)  => {
    // validate resultant target value against current mode, throw if invalid.
    const v = apStatus.target + value
    if (apStatus.mode === 'wind') {
      if (v > 180 || v < -180) {
        throw new Error(`Invalid value ${value} for current mode ${apStatus.mode}`)
      }
    } else {
      if (v > 360 || v < 0) {
        throw new Error(`Invalid value ${value} for current mode ${apStatus.mode}`)
      }
    }
    apStatus.target = v
    return
  }

  /**********************
   * Dodge mode operation
  ***********************/
  pilot.dodge = (value)  => {
    // determine operation.
    if (typeof value === 'number') {
      app.debug(`** Enter Dodge Mode (${value}) **`)
      preDodgeMode = apStatus.mode
      apStatus.mode = 'dodge'
    } else {
      app.debug('** Exit Dodge Mode **')
      apStatus.mode = preDodgeMode
    }
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
  const sendUpdateToSignalK = (attrib, value) => {
    // pilot.state should be set to 'off-line' if device is unavailable
    app.autopilotUpdate(pilot.type, attrib, value)
  }

  /***************************************
   * Send alarm from Autopilot to SKserver
  ****************************************/
  const sendAlarmToSignalK = (alarmName, value) => {
    app.autopilotAlarm(pilot.type, normaliseAlarm(alarmName), value)
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



