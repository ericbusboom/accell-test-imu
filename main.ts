
// Initialize the array to hold the values
let a: number[]  = [];

servos.P1.setAngle(90)

let run = false;

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
                basic.pause(pause);
                if (callback) {
                    callback(i);
                }
            }
        } else {
            for (let i = start; i > end; i -= step) {
                servo.setAngle(i);
                basic.pause(pause);
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
 * Scales a value from the input range [1024, -1024] to the output range [180, 0].
 * @param input - The value to scale.
 * @returns The scaled value.
 */
function scaleInput(input: number): number {
    // Define the input range
    const inputMin = 1024;
    const inputMax = -1024;

    // Define the output range
    const outputMin = 180;
    const outputMax = 0;

    // Compute the scaled value
    const scaled = ((input - inputMin) / (inputMax - inputMin)) * (outputMax - outputMin) + outputMin;

    return scaled;
}


// Function to add a new value and calculate the running average
function addAndAverage(x: number, l: number = 5) {
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


const ss = mkStepServo(servos.P1, 2, 30, function(angle: number){
    let m = addAndAverage(input.acceleration(Dimension.Y))

    let v = scaleInput(m);

    serial.writeValue("a", angle)
    serial.writeValue("x", v)
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

