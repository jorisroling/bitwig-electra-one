loadAPI(10)

const CONTROLLER_SCRIPT_VERSION = '1.26'
const CONTROLLER_BASE_NAME = 'Electra One Control'
const CONTROLLER_SCRIPT_NAME = `${CONTROLLER_BASE_NAME}`
host.setShouldFailOnDeprecatedUse(true)
host.defineController('Bonboa', CONTROLLER_SCRIPT_NAME, CONTROLLER_SCRIPT_VERSION, '7f4b4851-911b-4dbf-a6a7-ee7801296ce1', 'Joris Röling')
const E1_PAGE_INDEX  = 1
const E1_PRESET_NAME = 'Bitwig Control'
const E1_PRESET_NAME_ALTERNATIVE = 'Bacara'


/* --------------------------------------  v1.22  -- */
host.defineMidiPorts(2, 2)

if (host.platformIsWindows()) {
  host.addDeviceNameBasedDiscoveryPair(['Electra Controller', 'MIDIIN3 (Electra Controller)'], ['Electra Controller', 'MIDIOUT3 (Electra Controller)'])
} else if (host.platformIsMac()) {
  host.addDeviceNameBasedDiscoveryPair(['Electra Controller Electra Port 1', 'Electra Controller Electra CTRL'], ['Electra Controller Electra Port 1', 'Electra Controller Electra CTRL'])
} else if (host.platformIsLinux()) {
  host.addDeviceNameBasedDiscoveryPair(['Electra Controller Electra Port 1', 'Electra Controller Electra CTRL'], ['Electra Controller Electra Port 1', 'Electra Controller Electra CTRL'])
}

const presetModes = {
  bitwig: {
    request: 4,
    preset: 'Bitwig Control',
    pageIndex: 1,
    fastPage: true,
  },
  bacara: {
    request: 3,
    preset: 'Bacara',
    pageIndex: 7,
    fastPage: false,
  },
}

let presetActive = false
let e1_firmware_version

const BOOLEAN_OPTIONS = [ "Off", "On" ];
let highRes = true
const layoutColumns = true

const E1_MINIMAL_VERSION_TEXT = 'v2.1.2'
const E1_MINIMAL_VERSION_NUMBER = 212

let cursorDevice = null
let remoteControlsBank = null
let cursorTrack = null

const COLOR_WHITE   = 'FFFFFF'
const COLOR_RED     = 'F45C51'
const COLOR_YELLOW  = 'F49500'
const COLOR_BLUE    = '529DEC'
const COLOR_GREEN   = '03A598'
const COLOR_MAGENTA = 'C44795'


const E1_CC_MSB = [3, 9, 14, 15, 16, 17, 18, 19]
let   E1_CC_LSB = []
for (let a = 0; a < E1_CC_MSB.length; a++) {
  if (E1_CC_MSB[a] < 32) {
    E1_CC_LSB.push(E1_CC_MSB[a] + 32)
  }
}

let pageIndex = E1_PAGE_INDEX
const controlsPerPage = 36
let controlOffset = ((pageIndex - 1) * controlsPerPage)
const E1_DEVICE_NAME_CTRL_ID = 1
const E1_DEVICE_ACTIVE_CTRL_ID = 7

let fastPage = true
const remoteControlIDs = [2, 3, 4, 5, 8, 9, 10, 11]
const pageControlIDs = [13, 14, 15, 16, 17, 19, 20, 21, 22, 23]
const sendControlIDs = [25, 26, 27, 28, 29, 31, 32, 33, 34, 35]

const mixerPage = 3
const trackLevelControlIDs = [ 1,2,3, 4,5,6, 7,8,9, 10,11,12, 13,14,15, 16,17,18, 19,20,21, 22,23,24, 25,26,27, 28,29,30, 31,32,33, 34,35,36 ]

const E1_MAX_LABEL_LENGTH = 14
const E1_PAGE_CC = 102
const E1_MAX_PAGE_COUNT = 10
const E1_MAX_CONTROL_COUNT = 8
const E1_PAGE_COUNT = 10
let pageCount = E1_PAGE_COUNT
let presetName = E1_PRESET_NAME
const E1_MAX_SEND_COUNT = 10
const E1_SEND_CC = 20
const E1_MAX_TRACK_COUNT = 36
const E1_TRACK_NRP_PARAM_MSB = 100

