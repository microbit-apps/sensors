jacdac.firmwareVersion = jacdac.VERSION
console.log(`starting servers...`)
servers.start({
    // accelerometer: true,
    lightLevel: true,
    // temperature: true,
})

// now, we want to register a client for the light level service
// and create a dashboard widget for it

const lightLevelData = sensors.getSimpleSensorMetaData(sensors.JacdacSensorSrvs.LightLevel);
const jdLightLevelClient = new jacdac.SimpleSensorClient(sensors.JacdacSensorSrvs.LightLevel, "ll1", lightLevelData.stateFormat);
const lightLevelSensor = sensors.wrapJacdacSensor(jdLightLevelClient)


// wait until the client is bound then create the widget
jdLightLevelClient.onStateChanged(() => {
    if (jdLightLevelClient.isConnected()) {
        console.log("JD Light Level client connected, creating widget")
        // microgui.createWidgetForSensor(lightLevelSensor, "light level")
    }
})

namespace microgui {
     control.singleSimulator();
const app = new App();
const simpleTextComponent = new TextBox({
      alignment: GUIComponentAlignment.BOT,
      isActive: false,
      title: lightLevelSensor.name,
      text: [`min: ${lightLevelSensor.minimum.toString()}`, 
              `max: ${lightLevelSensor.maximum.toString()}`,
               `val: ${lightLevelSensor.reading.toString()}`], // optional arg
      colour: 6, // optional arg
      xScaling: 1.7, // optional arg
  })

  const gcs = new GUIComponentScene({ app, components: [simpleTextComponent] })
  app.popScene()
  app.pushScene(gcs)

}

