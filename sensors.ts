/**
* Wrapper around all micro:bit sensors + ability to wrap Jacdac sensors.
* Provides high level functionality for logging, buffering, normalising and scheduling sensors.
*/
//% weight=1 color="#063970" icon="\uf233"
//% groups=["Get a sensor", "Get data from sensors", "Get data from the sensor's buffer", "Logging and events", "Recording config"]
namespace sensors {
  /**
   * Used to lookup the implemented events via sensorEventFunctionLookup[]
   * 
   * Currently only events that check for inequalities are implemented,
   *      The only sensors that are incompatible with this are Buttons
   * The following code may be generalised to support them though.
   */
  export const sensorEventSymbols = ["=", ">", "<", ">=", "<="]

  /**
   * Type for value bound to inequality key within sensorEventFunctionLookup
   * 
   * One of these is optionally held by a sensor - see by sensor.setConfig
   */
  export type SensorEventFunction = (reading: number, comparator: number) => boolean

  /** 
   * Get a function that performs that inequality check & logs it with an event description if the event has triggered.
   */
  export const sensorEventFunctionLookup: { [inequality: string]: SensorEventFunction } = {
    "=": function (reading: number, comparator: number) { return reading == comparator },
    ">": function (reading: number, comparator: number) { return reading > comparator },
    "<": function (reading: number, comparator: number) { return reading < comparator },
    ">=": function (reading: number, comparator: number) { return reading >= comparator },
    "<=": function (reading: number, comparator: number) { return reading <= comparator }
  }

  /** To what precision should readings from the sensor be truncated to when they're logged? */
  const READING_PRECISION: number = 8
  /** When checking if an even has triggered. How long should the sensor wait between measurements? */
  const EVENT_POLLING_RATE_MS: number = 5


  /**
  * List of all Microbit sensors.
  */
  export enum MicrobitSensors {
    //% block="Accelerometer X axis"
    AccelerometerX,
    //% block="Accelerometer Y axis"
    AccelerometerY,
    //% block="Accelerometer Z axis"
    AccelerometerZ,
    //% block="Pitch"
    Pitch,
    //% block="Roll"
    Roll,
    //% block="Analog on Ring 0"
    AnalogPin0,
    //% block="Analog on Ring 1"
    AnalogPin1,
    //% block="Analog on Ring 2"
    AnalogPin2,
    //% block="Light"
    Light,
    //% block="Temperature"
    Temperature,
    //% block="Magnetometer"
    Magnetometer,
    //% block="Logo"
    Logo,
    //% block="Volume"
    Volume,
    //% block="Compass"
    Compass
  }

  export function listAllMicrobitSensors(): MicrobitSensors[] {
    return [
      MicrobitSensors.AccelerometerX,
      MicrobitSensors.AccelerometerY,
      MicrobitSensors.AccelerometerZ,
      MicrobitSensors.Pitch,
      MicrobitSensors.Roll,
      MicrobitSensors.AnalogPin0,
      MicrobitSensors.AnalogPin1,
      MicrobitSensors.AnalogPin2,
      MicrobitSensors.Light,
      MicrobitSensors.Temperature,
      MicrobitSensors.Magnetometer,
      MicrobitSensors.Logo,
      MicrobitSensors.Volume,
      MicrobitSensors.Compass
    ];
  }

  export const numberOfSupportedMicrobitSensors: number = 14; // Hard coded since can't reflect enum.