const E1_PREV_PAGE_CC     = 80
const E1_NEXT_PAGE_CC     = 81
const E1_DEVICE_NAME_CC   = 82
const E1_PREV_DEVICE_CC   = 83
const E1_NEXT_DEVICE_CC   = 84
const E1_PREV_TRACK_CC    = 85
const E1_NEXT_TRACK_CC    = 86
const E1_DEVICE_ACTIVE_CC = 87


const LAYOUT_COLUMNS_MAP = [0, 4, 1, 5, 2, 6, 3, 7]
const REVERSE_LAYOUT_COLUMNS_MAP = [0, 2, 4, 6, 1, 3, 5, 7]


const remoteControlValues = []
const remoteControlNames = []

const remoteControlCache = []
function clearRemoteControlCache() {
  for (let i = 0; i < E1_MAX_CONTROL_COUNT; i++) {
    remoteControlCache[i] = {name:'', visible:false, state:-1}
  }
}
clearRemoteControlCache()

const remotePageCache = []
function clearRemotePageCache() {
  for (let i = 0; i < E1_MAX_PAGE_COUNT; i++) {
    remotePageCache[i] = {name:'', visible:false, state:-1}
  }
}
clearRemotePageCache()


const sendValues = []
const sendCache = []
function clearSendCache() {
  for (let i = 0; i < E1_MAX_SEND_COUNT; i++) {
    if (presetActive) {
      sendCache[i] = {name:'', visible:true, state:-1}
      showSend(i, '')
    }
    sendCache[i] = {name:'', visible:false, color:COLOR_YELLOW, state:-1}
  }
}
clearSendCache()


const trackValues = []
const trackCache = []
function clearTrackCache() {
  for (let i = 0; i < E1_MAX_TRACK_COUNT; i++) {
    if (presetActive) {
      trackCache[i] = {name:'', type:'', visible:true, state:-1}
      showTrack(i, '','')
    }
    trackCache[i] = {name:'', type:'', visible:false, color:COLOR_YELLOW, state:-1}
  }
}
clearTrackCache()



function doObject(object, f) {
  return function() {
    f.apply(object, arguments)
  }
}

function padZero(str) {
  if (!str) {
    str = ''
  }
  while (str.length < 2) {
    str = '0' + str
  }
  return str
}

function num2hex(num) {
  return padZero(num.toString(16).toUpperCase())
}

function str2hex(str) {
  // println(str)
  let arr1 = []
  for (let n = 0, l = str.length; n < l; n++) {
    let hex = padZero(Number(str.charCodeAt(n)).toString(16).toUpperCase())
    arr1.push(hex)
  }
  return arr1.join(' ')
}

function showSend(index, name, color = COLOR_YELLOW, force = false) {
  const json = {
    name: cleanupLabel(name),
    visible: cleanupLabel(name).length ? true : false,
    color: color,
  }
  if (index >= 0 && index < sendControlIDs.length && (force || (sendCache[index].name !== json.name || sendCache[index].visible !== json.visible || sendCache[index].color !== json.color))) {
    if (presetActive) {
      const ctrlId = sendControlIDs[index] + controlOffset
      const data = `F0 00 21 45 14 07 ${num2hex(ctrlId & 0x7F)} ${num2hex(ctrlId >> 7)} ${str2hex(JSON.stringify(json))} F7`
      host.getMidiOutPort(1).sendSysex(data)

      if (fastPage) {
        const ctrlId = sendControlIDs[index] + controlOffset + controlsPerPage
        const data = `F0 00 21 45 14 07 ${num2hex(ctrlId & 0x7F)} ${num2hex(ctrlId >> 7)} ${str2hex(JSON.stringify(json))} F7`
        host.getMidiOutPort(1).sendSysex(data)
      }
    }
    sendCache[index].name = json.name
    sendCache[index].visible = json.visible
    sendCache[index].color = json.color
  }
}

