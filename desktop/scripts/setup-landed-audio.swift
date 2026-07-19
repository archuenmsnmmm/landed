#!/usr/bin/swift
import CoreAudio
import Foundation

let landedMultiName = "Landed Audio"
let landedInputName = "Landed Input"

func statusString(_ status: OSStatus) -> String {
  if let err = SecCopyErrorMessageString(status, nil) as String? {
    return err
  }
  return "OSStatus \(status)"
}

func getCFStringProperty(
  objectID: AudioObjectID,
  selector: AudioObjectPropertySelector,
) -> String? {
  var address = AudioObjectPropertyAddress(
    mSelector: selector,
    mScope: kAudioObjectPropertyScopeGlobal,
    mElement: kAudioObjectPropertyElementMain
  )
  var cfString: Unmanaged<CFString>?
  var dataSize = UInt32(MemoryLayout<Unmanaged<CFString>?>.size)
  let status = withUnsafeMutablePointer(to: &cfString) { ptr in
    AudioObjectGetPropertyData(objectID, &address, 0, nil, &dataSize, ptr)
  }
  guard status == noErr, let cfString else { return nil }
  return cfString.takeRetainedValue() as String
}

func listDevices() -> [(id: AudioDeviceID, name: String, uid: String)] {
  var address = AudioObjectPropertyAddress(
    mSelector: kAudioHardwarePropertyDevices,
    mScope: kAudioObjectPropertyScopeGlobal,
    mElement: kAudioObjectPropertyElementMain
  )
  var size: UInt32 = 0
  guard AudioObjectGetPropertyDataSize(
    AudioObjectID(kAudioObjectSystemObject),
    &address,
    0,
    nil,
    &size,
  ) == noErr else { return [] }

  let count = Int(size) / MemoryLayout<AudioDeviceID>.size
  let ids = UnsafeMutablePointer<AudioDeviceID>.allocate(capacity: count)
  defer { ids.deallocate() }
  guard AudioObjectGetPropertyData(
    AudioObjectID(kAudioObjectSystemObject),
    &address,
    0,
    nil,
    &size,
    ids,
  ) == noErr else { return [] }

  var devices: [(AudioDeviceID, String, String)] = []
  for i in 0..<count {
    let id = ids[i]
    let name =
      getCFStringProperty(objectID: id, selector: kAudioObjectPropertyName) ??
      getCFStringProperty(objectID: id, selector: kAudioDevicePropertyDeviceNameCFString) ??
      "?"
    let uid =
      getCFStringProperty(objectID: id, selector: kAudioDevicePropertyDeviceUID) ?? "?"
    devices.append((id, name, uid))
  }
  return devices
}

func findDevice(
  matching pattern: String,
  in devices: [(id: AudioDeviceID, name: String, uid: String)],
) -> (id: AudioDeviceID, name: String, uid: String)? {
  devices.first {
    $0.name.localizedCaseInsensitiveContains(pattern) ||
      $0.uid.localizedCaseInsensitiveContains(pattern)
  }
}

func destroyExisting(name: String, in devices: [(id: AudioDeviceID, name: String, uid: String)]) {
  for device in devices where device.name == name {
    let status = AudioHardwareDestroyAggregateDevice(device.id)
    if status == noErr {
      fputs("Removed existing \"\(name)\"\n", stderr)
    }
  }
}

func createAggregate(
  name: String,
  uid: String,
  subUIDs: [String],
  masterUID: String?,
  stacked: Int,
) -> OSStatus {
  var subDevices: [[String: Any]] = []
  for subUID in subUIDs {
    subDevices.append([
      kAudioSubDeviceUIDKey as String: subUID,
      kAudioSubDeviceDriftCompensationKey as String: 1,
    ])
  }

  var desc: [String: Any] = [
    kAudioAggregateDeviceNameKey as String: name,
    kAudioAggregateDeviceUIDKey as String: uid,
    kAudioAggregateDeviceSubDeviceListKey as String: subDevices,
    kAudioAggregateDeviceIsStackedKey as String: stacked,
  ]
  if let masterUID {
    desc[kAudioAggregateDeviceMasterSubDeviceKey as String] = masterUID
  }

  var deviceID: AudioDeviceID = 0
  return AudioHardwareCreateAggregateDevice(desc as CFDictionary, &deviceID)
}

