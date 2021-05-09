let all_notes = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
let instruments = [];
let key;
let mode;
let minor_type;
let chords_progression;
let bpm;


function createDuration(n_measures) {
  durations = [];
  for (i = 0; i < n_measures; i++) {
    durations.push(shuffle(random(combinations)));
  }
  return durations;
}

function durationToTime(duration) {
  // Function that convert set of following notes duration to when they are
  // played by the Tune Timer
  cumulative_duration = [0];
  times = ["0:0:0"];
  k = 0;
  for (var i = 0; i < duration.length; i++) {
    for (var j = 0; j < duration[i].length; j++) {
      cumulative_duration.push(cumulative_duration[k] + 1 / duration[i][j]);
      measure = Math.floor(cumulative_duration[k + 1]);
      left_measure = Math.abs(cumulative_duration[k + 1] - measure);
      quarter = Math.floor(left_measure * 4);
      left_quarter = Math.abs(quarter - left_measure * 4);
      sixth = Math.floor(left_quarter * 4);
      times.push(`${measure}:${quarter}:${sixth}`);
      k += 1;
    }
  }
  times.pop();
  return times;
}

function chooseNote(chords_progression, duration) {
  // Return a set of length len of elements belonging to scale
  notes = [];
  for (var i = 0; i < duration.length; i++) {
    var scale = Tonal.Chord.get(chords_progression[i]).notes;
    scale.push('r');
    scale.push('r');
    for (var j = 0; j < duration[i].length; j++) {
      notes.push(random(scale));
    }
  }
  return notes
}

function chooseChords(key, len) {
  // Return a set of length len of elements belonging to scale
  // Get the mode
  let key_chords;
  if (mode == 'major') {
    key_chords = Tonal.Key.majorKey(key).chords;
    console.log("Major scale");
  }
  else {
    key_chords = Tonal.Key.minorKey(key)[minor_type].chords;
    console.log(`Minor ${minor_type} scale`)
  }
  // }
  chords = [];
  for (var i = 0; i < len; i++) {
    chords.push(random(key_chords));
  }
  return chords
}

function createPhrase(duration, time, note, octave) {
  // Create the phrase to enter in the Tone.Part function
  phrase = [];
  var k = 0;
  for (var i = 0; i < duration.length; i++) {
    for (var j = 0; j < duration[i].length; j++) {
      if (note[k] != 'r') {
        temp = {};
        temp['time'] = time[k];
        temp['duration'] = duration[i][j] + "n";
        temp['note'] = note[k] + octave;
        phrase.push(temp);
      }
      k += 1;
    }
  }
  return phrase;
}

function createChordsPhrase(duration, time, note) {
  // Create the phrase to enter in the Tone.Part function
  phrase = [];
  for (var i = 0; i < duration.length; i++) {
    if (note[i] != 'r') {
      temp = {};
      temp['time'] = time[i];
      temp['duration'] = duration[i] + "n";
      temp['note'] = Tonal.Chord.get(note[i]).notes;
      temp['note'].pop();
      temp['note'] = temp['note'].map(i => i + '4');
      phrase.push(temp);
    }
  }
  return phrase;
}

function Instrument(synth, octave, chords = False) {
  this.octave = octave;
  this.synth = new Tone.PolySynth(synth).toDestination();
  this.chords = chords;
  this.part = new Tone.Part();
  this.generate();
}

Instrument.prototype.generate = function () {
  this.part.clear()
  if (this.chords) {
    // Create the chords progression
    this.durations = new Array(chords_progression.length);
    this.durations.fill(1);
    this.durations = [this.durations];
    this.times = durationToTime(this.durations);
    this.notes = chords_progression;
    this.phrase = createChordsPhrase(this.durations[0], this.times, this.notes);
  } else {
    // Create a phrase for the instrument
    this.durations = createDuration(chords_progression.length);
    this.times = durationToTime(this.durations);
    this.notes = chooseNote(chords_progression, this.durations);
    this.phrase = createPhrase(this.durations, this.times, this.notes, this.octave);
  }
  // Create the part
  this.part = new Tone.Part((time, value) => {
    this.synth.triggerAttackRelease(value.note, value.duration, time);
  }, this.phrase);
  this.part.start(0);
  this.part.loopEnd = chords_progression.length + 'm';
  this.part.loop = true;
}

