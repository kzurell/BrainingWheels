/* BrainingWheels
 * kirk.zurell.name
 */


/* Entrypoint.

 */


// Get the div that will hold the animation.
var container = document.getElementById("container");

// Add the BrainingWheels app (Sim.js)
var app = new BWApp();
app.init({ container: container });
app.run();


console.log("Completed loading.");
