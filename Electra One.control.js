loadAPI(7);

host.setShouldFailOnDeprecatedUse(true);
host.defineController("Bonboa", "Electra One Control", "1.03", "7f4b4851-911b-4dbf-a6a7-ee7801296ce1", "Joris Röling");

host.defineMidiPorts(2, 2);

if (host.platformIsWindows()) {
  host.addDeviceNameBasedDiscoveryPair(["Electra Controller Electra Port 1", "Electra Controller Electra CTRL"], ["Electra Controller Electra Port 1", "Electra Controller Electra CTRL"]);
} else if (host.platformIsMac()) {
  host.addDeviceNameBasedDiscoveryPair(["Electra Controller Electra Port 1", "Electra Controller Electra CTRL"], ["Electra Controller Electra Port 1", "Electra Controller Electra CTRL"]);
} else if (host.platformIsLinux()) {
  host.addDeviceNameBasedDiscoveryPair(["Electra Controller Electra Port 1", "Electra Controller Electra CTRL"], ["Electra Controller Electra Port 1", "Electra Controller Electra CTRL"]);
}

let active = false
const highRes = true;
const layoutColumns = true;


let remoteControlsBank = null;

const E1_PRESET_NAME = "Bitwig Control"
let E1_CC_MSB = [3, 9, 14, 15, 16, 17, 18, 19];
let E1_CC_LSB = [];

const E1_PREVIOUS_PAGE_CC = 80
const E1_NEXT_PAGE_CC = 81

for (let a = 0; a < E1_CC_MSB.length; a++) {
  if (E1_CC_MSB[a] < 32) E1_CC_LSB.push(E1_CC_MSB[a] + 32)
}

const LAYOUT_COLUMNS_MAP = [0, 4, 1, 5, 2, 6, 3, 7];
const REVERSE_LAYOUT_COLUMNS_MAP = [0, 2, 4, 6, 1, 3, 5, 7];

let controlIDs = [1, 2, 3, 4, 7, 8, 9, 10]

const values = [];
const names = [];

function doObject(object, f) {
  return function() {
    f.apply(object, arguments)
  }
}

function padZero(str) {
  if (!str) str = ''
  while (str.length < 2) str = '0' + str
  return str
}

function num2hex(num) {
  return padZero(num.toString(16).toUpperCase());
}

function str2hex(str) {
  let arr1 = [];
  for (let n = 0, l = str.length; n < l; n++) {
    let hex = padZero(Number(str.charCodeAt(n)).toString(16).toUpperCase());
    arr1.push(hex);
  }
  return arr1.join(' ');
}



function init() {
  let controls = [];
  for (let c = 0; c < 128; c++) controls.push(c + '')
  let preferences = host.getPreferences();

  for (let c=0;c<8;c++) {
    preferences.getNumberSetting(`Parameter #${c+1}`, 'Control IDs', 1, 432, 1, '', controlIDs[c]).addValueObserver(function(value) {
      controlIDs[c] = value;
    });
  }

  host.getMidiInPort(0).setMidiCallback(handleMidi);
  host.getMidiInPort(1).setSysexCallback(handleSysExMidi);


  let cursorTrack = host.createCursorTrack("E1_CURSOR_TRACK", "Cursor Track", 0, 0, true);

  let cursorDevice = cursorTrack.createCursorDevice("E1_CURSOR_DEVICE", "Cursor Device", 0, CursorDeviceFollowMode.FOLLOW_SELECTION);

  remoteControlsBank = cursorDevice.createCursorRemoteControlsPage(8);
  remoteControlsBank.pageNames().markInterested();
  remoteControlsBank.selectedPageIndex().addValueObserver(function(value) {
    if (value>=0 && !remoteControlsBank.pageNames().isEmpty()) {
      const names=remoteControlsBank.pageNames()
    }
  });

  function setupParameter(i) {
    const parameter = remoteControlsBank.getParameter(i);
    parameter.markInterested();
    parameter.setIndication(true);

    parameter.value().addValueObserver(function(value) {
      const idx = (layoutColumns ? REVERSE_LAYOUT_COLUMNS_MAP[i] : i);
      if (active) {
        if (values[idx] != (value * 16383)) {
          sendMidi(0xB0, E1_CC_MSB[idx], ((value * 16383) >> 7) & 0x7F);
          if (highRes) sendMidi(0xB0, E1_CC_LSB[idx], ((value * 16383) >> 0) & 0x7F);
        }
      }
      values[idx] = value
    });

    parameter.name().addValueObserver(function(name) {
      const idx = (layoutColumns ? REVERSE_LAYOUT_COLUMNS_MAP[i] : i);
      names[i] = name
      if (active) {
        const json = {
          "name": name,
          "visible": !!(name && name.trim().length)
        }
        const ctrlId = controlIDs[i]
        const data = `F0 00 21 45 14 07 ${num2hex(ctrlId & 0x7F)} ${num2hex(ctrlId >> 7)} ${str2hex(JSON.stringify(json))} F7`;
        host.getMidiOutPort(1).sendSysex(data)
      }
    })
  }

  for (let i = 0; i < remoteControlsBank.getParameterCount(); i++) {
    setupParameter(i);
  }

  cursorDevice.isEnabled().markInterested();
  cursorDevice.isWindowOpen().markInterested();

  /* Patch Request */
  host.getMidiOutPort(1).sendSysex(`F0 00 21 45 02 01 F7`)

  println("Electra One Control initialized!");
}

