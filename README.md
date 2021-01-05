Want to control [Roon](https://roonlabs.com/) from your keyboard on linux?  You can run [Roon on Wine](https://github.com/RoPieee/roon-on-wine) which allows you to select albums to play or whatever, but this does not hook up to the standard media controller buttons used on Ubuntu, [MPRIS](https://www.freedesktop.org/wiki/Specifications/mpris-spec/).  

This little script aims to provide a way to have MPRIS (i.e. your linux box) control Roon's basic functions, like Play, Pause, Next and Previous. That's all it does.

# Installation

```
```

# Credits
I based this work off the following packages

* [Roon's API](https://github.com/RoonLabs/node-roon-api)
* [mpris-service](https://github.com/dbusjs/mpris-service)
* [roon-extension-linuxkeyboardremote](https://github.com/naepflin/roon-extension-linuxkeyboardremote) - I used this as a starting point, then added the MPRIS support


# TODO

1. Make this start on system login, possibly with a little icon thingy..
1. Volume Support - Ubuntu uses the volume keys to control its own system volume.  I don't want to subvert that, but it would also be nice to have them control roon volume... not sure what to do here.
1. Remote control support.  This might be more of something for [RoPieee XL](https://ropieee.org/xl/), to allow a BLE remote control to control stuff.