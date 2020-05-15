let all_notes = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"]

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
    for (var j = 0; j < duration[i].length; j++) {
      notes.push(random(scale));
    }
  }
  return notes
}

function chooseChords(key, len) {
  // Return a set of length len of elements belonging to scale
  chords = [];
  if (Math.round(Math.random()) == 1) {
    key_chords = Tonal.Key.majorKey(key).chords;
    console.log('Major');
  } else {
    key_chords = Tonal.Key.minorKey(key).natural.chords;
    console.log('Minor');
  }
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

function Instrument(chords_progression, octave, poly) {
  this.poly = poly;
  this.octave = octave;
  this.chords_progression = chords_progression;
  // Set the instrument
  if (poly) {
    // If poly is true, it will create a polyphonic instrument
    this.sound = new Tone.PolySynth(3, Tone.Synth, {
      oscillator: {
        type: "sine"
      }
    }).toMaster();
    this.sound.volume.value = -12;
  } else {
    this.sound = new Tone.Synth({
      oscillator: {
        type: "sine"
      }
    }
    ).toMaster();
  }
  this.part = new Tone.Part();
  this.generate();
}

Instrument.prototype.generate = function () {
  this.part.removeAll()
  if (this.poly) {
    // Create a phrase for the instrument
    this.durations = new Array(this.chords_progression.length);
    this.durations.fill(1);
    this.durations = [this.durations];
    this.times = durationToTime(this.durations);
    this.notes = this.chords_progression;
    this.phrase = createChordsPhrase(this.durations[0], this.times, this.notes);
    // Create the part
    this.part = new Tone.Part((time, value) => {
      this.sound.triggerAttackRelease(value.note, value.duration, time);
    }, this.phrase);
    this.part.start(0);
    this.part.loopEnd = this.chords_progression.length + 'm';
    this.part.loop = true;
  } else {
    // Create a phrase for the instrument
    this.durations = createDuration(this.chords_progression.length);
    this.times = durationToTime(this.durations);
    this.notes = chooseNote(this.chords_progression, this.durations);
    this.phrase = createPhrase(this.durations, this.times, this.notes, this.octave);
    // Create the part
    this.part = new Tone.Part((time, value) => {
      this.sound.triggerAttackRelease(value.note, value.duration, time);
    }, this.phrase);
    this.part.start(0);
    this.part.loopEnd = this.chords_progression.length + 'm';
    this.part.loop = true;
  }
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
  chords_progression = chooseChords(key, 4);
  for (var i = 0; i < instruments.length; i++) {
    instruments[i].chords_progression = chords_progression;
    instruments[i].generate();
  }
  Tone.Transport.bpm.value = Math.round(random(40, 90));
  Tone.Transport.start();
}

let instruments = [];
let key;

function setup() {
  Tone.Transport.loopEnd = '4m';
  Tone.Transport.loop = true;
  Tone.Transport.bpm.value = Math.round(random(40, 90));

  // Get the key
  key = random(all_notes);
  // Generate the chords progression
  chords_progression = chooseChords(key, 4);

  // Chords section
  chords = new Instrument(chords_progression, "3", true);
  instruments.push(chords)

  // Bass section
  bass = new Instrument(chords_progression, "2", false);
  instruments.push(bass);

  // Melody section
  melody = new Instrument(chords_progression, "4", false);
  instruments.push(melody);


}

