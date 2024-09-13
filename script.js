// ----------- CLEF LOGIC -----------
// Constants that control various aspects of note movement and timing
const TRAVEL_SPEED = 7; // Speed at which the treble notes move across the screen
const NOTE_MOVEMENT_REFRESH_RATE_MS = 50; // Interval in milliseconds at which note positions are refreshed
const LEFT_THRESHOLD = 80; // Distance from the left edge where notes stop moving
const NEW_NOTE_INTERVAL_MS = 1500; // Interval in milliseconds between new note creation

// DOM elements to display notes and track correct/incorrect actions
const trebleContainer = document.querySelector("#treble-container");
const correctContainer = document.querySelector("#correct-count");
const incorrectContainer = document.querySelector("#incorrect-count");

let isGamePaused = false; // Tracks whether the game is paused or not

// List of possible notes and their corresponding MIDI note IDs
const possibleTrebleNotes = [
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

const activeNotes = []; // Array to keep track of active notes
let isGameStarted = false; // Flag to check if the game has started

// Inserts a new note into the DOM and adds it to the list of active notes
const insertTrebleNote = (noteObject) => {
  const newNote = document.createElement("div");
  newNote.classList.add("treble-note", noteObject.name);
  newNote.setAttribute("data-note-id", noteObject.id);
  trebleContainer.appendChild(newNote);
  activeNotes.push(newNote);
};

// Starts the game logic, handling note movement and periodic note insertion
function startGame() {
  isGameStarted = true;

  // Moves notes leftward every NOTE_MOVEMENT_REFRESH_RATE_MS milliseconds
  setInterval(() => {
    activeNotes.forEach((activeNote) => {
      if (isGamePaused) return; // Stop movement if the game is paused

      const currentLeft = parseInt(window.getComputedStyle(activeNote).left);
      const newLeft = currentLeft - TRAVEL_SPEED;
      if (newLeft <= LEFT_THRESHOLD) {
        isGamePaused = true; // Pause the game when a note reaches the left threshold
        return;
      }
      activeNote.style.left = `${newLeft}px`; // Move the note left
    });
  }, NOTE_MOVEMENT_REFRESH_RATE_MS);

  // Adds a new random note every NEW_NOTE_INTERVAL_MS milliseconds
  setInterval(() => {
    if (isGamePaused) return; // Skip adding notes if the game is paused
    const newNote =
      possibleTrebleNotes[
        Math.floor(Math.random() * possibleTrebleNotes.length)
      ];
    insertTrebleNote(newNote);
  }, NEW_NOTE_INTERVAL_MS);
}

// Updates the state of the clef when a key press occurs, marking notes as correct or incorrect
const updateClefOnKeypress = (noteId, forceCorrect = false) => {
  const oldestActiveNoteId = parseInt(
    activeNotes[0]?.getAttribute("data-note-id")
  );
  if (oldestActiveNoteId === noteId || forceCorrect) {
    activeNotes[0].remove(); // Remove the oldest note
    activeNotes.shift(); // Remove the note from the active notes list
    correctContainer.innerText = parseInt(correctContainer.innerText) + 1; // Update correct count
    isGamePaused = false; // Resume the game
  } else {
    incorrectContainer.innerText = parseInt(incorrectContainer.innerText) + 1; // Update incorrect count
    activeNotes[0]?.classList.add("incorrect-note"); // Mark the note as incorrect
  }
};

// Temporary for testing
// document.addEventListener("keyup", (event) => {
//   if (event.code === "Space") {
//     updateClefOnKeypress(null, true);
//   } else if (event.code === "KeyR") {
//     updateClefOnKeypress(0, false);
//   }
// });

// ----------- BLUETOOTH CONNECTION -----------
// Constants for the Bluetooth MIDI service and characteristics
const BT_MIDI_SERVICE_UID =
  "03B80E5A-EDE8-4B33-A751-6CE34EC4C700".toLowerCase();
const MIDI_CHARACTERISTIC_UID =
  "7772E5DB-3868-4112-A1A9-F2669D106BF3".toLowerCase();

// DOM elements for Bluetooth connection and logs
const $connectBt = document.querySelector("#connect-bt-btn");
const $logOutput = document.querySelector("#log-output");

// Appends log messages to the log output area and scrolls to the bottom
const printLog = (msg) => {
  $logOutput.innerHTML += "<br>" + msg;
  $logOutput.scrollTo(0, $logOutput.scrollHeight);
};

// Bluetooth connection handler to connect to a MIDI device and start listening for keypresses
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

// Constants for MIDI note processing
const PIANO_KEYDOWN_INT = 144; // MIDI value for keydown event
const OCTAVE_KEY_COUNT = 12; // Number of keys per octave on the piano

// Maps MIDI note values to corresponding piano notes
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

// for testing without piano keyboard
// startGame();

// Handles incoming MIDI messages and triggers the appropriate game logic
function handleMIDIMessage(midiMsgEvent) {
  if (!isGameStarted) startGame(); // Start game if it's the first key press

  const value = midiMsgEvent.target.value;
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
