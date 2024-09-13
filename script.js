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
const trebleNotes = [
  { name: "c4", id: 60 },
  { name: "C#4 or Db4", id: 61 },
  { name: "d4", id: 62 },
  { name: "D#4 or Eb4", id: 63 },
  { name: "e4", id: 64 },
  { name: "f4", id: 65 },
  { name: "F#4 or Gb4", id: 66 },
  { name: "g4", id: 67 },
  { name: "G#4 or Ab4", id: 68 },
  { name: "a4", id: 69 },
  { name: "A#4 or Bb4", id: 70 },
  { name: "b4", id: 71 },
  { name: "c5", id: 72 },
  { name: "C#5 or Db5", id: 73 },
  { name: "d5", id: 74 },
  { name: "D#5 or Eb5", id: 75 },
  { name: "e5", id: 76 },
  { name: "f5", id: 77 },
  { name: "F#5 or Gb5", id: 78 },
  { name: "g5", id: 79 },
  { name: "G#5 or Ab5", id: 80 },
  { name: "a5", id: 81 },
  { name: "A#5 or Bb5", id: 82 },
  { name: "b5", id: 83 },
];

// const posibleBassNotes = [
//   { name: "c2", id: 36 },
//   { name: "C#2 or Db2", id: 37 },
//   { name: "d2", id: 38 },
//   { name: "D#2 or Eb2", id: 39 },
//   { name: "e2", id: 40 },
//   { name: "f2", id: 41 },
//   { name: "F#2 or Gb2", id: 42 },
//   { name: "g2", id: 43 },
//   { name: "G#2 or Ab2", id: 44 },
//   { name: "a2", id: 45 },
//   { name: "A#2 or Bb2", id: 46 },
//   { name: "b2", id: 47 },
//   { name: "c3", id: 48 },
//   { name: "C#3 or Db3", id: 49 },
//   { name: "d3", id: 50 },
//   { name: "D#3 or Eb3", id: 51 },
//   { name: "e3", id: 52 },
//   { name: "f3", id: 53 },
//   { name: "F#3 or Gb3", id: 54 },
//   { name: "g3", id: 55 },
//   { name: "G#3 or Ab3", id: 56 },
//   { name: "a3", id: 57 },
//   { name: "A#3 or Bb3", id: 58 },
//   { name: "b3", id: 59 },
// ];

const activeNotes = []; // Array to keep track of active notes
let isGameStarted = false; // Flag to check if the game has started

// Inserts a new note into the DOM and adds it to the list of active notes
const insertTrebleNote = (noteObject) => {
  const newNote = document.createElement("div");

  // Replace spaces and invalid characters in the class name
  const newNoteName = noteObject.name.replace(/\s+/g, "-"); // Replace spaces with hyphens

  newNote.classList.add("treble-note", newNoteName);
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
    const newNote = trebleNotes[Math.floor(Math.random() * trebleNotes.length)];
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
document.addEventListener("keyup", (event) => {
  if (event.code === "Space") {
    updateClefOnKeypress(null, true);
  } else if (event.code === "KeyR") {
    updateClefOnKeypress(0, false);
  }
});

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

// for testing without piano keyboard
startGame();

// Handles incoming MIDI messages and triggers the appropriate game logic
function handleMIDIMessage(midiMsgEvent) {
  if (!isGameStarted) startGame(); // Start game if it's the first key press

  const value = midiMsgEvent.target.value;
  const data = [];

  for (let i = 0; i < value.byteLength; i++) {
    data.push(value.getUint8(i));
    console.log("DATA:", data);
  }

  const [data2, note, velocity] = data;

  // Do nothing except when piano keydown (ignore keyup events)
  if (data2 !== PIANO_KEYDOWN_INT) return;

  const octavePosition = note % OCTAVE_KEY_COUNT;
  const keyNote = trebleNotes.find((keyMap) => keyMap.note === octavePosition);

  console.log("Received MIDI data:", data);
  printLog(
    `Key: ${keyNote?.name} | Note Id: ${keyNote?.id} | Velocity: ${velocity}`
  );
  updateClefOnKeypress(note);
}