  /**
   * Factory function used to generate a Sensor from that sensors: .getName(), sensorSelect name, or its radio name
   * Throws an error if the enum value isn't recognised.
   * This is a single factory within this abstract class to reduce binary size
   * @param sensor is a value from the enum MicrobitSensors
   * @returns concrete sensor that the input name corresponds to, throws an error if not-defined.
   */
  //% block="Get microbit sensor $sensor"
  //% sensor.defl=MicrobitSensors.AccelerometerX
  //% blockSetVariable=mySensor
  //% group="Get a sensor"
  //% weight=99
  export function getMicrobitSensor(sensor: MicrobitSensors): Sensor {
    switch (sensor) {
      case (MicrobitSensors.AccelerometerX): {
        return new Sensor({
          name: "Accel. X",
          rName: "AX",
          sensorFn: () => input.acceleration(Dimension.X),
          min: -2048,
          max: 2048,
          units: ["milli-g", "mg"],
          error: 0,
          setupFn: () => input.setAccelerometerRange(AcceleratorRange.OneG)
        });
      }

      case (MicrobitSensors.AccelerometerY): {
        return new Sensor({
          name: "Accel. Y",
          rName: "AY",
          sensorFn: () => input.acceleration(Dimension.Y),
          min: -2048,
          max: 2048,
          units: ["milli-g", "mg"],
          error: 0,
          setupFn: () => input.setAccelerometerRange(AcceleratorRange.OneG)
        });
      }

      case (MicrobitSensors.AccelerometerZ): {
        return new Sensor({
          name: "Accel. Z",
          rName: "AZ",
          sensorFn: () => input.acceleration(Dimension.Z),
          min: -2048,
          max: 2048,
          units: ["milli-g", "mg"],
          error: 0,
          setupFn: () => input.setAccelerometerRange(AcceleratorRange.OneG)
        });
      }

      case (MicrobitSensors.Pitch): {
        return new Sensor({
          name: "Pitch",
          rName: "P",
          sensorFn: () => input.rotation(Rotation.Pitch),
          min: -180,
          max: 180,
          units: ["", ""],
          error: 0,
        });
      }

      case (MicrobitSensors.Roll): {
        return new Sensor({
          name: "Roll",
          rName: "R",
          sensorFn: () => input.rotation(Rotation.Roll),
          min: -180,
          max: 180,
          units: ["", ""],
          error: 0,
        });
      }

      case (MicrobitSensors.AnalogPin0): {
        return new Sensor({
          name: "A. Pin 0",
          rName: "AP0",
          sensorFn: () => pins.analogReadPin(AnalogPin.P0) / 340,
          min: 0,
          max: 3,
          units: ["Volts", "V"],
          error: 0,
        });
      }

      case (MicrobitSensors.AnalogPin1): {
        return new Sensor({
          name: "A. Pin 1",
          rName: "AP1",
          sensorFn: () => pins.analogReadPin(AnalogPin.P1) / 340,
          min: 0,
          max: 3,
          units: ["Volts", "V"],
          error: 0,
        });
      }


      case (MicrobitSensors.AnalogPin2): {
        return new Sensor({
          name: "A. Pin 2",
          rName: "AP2",
          sensorFn: () => pins.analogReadPin(AnalogPin.P2) / 340,
          min: 0,
          max: 3,
          units: ["Volts", "V"],
          error: 0,
        });
      }

      case (MicrobitSensors.Light): {
        return new Sensor({
          name: "Light",
          rName: "L",
          sensorFn: () => input.lightLevel(),
          min: 0,
          max: 255,
          units: ["Volts", "V"],
          error: 0,
        });
      }

      case (MicrobitSensors.Temperature): {
        return new Sensor({
          name: "Temp.",
          rName: "T",
          sensorFn: () => input.temperature(),
          min: -40,
          max: 100,
          units: ["Degrees celcius", "°C"],
          error: 0,
        });
      }

      case (MicrobitSensors.Magnetometer): {
        return new Sensor({
          name: "Magnet",
          rName: "M",
          sensorFn: () => input.magneticForce(Dimension.Strength),
          min: -5000,
          max: 5000,
          units: ["", ""],
          error: 0,
        });
      }

      case (MicrobitSensors.Logo): {
        return new Sensor({
          name: "Logo Press",
          rName: "LP",
          sensorFn: () => (input.logoIsPressed() ? 1 : 0),
          min: 0,
          max: 1,
          units: ["", ""],
          error: 0,
        });
      }

      case (MicrobitSensors.Volume): {
        return new Sensor({
          name: "Microphone",
          rName: "V",
          sensorFn: () => input.soundLevel(),
          min: 0,
          max: 255,
          units: ["Volume", "db"], //TODO:Check this...
          error: 0,
        });
      }

      case (MicrobitSensors.Compass): {
        return new Sensor({
          name: "Compass",
          rName: "C",
          sensorFn: () => input.compassHeading(),
          min: 0,
          max: 360,
          units: ["Degrees", "°"],
          error: 0,
        });
      }
      default:
        throw "Error: Couldn't build sensor. Passed value '" + sensor + "' doesn't exist on MicrobitSensors enum."
    }
  }

