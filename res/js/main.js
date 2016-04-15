/* App

 */


// Global constants.
var MODEL_MESSAGE = 'model';
var CONTROL_MESSAGE = 'control';


// Get the div that will hold the animation.
var container = document.getElementById("container");

// Add the BrainingWheels app (Sim.js)
var app = new BWApp();
app.init({ container: container });
app.run();


console.log("Completed loading.");
