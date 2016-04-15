/*global World Sim THREE STWEEN TWEEN WorldSound */

/* BrainingWheels
 * kirk.zurell.name
 */

World = function()
{
    Sim.Object.call(this);
};

World.prototype = new Sim.Object();
World.prototype.constructor = World;

World.prototype.init = function(params)
{
  Sim.Object.prototype.init.apply(this, arguments);


  // World's own collection.
  var world3D = new THREE.Object3D();

  // Sky sphere.
  //var skygeo = new THREE.SphereGeometry(100, 60, 40);
  var skygeo = new THREE.CylinderGeometry(70, 70, 150, 70, 1);

  this.skycolor = new THREE.Color(0,0,0);
  this.skymat = new THREE.MeshLambertMaterial({
    color : new THREE.Color(1.0,1.0,1.0),
    ambient: new THREE.Color(0,0,0),
    emissive : this.skycolor,
    side  : THREE.BackSide
  });

  this.skybox = new THREE.Mesh(skygeo, this.skymat);
  this.skybox.position.set(0,0,0);
  this.skybox.scale.set(1,1,1);
  world3D.add(this.skybox);


  // Sun.
  this.suncolor = new THREE.Color(0.5,0.5,1.0);
  this.sunlight = new THREE.DirectionalLight( this.suncolor, 1 );
  //this.sunlight.shadowCameraVisible = true;
  this.sunlight.position.set(3, 50, 30);
  this.sunlight.target.position.set(0,0,0);
  world3D.add(this.sunlight);


  this.setObject3D(world3D);


  // Connect world to the user input.
  this.model = {
    mood : 0.1,
    energy : 0.1,
    presence : 0.1
  };

  this.modelTween = new STWEEN(this.model, this.jsuniqueId)
    .onUpdate(this.mutateModel)
    .easing(TWEEN.Easing.Quadratic.InOut)
    .to({
      mood : 0.05,
      energy : 0.05,
      presence : 0.05
    }, 3000);


  // Start responding to input.
  this.subscribe(MODEL_MESSAGE, this, this._receiveModel);

};



World.prototype._receiveModel = function(worldModel) {

    var target = {
        mood : worldModel.mood,
        energy : worldModel.energy,
        presence : worldModel.presence
    };

    this.modelTween.to(target, worldModel.loop);

};

World.prototype.mutateModel = function(model, newModel)
{
  // Stub, newModel copied to model.
};


World.prototype.update = function()
{
  // Include children.
  Sim.Object.prototype.update.apply(this, arguments);



  /* HACKABLE: Adjust lights in the scene.
   this.model.[mood/energy/presence] 0.0 - 1.0
   this.sunlight.[Three.js light properties]
   this.skymat.[Three.js material properties]
   */

  var maxIntensity = 1.0;

  var sunIntensity = 1.0 - this.model.energy;
  var sunSaturation = this.model.mood;
  var sunHue = this.model.presence;
  this.sunlight.color.setHSL(sunHue, sunSaturation, sunIntensity);


  var skyIntensity = 1.0 - this.model.energy;
  var skySaturation = 1.0 - this.model.mood;
  var skyHue = this.model.presence;
  this.skymat.color.setHSL(skyHue, skySaturation, skyIntensity);

};
