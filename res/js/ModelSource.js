var enn = 5;

var PATH_CONCENTRATION = '/muse/elements/experimental/concentration';
var PATH_MELLOW = '/muse/elements/experimental/mellow';
var PATH_CLENCH = '/muse/elements/jaw_clench';
var PATH_BLINK = '/muse/elements/blink';


/* Interface for all Muse factors

 Factor keeps a series of samples of whatever value.

 .metric is average sample / range.

 .post(message) to incorporate a new value.

 Weight is 1.0 - ( range - smallest_range ) / ( largest_range - smallest_range )

 */

FactorSource = function(defaultSample, defaultMin, defaultMax) {

  // Samples.
  this.samples = new Array();
  for (var count = 0; count < enn; count++) {
	this.samples.push(defaultSample);
  }
  this.samples[0] = defaultMin;
  this.samples[enn - 1] = defaultMax;

  // Default results.
  this.metric = (defaultSample - defaultMin) / (defaultMax - defaultMin) ;
  //this.weight = 0.5;
};


FactorSource.prototype.post = function(message) {

  console.assert(typeof message.args[0] == 'number', "Message args[0] not a number " + message.args[0]);

  // Sample value, kludge.
  var sample = message.args[0];

  // Store it.
  var slot = Math.floor(Math.random() * enn);
  this.samples[slot] = sample;

  // Metric within current range.
  var largestSample = 0;
  var smallestSample = Infinity;
  var total = this.samples.reduce(function(sum, each) {
	largestSample = each > largestSample ? each : largestSample;
	smallestSample = each < smallestSample ? each : smallestSample;
	return sum + each;
  }, 0); // To ensure side effects happen to all samples.
  var average = total / enn;

  // Range of samples.
  var range = (largestSample - smallestSample);


  var metric = 1.0; // Sensible default. Number.EPSILON?
  if(range > 0) {
	metric = (average - smallestSample) / range;
  }

  console.assert(metric <= 1.0 && metric > 0.0,
		         "Metric out of bounds:"
		         + "\nmetric    "
		         + metric
		         + "\naverage   "
		         + average
		         + "\nrange     "
		         + range
		         + "\n largest  "
		         + largestSample
		         + "\n smallest "
		         + smallestSample
		         + "\nsamples   " + this.samples.join(' '));

  this.metric = metric;

};



/* A logical input source for Muse sense data.
 * Abstracts the Muse, this becomes the brain model.
 * - Distinguishes between control and data messages from Muse.
 * - Keeps time.
 */

ModelSource = function() {

  /* Collect possible paths */
  this.mindState = {};
  this.mindState[PATH_CONCENTRATION] = new FactorSource(0.5, 0, 1.0);
  this.mindState[PATH_MELLOW] = new FactorSource(0.5, 0, 1.0);
  this.mindState[PATH_CLENCH] = new FactorSource(5, 1, 10); // Samples in seconds.
  this.mindState[PATH_BLINK] = new FactorSource(1, 0, 2.0); // Samples in seconds.

  this.controlState = {
	live: 0,
	is_good: [0,0,0,0],
	forehead: 0
  };
  this.muse = null;

};

ModelSource.prototype = new Sim.Publisher;
ModelSource.prototype.constructor = ModelSource;


ModelSource.prototype.init = function() {

  var modelSource = this;

  // For use in rate-of-event calculation.
  this.clenchClock = new THREE.Clock(true);
  this.blinkClock = new THREE.Clock(true);
  this.clock = new THREE.Clock(true);


  // Create connection to Muse.
  var muse = new MuseSupport();
  muse.init({});
  this.muse = muse;

  var modelListener = this.processMessage.bind(this);
  this.muse.addMuseListener(modelListener);


  //var fakeInput = window.setInterval(function(){
    //if(modelSource.controlState.live == 0) {
      //modelSource.fakeMessage();
    //}
  //}, 400);

  // enough to allow this to execute?
  //var cto = window.setInterval(modelSource.payload.bind(modelSource), 3000);

  // Set off Circadian rhythm.
  modelSource.circadian();

};

/* Circadian rhythm: set, and vary the update cycle

 */

ModelSource.prototype.circadian = function()
{
  var loop = 3000;
  var modelSource = this;

  // Call the world, let know how long the loop will be.
  modelSource.payload(loop);

  window.setTimeout(modelSource.circadian.bind(modelSource), loop);
};


/* Pass the completed model to the animation.
 *
 */