  /**
   * Abstraction for all available sensors.
   * This class is extended by each of the concrete sensors which add on static methods for their name, getting their readings & optionally min/max readings
   */
  //%
  export class Sensor {
    /** Immutable: Forward facing name that is presented to the user in LiveDataViewer, Sensor Selection & TabularDataViewer */
    public readonly name: string;
    /** Immutable: Name used for Radio Communication, a unique shorthand, see distributedLogging.ts */
    public readonly radioName: string;
    /** Immutable: Minimum possible sensor reading, based on datasheet of peripheral. Some sensors transform their output (Analog pins transform 0->1023, into 0->3V volt range) */
    public readonly minimum: number;
    /** Immutable: Maximum possible sensor reading, based on datasheet of peripheral. Some sensors transform their output (Analog pins transform 0->1023, into 0->3V volt range) */
    public readonly maximum: number;
    /** Immutable: Abs(minimum) + Abs(maximum); calculated once at start since min & max can't change */
    public readonly range: number;
    /** Immutable: Wrapper around the sensors call, e.g: sensorFn = () => input.acceleration(Dimension.X) */
    private readonly sensorFn: () => number;
    /** Immutable: Need to know whether or not this sensor is on the microbit or is an external Jacdac one; see sensorSelection.ts */
    public readonly isJacdacSensor: boolean;
    /** Immutable: "percent", "pH", "hectopascals". Is "" where not applicable. */
    private readonly _unitName: string;
    /** Immutable: Examples: "%", "pH", "hPa". Is "" where not applicable.  */
    private readonly _unitSymbol: string;
    /** Immutable: The + or - error for the sensor. This is 0 where it is not-stated or known. */
    public readonly readingError: number;

    /** Set by .setConfig() */
    public totalMeasurements: number

    /** This can be changed dynamically. It might be useful if you were plotting data adn zoomed in, for example. */
    private maxBufferSize: number

    /** 
     * Used by the live data viewer to write the small abscissa
     * Always increases: even when data buffer is shifted to avoid reaching the BUFFER_LIMIT
     */
    public numberOfReadings: number

    /** Used to determine sensor information to write in DataRecorder and liveDataViewer */
    public isInEventMode: boolean

    /**
     * Determines behaviour of .log()
     */
    private config: RecordingConfig


    /** Event statistic used by the dataRecorder. */
    public lastLoggedEventDescription: string

    /**
     * Holds the sensor's readings.
     * Filled via .readIntoBufferOnce()
     * Used by the ticker in liveDataViewer.
     * Values are shifted out from FIFO if at max capacity.
     * Needed since the entire normalisedBuffer may need to be recalculated upon scrolling or zooming.
     */
    private dataBuffer: number[]

    private lastLoggedReading: number;

    /**
     * Equivalent to dataBuffer, but noramlised against .range
     * Filled alongside dataBuffer alongside .readIntoBufferOnce()
     * Entire dataBuffer may be recalculated via .normaliseDataBuffer()
     * Values are shifted out from FIFO if at max capacity.
     */
    private normalisedDataBuffer: number[]

    constructor(opts: {
      name: string,
      rName: string,
      sensorFn: () => number,
      min: number,
      max: number,
      units?: string[],
      error?: number,
      isJacdacSensor?: boolean,
      setupFn?: () => void
    }) {
      this.maxBufferSize = 80
      this.totalMeasurements = 0
      this.numberOfReadings = 0
      this.isInEventMode = false

      this.lastLoggedEventDescription = ""
      this.dataBuffer = []
      this.lastLoggedReading = 0
      this.normalisedDataBuffer = []

      // Data from opts:
      this.name = opts.name
      this.radioName = opts.rName
      this.minimum = opts.min
      this.maximum = opts.max
      this.range = this.maximum - this.minimum
      this._unitName = (opts.units && opts.units[0]) ? opts.units[0] : ""
      this._unitSymbol = (opts.units && opts.units[1]) ? opts.units[1] : ""
      this.readingError = (opts.error) ? opts.error : 0
      this.sensorFn = opts.sensorFn
      this.isJacdacSensor = (opts.isJacdacSensor) ? opts.isJacdacSensor : false

      // There could be additional functions required to set up the sensor (see Jacdac modules or Accelerometers):
      if (opts.setupFn)
        opts.setupFn();
    }

