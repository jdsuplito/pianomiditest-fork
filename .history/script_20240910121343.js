// ----------- CLEF LOGIC -----------
const TRAVEL_SPEED = 3;
const travelTimeMs = parseInt(
  window.getComputedStyle(document.body).getPropertyValue("--note-speed-ms")
);
const trebleContainer = document.querySelector("#treble-container");
const correctContainer = document.querySelector("#correct-count");
const incorrectContainer = document.querySelector("#incorrect-count");
const missedContainer = document.querySelector("#missed-count");

const possibleNotes = [
  { name: "c4", id: 60 },
  { name: "d4", id: 62 },
  { name: "e4", id: 64 },
  { name: "f4", id: 65 },
  { name: "g4", id: 67 },
  { name: "a4", id: 69 },
  { name: "b4", id: 71 },
  { name: "c5", id: 72 },
  { name: "d5", id: 74 },
  { name: "e5", id: 76 },
  { name: "f5", id: 77 },
  { name: "g5", id: 79 },
  { name: "a5", id: 81 },
];
const activeNotes = [];
let isGameStarted = false;

const insertTrebleNote = (noteObject) => {
  const newNote = document.createElement("div");
  newNote.classList.add("treble-note");
  newNote.classList.add(noteObject.name);
  newNote.setAttribute("data-note-id", noteObject.id);
  trebleContainer.appendChild(newNote);
  activeNotes.push(newNote);
};

function startGame() {
  isGameStarted = true;
  setInterval(() => {
    activeNotes.forEach((activeNote) => {
      const currentLeft = parseInt(window.getComputedStyle(activeNote).left);
      const newLeft = currentLeft - TRAVEL_SPEED;
      if (newLeft <= 0) {
        activeNote.remove();
        activeNotes.shift();
        missedContainer.innerText = parseInt(missedContainer.innerText) + 1;
      }
      activeNote.style.left = `${newLeft}px`;
    });
  }, 100);

  setInterval(() => {
    const newNote =
      possibleNotes[Math.floor(Math.random() * possibleNotes.length)];
    insertTrebleNote(newNote);
  }, 1000);
}

const updateClefOnKeypress = (noteId) => {
  console.log(noteId);
  const oldestActiveNoteId = parseInt(
    activeNotes[0].getAttribute("data-note-id")
  );
  if (oldestActiveNoteId === noteId) {
    activeNotes[0].remove();
    activeNotes.shift();
    correctContainer.innerText = parseInt(correctContainer.innerText) + 1;
  } else {
    incorrectContainer.innerText = parseInt(incorrectContainer.innerText) + 1;
  }
};

// ----------- BLUETOOTH CONNECTION -----------
const BT_MIDI_SERVICE_UID =
  "03B80E5A-EDE8-4B33-A751-6CE34EC4C700".toLowerCase();
const MIDI_CHARACTERISTIC_UID =
  "7772E5DB-3868-4112-A1A9-F2669D106BF3".toLowerCase();
const $connectBt = document.querySelector("#connect-bt-btn");
const $logOutput = document.querySelector("#log-output");

const printLog = (msg) => {
  $logOutput.innerHTML = $logOutput.innerHTML + "<br>" + msg;
  $logOutput.scrollTo(0, $logOutput.scrollHeight);
};

$connectBt.addEventListener("click", () => {
  navigator.bluetooth
    .requestDevice({ filters: [{ services: [BT_MIDI_SERVICE_UID] }] })
    .then((device) => {
      console.log("Bluetooth Device Details: ", device);
      printLog(`Connected to device: ${device.name} (id: ${device.id})`);

      return device.gatt.connect();
    })
    .then((btRemoteGattServer) => {
      console.log("btRemoteGattServer", btRemoteGattServer);
      printLog(`Is GATT server connected? ${btRemoteGattServer.connected}`);
      printLog("Getting GATT server primary service...");

      return btRemoteGattServer.getPrimaryService(BT_MIDI_SERVICE_UID);
    })
    .then((btRemoteGattService) => {
      console.log("btRemoteGattService", btRemoteGattService);
      printLog(
        `BT Remote GATT Service UUID: ${btRemoteGattService.uuid} (isPrimary?: ${btRemoteGattService.isPrimary})`
      );

      return btRemoteGattService.getCharacteristic(MIDI_CHARACTERISTIC_UID);
    })
    .then((btRemoteGattCharacteristic) => {
      console.log("btRemoteGattCharacteristic", btRemoteGattCharacteristic);
      printLog(
        `btRemoteGattCharacteristic UUID: ${btRemoteGattCharacteristic.uuid}`
      );
      printLog(`btRemoteGattCharacteristic Starting notifications...`);
      printLog(
        `--------- NADEDETECT NA ANG PIANO KEYS AT NOTE TRAINER WITH RANDOMIZER NA LANG ANG KULANG PARA MASAYA ---------`
      );

      btRemoteGattCharacteristic.startNotifications().then(() => {
        btRemoteGattCharacteristic.addEventListener(
          "characteristicvaluechanged",
          handleMIDIMessage
        );
      });
    })
    .catch((error) => {
      console.error(error);
    });
});

const PIANO_KEYDOWN_INT = 144;
const OCTAVE_KEY_COUNT = 12;
const pianoKeyMaps = [
  { name: "C", note: 0 },
  { name: "C# (or Db)", note: 1 },
  { name: "D", note: 2 },
  { name: "D# (or Eb)", note: 3 },
  { name: "E", note: 4 },
  { name: "F", note: 5 },
  { name: "F# (or Gb)", note: 6 },
  { name: "G", note: 7 },
  { name: "G# (or Ab)", note: 8 },
  { name: "A", note: 9 },
  { name: "A# (or Bb)", note: 10 },
  { name: "B", note: 11 },
];

function handleMIDIMessage(midiMsgEvent) {
  if (!isGameStarted) {
    startGame();
    printLog(`FIRST PRESS`);
  }

  const value = event.target.value;
  const data = [];

  for (let i = 0; i < value.byteLength; i++) {
    data.push(value.getUint8(i));
  }

  const [status, data1, data2, note, velocity] = data;

  // Do nothing except when piano keydown (ignore keyup events)
  if (data2 !== PIANO_KEYDOWN_INT) return;

  const octavePosition = note % OCTAVE_KEY_COUNT;
  const keyNote = pianoKeyMaps.find((keyMap) => keyMap.note === octavePosition);

  console.log("Received MIDI data:", data);
  printLog(`Key: ${keyNote?.name} | Note Id: ${note} | Velocity: ${velocity}`);
  updateClefOnKeypress(note);
}
