# Prana Archaius Client

## About
Client for getting property values from the exposed Archaius API in Prana.
 
## Getting started

```js
var pranaArchaius = require('prana-archaius-client');

var options = {
    host: getenv('PRANA_HOST', 'localhost'),
    port: getenv('PRANA_PORT', 8078)
};

var propKeys =
{
    //  Property key in Archaius : [config key used in the object returned, default config value if a value isn't returned by Archaius]
    archaiusEnvProp: ['environment', 'development'],
};

var archaiusClient = pranaArchaius.archaius(options);
var config = archaiusClient.syncRequest(props);
Object.keys(config).forEach(function(key) {
    process.env[key] = config[key];
});
```