function showRemoteControl(index, name, force = false) {
  remoteControlNames[index] = name
  const json = {
    name: cleanupLabel(name) ? cleanupLabel(name) : `Parameter #${index + 1}`,
    visible: cleanupLabel(name).length ? true : false
  }
  if (index >= 0 && index < remoteControlIDs.length && (force || (remoteControlCache[index].name !== json.name || remoteControlCache[index].visible !== json.visible))) {
    if (presetActive) {
      const ctrlId = remoteControlIDs[index] + controlOffset
      const data = `F0 00 21 45 14 07 ${num2hex(ctrlId & 0x7F)} ${num2hex(ctrlId >> 7)} ${str2hex(JSON.stringify(json))} F7`
      // println(data)
      host.getMidiOutPort(1).sendSysex(data)

      if (fastPage) {
        const ctrlId = remoteControlIDs[index] + controlOffset + controlsPerPage
        const data = `F0 00 21 45 14 07 ${num2hex(ctrlId & 0x7F)} ${num2hex(ctrlId >> 7)} ${str2hex(JSON.stringify(json))} F7`
        host.getMidiOutPort(1).sendSysex(data)
      }
    }
    remoteControlCache[index].name = json.name
    remoteControlCache[index].visible = json.visible
  }
}

function cleanupLabel(name) {
  if (!name) {
    name = ''
  }
  return name.replace('&', ' ').replace(/\s+/, ' ').trim().substr(0, E1_MAX_LABEL_LENGTH)
}

function showPages(value, force) {
  const remoteControlNames = remoteControlsBank.pageNames().get()

  for (let i = 0; i < E1_MAX_PAGE_COUNT; i++) {
    const state = i < pageCount ? ((i == value) ? 127 : 0) : 0
    if (remotePageCache[i].state !== state ) {
      sendMidi(0xB0, E1_PAGE_CC + i, state )
      remotePageCache[i].state = state
    }
    const name = (remoteControlNames && i < remoteControlNames.length) ? remoteControlNames[i] : ''
    const json = {
      name: cleanupLabel(name),
      visible: ((i < pageCount) && cleanupLabel(name).length) ? true : false
    }
    if (force || (remotePageCache[i].name !== json.name || remotePageCache[i].visible !== json.visible)) {
      if (presetActive) {
        const ctrlId = pageControlIDs[i] + controlOffset
        const data = `F0 00 21 45 14 07 ${num2hex(ctrlId & 0x7F)} ${num2hex(ctrlId >> 7)} ${str2hex(JSON.stringify(json))} F7`
        host.getMidiOutPort(1).sendSysex(data)

        if (fastPage) {
          const ctrlId = pageControlIDs[i] + controlOffset + controlsPerPage
          const data = `F0 00 21 45 14 07 ${num2hex(ctrlId & 0x7F)} ${num2hex(ctrlId >> 7)} ${str2hex(JSON.stringify(json))} F7`
          host.getMidiOutPort(1).sendSysex(data)
        }
      }
      remotePageCache[i].name = json.name
      remotePageCache[i].visible = json.visible
    }
  }
}

let devicePadVisible = false
function showDeviceName(name) {
  if (presetActive) {
    devicePadVisible = (cleanupLabel(name).length ? true : false)
    if (!devicePadVisible) showDeviceActive(null)
    const json = {
      name: cleanupLabel(name),
      visible: devicePadVisible,
    }
    const ctrlId = E1_DEVICE_NAME_CTRL_ID + controlOffset
    const data = `F0 00 21 45 14 07 ${num2hex(ctrlId & 0x7F)} ${num2hex(ctrlId >> 7)} ${str2hex(JSON.stringify(json))} F7`
    host.getMidiOutPort(1).sendSysex(data)

    if (fastPage) {
      const ctrlId = E1_DEVICE_NAME_CTRL_ID + controlOffset + controlsPerPage
      const data = `F0 00 21 45 14 07 ${num2hex(ctrlId & 0x7F)} ${num2hex(ctrlId >> 7)} ${str2hex(JSON.stringify(json))} F7`
      host.getMidiOutPort(1).sendSysex(data)
    }
  }
}


