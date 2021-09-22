# Bitwig Control for Electra One

This **Control Script** for *Bitwig* allows **Remote Control Pages** to be controlled by *Electra One*. It has the following features:

- Operates as any *Bitwig* **Remote Control Script**, it follows the current device (any), and maps 8 controls (per page), so that *Electra One* reflects the current parameter values, and allow to control them seamlessly bi-directional (without value jumps)
- It reflects the current parameter names (assignments) as control labels on *Electra One*.
- It uses high-res (14-bit) MIDI so that even meticulous parameters changes will transmitted and received. This thanks to *Electra One*'s a very balanced tuning of control handling. Due to this one can do (i.e. with a 'Feedback' parameter on a 0.0 % to 100.0 % scale) little steps like 63.1%, 63.2%, 63.3%, 63.4%. While on a standard low-res (7-bit) MIDI setup this would result in value jumps like 62.5%, 63.3%, 64.1%, 64.8% (very sad I think 😐).

## History

### v1.09
Some more features on Send: now it shows Pre-fader (blue) or Post-fader (yellow) indicator
Combined Device & Track page called "Combined" (for now)
### v1.08
Initial work on a second page called **Track**, wich should allows acces to all track related things, like sends.
### v1.06
Some better settings handling. Default MIDI portnames for Windows added (thanks to *Kirkwood West*).
### v1.05
Fixes bug in fetching the number of Quick Access buttons from settings
### v1.04
Quick Access to Pages (the number of which can be set in the settings)
### v1.03
Added protection agains using the **Control Script** together with any preset other than "**Bitwig Control**". Without the protection, this **Control Script** would set arbitrary labels in the other preset. This mechanism depends on this naming now, so make sure you call your custom preset as sprecified in the settings (defaults to "**Bitwig Control**").
### v1.00
Initial release

## Installation

To use this setup, copy the **Electra One.control.js** file to **~/Documents/Bitwig Studio/Controller Scripts** (on Mac, please inform me of the Windows/Linux paths of you know). Make sure the **Bitwig Control** preset is loaded in your *Electra One*. Now add the Control Script in Bitwig by going to **Preferences** -> **Settings** -> **Controllers** -> **Add Controller**, and choose **Bonboa** -> **Electra One Control**. It should be setup correctly by default, but the ports should be like this:

#### for Mac
- (in) **Electra Controller Electra Port 1**
- (in) **Electra Controller Electra CTRL**
- (out) **Electra Controller Electra Port 1**
- (out) **Electra Controller Electra CTRL**

#### for Windows
- (in) **Electra Controller**
- (in) **MIDIIN3 (Electra Controller)**
- (out) **Electra Controller**
- (out) **MIDIOUT3 (Electra Controller)**

(This should be default on Mac and Windows, I don't know the port naming on Linux, if anyone knows, please give me a hint, and I will implement the correct naming)

The **Control ID's** are only of interest to those that want to change the layout of their **Bitwig Control** preset.

![images/settings.jpg](https://github.com/jorisroling/bitwig-electra-one/raw/main/images/settings.jpg)

That's it, it should work now. Go to any Bitwig track and add/select a device. Open its **Remote Parameter Panel**.

![images/remote_panel.png](https://github.com/jorisroling/bitwig-electra-one/raw/main/images/remote_panel.png)

Should show this

![images/images/remote_open.png](https://github.com/jorisroling/bitwig-electra-one/raw/main/images/remote_open.png)


Changes to these mapped parameters will be reflected on *Electra One* (and vice versa 😃)

- If you change **Remote Controls Page** the labels & values will change.
- If you select another device on the same track the labels & values will change.
- If you select another track the labels & values will change.
- It follows your focus so to say. Works out nice.

![images/electra_one.jpg](https://github.com/jorisroling/bitwig-electra-one/raw/main/images/electra_one.jpg)

