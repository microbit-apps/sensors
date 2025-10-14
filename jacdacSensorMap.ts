namespace sensors {
  /**
  * A type used solely by the __jacdacSensorMap.
  * This is metadata for all SimpleSensorClient Jacdac sensors.
  * This is looked up by a SimpleSensorClient.serviceClass:
  *     The metadata therein can be used to make a Sensor(), see getJacdacSensor() and wrapJacdacSensor()
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
      error: number,
      /** What is the datatype of .reading()? e.g: "u0.8". 
      * We can pass this to SimpleSensorClient with the serviceClass 
      * and a roleName of the users choosing to construct a simple sensor.
      */
      stateFormat: string
    }
  }


  /**
  * Supported Jacdac Simple Sensors.
  * Maps a Jacdac sensor name to its service class in decimal.
  */
  export enum JacdacSensorSrvs {
    /** 0x1e9778c5 */
    WaterAcidity = 0x1e9778c5,
    /** 0x1e117cea */
    AirPressure = 0x1e117cea,
    /** 0x1473a263 */
    Button = 0x1473a263,
    /** 0x15b7b9bf */
    Compass = 0x15b7b9bf,
    /** 0x1912c8ae */
    DcCurrent = 0x1912c8ae,
    /** 0x1633ac19 */
    DcVoltage = 0x1633ac19,
    /** 0x141a6b8a */
    Distance = 0x141a6b8a,
    /** 0x169c9dc6 */
    ECO2 = 0x169c9dc6,
    /** 0x1f1f7277 */
    ElectricalConductivity = 0x1f1f7277,
    /** 0x1f47c6c6 */
    Flex = 0x1f47c6c6,
    /** 0x166c6dc4 */
    HeartRate = 0x166c6dc4,
    /** 0x16c810b8 */
    Humidity = 0x16c810b8,
    /** 0x1e6ecaf2 */
    Illuminance = 0x1e6ecaf2,
    /** 0x17dc9a1c */
    LightLevel = 0x17dc9a1c,
    /** 0x12fe180f */
    MagneticField = 0x12fe180f,
    /** 0x1f274746 */
    Potentiometer = 0x1f274746,
    /** 0x10bb4eb6 */
    PulseOximeter = 0x10bb4eb6,
    /** 0x13734c95 */
    RainGauge = 0x13734c95,
    /** 0x10fa29c9 */
    RotaryEncoder = 0x10fa29c9,
    /** 0x19f8e291 */
    RotationsPerMinute = 0x19f8e291,
    /** 0x12fc9103 */
    Servo = 0x12fc9103,
    /** 0x1d4aa3b3 */
    SoilMoisture = 0x1d4aa3b3,
    /** 0x14ad1a5d */
    SoundLevel = 0x14ad1a5d,
    /** 0x1421bac7 */
    Temperature = 0x1421bac7,
    /** 0x12a5b597 */
    TVOC = 0x12a5b597,
    /** 0x1f6e0d90 */
    UvIndex = 0x1f6e0d90,
    /** 0x147b62ed */
    Waterlevel = 0x147b62ed,
    /** 0x1f4d5040 */
    WeightScale = 0x1f4d5040,
    /** 0x186be92b */
    WindDirection = 0x186be92b,
    /** 0x1b591bbf */
    WindSpeed = 0x1b591bbf
  }


  //-----------------------------------
  // Exported factory functions hereon:
  //-----------------------------------


  /**
   * Creates a Sensor object from a jacdac service class and a roleName (roleName of your choosing).
   * Will throw an error if the serviceClass is not supported.
   * Alternative factory to wrapJacdacSensor
   *
   * @param jdClient is a SimpleSensorClient, its .serviceClass is used to look up metadata about the sensor.
   * @returns A Sensor object that can be used like any other sensor in this library.
   */
  //% group="Sensors"
  //% blockId=sensors_get_jacdac_sensor
  //% block="Get a jacdac sensor |service class $srv |role name $roleName"
  //% weight=97
  export function getJacdacSensor(srv: JacdacSensorSrvs, roleName: string): Sensor {
    const s = __jacdacSensorMap[srv];

    if (!s)
      throw "Error: Invalid serviceClass: that Jacdac Client is not supported. Please use a SimpleSensorClient."

    const jdClient = new jacdac.SimpleSensorClient(srv, roleName, s.stateFormat);
    return new Sensor({
      name: s.name,
      rName: s.rName,
      sensorFn: () => jdClient.reading(),
      min: s.min,
      max: s.max,
      units: s.units,
      error: s.error,
      isJacdacSensor: true,
      setupFn: () => { jdClient.start() }
    });
  }


  /**
   * Creates a Sensor object from a jacdac.SimpleSensorClient.
   * Will throw an error if the serviceClass is not supported.
   * Alternative factory to getJacdacSensor
   *
   * @param jdClient is a SimpleSensorClient, its .serviceClass is used to look up metadata about the sensor.
   * @returns A Sensor object that can be used like any other sensor in this library.
   */
  //% group="Sensors"
  //% blockId=sensors_wrap_jacdac_sensor
  //% block="Wrap a jacdac sensor |JDClient $jdClient"
  //% weight=96
  export function wrapJacdacSensor(jdClient: jacdac.SimpleSensorClient): Sensor {
    if (!jdClient) {
      throw "Please provide a Jacdac SimpleSensorClient object to wrap."
    }

    const s = __jacdacSensorMap[jdClient.serviceClass];
    if (!s)
      throw "Error: Invalid serviceClass: that Jacdac Client is not supported. Please use a SimpleSensorClient."

    return new Sensor({
      name: s.name,
      rName: s.rName,
      sensorFn: () => jdClient.reading(),
      min: s.min,
      max: s.max,
      units: s.units,
      error: s.error,
      isJacdacSensor: true,
      setupFn: () => {
        jdClient.start();
        jdClient.reading(); // Taking a reading to prevent the first reading being 'undefined' error.
      }
    });
  }

  //------------------------------------
  // SimpleSensorsMap definition hereon:
  //------------------------------------

  // No ReflectedLightClient, nor Wifi simulator
  const __jacdacSensorMap: SimpleSensorsMap = {
    [JacdacSensorSrvs.WaterAcidity]: { // 0x1e9778c5
      name: "JacdacWaterAcidity",
      rName: "JDA",
      min: 2.5,
      max: 10,
      typeOfReadingRegister: "number",
      units: ["pH", "pH"],
      error: 0.1,
      stateFormat: "u4.12"
    },
    [JacdacSensorSrvs.AirPressure]: { // 0x1e117cea
      name: "JacdacAirPressure",
      rName: "JDAP",
      min: 150,
      max: 4000,
      typeOfReadingRegister: "number",
      units: ["hectopascals", "hPa"],
      error: 1.5,
      stateFormat: "u22.10"
    },
    [JacdacSensorSrvs.Button]: { // 0x1473a263
      name: "JacdacButton",
      rName: "JDB",
      min: 0,
      max: 0.99,
      typeOfReadingRegister: "number",
      units: ["", ""],
      error: 0, // Bouncing, etc not accounted for.
      stateFormat: "u0.16"
    },
    [JacdacSensorSrvs.Compass]: { // 0x15b7b9bf
      name: "JacdacCompass",
      rName: "JDC",
      min: 0,
      max: 360,
      typeOfReadingRegister: "number",
      units: ["Degrees", "°"],
      error: 1, // Heading error,
      stateFormat: "u16.16"
    },
    [JacdacSensorSrvs.DcCurrent]: { // 0x1912c8ae
      name: "JacdacDcCurrent",
      rName: "JDCC",
      min: 0,
      max: 360,
      typeOfReadingRegister: "number",
      units: ["Amps", "A"], // Simulator uses a scale from 0 to 1000mA though.
      error: 0, // This returns ? on the simulator. It's also dependent on the reading I believe.
      stateFormat: "f64"
    },
    [JacdacSensorSrvs.DcVoltage]: { // 0x1633ac19
      name: "JacdacDcVoltage",
      rName: "JDCV",
      min: 0,
      max: 360,
      typeOfReadingRegister: "number",
      units: ["Volts", "V"],
      error: 0, // This returns ? on the simulator. It's also dependent on the reading I believe.
      stateFormat: "u0.16"
    },
    [JacdacSensorSrvs.Distance]: { // 0x141a6b8a
      name: "JacdacDistance",
      rName: "JDD",
      min: 0.02,
      max: 4,
      typeOfReadingRegister: "number",
      units: ["Meters", "m"],
      error: 0, // This returns ? on the simulator.
      stateFormat: "u16.16"
    },
    [JacdacSensorSrvs.ECO2]: { // 0x169c9dc6
      name: "JacdacECO2",
      rName: "JDEC02",
      min: 400,
      max: 8192,
      typeOfReadingRegister: "number",
      units: ["parts-per-million", "ppm"],
      error: 0, // This returns ? on the simulator.
      stateFormat: "u22.10"
    },
    [JacdacSensorSrvs.ElectricalConductivity]: { // 0x1f1f7277
      name: "JacdacElectricalConductivity",
      rName: "JDEC",
      min: 0,
      max: 9990, // The simulator actually goes beyond this, probably due to +-error
      typeOfReadingRegister: "number",
      units: ["Microsiemens per centimeter", "uS/cm"],
      error: 10,
      stateFormat: "u22.10"

    },
    [JacdacSensorSrvs.Flex]: { // 0x1f47c6c6
      name: "JacdacFlex",
      rName: "JDF",
      min: -1,
      max: 1,
      typeOfReadingRegister: "number",
      units: ["percent", "%"],
      error: 0, // None stated
      stateFormat: "i1.15"
    },
    [JacdacSensorSrvs.HeartRate]: { // 0x166c6dc4
      name: "JacdacHeartRate",
      rName: "JDHR",
      min: 30,
      max: 200,
      typeOfReadingRegister: "number",
      units: ["beats per minute", "bpm"],
      error: 0, // None stated
      stateFormat: "u16.16"
    },
    [JacdacSensorSrvs.Humidity]: { // 0x16c810b8
      name: "JacdacHumidity",
      rName: "JDH",
      min: 10,
      max: 99,
      typeOfReadingRegister: "number",
      units: ["relative humidity", "%RH"],
      error: 0.1,
      stateFormat: "u22.10"
    },
    [JacdacSensorSrvs.Illuminance]: { // 0x1e6ecaf2
      name: "JacdacIlluminance",
      rName: "JDI",
      min: 1,
      max: 100000,
      typeOfReadingRegister: "number",
      units: ["lux", "lx"],
      error: 0, // None stated
      stateFormat: "u22.10"

    },
    [JacdacSensorSrvs.LightLevel]: { // 0x17dc9a1c
      name: "JacdacLightLevel",
      rName: "JDLL",
      min: 0,
      max: 100,
      typeOfReadingRegister: "number",
      units: ["percent", "%"],
      error: 0, // None stated
      stateFormat: "u0.16"
    },
    [JacdacSensorSrvs.MagneticField]: { // 0x12fe180f
      name: "JacdacMagneticField",
      rName: "JDMF",
      min: -1,
      max: 1,
      typeOfReadingRegister: "number",
      units: ["percent", "%"],
      error: 0, // None stated
      stateFormat: "i1.15"
    },
    [JacdacSensorSrvs.Potentiometer]: { // 0x1f274746
      name: "JacdacPotentiometer",
      rName: "JDP",
      min: 0,
      max: 1,
      typeOfReadingRegister: "number",
      units: ["percent", "%"],
      error: 0, // None stated
      stateFormat: "u0.16"
    },
    [JacdacSensorSrvs.PulseOximeter]: { // 0x10bb4eb6
      name: "JacdacPulseOximeter",
      rName: "JDPO",
      min: 80,
      max: 100,
      typeOfReadingRegister: "number",
      units: ["percent", "%"],
      error: 0, // None stated
      stateFormat: "u8.8"
    },
    [JacdacSensorSrvs.RainGauge]: { // 0x13734c95
      name: "JacdacRainGauge",
      rName: "JDRG",
      min: 0,
      max: 100, // This doesn't have a maximum.
      typeOfReadingRegister: "number",
      units: ["millimeters", "mm"],
      error: 0, // None stated
      stateFormat: "u16.16"
    },
    [JacdacSensorSrvs.RotaryEncoder]: { // 0x10fa29c9
      name: "JacdacRotaryEncoder",
      rName: "JDRE",
      min: -1000,// This doesn't have a minimum.
      max: 1000, // This doesn't have a maximum.
      typeOfReadingRegister: "number",
      units: ["", ""],
      error: 0, // None stated
      stateFormat: "i32"
    },
    [JacdacSensorSrvs.RotationsPerMinute]: { // 0x19f8e291
      name: "JacdacRotationsPerMinute",
      rName: "JDRPM",
      min: 0,
      max: 5000,
      typeOfReadingRegister: "number",
      units: ["rotations per minute", "rpm"],
      error: 0, // None stated
      stateFormat: "i24.8"
    },
    [JacdacSensorSrvs.Servo]: { // 0x12fc9103
      name: "JacdacServo",
      rName: "JDSR",
      min: 0,
      max: 180,
      typeOfReadingRegister: "number",
      units: ["Degrees", "°"],
      error: 0, // None stated
      stateFormat: "i16.16"
    },
    [JacdacSensorSrvs.SoilMoisture]: { // 0x1d4aa3b3
      name: "JacdacSoilMoisture",
      rName: "JDSM",
      min: 0,
      max: 1,
      typeOfReadingRegister: "number",
      units: ["percent", "%"],
      error: 5,
      stateFormat: "u0.16"
    },
    [JacdacSensorSrvs.SoundLevel]: { // 0x14ad1a5d
      name: "JacdacSoundLevel",
      rName: "JDSL",
      min: 0,
      max: 1,
      typeOfReadingRegister: "number",
      units: ["percent", "%"],
      error: 0, // None stated
      stateFormat: "u0.16"
    },
    [JacdacSensorSrvs.Temperature]: { // 0x1421bac7
      name: "JacdacTemperature",
      rName: "JDT",
      min: -40,
      max: 120,
      typeOfReadingRegister: "number",
      units: ["Degrees celcius", "°C"],
      error: 0.25,
      stateFormat: "i22.10"
    },
    [JacdacSensorSrvs.TVOC]: { // 0x12a5b597
      name: "JacdactVOC",
      rName: "JDV0C",
      min: 0, // This is ?
      max: 1187, // This is ?
      typeOfReadingRegister: "number",
      units: ["parts per billion", "ppb"],
      error: 0, // This is ?
      stateFormat: "u22.10"
    },
    [JacdacSensorSrvs.UvIndex]: { // 0x1f6e0d90
      name: "JacdacUvIndex",
      rName: "JDUV",
      min: 0,
      max: 11,
      typeOfReadingRegister: "number",
      units: ["Ultraviolet index", "uv"],
      error: 0, // This is ?
      stateFormat: "u16.16"
    },
    [JacdacSensorSrvs.Waterlevel]: { // 0x147b62ed
      name: "JacdacWaterLevel",
      rName: "JDWL",
      min: 0,
      max: 1,
      typeOfReadingRegister: "number",
      units: ["percent", "%"],
      error: 0, // This is ?
      stateFormat: "u0.16"
    },
    [JacdacSensorSrvs.WeightScale]: { // 0x1f4d5040
      name: "JacdacWeightScale", // This is weight scale (body) to be specific
      rName: "JDWS",
      min: 0,
      max: 180,
      typeOfReadingRegister: "number",
      units: ["kilograms", "kg"],
      error: 0, // This is ?
      stateFormat: "u16.16"
    },
    [JacdacSensorSrvs.WindDirection]: { // 0x186be92b
      name: "JacdacWindDirection",
      rName: "JDWD",
      min: 0,
      max: 360,
      typeOfReadingRegister: "number",
      units: ["Degrees", "°"],
      error: 5,
      stateFormat: "u16"
    },
    [JacdacSensorSrvs.WindSpeed]: { // 0x1b591bbf
      name: "JacdacWindSpeed",
      rName: "JDWS",
      min: 0,
      max: 80,
      typeOfReadingRegister: "number",
      units: ["meters per second", "m/s"],
      error: 2,
      stateFormat: "u16.16"
    }
  }
}