function showDeviceActive(active) {
  if (presetActive) {
    const json = {
      name: cleanupLabel(active ? 'ON' : 'OFF'),
      visible: devicePadVisible,
      color: active ? COLOR_MAGENTA : COLOR_WHITE,
    }
    const ctrlId = E1_DEVICE_ACTIVE_CTRL_ID + controlOffset
    const data = `F0 00 21 45 14 07 ${num2hex(ctrlId & 0x7F)} ${num2hex(ctrlId >> 7)} ${str2hex(JSON.stringify(json))} F7`
    host.getMidiOutPort(1).sendSysex(data)

    if (fastPage) {
      const ctrlId = E1_DEVICE_ACTIVE_CTRL_ID + controlOffset + controlsPerPage
      const data = `F0 00 21 45 14 07 ${num2hex(ctrlId & 0x7F)} ${num2hex(ctrlId >> 7)} ${str2hex(JSON.stringify(json))} F7`
      host.getMidiOutPort(1).sendSysex(data)
    }
  }
}

function showTrack(index, name, type, color = COLOR_YELLOW, force = false) {
  // println('Color '+color)
  const json = {
    name: cleanupLabel(name),
    visible: cleanupLabel(name).length && cleanupLabel(type).length ? true : false,
    color: type == 'Master' || type == 'Effect' ? COLOR_MAGENTA : (type == 'Group' ? COLOR_RED : (type == 'Disabled' ? COLOR_WHITE : color)),
  }
  if (index >= 0 && index < trackLevelControlIDs.length && (force || (trackCache[index].name !== json.name || trackCache[index].type !== type || trackCache[index].visible !== json.visible || trackCache[index].color !== json.color))) {
    if (presetActive) {
      const ctrlId = trackLevelControlIDs[index] + controlOffset + ( (mixerPage - 1) * controlsPerPage)
      const data = `F0 00 21 45 14 07 ${num2hex(ctrlId & 0x7F)} ${num2hex(ctrlId >> 7)} ${str2hex(JSON.stringify(json))} F7`
      host.getMidiOutPort(1).sendSysex(data)
    }
    trackCache[index].name = json.name
    trackCache[index].type = type
    trackCache[index].visible = json.visible
    trackCache[index].color = json.color
  }
}


