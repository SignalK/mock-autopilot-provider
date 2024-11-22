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
  engaged: null,
  target: null
}

module.exports = function(app) {

  let pilot = {type: AP_TYPE }

  pilot.start = () => {
    app.debug(`**** Intialising autopilot device (${pilot.type}) *****`)
  }

  pilot.stop = () => {
    app.debug('**** stopping mock autopilot *****')
  }

  pilot.status = () => { 
    return  {...AP_OPTIONS, ...apStatus}
  }

  pilot.setState = (value) => {
    if ( AP_OPTIONS.states.filter( i => i.name === value).length === 0 ) {
      throw new Error(`Invalid state: ${value}!`)
    } else {
      apStatus.state = value
      apStatus.engaged = defaultState.engaged === value ? true : false
      return apStatus.engaged
    }
  }

  pilot.engage = () => {
    apStatus.state = defaultState.engaged
    apStatus.engaged = true
    return
  }

  pilot.disengage = () => {
    apStatus.state = defaultState.disengaged
    apStatus.engaged = false
    return
  }

  pilot.setMode = (value) => {
    if ( !AP_OPTIONS.modes.includes(value)) {
      throw new Error(`Invalid mode: ${value}!`)
    } else {
      apStatus.mode = value
      return
    }
  }

  /**********************************************
   * Update function for target autopilot device 
  ***********************************************/
  pilot.setTarget = (value) => {

    apStatus.target = value
    return
  }

  /**********************
   * Adjust target value
  ***********************/
  pilot.adjustTarget = (value)  => {
    apStatus.target = apStatus.target + value
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

  /**************************************
   * Incoming data from Autopilot handler
  ***************************************/
  const sendUpdateToSignalK = (attrib, value) => {
    app.autopilotUpdate(pilot.type, attrib, value)
  }

  /***************************************
   * Incoming alarm from Autopilot handler
  ****************************************/
  const sendAlarmToSignalK = (alarmName, value) => {
    app.autopilotAlarm(pilot.type, normaliseAlarmId(alarmName), value)
  }


/**********************************************
 * Normalise incoming alarm name from Autopilot
***********************************************/
  const normaliseAlarmId = (alarmId) => {
    /** Alarm text to map to Autopilot API alarm notifications */
    AP_ALARMS = ['WP Arrival','Pilot Way Point Advance','Pilot Route Complete']

    if (!AP_ALARMS.includes(alarmId)) {
      return ''
    }
    switch (id) {
      case 'WP Arrival':
        return 'waypointArrival'
      case 'Pilot Way Point Advance':
        return 'waypointAdvance'
      case 'Pilot Route Complete':
        return 'routeComplete'
      default:
        return ''
    }
  }

  return pilot

}



