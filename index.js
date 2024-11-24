'use strict'
const apModule = require('./mock-pilot')

module.exports = function(app) {

  const autopilot = apModule(app)
  
  const plugin = {
    id: "mock-autopilot-provider",
    name: "Mock Autopilot Provider",
    description: "Mock Signal K Autopilot plugin."
  }

  plugin.start = (props) => {
    autopilot.start(props)
    registerProvider()
  }

  plugin.stop = () => {
    autopilot.stop()
  }

  plugin.schema = autopilot.properties


  // Autopilot API - register with Autopilot API
  const registerProvider = ()=> {
    app.debug(`**** Registering Provider (${plugin.id}) *****`)
    try {
      app.registerAutopilotProvider(
        {
          getData: async (deviceId) => {
            return autopilot.status()
          },

          getState: async (deviceId) => {
            return autopilot.status().state
          },
          setState: async (
            state,
            deviceId
          ) => {
            return autopilot.setState(state)
          },

          getMode: async (deviceId) => {
            return autopilot.status().mode
          },
          setMode: async (mode, deviceId) => {
            return autopilot.setMode(mode)
          },

          getTarget: async (deviceId) => {
            return autopilot.status().target
          },
          setTarget: async (value, deviceId) => {
            return autopilot.setTarget(value)
          },
          adjustTarget: async (
            value,
            deviceId
          ) => {
            return autopilot.adjustTarget(value)
          },
          engage: async (deviceId) => {
            return autopilot.engage()
          },
          disengage: async (deviceId) => {
            return autopilot.disengage()
          },
          tack: async (
            direction,
            deviceId
          ) => {
            throw new Error('Not implemented!')
          },
          gybe: async (
            direction,
            deviceId
          ) => {
            throw new Error('Not implemented!')
          },
          dodge: async (
            value,
            deviceId
          ) => {
            return autopilot.dodge(value)
          }
        },
        [autopilot.type]
      )
    } catch (error) {
      app.debug(error)
    }
  }

  return plugin;
}
