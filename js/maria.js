/**
 * Helpers and tools to ease your JavaScript day.
 *
 * @author Maria Jonsson
 */
window.Maria = (function(window, document, undefined ) {
  var Maria = {};

  //Get a random number between a max and min
  Maria.random = function(min, max) {
    return Math.floor(Math.random()*(max+1-min)+min);
  }  
  
  //Get an array of a certain size containing random numbers
  Maria.getRandomArray = function(arrsize) {
  	  var roundarray = [];
  	  for (i=0; i<arrsize; i++) {
  	   roundarray[i] = Maria.random(0,36);
  	  }
  	  console.log(roundarray);
  	  return roundarray;
  }

  Maria.validateEmail = function(email) {
  var re = /^.+@.+\..+$/;
  return re.test(email);
  };
  
  
  // Checks if an array contains the value and returns true or false.
  Maria.arrayContains = function (array, value) {
      if (array.indexOf(value) !== -1) {
        return true;
   }
   else {
        return false;
   }
  }
  
  
    // Expose public methods
  return Maria;
  
})(window, window.document);