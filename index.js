"use strict";

const RoonApi = require("node-roon-api");
const RoonApiTransport = require("node-roon-api-transport");
const RoonApiSettings  = require("node-roon-api-settings");
const Player = require('mpris-service');
const yargs = require('yargs')


const argv = yargs
    .option('core', {
        alias: 'c',
        description: 'Hostname to connect to, rather than using Roon discovery',
        type: 'string'
    })
    .option('port', {
        alias: 'p',
        description: 'The port to connect to when connecting directly to a host',
        type: 'number',
        default: 9100
    })
    .option('log', {
        alias: 'l',
        description: 'The amount of Roon logging to output',
        type: 'string',
        default: 'none'
    })
    .help()
    .alias('help', 'h')
    .argv;

var core;
var zone;

function zoneChanged(new_zone) {
    zone = new_zone;
    console.log();
    var url = core.moo.transport.ws._url.substring(5);
    mpris.metadata = {
        'mpris:length': zone.now_playing.length * 1000 * 1000, // In microseconds
        'mpris:artUrl': `http://${url}/image/${zone.now_playing.image_key}`,
        'xesam:title': zone.now_playing.three_line.line1,
        'xesam:album': zone.now_playing.three_line.line3,
        'xesam:artist': zone.now_playing.three_line.line2.split(/\s+\/\s+/),
    }
    mpris.playbackStatus = zone.state.charAt(0).toUpperCase() + zone.state.slice(1); 
    mpris.canGoNext = zone.is_next_allowed;
    mpris.canGoPrevious = zone.is_next_allowed;
    // mpris.canPlay = zone.is_play_allowed; // the ubuntu dock disappears if it is set to false (while playing)
    mpris.canPause = zone.is_pause_allowed;
    mpris.canSeek = zone.is_seek_allowed;
    console.log(zone);
}

function setSeek(seek) {
    // The zone object is automatically updated as the events come in, so there's no need to update it.
    // console.log(zone);
    mpris.position = seek * 1000 * 1000;
}


const roon = new RoonApi({
    extension_id:        'com.8bitcloud.roon-mpris',
    display_name:        "MPRIS adapter",
    display_version:     "1.0.0",
    log_level:           argv.log,
    publisher:           'Bruce Cooper',
    email:               'bruce@brucecooper.net',
    website:             'https://github.com/brucejcooper/roon-mpris',
    core_paired: function(core_) {
      core = core_;

      
   
      let transport = core.services.RoonApiTransport;
      transport.subscribe_zones(function(cmd, data) {

        var zones = data.zones_changed || data.zones;

        if (zones) {
            for (var candidate of zones) {
                if (candidate.display_name === mysettings.zone.name) {
                    zoneChanged(candidate);
                }
            }
        } else if (data.zones_seek_changed) {
            for (var change of data.zones_seek_changed) {
                if (change.zone_id === zone.zone_id) {
                    setSeek(change);
                }
            }
        } else {
            console.log(core.core_id,
                core.display_name,
                core.display_version,
                "-",
                cmd,
                JSON.stringify(data, null, '  ')
              );      
        }
  
      });
    },
    core_unpaired: function(core_) {
      core = core_;
      console.log(core.core_id,
        core.display_name,
        core.display_version,
        "-",
        "LOST"
      );
      core = undefined;
    },
});


var mysettings = roon.load_config("settings") || {
    zone: null,
};


function makelayout(settings) {
    var l = {
        values:    settings,
        layout:    [],
        has_error: false
    };
  
    l.layout.push({
        type:    "zone",
        title:   "Zone",
        setting: "zone",
    });  
    return l;
}
  

const svc_settings = new RoonApiSettings(roon, {
    get_settings: function(cb) {
      cb(makelayout(mysettings));
    },
    save_settings: function(req, isdryrun, settings) {
      let l = makelayout(settings.values);
      req.send_complete(l.has_error ? "NotValid" : "Success", { settings: l });
  
      if (!isdryrun && !l.has_error) {
        mysettings = l.values;
        svc_settings.update_settings(l);
        roon.save_config("settings", mysettings);
      }
    }
});
  
roon.init_services({
    required_services: [ RoonApiTransport ],
    provided_services:   [ svc_settings ],
});
  

// My Work laptop blocks UDP by default, so we use the direct connect method
if (argv.core) {
    console.log(`Connecting to Core at ws://${argv.core}:${argv.port}`)
    roon.ws_connect({ host: argv.core, port: argv.port});
} else {
    roon.start_discovery();

}


var mpris = Player({
	name: 'roon',
	identity: 'Roon',
	supportedUriSchemes: ['file'],
	supportedMimeTypes: ['audio/mpeg', 'application/ogg'],
	supportedInterfaces: ['player']
});

mpris.getPosition = function() {
  // return the position of your player
  console.log("asking for position")
  return zone ? zone.now_playing.seek_position * 1000 * 1000 : 0;
}

// Events
var events = ['raise', 'quit', 'pause', 'play', 'seek', 'position', 'open', 'volume', 'loopStatus', 'shuffle'];
events.forEach(function (eventName) {
	mpris.on(eventName, function () {
		console.log('Event:', eventName, arguments);
	});
});

['playpause', 'stop', 'next', 'previous'].forEach(function (eventName) {
    mpris.on(eventName,  () => {
        console.log("Executing event", eventName);
        core.services.RoonApiTransport.control(mysettings.zone, eventName)
    });
});


mpris.on('quit', function () {
	process.exit();
});