    private eventShouldTrigger(reading: number): boolean {
      if (!this.config)
        throw "eventShouldTrigger: no config: use .setConfig before calling this fn"

      const inequality = this.config.inequality
      const comparator = this.config.comparator

      if (inequality == undefined || comparator == undefined)
        throw "eventShouldTrigger: incomplete config: no inequality nor comparator provided: use .setConfig before calling this fn"

      switch (inequality) {
        case "=": {
          if (reading == comparator)
            return true;
          break;
        }

        case "!=": {
          if (reading != comparator)
            return true;
          break;
        }

        case ">": {
          if (reading > comparator)
            return true;
          break;
        }

        case "<": {
          if (reading < comparator)
            return true;
          break;
        }
        case ">=": {
          if (reading >= comparator)
            return true;
          break;
        }

        case "<=": {
          if (reading <= comparator)
            return true;
          break;
        }

        default: {
          throw "eventShouldTrigger: default: unrecognised sensorEventSymbol: '" + comparator + "'"
        }
      }

      return false;
    }

    //---------------------
    // Interface Functions:
    //---------------------

    /** Latest value from the sensor. Does not change any buffered readings.*/
    //% blockId="sensor_reading" block="get reading from %sensor(mySensor)"
    //% group="Get data from sensors"
    //% weight=100
    get reading(): number { return this.sensorFn() }

    /** Latest value from the sensor. Normalised by this sensors minimum and maximum. Does not change any buffered readings.*/
    //% blockId="sensor_normalised_reading" block="get normalised reading from %sensor(mySensor)"
    //% group="Get data from sensors"
    //% weight=99
    get normalisedReading(): number { return (this.reading - this.minimum) / this.range }
  
    //% blockId="sensor_min" block="get the minimum possible value of %sensor(mySensor)"
    //% group="Get data from sensors"
    //% weight=98
    get min(): number { return this.minimum }

    //% blockId="sensor_max" block="get the maximum possible value of %sensor(mySensor)"
    //% group="Get data from sensors"
    //% weight=97
    get max(): number { return this.maximum }

    //% blockId="sensor_unit_symbol" block="get the symbol for the units of %sensor(mySensor) "
    //% group="Get data from sensors"
    //% weight=96
    get unitSymbol(): string { return this._unitSymbol }

    //% blockId="sensor_unit_name" block="get the name for the units of %sensor(mySensor)"
    //% group="Get data from sensors"
    //% weight=95
    get unitName(): string { return this._unitName }

    //% blockId="sensor_show_reading" block="show a reading from %sensor(mySensor) truncated to be $truncatedTo length"
    //% group="Get data from sensors"
    //% weight=94
    public showReading(truncatedTo: number = READING_PRECISION): void { basic.showString(this.formatReading().slice(0, truncatedTo)) }

    //---------------
    // Sensor buffer:
    //---------------


    /**
     * Add one value to this.dataBuffer, add that value normalised into this.normalisedBuffer too.
     * No value is added if the reading is undefined (such as from a disconnected Jacdac sensor).
     * If the (this.dataBuffer.length >= this.maxBufferSize) then then the oldest values are removed.
     * If the reading is undefined, it isn't added to either buffer, but the oldest values are still removed if at max capacity.
     * @param fromY the offset by which the reading should be raised before adding to this.normalisedBuffer
     * @returns the new length of this.dataBuffer (same as this.normalisedDataBuffer)
     */
    //% blockId="sensor_read_into_buffer_once" block="read into %sensor(mySensor) buffer & normalised buffer, then get its new length"
    //% group="Get data from the sensor's buffer"
    //% weight=100
    public readIntoBufferOnce(): number {
      const reading = this.reading

      if (this.dataBuffer.length >= this.maxBufferSize || reading === undefined) {
        this.dataBuffer.shift();
        this.normalisedDataBuffer.shift();
      }

      if (reading === undefined)
        return this.dataBuffer.length

      this.numberOfReadings += 1
      this.dataBuffer.push(reading);
      this.normalisedDataBuffer.push((reading - this.minimum) / this.range);
      return this.dataBuffer.length
    }

