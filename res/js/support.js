/* Finds Centre of Gravity for an array of factors and weights.
 *
 */
function COG(arrayOfFactors, arrayOfWeights) {

    var totalMoments = 0;
    var totalWeights = 0;

    arrayOfFactors.map(function(each, index, arr) {
        var weight = arrayOfWeights[index];
        totalMoments += each * weight;
        totalWeights += weight;
    });

    return totalMoments / totalWeights;
};


/* Tweening support */
var localPerformance = function() {
  // self.performance.now
  return window.performance.now();
};

/* SUPPORT ROUTINES */
Math.clip = function(number, min, max) {
  return Math.max(min, Math.min(number, max));
};
