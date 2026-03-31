jacdac.start()

// TODO:
// 1. make generic so that any sensor can be used, not just light level
// 2. make it so that the widget updates on sensor change, not just on a loop
// 3. make it so that the widget only updates the text, not the whole thing
// 4. handle multiple sensors being added at same time
// 5. need a way for user to dismiss the widget, maybe a button on the widget itself?
// 6. need to handle user inputs (buttons, etc), user outputs, and actuators (motors, etc) in general, not just sensors

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

function getTextComponent(sensor: sensors.Sensor) {
    const simpleTextComponent = new TextBox({
        alignment: GUIComponentAlignment.CENTRE,
        isActive: false,
        title: sensor.name,
        text: [`min: ${sensor.minimum.toString()}`, 
                `max: ${sensor.maximum.toString()}`,
                `val: ${Math.roundWithPrecision(sensor.reading,3).toString()} ${sensor.unitName}`], // optional arg
        colour: 6, // optional arg
        xScaling: 1.7, // optional arg
    })
    return simpleTextComponent
}

let sensorRoleCount = 0
let sensorsToProcess: sensors.Sensor[] = []
let devicesServiceFound: string[] = []

jacdac.bus.on(jacdac.DEVICE_ANNOUNCE, (dev: jacdac.Device) => {
    console.log(`device connected: ${dev.deviceId} with ${dev.serviceClassLength} services  `)
    for (let i = 1; i < dev.serviceClassLength; i++) {
        const serviceClass = dev.serviceClassAt(i) // skip service class 0 which is usually the control service
        // print it as hex to make it easier to read
        const devService = `${dev.deviceId}:${serviceClass}`
        if (devicesServiceFound.find(d => d === devService)) {
            continue
        }
        devicesServiceFound.push(devService)
        try {
            const sensor = sensors.getJacdacSensor(serviceClass, `sensor${sensorRoleCount}`)
            sensorsToProcess.push(sensor)
            sensorRoleCount++
        } catch (e) {
            console.log(`error creating widget for device ${dev.deviceId}: ${e}`)
        }
    }
})

let currentSensor: sensors.Sensor = undefined
let gcs : GUIComponentScene = undefined

basic.forever(() => {
    if (sensorsToProcess.length > 0 && !gcs) {
        console.log(`processing sensor ${sensorsToProcess[0].name}...`)
        currentSensor = sensorsToProcess.pop()
    } 
    if (currentSensor) {
        const textComponent = getTextComponent(currentSensor)
        app.popScene()
        gcs = new GUIComponentScene({ app, components: [textComponent] })
        app.pushScene(gcs)
    }
})

}