    //% blockId="sensor_get_nth_reading" block="get the reading from %sensor(mySensor) buffer at index $n"
    //% group="Get data from the sensor's buffer"
    //% weight=99
    public getNthReading(n: number): number { return this.dataBuffer[n] }
    
    //% blockId="sensor_get_nth_normalised_reading" block="get the normalised reading from %sensor(mySensor) buffer at index $n"
    //% group="Get data from the sensor's buffer"
    //% weight=98
    public getNthNormalisedReading(n: number): number { return this.normalisedDataBuffer[n] }

    /** Should be the same as .normalisedBufferLength() */
    //% blockId="sensor_buffer_length" block="get %sensor(mySensor) buffer length"
    //% group="Get data from the sensor's buffer"
    //% weight=97
    get bufferLength(): number { return this.dataBuffer.length }
    
    /** Should be the same as .bufferLength() */
    //% blockId="sensor_normalised_buffer_length" block="get %sensor(mySensor) normalised buffer length"
    //% group="Get data from the sensor's buffer"
    //% weight=96
    get normalisedBufferLength(): number { return this.normalisedDataBuffer.length }

    //% blockId="sensor_get_max_buffer_size" block="get %sensor(mySensor) buffer's current maximum length"
    //% group="Get data from the sensor's buffer"
    //% weight=95
    public getMaxBufferSize(): number { return this.maxBufferSize }

    /**
     * Change the size of the buffer used for this.dataBuffer & this.normalisedBuffer
     * Will shift out old this.dataBuffer & this.normalisedBuffer values from the front.
     * @param newBufferSize absolute new value for both this.dataBuffer & this.normalisedBuffer
     */
    //% blockId="sensor_set_buffer_size" block="set the size of %sensor(mySensor) data buffer and normalised data buffer to $newBufferSize"
    //% group="Get data from the sensor's buffer"
    //% weight=95
    public setBufferSize(newBufferSize: number): void {
      // Remove additional values if neccessary:
      if (this.dataBuffer.length > newBufferSize) {
        const difference = this.dataBuffer.length - newBufferSize
        this.dataBuffer.splice(0, difference)
        this.normalisedDataBuffer.splice(0, difference)
      }
      this.maxBufferSize = newBufferSize
    }

    //-------------------------
    // Sensor logging & events:
    //-------------------------


    /**
     * Records a sensor's reading to the datalogger.
     * Will set the event column in the datalogger to "N/A" if not in event mode.
     * Invoked by dataRecorder.log().
     * @param time (in ms) is to be passed by the caller. This becomes the "Time (Ms)" column.
     * SensorScheduler will start at 0 and incremen it by a fixed period, so the time will not be exact.
     * You can pass in control.millis() if you want the exact time though.
     * @returns A CSV string of the log that was made, the sensors name will be cut-short to its .radioName. "" is returned if no log is made.
     */
    //% block="log a reading from %sensor(mySensor) and optionally override timestapm with $time. Get log back as a string."
    //% measurements.defl=10
    //% period.defl=99
    //% group="Logging and events"
    //% weight=100
    public log(time?: number): string {
      if (!time)
        time = control.millis()

      this.lastLoggedReading = this.reading

      const reading = this.lastLoggedReading.toString().slice(0, READING_PRECISION)

      if (this.isInEventMode) {
        if (sensorEventFunctionLookup[this.config.inequality](this.lastLoggedReading, this.config.comparator)) {
          datalogger.log(
            datalogger.createCV("Sensor", this.name),
            datalogger.createCV("Time (ms)", time),
            datalogger.createCV("Reading", reading),
            datalogger.createCV("Event", this.config.inequality + " " + this.config.comparator)
          )
          this.config.measurements -= 1
          return this.radioName + "," + time.toString() + "," + reading + "," + this.config.inequality + " " + this.config.comparator
        }
      }

      else {
        datalogger.log(
          datalogger.createCV("Sensor", this.name),
          datalogger.createCV("Time (ms)", time.toString()),
          datalogger.createCV("Reading", reading),
          datalogger.createCV("Event", "N/A")
        )
        this.config.measurements -= 1
        return this.radioName + "," + time.toString() + "," + reading + "," + "N/A"
      }
      return ""
    }

