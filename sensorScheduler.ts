namespace sensors {
  /**
   * An object that implements this interface can be (optionally) passed to the SensorScheduler to invoke this callback after each log.
   * At the end of logging an empty string is passed to the callback. Please note that "" is also what is returned by sensor.log() if no data is logged.
   * TODO: Change the final callback("") to callback("DONE") or similar to avoid ambiguity.
   */
  export interface ISensorSchedulerCallBackObj {
    callback(loggedRow: string): void;
  }

  /**
   * Responsible for making an array of sensors with configurations read & log their data accurately.
   * This class is used by both the DataRecorder (when an Arcade Shield is connected), and by a microbit without an Arcade Shield (see DistributedLoggingProtocol).
   * The scheduler runs in a separate thread and accounts for sensors with different numbers of measurements, periods and events.
   * see .start()
   */
  export class SensorScheduler {
    /** Sensors and their waitTime, ordered by ascending periods */
    private schedule: { sensor: Sensor, waitTime: number }[];

    /** These are configured sensors that will be scheduled upon. */
    private sensors: Sensor[];

    /** This class can be used evven if an Arcade Shield is not connected; the 5x5 matrix will display the number of measurements for the sensor with the most time left if this is the case */
    private sensorWithMostTimeLeft: Sensor;

    /** Should the information from the sensorWithMostTimeLeft be shown on the basic's 5x5 LED matrix? */
    private showOnLEDMatrixWhenDone: boolean = false;

    /** A flag that is mutated by stop() to prematurely terminate logging. */
    private continueLogging: boolean;

    constructor(sensors: Sensor[], showOnBasicScreen?: boolean) {
      this.schedule = []
      this.sensors = sensors

      if (showOnBasicScreen != null)
        this.showOnLEDMatrixWhenDone = showOnBasicScreen

      // Get the sensor that will take the longest to complete:
      // The number of measurements this sensor has left is displayed on the microbit 5x5 led grid; when the Arcade Shield is not connected.
      this.sensorWithMostTimeLeft = sensors[0]
      let mostTimeLeft = this.sensorWithMostTimeLeft.totalMeasurements * this.sensorWithMostTimeLeft.period

      this.sensors.forEach(sensor => {
        if ((sensor.totalMeasurements * sensor.period) > mostTimeLeft) {
          mostTimeLeft = sensor.totalMeasurements * sensor.period
          this.sensorWithMostTimeLeft = sensor
        }
      })

      this.continueLogging = true;

      // Setup schedule so that periods are in order ascending
      sensors.sort((a, b) => a.period - b.period)
      this.schedule = sensors.map((sensor) => { return { sensor, waitTime: sensor.period } })
    }

    //--------------------------
    // Public interface methods:
    //--------------------------

    public loggingComplete(): boolean { return !(this.schedule.length > 0) }


    /**
    * Request early termination of logging.
    * This doesn't happen immediately since the scheduler is sleeping between checks, but it will prevent further logging.
    */
    public stop() {
      this.continueLogging = false;
    }

    /**
     * Schedules the sensors and orders them to .log()
     * Runs within a separate fiber in the background.
     * 
     * Time it takes for this algorithm to run is accounted for when calculating how long to wait inbetween logs
     * Mutates this.schedule
     * 
     * Temp disabled elements relating to callbackObj (no mem)
     * @param callbackObj (optionally) can be used after each log after the algorithm finishes a callback will be made, see ISensorSchedulerCallBackObj.
    */
    public start(callbackObj?: ISensorSchedulerCallBackObj) {
      const callbackAfterLog: boolean = (callbackObj == null) ? false : true

      control.inBackground(() => {
        let currentTime = 0;

        // Log all sensors once:
        for (let i = 0; i < this.schedule.length; i++) {
          if (this.showOnLEDMatrixWhenDone && this.schedule[i].sensor == this.sensorWithMostTimeLeft)
            basic.showNumber(this.sensorWithMostTimeLeft.measurements)

          // Make the datalogger log the data:
          const logAsCSV = this.schedule[i].sensor.log(0)

          // Optionally inform the caller of the log (In the case of the DistributedLoggingProtocol this information can be forwarded to the Commander over radio)
          if (callbackAfterLog)
            callbackObj.callback(logAsCSV)

          // Clear from schedule (A sensor may only have 1 reading):
          if (!this.schedule[i].sensor.hasMeasurements())
            this.schedule.splice(i, 1);
        }


        let lastLogTime = input.runningTime()

        while (this.schedule.length > 0) {
          const nextLogTime = this.schedule[0].waitTime;
          const sleepTime = nextLogTime - currentTime;


          // Wait the required period, discount operation time, in 100ms chunks
          // Check if there last been a request to stop logging each chunk

          const pauseTime = sleepTime + lastLogTime - input.runningTime() // Discount for operation time
          for (let i = 0; i < pauseTime; i += 100) {
            if (!this.continueLogging) {
              return
            }
            basic.pause(100)
          }
          basic.pause(pauseTime % 100)

          if (!this.continueLogging)
            break;

          lastLogTime = input.runningTime()
          currentTime += sleepTime

          for (let i = 0; i < this.schedule.length; i++) {
            // Clear from schedule:
            if (!this.schedule[i].sensor.hasMeasurements()) {
              this.schedule.splice(i, 1);
            }

            // Log sensors:
            else if (currentTime % this.schedule[i].waitTime == 0) {
              if (this.showOnLEDMatrixWhenDone && this.schedule[i].sensor == this.sensorWithMostTimeLeft)
                basic.showNumber(this.sensorWithMostTimeLeft.measurements)

              // Make the datalogger log the data:
              const logAsCSV = this.schedule[i].sensor.log(currentTime)

              // Optionally inform the caller of the log (In the case of the DistributedLoggingProtocol this information can be forwarded to the Commander over radio)
              if (callbackAfterLog)
                callbackObj.callback(logAsCSV)

              // Update schedule with when they should next be logged:
              if (this.schedule[i].sensor.hasMeasurements()) {
                this.schedule[i].waitTime = nextLogTime + this.schedule[i].sensor.period
              }
            }
          }

          // Ensure the schedule remains ordely after these potential deletions & recalculations:
          this.schedule.sort((
            a: { sensor: Sensor; waitTime: number; },
            b: { sensor: Sensor; waitTime: number; }) =>
            a.waitTime - b.waitTime
          )
        }

        // Done:
        if (this.showOnLEDMatrixWhenDone) {
          basic.showLeds(
            `. . . . .
                . # . # .
                . . . . .
                #. . . #
                . # # #.`
          )
        }

        if (callbackAfterLog) {
          callbackObj.callback("")
        }
      })
    }
  }
}
