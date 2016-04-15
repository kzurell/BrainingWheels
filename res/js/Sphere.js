Sphere = function()
{
  this.params = {};

  Sim.Object.call(this);
};

Sphere.prototype = new Sim.Object();
Sphere.prototype.constructor = Sphere;

Sphere.prototype.init = function(params)
{
  Sim.Object.prototype.init.apply(this, arguments);


  this.model = {
    mood : 0.0,
    energy : 0.0,
    presence : 0.0
  };


  /* Sphere */

  this.geometry = new THREE.SphereGeometry( 10, 16, 16 );


  this.material = new THREE.MeshLambertMaterial({color: 0xFF1111});


  var mesh = new THREE.Mesh( this.geometry, this.material );


  this.setObject3D(mesh);
  this.setPosition(0,0,0);
  this.setScale(0.1,0.1,0.1);


  // Circadian rhythm.
  this.modelTween = new STWEEN(this.model, this.jsuniqueId)
  // On all updates, mutate this object's model
  .onUpdate(this.mutateModel.bind(this))
  // Initial growth spurt.
  .to({
      mood : 0.05,
      energy : 0.05,
      presence : 0.05
  }, 3000);
  ;

  this.subscribe(MODEL_MESSAGE, this, this._receiveModel);

  console.debug("Sphere created.");

};


Sphere.prototype._receiveModel = function(worldModel)
{
  // Strip out loop
  var loop = worldModel.loop;
  delete worldModel.loop;

  // Set target
  if(this.modelTween) {
    this.modelTween.to(worldModel, loop);
  }
};

Sphere.prototype.mutateModel = function(model, newModel)
{
  // Stub, newModel copied to model.
};


Sphere.prototype.update = function()
{
  Sim.Object.prototype.update.apply(this, arguments);

  var sphere = this;

  var g = Math.clip(this.model.energy, 0.01, 1.0);
  sphere.setScale(g,g,g);

  var intensity = 1.0 - this.model.energy;
  var saturation = this.model.mood;
  var hue = this.model.presence;

  this.material.color.setHSL(hue, saturation, intensity);
};