function init() {
  const preferences = host.getPreferences ();
  preferences.getEnumSetting ("Enable", "High Resolution (needed for Precise Page)", BOOLEAN_OPTIONS, BOOLEAN_OPTIONS[1]).addValueObserver (function (value) {
    highRes = value == BOOLEAN_OPTIONS[1];
  });

  let controls = []
  for (let c = 0; c < 128; c++) {
    controls.push(c + '')
  }
  host.getMidiInPort(0).setMidiCallback(handleMidi)
  host.getMidiInPort(0).setSysexCallback(handleSysExMidi)
  host.getMidiInPort(1).setSysexCallback(handleSysExMidi)

  trackBank = host.createTrackBank(E1_MAX_TRACK_COUNT, 0, 0);
  for(let t=0; t<E1_MAX_TRACK_COUNT; t++) {
    const track = trackBank.getItemAt(t)

    track.isActivated().addValueObserver( (value) => {
      showTrack(t,trackCache[t].name,value ? track.trackType().get() : 'Disabled')
    })

    track.trackType().addValueObserver( (type) => {
      showTrack(t,trackCache[t].name,track.isActivated().get() ? type : 'Disabled')
    })

    track.name().addValueObserver( (name) => {
      showTrack(t,name,trackCache[t].type)
    })

    track.color().addValueObserver( (red,green,blue) => {
      function toHex(d) {
          return  ("0"+(Number(d).toString(16))).slice(-2).toUpperCase()
      }
      const colorHex = toHex(red*256)+toHex(green*256)+toHex(blue*256)
      // println('Hex: '+colorHex)
      showTrack(t,trackCache[t].name,trackCache[t].type,colorHex)
    })

    track.volume().value().addValueObserver( (volume) => {
      if (trackValues[t] != (volume /* * 16383 */)) {
        sendMidi(0xB0, 99, E1_TRACK_NRP_PARAM_MSB)
        sendMidi(0xB0, 98, t + 1)

        sendMidi(0xB0, 6,  ((volume * 16383) >> 7) & 0x7F)
        sendMidi(0xB0, 38, ((volume * 16383) >> 0) & 0x7F)
      }
      trackValues[t] = volume
    })

  }

  cursorTrack = host.createCursorTrack('E1_CURSOR_TRACK', 'Cursor Track', E1_MAX_SEND_COUNT, 0, true)

  for (let s = 0; s < E1_MAX_SEND_COUNT; s++) {
    cursorTrack.getSend(s).value().addValueObserver((value) => {
      if (sendValues[s] != (value * 16383)) {
        sendMidi(0xB0, E1_SEND_CC + s, ((value * 16383) >> 7) & 0x7F)
        if (highRes) {
          sendMidi(0xB0, E1_SEND_CC + s + 32, ((value * 16383) >> 0) & 0x7F)
        }
      }
      sendValues[s] = value
    })
    cursorTrack.getSend(s).name().addValueObserver((name) => {
      showSend(s, name, sendCache[s].color)
    })
    cursorTrack.getSend(s).isPreFader().addValueObserver((preFader) => {
      showSend(s, sendCache[s].name, preFader ? COLOR_BLUE : COLOR_YELLOW)
    })
  }

  cursorDevice = cursorTrack.createCursorDevice('E1_CURSOR_DEVICE', 'Cursor Device', 0, CursorDeviceFollowMode.FOLLOW_SELECTION)

  cursorDevice.name().addValueObserver(function(name) {
    if (presetActive) {
      showDeviceName(name)
      showDeviceActive(cursorDevice.isEnabled().get())
    }
  })

  cursorDevice.isEnabled().addValueObserver(function(value) {
    if (presetActive) {
      showDeviceActive(value)
    }
  })

  remoteControlsBank = cursorDevice.createCursorRemoteControlsPage(8)

  remoteControlsBank.pageNames().addValueObserver(function(value) {
    if (presetActive) {
      showPages( remoteControlsBank.selectedPageIndex().get() )
    }
  })

  remoteControlsBank.selectedPageIndex().addValueObserver(function(value) {
    if (presetActive) {
      if (value >= 0 && !remoteControlsBank.pageNames().isEmpty()) {
        showPages(value)
      }
    }
  })

  function setupParameter(i) {
    const parameter = remoteControlsBank.getParameter(i)
    parameter.markInterested()
    parameter.setIndication(true)

    parameter.value().addValueObserver(function(value) {
      const idx = (layoutColumns ? REVERSE_LAYOUT_COLUMNS_MAP[i] : i)
      if (presetActive) {
        if (remoteControlValues[idx] != (value * 16383)) {
          sendMidi(0xB0, E1_CC_MSB[idx], ((value * 16383) >> 7) & 0x7F)
          if (highRes) {
            sendMidi(0xB0, E1_CC_LSB[idx], ((value * 16383) >> 0) & 0x7F)
          }
        }
      }
      remoteControlValues[idx] = value
    })

    parameter.name().addValueObserver(function(name) {
      showRemoteControl(i, name)
    })
  }

  for (let i = 0; i < remoteControlsBank.getParameterCount(); i++) {
    setupParameter(i)
  }

  cursorDevice.isEnabled().markInterested()
  cursorDevice.isWindowOpen().markInterested()

  println(`${CONTROLLER_SCRIPT_NAME} v${CONTROLLER_SCRIPT_VERSION} initialized!`)


  host.getMidiOutPort(1).sendSysex('F0 00 21 45 02 7F F7') /* Query data, Electra information */
}

function reSendAll() {
  for (let s = 0; s < E1_MAX_SEND_COUNT; s++) {
    showSend(s, sendCache[s].name, sendCache[s].color, true)
  }
  for (let t = 0; t < E1_MAX_TRACK_COUNT; t++) {
    showTrack(t, trackCache[t].name, trackCache[t].type, trackCache[t].color, true)
  }
  for (let i = 0; i < E1_MAX_CONTROL_COUNT; i++) {
    const idx = (layoutColumns ? REVERSE_LAYOUT_COLUMNS_MAP[i] : i)
    const value = remoteControlValues[idx]
    const name = remoteControlNames[idx] || ''

    sendMidi(0xB0, E1_CC_MSB[idx], ((value * 16383) >> 7) & 0x7F)
    if (highRes) {
      sendMidi(0xB0, E1_CC_LSB[idx], ((value * 16383) >> 0) & 0x7F)
    }

    showRemoteControl(idx, name, true)
  }
  showPages( remoteControlsBank.selectedPageIndex().get(), true)

  showDeviceName(cursorDevice.name().get())
  showDeviceActive(cursorDevice.isEnabled().get())

}


let nrpn_param_msb = -1
let nrpn_param_lsb = -1
let nrpn_value_msb = -1
let nrpn_value_lsb = -1

