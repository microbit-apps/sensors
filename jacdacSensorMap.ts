namespace sensors {
  /**
  * A type used solely by the __jacdacSensorMap.
  * This is metadata for all SimpleSensorClient Jacdac sensors.
  * This is looked up by a SimpleSensorClient.serviceClass:
  *     The metadata therein can be uesd to make a Sensor(), see wrapJacdacSensor()
  */
  type SimpleSensorsMap = {
    /** This service class key is in decimal, since that's what jacdac.SimpleSensorClient.serviceClass returns */
    [serviceClass: number]: {
      /** A unique name starting with 'Jacdac', e.g: JacdacButton not the same as the client specific name 'button1'. */
      name: string,
      /** A unique shortened name starting with 'JD', e.g: JDB. This is useful is you want to transmit over radio. */
      rName: string,
      /** The minimum value that this specific sensor can return, may be negative. Some are unbounded. */
      min: number,
      /** The minimum value that this specific sensor can return, may be negative. Some are unbounded. */
      max: number,
      /** All return a 'number' type at the moment. Might be useful in the future for more diverse return types. */
      typeOfReadingRegister: string,
      /** Always a non-null 2-tuple, like ["Degrees", "°"]. Some have ["", ""] */
      units: string[],
      /** Seldomly implemented, this is set to '0' where there's no information. */
      error: number
    }
  }


  /**
   * Creates a Sensor object from a jacdac.SimpleSensorClient.
   * Will throw an error if the serviceClass is not supported.
   *
   * @param jdClient is a SimpleSensorClient, its .serviceClass is used to look up metadata about the sensor.
   * @returns A Sensor object that can be used like any other sensor in this library.
   */
  //% group="Sensors"
  //% blockId=sensors_wrap_jacdac_sensor
  //% block="Wrap a jacdac sensor |JDClient $jdClient"
  //% weight=97
  export function wrapJacdacSensor(jdClient: jacdac.SimpleSensorClient): Sensor {
    if (!jdClient) {
      throw "Please provide a Jacdac SimpleSensorClient object to wrap."
    }

    const s = __jacdacSensorMap[jdClient.serviceClass];
    if (!s) {
      throw "Error: Invalid serviceClass: that Jacdac Client is not supported. Please use a SimpleSensorClient."
    }

    return new Sensor({
      name: s.name,
      rName: s.rName,
      sensorFn: () => jdClient.reading(),
      min: s.min,
      max: s.max,
      isJacdacSensor: true,
      setupFn: () => { jdClient.start() }
    });
  }

  // No ReflectedLightClient, nor Wifi simulator
  const __jacdacSensorMap: SimpleSensorsMap = {
    513243333: { // 0x1e9778c5
      name: "JacdacWaterAcidity",
      rName: "JDA",
      min: 2.5,
      max: 10,
      typeOfReadingRegister: "number",
      units: ["pH", "pH"],
      error: 0.1
    },
    504462570: { // 0x1e117cea
      name: "JacdacAirPressure",
      rName: "JDAP",
      min: 150,
      max: 4000,
      typeOfReadingRegister: "number",
      units: ["hectopascals", "hPa"],
      error: 1.5
    },
    343122531: { // 0x1473a263
      name: "JacdacButton",
      rName: "JDB",
      min: 0,
      max: 100,
      typeOfReadingRegister: "number",
      units: ["", ""],
      error: 0 // Bouncing, etc not accounted for.
    },
    364362175: { // 0x15b7b9bf
      name: "JacdacCompass",
      rName: "JDC",
      min: 0,
      max: 360,
      typeOfReadingRegister: "number",
      units: ["Degrees", "°"],
      error: 1 // Heading error
    },
    420661422: { // 0x1912c8ae
      name: "JacdacDcCurrent",
      rName: "JDCC",
      min: 0,
      max: 360,
      typeOfReadingRegister: "number",
      units: ["Amps", "A"], // Simulator uses a scale from 0 to 1000mA though.
      error: 0 // This returns ? on the simulator. It's also dependent on the reading I believe.
    },
    372485145: { // 0x1633ac19
      name: "JacdacDcVoltage",
      rName: "JDCV",
      min: 0,
      max: 360,
      typeOfReadingRegister: "number",
      units: ["Volts", "V"],
      error: 0 // This returns ? on the simulator. It's also dependent on the reading I believe.
    },
    337275786: { // 0x141a6b8a
      name: "JacdacDistance",
      rName: "JDD",
      min: 0.02,
      max: 4,
      typeOfReadingRegister: "number",
      units: ["Meters", "m"],
      error: 0 // This returns ? on the simulator.
    },
    379362758: { // 0x169c9dc6
      name: "JacdacECO2",
      rName: "JDEC02",
      min: 400,
      max: 8192,
      typeOfReadingRegister: "number",
      units: ["parts-per-million", "ppm"],
      error: 0 // This returns ? on the simulator.
    },
    522154615: { // 0x1f1f7277
      name: "JacdacElectricalConductivity",
      rName: "JDEC",
      min: 0,
      max: 9990, // The simulator actually goes beyond this, probably due to +-error
      typeOfReadingRegister: "number",
      units: ["Microsiemens per centimeter", "uS/cm"],
      error: 10
    },
    524797638: { // 0x1f47c6c6
      name: "JacdacFlex",
      rName: "JDF",
      min: -100,
      max: 100,
      typeOfReadingRegister: "number",
      units: ["percent", "%"],
      error: 0 // None stated
    },
    376204740: { // 0x166c6dc4
      name: "JacdacHeartRate",
      rName: "JDHR",
      min: 30,
      max: 200,
      typeOfReadingRegister: "number",
      units: ["beats per minute", "bpm"],
      error: 0 // None stated
    },
    382210232: { // 0x16c810b8
      name: "JacdacHumidity",
      rName: "JDH",
      min: 10,
      max: 99,
      typeOfReadingRegister: "number",
      units: ["relative humidity", "%RH"],
      error: 0.1
    },
    510577394: { // 0x1e6ecaf2
      name: "JacdacIlluminance",
      rName: "JDI",
      min: 1,
      max: 100000,
      typeOfReadingRegister: "number",
      units: ["lux", "lx"],
      error: 0 // None stated
    },
    400333340: { // 0x17dc9a1c
      name: "JacdacLightLevel",
      rName: "JDLL",
      min: 0,
      max: 100,
      typeOfReadingRegister: "number",
      units: ["percent", "%"],
      error: 0 // None stated
    },
    318642191: { // 0x12fe180f
      name: "JacdacMagneticField",
      rName: "JDMF",
      min: -100,
      max: 100,
      typeOfReadingRegister: "number",
      units: ["percent", "%"],
      error: 0 // None stated
    },
    522667846: { // 0x1f274746
      name: "JacdacPotentiometer",
      rName: "JDP",
      min: 0,
      max: 100,
      typeOfReadingRegister: "number",
      units: ["percent", "%"],
      error: 0 // None stated
    },
    280710838: { // 0x10bb4eb6
      name: "JacdacPulseOximeter",
      rName: "JDPO",
      min: 80,
      max: 100,
      typeOfReadingRegister: "number",
      units: ["percent", "%"],
      error: 0 // None stated
    },
    326323349: { // 0x13734c95
      name: "JacdacRainGauge",
      rName: "JDRG",
      min: 0,
      max: 100, // This doesn't have a maximum.
      typeOfReadingRegister: "number",
      units: ["millimeters", "mm"],
      error: 0 // None stated
    },
    284830153: { // 0x10fa29c9
      name: "JacdacRotaryEncoder",
      rName: "JDRE",
      min: -1000,// This doesn't have a minimum.
      max: 1000, // This doesn't have a maximum.
      typeOfReadingRegister: "number",
      units: ["", ""],
      error: 0 // None stated
    },
    435741329: { // 0x19f8e291
      name: "JacdacRotationsPerMinute",
      rName: "JDRPM",
      min: 0,
      max: 5000,
      typeOfReadingRegister: "number",
      units: ["rotations per minute", "rpm"],
      error: 0 // None stated
    },
    318542083: { // 0x12fc9103
      name: "JacdacServo",
      rName: "JDSR",
      min: 0,
      max: 180,
      typeOfReadingRegister: "number",
      units: ["Degrees", "°"],
      error: 0 // None stated
    },
    491430835: { // 0x1d4aa3b3
      name: "JacdacSoilMoisture",
      rName: "JDSM",
      min: 0,
      max: 100,
      typeOfReadingRegister: "number",
      units: ["percent", "%"],
      error: 5
    },
    346888797: { // 0x14ad1a5d
      name: "JacdacSoundLevel",
      rName: "JDSL",
      min: 0,
      max: 100,
      typeOfReadingRegister: "number",
      units: ["percent", "%"],
      error: 0 // None stated
    },
    337754823: { // 0x1421bac7
      name: "JacdacTemperature",
      rName: "JDT",
      min: -40,
      max: 120,
      typeOfReadingRegister: "number",
      units: ["Degrees celcius", "°C"],
      error: 0.25
    },
    312849815: { // 0x12a5b597
      name: "JacdactVOC",
      rName: "JDV0C",
      min: 0, // This is ?
      max: 1187, // This is ?
      typeOfReadingRegister: "number",
      units: ["parts per billion", "ppb"],
      error: 0 // This is ?
    },
    527306128: { // 0x1f6e0d90
      name: "JacdacUvIndex",
      rName: "JDUV",
      min: 0,
      max: 11,
      typeOfReadingRegister: "number",
      units: ["Ultraviolet index", "uv"],
      error: 0 // This is ?
    },
    343630573: { // 0x147b62ed
      name: "JacdacWaterLevel",
      rName: "JDWL",
      min: 0,
      max: 100,
      typeOfReadingRegister: "number",
      units: ["percent", "%"],
      error: 0 // This is ?
    },
    0x1f4d5040: { // 0x1f4d5040
      name: "JacdacWeightScale", // This is weight scale (body) to be specific
      rName: "JDWS",
      min: 0,
      max: 180,
      typeOfReadingRegister: "number",
      units: ["kilograms", "kg"],
      error: 0 // This is ?
    },
    409725227: { // 0x186be92b
      name: "JacdacWindDirection",
      rName: "JDWD",
      min: 0,
      max: 360,
      typeOfReadingRegister: "number",
      units: ["Degrees", "°"],
      error: 5
    },
    458824639: { // 0x1b591bbf
      name: "JacdacWindSpeed",
      rName: "JDWS",
      min: 0,
      max: 80,
      typeOfReadingRegister: "number",
      units: ["meters per second", "m/s"],
      error: 2
    },
  }
}