function handleMidi(status, data1, data2) {
  if (active) {
    if (isChannelController(status)) {
      if (E1_CC_MSB.indexOf(data1) >= 0) {
        let idx = E1_CC_MSB.indexOf(data1);
        values[idx] = (values[idx] & (0x7F << 0)) | (data2 << 7);
        if (!highRes) remoteControlsBank.getParameter(layoutColumns ? LAYOUT_COLUMNS_MAP[idx] : idx).set(values[idx], 16384);
      } else if (highRes && E1_CC_LSB.indexOf(data1) >= 0) {
        idx = E1_CC_LSB.indexOf(data1);
        values[idx] = (values[idx] & (0x7F << 7)) | (data2 << 0);
        remoteControlsBank.getParameter(layoutColumns ? LAYOUT_COLUMNS_MAP[idx] : idx).set(values[idx], 16384);
      } else if (data1 == E1_PREVIOUS_PAGE_CC && data2) {
        remoteControlsBank.selectPreviousPage(true)
      } else if (data1 == E1_NEXT_PAGE_CC && data2) {
        remoteControlsBank.selectNextPage(true)
      }
    }
  }
  return false;
}

function handleSysExMidi(data) {
  if (data && data.substr(0,8)==='f0002145') {
    if (data.substr(0,12)==='f00021457e02') { //f00021457e02####f7 = Preset Switch
      println('Preset Switch')
      host.getMidiOutPort(1).sendSysex(`F0 00 21 45 02 01 F7`)  /* Patch Request */
    }

    if (data.substr(0,12)==='f00021450101') { //f00021450101####f7 = Patch Response
      println('Patch Response')

      const headData = data.substr(12,64*2)
      let head=''
      for (let i=0;i<headData.length;i+=2) {
        head += String.fromCharCode(parseInt(headData.substr(i,2),16));
      }

      const match = head.match(/,"name"\s*:\s*"([^"]*)",/)
      active = (match && match.length && match[1] === E1_PRESET_NAME)
      println('match '+(match && match[1]))
      println('active '+active)


      if (active) {
        for (let i=0;i<8;i++) {
          const idx = (layoutColumns ? REVERSE_LAYOUT_COLUMNS_MAP[i] : i);
          const value = values[idx]
          const name = names[idx]

          sendMidi(0xB0, E1_CC_MSB[idx], ((value * 16383) >> 7) & 0x7F);
          if (highRes) sendMidi(0xB0, E1_CC_LSB[idx], ((value * 16383) >> 0) & 0x7F);

          const json = {
            "name": name,
            "visible": !!(name && name.trim().length)
          }
          const ctrlId = controlIDs[i]
          const data = `F0 00 21 45 14 07 ${num2hex(ctrlId & 0x7F)} ${num2hex(ctrlId >> 7)} ${str2hex(JSON.stringify(json))} F7`;
          host.getMidiOutPort(1).sendSysex(data)
        }
      }


    }
  }
  return false;
}

function flush() {}

function exit() {
  println("Electra One Control exited!");
}
