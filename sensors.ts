namespace sensor {
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
   * One of these is optionally held by a sensor - see by sensor.setRecordingConfig
   */
  export type SensorEventFunction = (reading: number, comparator: number) => boolean

  /** 
   * Get aa function that performs that inequality check & logs it with an event description if the event has triggered.
   */
  export const sensorEventFunctionLookup: { [inequality: string]: SensorEventFunction } = {
    "=": function (reading: number, comparator: number) { return reading == comparator },
    ">": function (reading: number, comparator: number) { return reading > comparator },
    "<": function (reading: number, comparator: number) { return reading < comparator },
    ">=": function (reading: number, comparator: number) { return reading >= comparator },
    "<=": function (reading: number, comparator: number) { return reading <= comparator }
  }

  /** To what precision whould readings fromt he sensor be cut to when they're logged? */
  const READING_PRECISION: number = 9

  /**
   * Abstraction for all available sensors.
   * This class is extended by each of the concrete sensors which add on static methods for their name, getting their readings & optionally min/max readings
   */
  export class Sensor {
    /** Immutable: Forward facing name that is presented to the user in LiveDataViewer, Sensor Selection & TabularDataViewer */
    private readonly name: string;
    /** Immutable: Name used for Radio Communication, a unique shorthand, see distributedLogging.ts */
    private readonly radioName: string;
    /** Immutable: Minimum possible sensor reading, based on datasheet of peripheral. Some sensors transform their output (Analog pins transform 0->1023, into 0->3V volt range) */
    private readonly minimum: number;
    /** Immutable: Maximum possible sensor reading, based on datasheet of peripheral. Some sensors transform their output (Analog pins transform 0->1023, into 0->3V volt range) */
    private readonly maximum: number;
    /** Immutable: Abs(minimum) + Abs(maximum); calculated once at start since min & max can't change */
    private readonly range: number;
    /** Immutable: Wrapper around the sensors call, e.g: sensorFn = () => input.acceleration(Dimension.X) */
    private readonly sensorFn: () => number;
    /** Immutable: Need to know whether or not this sensor is on the microbit or is an external Jacdac one; see sensorSelection.ts */
    private readonly isJacdacSensor: boolean;

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
      f: () => number,
      min: number,
      max: number,
      isJacdacSensor: boolean,
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
      this.range = Math.abs(this.minimum) + this.maximum
      this.sensorFn = opts.f
      this.isJacdacSensor = opts.isJacdacSensor

      // Could be additional functions required to set up the sensor (see Jacdac modules or Accelerometers):
      if (opts.setupFn != null)
        opts.setupFn();
    }

    //------------------
    // Factory Function:
    //------------------

    /**
     * Factory function used to generate a Sensor from that sensors: .getName(), sensorSelect name, or its radio name
     * This is a single factory within this abstract class to reduce binary size
     * @param name either sensor.getName(), sensor.getRadioName() or the ariaID the button that represents the sensor in SensorSelect uses.
     * @returns concrete sensor that the input name corresponds to. OR NULL if no sensor matches the name.
     */
    public static getMicrobitSensor(name: string): Sensor {
      if (name == "Accel. X" || name == "Accelerometer X" || name == "AX")
        return new Sensor({
          name: "Accel. X",
          rName: "AX",
          f: () => input.acceleration(Dimension.X),
          min: -2048,
          max: 2048,
          isJacdacSensor: false,
          setupFn: () => input.setAccelerometerRange(AcceleratorRange.OneG)
        });

      else if (name == "Accel. Y" || name == "Accelerometer Y" || name == "AY")
        return new Sensor({
          name: "Accel. Y",
          rName: "AY",
          f: () => input.acceleration(Dimension.Y),
          min: -2048,
          max: 2048,
          isJacdacSensor: false,
          setupFn: () => input.setAccelerometerRange(AcceleratorRange.OneG)
        });

      else if (name == "Accel. Z" || name == "Accelerometer Z" || name == "AZ")
        return new Sensor({
          name: "Accel. Z",
          rName: "AZ",
          f: () => input.acceleration(Dimension.Z),
          min: -2048,
          max: 2048,
          isJacdacSensor: false,
          setupFn: () => input.setAccelerometerRange(AcceleratorRange.OneG)
        });

      else if (name == "Pitch" || name == "P")
        return new Sensor({
          name: "Pitch",
          rName: "P",
          f: () => input.rotation(Rotation.Pitch),
          min: -180,
          max: 180,
          isJacdacSensor: false
        });

      else if (name == "Roll" || name == "R")
        return new Sensor({
          name: "Roll",
          rName: "R",
          f: () => input.rotation(Rotation.Roll),
          min: -180,
          max: 180,
          isJacdacSensor: false
        });

      else if (name == "A. Pin 0" || name == "Analog Pin 0" || name == "AP0")
        return new Sensor({
          name: "A. Pin 0",
          rName: "AP0",
          f: () => pins.analogReadPin(AnalogPin.P0) / 340,
          min: 0,
          max: 3,
          isJacdacSensor: false
        });

      else if (name == "A. Pin 1" || name == "Analog Pin 1" || name == "AP1")
        return new Sensor({
          name: "A. Pin 1",
          rName: "AP1",
          f: () => pins.analogReadPin(AnalogPin.P1) / 340,
          min: 0,
          max: 3,
          isJacdacSensor: false
        });

      else if (name == "A. Pin 2" || name == "Analog Pin 2" || name == "AP2")
        return new Sensor({
          name: "A. Pin 2",
          rName: "AP2",
          f: () => pins.analogReadPin(AnalogPin.P2) / 340,
          min: 0,
          max: 3,
          isJacdacSensor: false
        });

      else if (name == "Light" || name == "L")
        return new Sensor({
          name: "Light",
          rName: "L",
          f: () => input.lightLevel(),
          min: 0,
          max: 255,
          isJacdacSensor: false
        });

      else if (name == "Temp." || name == "Temperature" || name == "T")
        return new Sensor({
          name: "Temp.",
          rName: "T",
          f: () => input.temperature(),
          min: -40,
          max: 100,
          isJacdacSensor: false
        });

      else if (name == "Magnet" || name == "M")
        return new Sensor({
          name: "Magnet",
          rName: "M",
          f: () => input.magneticForce(Dimension.Strength),
          min: -5000,
          max: 5000,
          isJacdacSensor: false
        });

      else if (name == "Logo Pressed" || name == "Logo Press" || name == "LP")
        return new Sensor({
          name: "Logo Press",
          rName: "LP",
          f: () => (input.logoIsPressed() ? 1 : 0),
          min: 0,
          max: 1,
          isJacdacSensor: false
        });

      else if (name == "Volume" || name == "Microphone" || name == "V")
        return new Sensor({
          name: "Microphone",
          rName: "V",
          f: () => input.soundLevel(),
          min: 0,
          max: 255,
          isJacdacSensor: false
        });

      else if (name == "Compass" || name == "C")
        return new Sensor({
          name: "Compass",
          rName: "C",
          f: () => input.compassHeading(),
          min: 0,
          max: 360,
          isJacdacSensor: false
        });
      else
        return null;
    }

    /**
     * Creates a Sensor object for a Jacdac sensor.
     * TODO: this.rName is just "" atm. This should be unique to all sensors. It would be difficult for the user to know the unique radioName of the sensor though.

     * Additionally, we might be able to offer a function that takes a Jacdac sensor object and extracts these members from it.
     * @param name Of the Jacdac sensor.
     * @param f A function that returns the current reading of the sensor as a number. Disconnected Jacdac sensors typically return 'undefined' when called.
     * @param min The minimum possible reading of the sensor. Used for normalisation and display purposes.
     * @param max The maximum possible reading of the sensor. Used for normalisation and display purposes.
     * @param setupFn Please put at least () => {modules.mySensor.start()} here.
     * @returns A Sensor object that can be used like any other sensor in this library.
     */
    public static wrapJacdacSensor(name: string, f: () => number, min: number, max: number, setupFn?: () => void): Sensor {
      return new Sensor({
        name,
        rName: "",
        f,
        min,
        max,
        isJacdacSensor: false,
        setupFn
      });
    }


    //---------------------
    // Interface Functions:
    //---------------------

    public getName(): string { return this.name }
    public getRadioName(): string { return this.radioName }
    public getReading(): number { return this.sensorFn() }
    public getNormalisedReading(): number { return Math.abs(this.getReading()) / this.range }
    public getMinimum(): number { return this.minimum; }
    public getMaximum(): number { return this.maximum; }
    public isJacdac(): boolean { return this.isJacdacSensor; }
    public getMaxBufferSize(): number { return this.maxBufferSize }
    public getNthReading(n: number): number { return this.dataBuffer[n] }
    public getNthNormalisedReading(n: number): number { return this.normalisedDataBuffer[n] }
    public getBufferLength(): number { return this.dataBuffer.length }
    public getNormalisedBufferLength(): number { return this.normalisedDataBuffer.length }
    public getPeriod(): number { return this.config.period; }
    public getMeasurements(): number { return this.config.measurements }
    public hasMeasurements(): boolean { return this.config.measurements > 0; }

    /**
     * Used by the DataRecorder to display information about the sensor as it is logging.
     * @returns linles of information that can be printed out into a box for display.
     */
    public getRecordingInformation(): string[] {
      if (this.hasMeasurements())
        return [
          this.getPeriod() / 1000 + " second period",
          this.config.measurements.toString() + " measurements left",
          ((this.config.measurements * this.getPeriod()) / 1000).toString() + " seconds left",
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
     * Change the size of the buffer used for this.dataBuffer & this.normalisedBuffer
     * Will shift out old this.dataBuffer & this.normalisedBuffer values from the front.
     * @param newBufferSize absolute new value for both this.dataBuffer & this.normalisedBuffer
     */
    public setBufferSize(newBufferSize: number): void {
      // Remove additional values if neccessary:
      if (this.dataBuffer.length > newBufferSize) {
        const difference = this.dataBuffer.length - newBufferSize
        this.dataBuffer.splice(0, difference)
        this.normalisedDataBuffer.splice(0, difference)
      }
      this.maxBufferSize = newBufferSize
    }

    /**
     * Add one value to this.dataBuffer, add that value normalised into this.normalisedBuffer too.
     * No value is added if the reading is undefined (such as from a disconnected Jacdac sensor).
     * If the (this.dataBuffer.length >= this.maxBufferSize) then then the oldest values are removed.
     * If the reading is undefined, it isn't added to either buffer, but the oldest values are still removed if at max capacity.
     * @param fromY the offset by which the reading should be raised before adding to this.normalisedBuffer
     * @returns the new length of this.dataBuffer (same as this.normalisedDataBuffer)
     */
    public readIntoBufferOnce(): number {
      const reading = this.getReading()

      if (this.dataBuffer.length >= this.maxBufferSize || reading === undefined) {
        this.dataBuffer.shift();
        this.normalisedDataBuffer.shift();
      }

      if (reading === undefined)
        return this.dataBuffer.length

      this.numberOfReadings += 1
      this.dataBuffer.push(reading);
      this.normalisedDataBuffer.push((reading - this.getMinimum()) / this.range);
      return this.dataBuffer.length
    }

    /**
     * Populates this.normalisedBuffer with the Y position for each element in this.dataBuffer.
     * Uses BUFFERED_SCREEN_HEIGHT.
     * Invoked upon scrolling in the live-data-viewer.
     * @param fromY The y value that each element should be offset by.
     */
    public normaliseDataBuffer(): void {
      const min = this.getMinimum()
      const range: number = Math.abs(min) + this.getMaximum();

      this.normalisedDataBuffer = []
      for (let i = 0; i < this.dataBuffer.length; i++) {
        this.normalisedDataBuffer.push((this.dataBuffer[i] - min) / range);
      }
    }

    /**
     * Set inside of recordingConfigSelection.
     * @param config see recordingConfigSelection.
     */
    public setConfig(config: RecordingConfig): void {
      const isInEventMode = config.comparator != null && config.inequality != null
      this.config = config
      this.totalMeasurements = this.config.measurements
      this.isInEventMode = isInEventMode
    }

    /**
     * Records a sensor's reading to the datalogger.
     * Will set the event column in the datalogger to "N/A" if not in event mode.
     * Invoked by dataRecorder.log().
     * @param time (in ms) is to be passed by the caller. This becomes the "Time (Ms)" column.
     * SensorScheduler will start at 0 and incremen it by a fixed period, so the time will not be exact.
     * You can pass in control.millis() if you want the exact time though.
     * @returns A CSV string of the log that was made, the sensors name will be cut-short to its .radioName. "" is returned if no log is made.
     */
    public log(time: number): string {
      this.lastLoggedReading = this.getReading()

      const reading = this.lastLoggedReading.toString().slice(0, READING_PRECISION)

      if (this.isInEventMode) {
        if (sensorEventFunctionLookup[this.config.inequality](this.lastLoggedReading, this.config.comparator)) {
          datalogger.log(
            datalogger.createCV("Sensor", this.getName()),
            datalogger.createCV("Time (ms)", time),
            datalogger.createCV("Reading", reading),
            datalogger.createCV("Event", this.config.inequality + " " + this.config.comparator)
          )
          this.config.measurements -= 1
          return this.getRadioName() + "," + time.toString() + "," + reading + "," + this.config.inequality + " " + this.config.comparator
        }
      }

      else {
        datalogger.log(
          datalogger.createCV("Sensor", this.getName()),
          datalogger.createCV("Time (ms)", time.toString()),
          datalogger.createCV("Reading", reading),
          datalogger.createCV("Event", "N/A")
        )
        this.config.measurements -= 1
        return this.getRadioName() + "," + time.toString() + "," + reading + "," + "N/A"
      }
      return ""
    }
  }
}