    //% blockId="sensor_period" block="get the period set in %sensor(mySensor) config"
    //% group="Logging and events"
    //% weight=99
    get period(): number { return this.config.period; }
    
    //% blockId="sensor_measurements" block="get the number of measurements set in %sensor(mySensor) config"
    //% group="Logging and events"
    //% weight=98
    get measurements(): number { return this.config.measurements }

    //% blockId="sensor_show_reading" block="Does %sensor(mySensor) have readings? see setConfig"
    //% group="Logging and events"
    //% weight=97
    public hasMeasurements(): boolean { return this.config.measurements > 0; }

    /** Helper function, used by showReading, log. Doesn't need to be a block */
    public formatReading(reading?: number): string {
      reading = (reading) ? reading : this.reading;
      return this.reading + " " + this._unitSymbol
    }

    /** Helper function, used by showReading, log. Doesn't need to be a block */
    public formatNormalisedReading(reading?: number): string {
      reading = (reading) ? reading : this.reading;
      return this.normalisedReading + " " + this._unitSymbol
    }

    /**
     * Used by the DataRecorder to display information about the sensor as it is logging.
     * @returns lines of information that can be printed out into a box for display.
     */
    //% blockId="sensor_get_recording_information" block="get info about about the logged readings from %sensor(mySensor)"
    //% group="Logging and events"
    //% weight=96
    public getRecordingInformation(): string[] {
      if (this.hasMeasurements())
        return [
          this.period / 1000 + " second period",
          this.config.measurements.toString() + " measurements left",
          ((this.config.measurements * this.period) / 1000).toString() + " seconds left",
          "Last log was " + this.lastLoggedReading.toString().slice(0, 5),
        ]
      else
        return [
          "Logging complete.",
          "Last log was " + this.lastLoggedReading.toString().slice(0, 5),
        ]
    }

    /**
     * Used by the DataRecorder to display information about the sensor as it is logging.
     * @returns lines of information that can be printed out into a box for display.
     */
    //% blockId="sensor_get_event_information" block="get info about the logged events from %sensor(mySensor)"
    //% group="Logging and events"
    //% weight=95
    public getEventInformation(): string[] {
      if (this.hasMeasurements())
        return [
          this.config.measurements.toString() + " events left",
          "Logging " + this.config.inequality + " " + this.config.comparator + " events",
          "Last log was " + this.lastLoggedReading.toString().slice(0, 5),
          this.lastLoggedEventDescription
        ]

      else
        return [
          "Logging complete.",
          "Last log was " + this.lastLoggedReading.toString().slice(0, 5)
        ]
    }

    /**
     * Set inside of recordingConfigSelection.
     * @param config see recordingConfigSelection.
     */
    //% block="setup %sensor(mySensor) ready for logging with $config config"
    //% group="Recording config"
    //% weight=100
    public setConfig(config: RecordingConfig): void {
      const isInEventMode = config.comparator != null && config.inequality != null
      this.config = config
      this.totalMeasurements = this.config.measurements
      this.isInEventMode = isInEventMode
    }
  }

  /**
   * Generated at recordingConfigSelection 
   * Passed to and owned by a sensor
   * The sensor uses this information to control how it logs readings
   */
  export type RecordingConfig = {
    measurements: number,
    period: number
    inequality?: string,
    comparator?: number
  };

  /**
   * These should be shadows in the future, that are taken in some function like startLogging or startEvent.
   */
  //% block="config that takes $measurements measurements in total, one every $period ms"
  //% measurements.defl=10
  //% period.defl=99
  //% group="Recording config"
  //% weight=99
  export function recordingConfig(measurements: number, period: number): RecordingConfig {
    return { measurements, period }
  }

  /**
   * These should be shadows in the future, that are taken in some function like startLogging or startEvent.
   */
  //% block="config to measure when $inequality $comparator"
  //% inequality.defl=">"
  //% comparator.defl=0
  //% group="Recording config"
  //% weight=98
  export function eventOnlyRecordingConfig(inequality: string, comparator: number): RecordingConfig {
    return { measurements: undefined, period: undefined, inequality, comparator }
  }
}