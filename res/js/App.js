/* BrainingWheels
 * kirk.zurell.name
 */

/* Application object */

/* Initialization */
var allInitResolve = function(){};
var allInit = new Promise(function(resolve) {
  allInitResolve = resolve;
});

allInit.then(function(app) {
  // Control indicators
  app.subscribe('control', app, function() {
    /* Perhaps update control indicators? */
  });
});


BWApp = function() {
  //Sim.App.apply(this, arguments);
};

BWApp.prototype = new Sim.App();
BWApp.prototype.constructor = BWApp;


/* Application object methods */

BWApp.prototype.init = function(params) {
  Sim.App.prototype.init.apply(this, arguments);

  var app = this;

  allInitResolve(app);


  /* TOD for all components */
  app.clock = new THREE.Clock(true);


  /* Rendering setup */

  app.renderer.setClearColor(0x100000, 0);


  /* Connect to input, will publish its own model. */
  this.modelSource = new ModelSource();
  this.modelSource.init({});


  /* HACKABLE: OBJECTS SETUP

   All objects here are created only once at app start.

   */


  // Position camera.
  //this.camera.rotation.set(0,0,0.5*Math.PI);
  //this.camera.position.set(0,6,5);
  this.camera.position.set(0,2,25);


  /* World */

  var world = new World();
  world.init({});
  app.addObject(world);


  /* Something to look at. */
  var sphere = new Sphere();
  sphere.init({});
  app.addObject( sphere );


  /* App.run() gets called eventually. */

};


BWApp.prototype.update = function()
{
  STWEENCTL.update(/* self timing */);
  // Update objects based on tweens.
  Sim.App.prototype.update.call(this);

};
