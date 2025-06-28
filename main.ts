
// Initialize the array to hold the values
let a: number[]  = [];

servos.P1.setAngle(90)

let run = false;


// Function to add a new value and calculate the running average
function addAndAverage(x: number, l: number = 20) {
    // Add the new value to the end
    a.push(x);

    if (a.length > l) {
        a.shift();
    }

    // Calculate the sum
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
        sum += a[i];
    }

    // Calculate the average
    let average = sum / a.length;

    // Return the average
    return average;
}

function degToRad(degrees: number): number {
    return degrees * (Math.PI / 180);
}

function busyWait(durationUs: number, callback: () => void) {
    const start = control.micros();
    const intervalUs = 20;
    let lastCallback = start;

    while (true) {
        const now = control.micros();
        const elapsed = now - start;

        if (elapsed >= durationUs) {
            break;
        }

        if (now - lastCallback >= intervalUs) {
            callback();
            lastCallback = now;
        }

        // Optionally do a short wait to reduce CPU heating,
        // but note this introduces jitter:
        // control.waitMicros(1);
    }
}

function mkStepServo(
    servo: servos.PinServo,
    step: number,
    pause: number,
    callback?: (angle: number) => void  // optional callback
): (start: number, end: number) => void {
    return function (start: number, end: number) {
        step = Math.abs(step);

        if (start <= end) {
            for (let i = start; i < end; i += step) {
                servo.setAngle(i);
                busyWait(pause*1000, function(){
                    addAndAverage(input.acceleration(Dimension.X))
                })
                if (callback) {
                    callback(i);
                }
            }
        } else {
            for (let i = start; i > end; i -= step) {
                servo.setAngle(i);
                busyWait(pause*1000, function () {
                    addAndAverage(input.acceleration(Dimension.X))
                })
                if (callback) {
                    callback(i);
                }
            }
        }
    };

}


input.onButtonPressed(Button.A, function () {
    run = !run
})

/**
 * Creates a scaling function that maps an input range to an output range.
 * The returned function closes over the provided ranges.
 *
 * @param inputMin - Minimum of input range.
 * @param inputMax - Maximum of input range.
 * @param outputMin - Minimum of output range.
 * @param outputMax - Maximum of output range.
 * @returns A function that scales an input number.
 */
function makeScaler(
    inputMin: number,
    inputMax: number,
    outputMin: number,
    outputMax: number
): (input: number) => number {
    // This inner function will have access to inputMin, inputMax, outputMin, outputMax
    return function (input: number): number {
        return ((input - inputMin) / (inputMax - inputMin)) * (outputMax - outputMin) + outputMin;
    };
}



const imuScaler = makeScaler(1024, -1024, -1, 1);

let meanAccel = 0;

const ss = mkStepServo(servos.P1, 2, 100, function(angle: number){

    // This is actually a 360 degree servo
    angle *= 2

    meanAccel = addAndAverage(input.acceleration(Dimension.X))
    let v = imuScaler(meanAccel);

    let a_r = degToRad(angle)

    serial.writeValue("c", Math.cos(a_r))
    serial.writeValue("x", v)
    serial.writeValue("diff", v - Math.cos(a_r))
})



basic.forever(function () {
    if (!run) {
        return
    }

    ss(90, 180);
    ss(180, 0);
    ss( 0, 90);

    run = false

})

