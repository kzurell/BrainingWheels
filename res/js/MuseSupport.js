/*global MuseSupport CreateMuseSupport MuseSupportSingleton osc chrome */

/* MUSE ROUTINES */

MuseSupport = function() {
    this.osclisteners = [];
    this.muselisteners = [];
    this.port = null;
};

MuseSupport.prototype = new Object();
MuseSupport.prototype.constructor = MuseSupport;

MuseSupport.prototype.addOscListener = function(listener) {
    this.osclisteners.push(listener);
};

MuseSupport.prototype.addMuseListener = function(listener) {
    this.muselisteners.push(listener);
};

MuseSupport.prototype.init = function(params) {

    var museSupport = this;

    // To keep promise around.
    museSupport.portpromise = new Promise(this._init.bind(this)).then(function(port){
        console.log("Muse Support initializing");
        console.dir(port);
        museSupport.port = port;
    });

    // chrome.sockets check?

};


MuseSupport.prototype._init = function(resolve, reject) {

  var musesupport = this;

  try {

    // UDP port from muse-io.
    var port = new osc.UDPPort({
        localAddress: "127.0.0.1",
        localPort: 57121
    });

    var elementsPattern = /\/muse\/elements\/(.+)/;

    port.on("message", function(message){
        musesupport.muselisteners.map(function(listener) {
            listener(message);
        });
    });

    port.on("error", function (err) {
        console.log("MuseSupport error: ");
        console.dir(err);
        musesupport.osclisteners.map(function(listener) {
            listener(err);
        });
    });


    port.open();

    resolve(port);

  }
  catch (portex)
  {
    console.error("Failed to open UDP port");
    console.dir(portex);
  }


};