ModelSource.prototype.payload = function(loop) {

    var modelSource = this;


    /* Update display of control information. */

    modelSource.publish(CONTROL_MESSAGE, modelSource.controlState);


    /* Main model */


    /* Centre of Gravity model
     *
     * COG is:
     * metric is of average sample from 0 to 1,
     * weight is calculation-specific
     *
     * metric = (sample1 + sample2 + samplen) / n
     * weight = 1.0 - (largestMetric - smallestMetric)
     * moment = metric * weight
     * totalMoments = moment1 + moment2 + momentn
     * totalWeights = weight1 + weight2 + weightn
     * COGMetric = totalMoments / totalWeights;

     * Was:
     var mood = avgmellow * avgconcentration;
     var energy = 1.0 - avgmellow;
     var presence = avgconcentration;
     */



    /* Mood:

     */
    var moodFactors = [
	  modelSource.mindState[PATH_BLINK].metric,
	  modelSource.mindState[PATH_CLENCH].metric,
	  modelSource.mindState[PATH_MELLOW].metric
    ];
    var moodWeights = [
		0.25,
		0.25,
		1.0
    ];
    var mood = COG(moodFactors, moodWeights);
	//mood = modelSource.mindState[PATH_MELLOW].metric;


    /* Energy:

     */
    var energy = COG([
	  modelSource.mindState[PATH_CONCENTRATION].metric,
	  modelSource.mindState[PATH_BLINK].metric
    ], [
	    1.0,
	    0.25
    ]);
    //energy = modelSource.mindState[PATH_CONCENTRATION].metric;
	//energy = 0.1;


    /* Presence:

     */
    var presence = COG([
	  modelSource.mindState[PATH_CONCENTRATION].metric,
	  modelSource.mindState[PATH_MELLOW].metric,
	  modelSource.mindState[PATH_BLINK].metric
    ], [
	    0.8,
	    1.0,
	    0.5
    ]);
    //presence = modelSource.mindState[PATH_MELLOW].metric;
    //presence = 0.1;
	//presence = modelSource.mindState[PATH_CONCENTRATION].metric;



  /* Share model with world */

  console.debug("Model Mood: " + mood + ", Energy: " + energy + ", Presence: " + presence);

  modelSource.publish(MODEL_MESSAGE, {
	mood : mood,
	energy : energy,
	presence : presence,
    loop : loop
  });

};


/* Receive data and control input direct from Muse.
 * Not errors.
 *
 */

ModelSource.prototype.processMessage = function(message) {

  // We're live!
  this.controlState.live = true;

  /* Divide messages to mind and control. */

  switch(message.address) {

  case '/muse/elements/experimental/concentration':
  case '/muse/elements/experimental/mellow':
	// Rate control.
	if(Math.random() > 0.1) return;
	//console.log( message.address + " " + message.args[0]);
	this.mindMessage(message);
	break;


  // Substitute time for t/f
  case '/muse/elements/blink':
	if(message.args[0] == true) {
	  message.args[0] = this.blinkClock.getDelta();
	  this.mindMessage(message);
	}
	break;
  case '/muse/elements/jaw_clench':
	if(message.args[0] == true) {
	  message.args[0] = this.clenchClock.getDelta();
	  this.mindMessage(message);
	}
	break;


  case '/muse/elements/touching_forehead':
  case '/muse/elements/is_good':
	this.controlMessage(message);
	break;

  }


};


/* For use by processMessage() and fakeMessage() */

ModelSource.prototype.mindMessage = function(message) {

  var index = message.address;
  this.mindState[index].post(message);

};


ModelSource.prototype.controlMessage = function(message) {

  switch(message.address) {

  case '/muse/elements/touching_forehead':
	// Put forehead in centre of status indicator.
	this.controlState.forehead = message.args[0];
	break;

  case '/muse/elements/is_good':
	// Put contact sensors in status indicator.
	this.controlState.is_good = message.args;
	break;

  }

};



/* Call this method to create fake input data */

ModelSource.prototype.fakeMessage = function ()
{
  console.debug("Fake input data:");

  // Input is not live, supply random data until something happens.
  /*
   var timeangle = clock.getElapsedTime() % 10 / 10 * Math.PI * 2;
   var concentration = ( Math.sin(timeangle)  + 1 ) / 2;
   var mellow = ( Math.cos(timeangle) + 1 ) / 2;
   */

  /* Random factors, within a narrow idle range. */

  // var concentration = 0.10 + (Math.random() * 0.20 - 0.10);
  // var mellow = 0.10 + (Math.random() * 0.20 - 0.10);
  var blink = Math.random() < 0.05;
  var clench = Math.random() < 0.025;

  /* Quasi random, cyclical */

  var time = this.clock.getElapsedTime();

  var one = (Math.sin(time % 3 / 3 * Math.PI * 2) + 1) / 2;
  var two = (Math.sin(time % 11 / 11 * Math.PI * 2) + 1) / 2;
  var three = (Math.sin(time % 37 / 37 * Math.PI * 2) + 1 ) / 2;
  var concentration = (one + two) / 2.0;


  var four = (Math.sin(time % 5 / 5 * Math.PI * 2) + 1) / 2;
  var five = (Math.sin(time % 13 / 13 * Math.PI * 2) + 1) / 2;
  var six = (Math.sin(time % 47 / 47 * Math.PI * 2) + 1 ) / 2;
  var mellow = (four + five) / 2.0;
  //mellow = Math.clip(mellow + 0.3, 0, 1);

  //console.info("fake conc " + concentration + " mellow " + mellow);


  /* Constant concentration & mellow events. */
  this.mindMessage.call(this, {
	address: "/muse/elements/experimental/concentration",
	args: [concentration]
  });
  this.mindMessage.call(this, {
	address: "/muse/elements/experimental/mellow",
	args: [mellow]
  });


  /* Occasional blink and clench events */
  if(blink) {
	this.mindMessage.call(this, {
	  address: "/muse/elements/blink",
	  args: [this.blinkClock.getDelta()]
	});
  }
  if(clench) {
	this.mindMessage.call(this, {
	  address: "/muse/elements/jaw_clench",
	  args: [this.clenchClock.getDelta()]
	});
  }


};
