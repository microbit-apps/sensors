namespace sensors {
  type PIDCallbackFn = (response: number) => void;

  //% block="Loop"
  export function loop(
    sensors: Sensor[],
    targets: number[],
    callbacks: PIDCallbackFn[],
    waitTimeSeconds: number = 1,
    logData: boolean = true
  ) {
    const pGains: number[] = sensors.map(sensor => (1 / sensor.range) * 25);
    const iGains: number[] = sensors.map(sensor => (1 / sensor.range) * 1);
    const dGains: number[] = sensors.map(sensor => (1 / sensor.range) * 1);
    const iMax: number[] = sensors.map(sensor => (1 / sensor.range) * 50)

    let readings: number[] = [];
    let responses: number[];

    let errors: number[];
    let priorErrors: number[] = sensors.map(_ => 0);

    let proportionals: number[];
    let derivatives: number[];
    let integrals: number[] = sensors.map(_ => 0);

    while (true) {
      readings = sensors.map((sensor) => sensor.reading)
      errors = readings.map((reading, index) => targets[index] - reading)

      proportionals = errors
      derivatives = errors.map((error, index) => (error - priorErrors[index]) / waitTimeSeconds)
      integrals = integrals.map((integral, index) => Math.min(iMax[index], (integral + errors[index]) * waitTimeSeconds))

      responses = sensors.map((error, index) =>
        (pGains[index] * proportionals[index]) + (iGains[index] * integrals[index]) + (dGains[index] * derivatives[index])
      )

      if (logData)
        sensors.forEach((sensor, index) =>
          datalogger.log(
            datalogger.createCV("Sensor", sensor.name),
            datalogger.createCV("Target", Math.roundWithPrecision(targets[index], 2)),
            datalogger.createCV("Reading", Math.roundWithPrecision(readings[index], 2)),
            datalogger.createCV("Error", Math.roundWithPrecision(errors[index], 2)),
          )
        )

      callbacks.forEach((callback, index) => callback(responses[index]))
      priorErrors = errors
      basic.pause(waitTimeSeconds * 1000)
    }
  }
}
