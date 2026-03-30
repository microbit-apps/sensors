jacdac.firmwareVersion = jacdac.VERSION
console.log(`starting servers...`)
servers.start({
    // accelerometer: true,
    lightLevel: true,
    // temperature: true,
})

// now, we want to register a client for the light level service
// and create a dashboard widget for it

const jdLightLevelClient = new jacdac.SimpleSensorClient(sensors.JacdacSensorSrvs.LightLevel, "ll1", );


const lightLevelSensor = sensors.wrapJacdacSensor(jdLightLevelClient)




