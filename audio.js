let pentatonic_scale_bass = [["C2", "D2", "E2", "G2", "A2", "C3", "r"]];
let pentatonic_scale_aigu = ["C3", "D3", "E3", "G3", "A3", "C4", "r"];

let all_notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]

function createDuration(n_measures) {
  durations = [];
  for (i = 0; i < n_measures; i++) {
    durations = durations.concat(shuffle(random(combinations)));
  }
  return durations;
}

function durationToTime(duration) {
  // Function that convert set of following notes duration to when they are
  // played by the Tune Timer
  cumulative_duration = [0];
  times = ["0:0:0"];
  for (var i = 0; i < duration.length - 1; i++) {
    cumulative_duration.push(cumulative_duration[i] + 1 / duration[i]);
    measure = Math.floor(cumulative_duration[i + 1]);
    left_measure = Math.abs(cumulative_duration[i + 1] - measure);
    quarter = Math.floor(left_measure * 4);
    left_quarter = Math.abs(quarter - left_measure * 4);
    sixth = Math.floor(left_quarter * 4);
    times.push(`${measure}:${quarter}:${sixth}`);
  }
  return times
}

function chooseNote(scale, len) {
  // Return a set of length len of elements belonging to scale
  notes = [];
  for (var i = 0; i < len; i++) {
    notes.push(random(scale));
  }
  return notes
}

function createPhrase(duration, time, note) {
  // Create the phrase to enter in the Tone.Part function
  phrase = [];
  for (var i = 0; i < duration.length; i++) {
    if (note[i] != 'r') {
      temp = {};
      temp['time'] = time[i];
      temp['duration'] = duration[i] + "n";
      temp['note'] = note[i]
      phrase.push(temp);
    }
  }
  return phrase;
}

function Instrument(name, scale, n_measures, loop) {
  this.name = name;
  this.scale = scale;
  this.n_measures = n_measures
  // Set the instrument
  this.sound = new Tone.Synth().toMaster();
  // Create a phrase for the instrument
  this.durations = createDuration(this.n_measures);
  this.times = durationToTime(this.durations);
  this.notes = chooseNote(this.scale, this.times.length);
  this.phrase = createPhrase(this.durations, this.times, this.notes);
  // Create the part
  this.part = new Tone.Part((time, value) => {
    this.sound.triggerAttackRelease(value.note, value.duration, time);
  }, this.phrase);
  this.part.start(0);
  this.part.loopEnd = n_measures + 'm'
  this.part.loop = loop;
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

Instrument.prototype.generateNew = function () {
  this.part.removeAll()
  // Create a phrase for the instrument
  this.durations = createDuration(this.n_measures);
  this.times = durationToTime(this.durations);
  this.notes = chooseNote(this.scale, this.times.length);
  this.phrase = createPhrase(this.durations, this.times, this.notes);
  // Create the part
  this.part = new Tone.Part((time, value) => {
    this.sound.triggerAttackRelease(value.note, value.duration, time);
  }, this.phrase);
  this.part.start(0);
  this.part.loopEnd = this.n_measures + 'm'
  this.part.loop = true;
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
  Tone.Transport.stop();
  document.getElementById("play-button").style.borderColor = "#000000";
}

function generateMusic() {
  Tone.Transport.stop();
  key = random(all_notes);
  for (j = 0; j < instruments.length; j++) {
    instruments[j].scale = Tonal.Scale.get(key + (j+2) + " pentatonic").notes;
    instruments[j].generateNew();
  }
  Tone.Transport.start();
}

let instruments = [];
let key;

function setup() {
  Tone.Transport.loopEnd = '4m';
  Tone.Transport.loop = true;
  Tone.Transport.bpm.value = 60;  

  key = random(all_notes);

  // Bass section
  bass = new Instrument("Bass", Tonal.Scale.get(key + "2 pentatonic").notes, 1, true);
  instruments.push(bass);

  // Melody section
  melody = new Instrument("Melody", Tonal.Scale.get(key + "3 pentatonic").notes, 4, true);
  instruments.push(melody);
}

