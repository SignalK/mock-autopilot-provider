# Mock Autopilot Provider Plugin for Signal K

### About

Signal K server plugin that provides a mock Autopilot Provider for use with the `Autopilot API`.

It can be used as the basis for creating your own provider for autopilot device(s).

This repository should be used in conjunction with Signal K Autopilot API documentation.

---

### Usage

- Clone this repository
- Change the package `name` and `description`
- Change the plugin `id` and `name` _(index.js)_
- Set `AP_TYPE` to reflect the autopilot type identifier _(mock-pilot.js)_
- Set `AP_OPTIONS` to the relevant values for the target device type _(mock-pilot.js)_
- Map `defaultState` key values to the relevant state in `AP_OPTIONS` _(mock-pilot.js)_

For information on plugin development see [Getting started with Plugin development](https://demo.signalk.org/documentation/develop/plugins/server_plugin.html#getting-started-with-plugin-development).


---

### Related Links
- [#1596 AutoPilot API](https://github.com/SignalK/signalk-server/pull/1596)

- [Signal K Documentation](https://demo.signalk.org/documentation)
