/*global STWEENCTL TWEEN STWEEN localPerformance */

/* Simple Tweens

 Ensures that tween can accept new target at any time
 new STWEEN(model, "id").to(target, seconds)

 Self-timing using self.performance
 */


/* Uses localPerformance from main.js to separate out for tests. */


var STWEENCTL = STWEENCTL || (
    function()
    {

        return {

            _catalogue : {},

            catalogue : function(newtween, id)
            {
                id = id || Date.now().toString();
                this._catalogue[id] = newtween;
            },

            catalogueRemove : function(id) {

              delete this._catalogue[id];
            },

            update : function()
            {
                var update_time = localPerformance();


                for(var id in this._catalogue) {

                    var tween = this._catalogue[id];

                    // Update
                    tween.update(update_time);

                    // if(Math.random() < 0.01) {
                    //     console.log("tween check : " + tween._lastexpiry + " " + update_time + " " + ((tween._lastexpiry + 10000) < update_time));

                    // If update time is 10 seconds past last expiry, tween is dead.
                    if ((tween._lastexpiry + 10000) < update_time) {
                        //            delete this._catalogue[id];
                    }


                }
            }


        };

    }
)();



STWEEN = function(model, id)
{
    // Reference to model to tween.
    this._model = model;
    this._id = id;

    // Targets to tween toward.
    this._targets = {};

    this._easing = TWEEN.Easing.Quadratic.InOut;

    this._onUpdateFunctions = [];

    this._running = false;

    // Time of last expiry
    this._lastexpiry = Infinity;

    // Add to system-wide catalogue.
    STWEENCTL.catalogue(this, id);
};

STWEEN.prototype = new Object();
STWEEN.prototype.constructor = STWEEN;


STWEEN.prototype.finalize = function() {

  // Eliminate references to other things.
  //this._model = null;

  delete this._targets;
  delete this._onUpdateFunctions;

  STWEENCTL.catalogueRemove(this._id);

};


STWEEN.prototype.to = function(target_obj, trans_time_milliseconds, onComplete)
{
    var tween = this;

    // For use in below, also as key for quick check of each target.
    var begins = localPerformance();
    var expires = begins + trans_time_milliseconds;



    // Tween moves from model at time of .to() to target at expiry.



    // Compile a list of member functions that, given the update time, return the tween value.

    // Member functions: all are run each update, each one addresses its own model member.
    var member_functions = [];


    for (var target_key in target_obj) {
        var starting_model_value = this._model[target_key];
        var starting_target_value = target_obj[target_key];

      //console.assert(!Number.isNaN(starting_model_value), this._id + ":" + target_key + " is NaN");

        var member_func = (function(membername, exp, beg, starting_model_value, starting_target_value) {

            return function(update_time_milliseconds, newmodels, newweights){
                /*
                 Tween
                 start time -> tween time -> end time
                 start model -> value -> end target
                 */

                var t = (exp - update_time_milliseconds);
                if(t < 0) { t = 0; }

                // Calculate where we are in the tween.
                // Remaining.
                var ratio = t / (exp - beg);
                // Elapsed.
                ratio = 1.0 - ratio;
                // Eased.
                ratio = tween._easing(ratio);

                var offset = (starting_target_value - starting_model_value) * ratio;
                var value = starting_model_value + offset;

                // If newmodels does not have an array for new values, supply it.
                if(typeof newmodels[membername] === 'undefined') {
                    newmodels[membername] = [];
                }

                // If newweights does not have an array for new values, supply it.
                if(typeof newweights[membername] === 'undefined') {
                    newweights[membername] = [];
                }

                // Store the new value in the new model.
                newmodels[membername].push(value);

                // Store the new weight in the new weights.
                newweights[membername].push(ratio);

                return value;

            };

        })(target_key, expires, begins, starting_model_value, starting_target_value);

        // Add to list of member functions to run when update happens.
        member_functions.push(member_func);
    }




    /* Create an update function for this target. This function runs the array of member functions. */


    var updatefunc = function(update_time_milliseconds, newmodels, newweights, completed){

        // Do all target functions.
        member_functions.map(function(memfunc){
            memfunc(update_time_milliseconds, newmodels, newweights);
        });

        // Do something on completion.

        if(completed && onComplete) {
            onComplete();
        }

    };

    // Targetfunc receives update time, returns object with tweened
    this._targets[expires] = updatefunc.bind(this);
    this._running = true;

    return this;
};

STWEEN.prototype.easing = function(easing_function)
{
    this._easing = easing_function;
    return this;
};

// OnUpdate handler list, remember to .bind()
STWEEN.prototype.onUpdate = function(onUpdate_function) {
    this._onUpdateFunctions.push(onUpdate_function);
    return this;
};


// Update this tween
STWEEN.prototype.update = function(update_time_milliseconds)
{

    var tween = this;

    var atleastone = false;

    // Each model member key receives an array of new model values to be averaged.
    var newmodels = {};
    // Each model member key receives an array of weights to be weighted.
    var newweights = {};


    // Consider all targets; if expired, remove; if not, process.
    for(var i in this._targets) {
        var expiry = parseFloat(i);

        var expired = update_time_milliseconds > expiry;

        atleastone = atleastone || !expired;

        // Run target updatefunction.
        var updatefunc = this._targets[i];

        updatefunc(update_time_milliseconds, newmodels, newweights, expired);

        if(expired) {

            // Target has expired.

            // Note time of expiry in tween for cleanup.
            this._lastexpiry = expiry; // probably not update_time_milliseconds;

            // Delete expired target.
            delete this._targets[i];


        }

    }

  // Modify model
  if(atleastone) {


        // Copy existing model.
        var newmodel = {};
      Object.keys(this._model).map(function(key){
        console.assert(!Number.isNaN(tween._model[key]),"Setting default NaN " + key);
            newmodel[key] = tween._model[key];
        });



        // Calculate average of new model and assign to existing model.

        averageMemberValues(newmodel, newmodels, newweights);

        // Perform onUpdate handlers.
        this._onUpdateFunctions.map(function(callback){
            callback.call(this, this._model, newmodel);
        }, this);


        // copy Newmodel to existing model.
        Object.keys(newmodel).map(function(key) {
          console.assert(!Number.isNaN(newmodel[key]),"Setting new NaN " + key);
          tween._model[key] = newmodel[key];
        });

    }


    // If not running, do nothing
    //return atleastone /* expired */;
};




function averageMemberValues(model, newmodels, newweights) {

    for(var member_index in newmodels) {

        var member = newmodels[member_index];
        var memberweights = newweights[member_index];

      /*var new_value = member.reduce(function(p, c, i, a){
             return p + c;
         }) / member.length;*/

         var oldvalue = model[member_index];

        var new_value = COG(member, memberweights);

        model[member_index] = new_value;

    }

}