Instrument.prototype.muteOrUnmute = function () {
  if (this.part.mute) {
    this.part.mute = false;
    this.muteButton.innerHTML = "Mute";
  }
  else {
    this.part.mute = true;
    this.muteButton.innerHTML = "Unmute";
  }
}

// Callback to play
function playMusic() {
  if (Tone.Transport.state == "stopped") {
    Tone.Transport.start();
    document.getElementById("play-button").style.borderColor = "#FF8E4F";
  }
  else if (Tone.Transport.state == "paused") {
    Tone.Transport.start();
    document.getElementById("pause-button").style.borderColor = "#000000";
  }
}

// Callback to pause
function pauseMusic() {
  if (Tone.Transport.state == "started") {
    for (var i = 0; i < instruments.length; i++) {
      instruments[i].synth.releaseAll();
    }
    Tone.Transport.pause();
    document.getElementById("pause-button").style.borderColor = "#FF8E4F";
  }
  else if (Tone.Transport.state == "paused") {
    Tone.Transport.start();
    document.getElementById("pause-button").style.borderColor = "#000000";
  }
}

// Callback to stop
function stopMusic() {
  if (Tone.Transport.state == "paused") {
    document.getElementById("pause-button").style.borderColor = "#000000";
  }
  for (var i = 0; i < instruments.length; i++) {
    instruments[i].synth.releaseAll();
  }
  Tone.Transport.stop();
  document.getElementById("play-button").style.borderColor = "#000000";
}

function generateMusic() {
  if (Tone.Transport.state == "paused") {
    document.getElementById("pause-button").style.borderColor = "#000000";
  }
  Tone.Transport.stop();
  for (var i = 0; i < instruments.length; i++) {
    instruments[i].synth.releaseAll();
  }
  chords_progression = chooseChords(key, 4);
  for (var i = 0; i < instruments.length; i++) {
    instruments[i].generate();
  }
  bpm = Math.round(random(40, 110));
  Tone.Transport.bpm.value = bpm;
  document.getElementById("bpm-input").value = bpm;
  playMusic();
}

// Callback when selecting key
function keySelected() {
  var key_selection = document.getElementById("key-select").value;
  key = key_selection;
  generateMusic();
}

// Callback when selecting mode
function modeSelected() {
  var mode_selected = document.getElementById("mode-select").value;
  var minor_selection = document.getElementById("minor-select");
  var minor_type_selection = document.getElementById("minor-type-select");
  if (mode_selected == 'minor') {
    minor_selection.classList.remove("hidden");
    minor_type_selection.classList.remove("hidden");
    minor_type = minor_selection.value
  } else {
    minor_selection.classList.add("hidden");
    minor_type_selection.classList.add("hidden");
  }
  mode = mode_selected;
  generateMusic();
}

// Callback when selecting mode
function minorSelected() {
  var minor_selection = document.getElementById("minor-select").value;
  minor_type = minor_selection;
  generateMusic();
}

// Callback when changing BPM
function changeBPM() {
  Tone.Transport.bpm.value = document.getElementById("bpm-input").value;
}

function setup() {

  noCanvas();

  // Create all the notes options at startup
  var keySelect = document.getElementById("key-select");
  for (var i = 0; i < all_notes.length; i++) {
    var optn = all_notes[i];
    var el = document.createElement("option");
    el.textContent = optn;
    el.value = optn;
    keySelect.appendChild(el);
  }
  // Random BPM at startup
  bpm = Math.round(random(40, 110));
  document.getElementById("bpm-input").value = bpm;

  Tone.Transport.loopEnd = '4m';
  Tone.Transport.loop = true;
  Tone.Transport.bpm.value = bpm;

  // Get the key
  key = keySelect.value;

  // Get the mode
  var modeSelect = document.getElementById("mode-select");
  mode = modeSelect.value;

  // Get the minor type
  var minorSelect = document.getElementById("minor-select");
  minor_type = minorSelect.value;

  // Generate the chords progression with four chords
  chords_progression = chooseChords(key, 4);

  // Chords section
  let chord_synth = Tone.FMSynth;
  chord = new Instrument(chord_synth, "3", true);
  chord.synth.volume.value = -22;
  instruments.push(chord)

  // Bass section
  let bass_synth = Tone.AMSynth;
  bass = new Instrument(bass_synth, "2", false);
  instruments.push(bass);

  // Melody section
  let melody_synth = Tone.Synth;
  melody = new Instrument(melody_synth, "4", false);
  instruments.push(melody);
}

function draw() {
  noLoop();
}