func setDefaultOutput(uid: String, devices: [(id: AudioDeviceID, name: String, uid: String)]) -> Bool {
  guard let device = devices.first(where: { $0.uid == uid || $0.name == uid }) else { return false }
  var address = AudioObjectPropertyAddress(
    mSelector: kAudioHardwarePropertyDefaultOutputDevice,
    mScope: kAudioObjectPropertyScopeGlobal,
    mElement: kAudioObjectPropertyElementMain
  )
  var id = device.id
  let status = AudioObjectSetPropertyData(
    AudioObjectID(kAudioObjectSystemObject),
    &address,
    0,
    nil,
    UInt32(MemoryLayout<AudioDeviceID>.size),
    &id,
  )
  return status == noErr
}

let devices = listDevices()
for d in devices {
  print("[device] \(d.name) — \(d.uid)")
}

guard let blackhole = findDevice(matching: "BlackHole", in: devices) else {
  fputs("ERROR: BlackHole 2ch not found. Install it first:\n", stderr)
  fputs("  npm run setup:blackhole\n", stderr)
  exit(1)
}

let speakers =
  findDevice(matching: "MacBook Air Speakers", in: devices) ??
  findDevice(matching: "Speakers", in: devices) ??
  devices.first {
    $0.name.localizedCaseInsensitiveContains("speaker") &&
      !$0.name.localizedCaseInsensitiveContains("multi") &&
      !$0.name.localizedCaseInsensitiveContains("landed")
  }

let microphone =
  findDevice(matching: "MacBook Air Microphone", in: devices) ??
  findDevice(matching: "Microphone", in: devices) ??
  devices.first {
    $0.name.localizedCaseInsensitiveContains("microphone") &&
      !$0.name.localizedCaseInsensitiveContains("aggregate") &&
      !$0.name.localizedCaseInsensitiveContains("landed")
  }

guard let speakers else {
  fputs("ERROR: Could not find built-in speakers.\n", stderr)
  exit(1)
}
guard let microphone else {
  fputs("ERROR: Could not find built-in microphone.\n", stderr)
  exit(1)
}

destroyExisting(name: landedMultiName, in: devices)
destroyExisting(name: landedInputName, in: devices)

let multiUID = "com.landed.audio.multi-\(UUID().uuidString)"
var status = createAggregate(
  name: landedMultiName,
  uid: multiUID,
  subUIDs: [speakers.uid, blackhole.uid],
  masterUID: speakers.uid,
  stacked: 1,
)
if status != noErr {
  fputs("ERROR creating Landed Audio: \(statusString(status))\n", stderr)
  exit(1)
}
print("Created \"\(landedMultiName)\"")

let inputUID = "com.landed.audio.input-\(UUID().uuidString)"
status = createAggregate(
  name: landedInputName,
  uid: inputUID,
  subUIDs: [blackhole.uid, microphone.uid],
  masterUID: blackhole.uid,
  stacked: 0,
)
if status != noErr {
  fputs("ERROR creating Landed Input: \(statusString(status))\n", stderr)
  exit(1)
}
print("Created \"\(landedInputName)\"")

let refreshed = listDevices()
if setDefaultOutput(uid: landedMultiName, devices: refreshed) {
  print("Set system output to \"\(landedMultiName)\"")
} else if setDefaultOutput(uid: multiUID, devices: refreshed) {
  print("Set system output to \"\(landedMultiName)\"")
} else {
  fputs("WARN: Could not set default output automatically. Choose \"Landed Audio\" in System Settings → Sound.\n", stderr)
}

print("DONE")
