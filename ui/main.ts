jacdac.start()

const lightLevelData = sensors.getSimpleSensorMetaData(sensors.JacdacSensorSrvs.LightLevel);
const jdLightLevelClient = new jacdac.SimpleSensorClient(sensors.JacdacSensorSrvs.LightLevel, "ll1", lightLevelData.stateFormat);
const lightLevelSensor = sensors.wrapJacdacSensor(jdLightLevelClient)

input.lightLevel()

// wait until the client is bound then create the widget
input.onButtonPressed(Button.A, () => {
    console.log(`starting servers...`)
    servers.start({
        // accelerometer: true,
        lightLevel: true,
        // temperature: true,
        forceSimulators: true
    })
})

namespace microgui {

control.singleSimulator();
const app = new App();

function getTextComponent() {
    const simpleTextComponent = new TextBox({
        alignment: GUIComponentAlignment.CENTRE,
        isActive: false,
        title: lightLevelSensor.name,
        text: [`min: ${lightLevelSensor.minimum.toString()}`, 
                `max: ${lightLevelSensor.maximum.toString()}`,
                `val: ${Math.roundWithPrecision(lightLevelSensor.reading,3).toString()}`], // optional arg
        colour: 6, // optional arg
        xScaling: 1.7, // optional arg
    })
    return simpleTextComponent
}

let gcs: GUIComponentScene = undefined

jdLightLevelClient.onStateChanged(() => {
    if (jdLightLevelClient.isConnected()) {
        if (!gcs) {
            console.log("JD Light Level client connected, creating widget")
            gcs = new GUIComponentScene({ app, components: [getTextComponent()] })
            app.popScene()
            app.pushScene(gcs)
        }
    }
})

basic.forever(() => {
    if (gcs) {
        gcs = new GUIComponentScene({ app, components: [getTextComponent()] })
        app.popScene()
        app.pushScene(gcs)
    }
})

}

