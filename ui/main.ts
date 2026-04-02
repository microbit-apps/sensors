jacdac.start()

// TODO:
// efficiency
// - make it so that the widget updates on sensor change, not just on a loop
// - make it so that the widget only updates the text, not the whole thing
// - need a way for user to dismiss the widget, maybe a button on the widget itself?
// - need to handle user inputs (buttons, etc), user outputs, and actuators (motors, etc) in general, not just sensors
// - what happens when devices disconnect? optional dialog for this? 
// - storing the RoleInfo in settings

input.lightLevel()
input.temperature()

// wait until the client is bound then create the widget
input.onButtonPressed(Button.A, () => {
    console.log(`starting servers...`)
    servers.start({
        touchP0: true,
        touchP1: true,
        touchP2: true,
        soundLevel: true,
        lightLevel: true,
        temperature: true,
        forceSimulators: true
    })
})


namespace microgui {
import Button = user_interface_base.Button

control.singleSimulator();
const app = new App();

function convertToPercent(sensor: sensors.Sensor) {
    if (sensor.unitName === "percent") {
        return Math.roundWithPrecision(sensor.reading*100, 2)+" %"
    }
    return `${Math.roundWithPrecision(sensor.reading,3)} ${sensor.unitName}`
}

function getTextComponent(role: string, sensor: sensors.Sensor) {
    const simpleTextComponent = new TextBox({
        alignment: GUIComponentAlignment.CENTRE,
        isActive: false,
        title: sensor.name,
        text: [
                convertToPercent(sensor),
                `min: ${sensor.minimum.toString()}`, 
                `max: ${sensor.maximum.toString()}`,
                `role: ${role}`
            ], // optional arg
        colour: 6, // optional arg
        xScaling: 1.7, // optional arg
    })
    return simpleTextComponent
}

let sensorsToProcess: string[] = []
let devicesServiceFound: string[] = []

type RoleInfo = {
    rName: string,
    deviceId: string,
    serviceIndex: number
}

type ServiceToRoleInfo = {
    [serviceClass: number]: RoleInfo[]
}

type ServiceToCount = {
    [serviceClass: number]: number
}

const serviceToRoleInfo: ServiceToRoleInfo = {}
const serviceToCount: ServiceToCount = {}
const roleToSensor: { [rName: string]: sensors.Sensor } = {}

function getRoleInfoForService(serviceClass: number, deviceId: string, serviceIndex: number) : RoleInfo | undefined{
    try {
        const sensorData = sensors.getSimpleSensorMetaData(serviceClass)
        if (!serviceToRoleInfo[serviceClass]) {
            serviceToRoleInfo[serviceClass] = []
            serviceToCount[serviceClass] = 0
        }
        const rName = `${sensorData.rName}${serviceToCount[serviceClass]}`
        const roleInfo = {
            rName,
            deviceId,
            serviceIndex
        }
        serviceToRoleInfo[serviceClass].push(roleInfo)
        serviceToCount[serviceClass]++
        return roleInfo
    } catch (e) {
        return undefined
    }

}

jacdac.bus.on(jacdac.DEVICE_ANNOUNCE, (dev: jacdac.Device) => {
    console.log(`device connected: ${dev.deviceId} with ${dev.serviceClassLength} services  `)
    for (let i = 1; i < dev.serviceClassLength; i++) {
        const serviceClass = dev.serviceClassAt(i)
        const devService = `${dev.deviceId}:${serviceClass}:${i}`
        if (devicesServiceFound.find(d => d === devService)) {
            continue
        }
        devicesServiceFound.push(devService)
        const roleInfo = getRoleInfoForService(serviceClass, dev.deviceId, i)
        if (!roleInfo) {
            console.log(`service class ${serviceClass} not recognized as a sensor, skipping`)
            continue
        }
        const sensor = sensors.getJacdacSensor(serviceClass, roleInfo.rName)
        roleToSensor[roleInfo.rName] = sensor
        sensorsToProcess.push(roleInfo.rName)
    }
})

let currentRole: string | undefined= undefined
let gcs : GUIComponentScene | undefined = undefined

context.onEvent(ControllerButtonEvent.Pressed, controller.B.id,
    () => { 
        if (gcs) {
            app.popScene()
            gcs = undefined
            currentRole = undefined
        }
    }
)


basic.forever(() => {
    if (sensorsToProcess.length > 0 && !gcs) {
        console.log(`processing sensor ${sensorsToProcess[0]}...`)
        currentRole = sensorsToProcess.pop()
    } 
    if (currentRole) {
        const textComponent = getTextComponent(currentRole, roleToSensor[currentRole])
        app.popScene()
        gcs = new GUIComponentScene({ app, 
            components: [textComponent] })
        gcs.showAllComponents()
        app.pushScene(gcs)
    }
})

}