function handleMidi(status, data1, data2) {
  if (presetActive) {
    if (isChannelController(status)) {
      if (E1_CC_MSB.indexOf(data1) >= 0) {
        let idx = E1_CC_MSB.indexOf(data1)
        remoteControlValues[idx] = (remoteControlValues[idx] & (0x7F << 0)) | (data2 << 7)
        remoteControlsBank.getParameter(layoutColumns ? LAYOUT_COLUMNS_MAP[idx] : idx).set(remoteControlValues[idx], 16384)
      } else if (highRes && E1_CC_LSB.indexOf(data1) >= 0) {
        let idx = E1_CC_LSB.indexOf(data1)
        remoteControlValues[idx] = (remoteControlValues[idx] & (0x7F << 7)) | (data2 << 0)
        remoteControlsBank.getParameter(layoutColumns ? LAYOUT_COLUMNS_MAP[idx] : idx).set(remoteControlValues[idx], 16384)
      } else if (data1 >= E1_SEND_CC && data1 <= (E1_SEND_CC + E1_MAX_SEND_COUNT)) {
        let idx = data1 - E1_SEND_CC
        sendValues[idx] = (sendValues[idx] & (0x7F << 0)) | (data2 << 7)
        cursorTrack.getSend(idx).set(sendValues[idx], 16384)
      } else if (highRes && data1 >= (E1_SEND_CC + 32) && data1 < (E1_SEND_CC + E1_MAX_SEND_COUNT + 32) ) {
        let idx = data1 - (E1_SEND_CC + 32)
        sendValues[idx] = (sendValues[idx] & (0x7F << 7)) | (data2 << 0)
        cursorTrack.getSend(idx).set(sendValues[idx], 16384)
      } else if (data1 == E1_DEVICE_NAME_CC && data2) {
        cursorDevice.isWindowOpen().toggle()
      } else if (data1 == E1_DEVICE_ACTIVE_CC && data2) {
        cursorDevice.isEnabled().toggle()
      } else if (data1 == E1_PREV_PAGE_CC && data2) {
        remoteControlsBank.selectPreviousPage(true)
      } else if (data1 == E1_NEXT_PAGE_CC && data2) {
        remoteControlsBank.selectNextPage(true)
      } else if (data1 == E1_PREV_DEVICE_CC && data2) {
        cursorDevice.selectPrevious()
      } else if (data1 == E1_NEXT_DEVICE_CC && data2) {
        cursorDevice.selectNext()
      } else if (data1 == E1_PREV_TRACK_CC && data2) {
        cursorTrack.selectPrevious()
      } else if (data1 == E1_NEXT_TRACK_CC && data2) {
        cursorTrack.selectNext()
      } else if (data1 >= E1_PAGE_CC && data1 < (E1_PAGE_CC + pageCount)) {
        remoteControlsBank.selectedPageIndex().set(data1 - E1_PAGE_CC)
      } else if (data1 == 99) {
        nrpn_param_msb = data2
      } else if (data1 == 98) {
        nrpn_param_lsb = data2
      } else if (data1 == 6) {
        nrpn_value_msb = data2
      } else if (data1 == 38) {
        nrpn_value_lsb = data2
        if (nrpn_param_msb == E1_TRACK_NRP_PARAM_MSB && (nrpn_param_lsb >= 1 && nrpn_param_lsb <= E1_MAX_TRACK_COUNT ) && nrpn_value_msb > -1 && nrpn_value_msb > -1 ) {
          let idx = ( nrpn_param_lsb - 1 )
          trackValues[idx] = ( ( nrpn_value_msb << 7 ) | ( nrpn_value_lsb << 0 ) )
          trackBank.getItemAt(idx).volume().set(trackValues[idx], 16384)
        }
        nrpn_param_msb = -1
        nrpn_param_lsb = -1
        nrpn_value_msb = -1
        nrpn_value_lsb = -1
      }
    }
  }
  return false
}

function sysexToJSON(payload) {
  let str = ''
  for (let i = 0; i < payload.length; i += 2) {
    str += String.fromCharCode(parseInt(payload.substr(i, 2), 16))
  }
  try {
    return JSON.parse(str)
  } catch (e) {
    println(e.toString())
  }
}

function deactivateAndRequest() {
  presetActive = false
  if (e1_firmware_version && e1_firmware_version < E1_MINIMAL_VERSION_NUMBER) {
    host.getMidiOutPort(1).sendSysex('F0 00 21 45 02 01 F7') /* Patch Request */
  } else {
    host.getMidiOutPort(1).sendSysex('F0 00 21 45 02 7C F7') /* Preset Request */
  }
}

function handleSysExMidi(data) {
  if (data && data.substr(0, 8) === 'f0002145') {  // Electra One
    if (data.substr(8, 4) === '017f') { //f0002145017F####f7 = Response data, Electra information
      const json = sysexToJSON(data.substr(12, data.length - 14))
      if (json && json.versionText) {
        println(`True version string: ${json.versionText}`)
        if (!json.versionText.match(/^v\d+\.\d+\.\d+$/)) {
          if (json.versionText.match(/^v\d+\.\d+$/)) {
            json.versionText+='.0'
          }
        }
        const versionText = json.versionText.replace(/[a-zA-Z.-]/g, '').trim()  // To remove
        println(`Processed version string: ${versionText}`)
        e1_firmware_version = parseInt(versionText)
        if (e1_firmware_version && e1_firmware_version < E1_MINIMAL_VERSION_NUMBER) {
          host.showPopupNotification(`${CONTROLLER_SCRIPT_NAME}: Please upgrade the firmware on your Electra One to at least ${E1_MINIMAL_VERSION_TEXT} (now at ${versionText})`)
        } else {
//          host.showPopupNotification(`${CONTROLLER_SCRIPT_NAME}:  minimal ${E1_MINIMAL_VERSION_NUMBER} (now at ${versionText})`)
        }
        deactivateAndRequest()
      }
    }

    if (data.substr(8, 4) === '7e02') { //f00021457e02####f7 = Preset Switch
      deactivateAndRequest()
    }

    if (e1_firmware_version && e1_firmware_version < E1_MINIMAL_VERSION_NUMBER) {
      if (data.substr(8, 4) === '0101') { //f00021450101####f7 = Patch Response
        const headData = data.substr(12, 64 * 2)
        let head = ''
        for (let i = 0; i < headData.length; i += 2) {
          head += String.fromCharCode(parseInt(headData.substr(i, 2), 16))
        }

        const match = head.match(/,"name"\s*:\s*"([^"]*)",/)
        presetActive = (match && match.length && match[1].includes(presetName))
        println(`Control changing ${presetActive ? 'IS' : 'is NOT'} active (the active preset name "${match[1]}" ${presetActive ? 'includes' : 'does NOT include'} the phrase "${presetName}")`)
        if (presetActive) {
          reSendAll()
        }
      }
    }

    if (e1_firmware_version && e1_firmware_version >= E1_MINIMAL_VERSION_NUMBER) {
      if (data.substr(8, 4) === '017c') { //f0002145017C####f7 = Preset Response
        const json = sysexToJSON(data.substr(12, data.length - 14))
        if (json) {
            // println('hi: '+ e1_firmware_version)
          if (json.preset) {
            presetActive = json.preset.includes(presetName)
            println(`Control changing ${presetActive ? 'IS' : 'is NOT'} active (the active preset name "${json.preset}" ${presetActive ? 'includes' : 'does NOT include'} the phrase "${presetName}")`)
            if (presetActive) {
              reSendAll()
            }
          } else if (e1_firmware_version >= 300) {
            // println('hi: '+ JSON.stringify(json))
            presetActive = true
            reSendAll()
          }
        }
      }
    }
  } else if (data && data.substr(0, 4) === 'f07d') {  // Non-commercial SysEx: Ours!
    if (data.substr(4, 3) === '000') {  // Bacara request patch
      const req = parseInt(data.substr(7, 1))
      for (let mode in presetModes) {
        if (presetModes[mode].request == req) {
          presetName = presetModes[mode].preset
          pageIndex = presetModes[mode].pageIndex
          fastPage = presetModes[mode].fastPage
          controlOffset = ((pageIndex - 1) * controlsPerPage)
          println(`Switched to ${presetName} mode`)
          deactivateAndRequest()
        }
      }
    }
  }
  return false
}

function flush() {}

function exit() {
  println(`${CONTROLLER_SCRIPT_NAME} v${CONTROLLER_SCRIPT_VERSION} exited!`)
}

