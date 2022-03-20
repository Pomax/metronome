import { router } from "./router.js";

function run(err) {
  if (err) {
    return err;
  }
}

// router function for incoming MIDI messages
function getMIDIMessage(midiMessage) {
  var data = midiMessage.data;
  var status = data[0];
  var type = (status & 0xf0) >> 4;
  var channel = status & 0x0f;
  var data = data.slice(1);
  router.receive(type, channel, data);
}

// general bootstrapping
function onMidiSuccess(success) {
  let devices = [];
  console.log(`INPUT DEVICES FOUND`);
  for (let input of success.inputs.values()) {
    console.log(input);
    devices.push(input);
    input.close();
  }

  const htmlNode = document.getElementById(`mididevice`);
  htmlNode.append(document.createElement(`option`));
  devices.forEach((input) => {
    const option = document.createElement(`option`);
    option.value = option.textContent = input.name;
    htmlNode.append(option);
  });

  htmlNode.addEventListener(`change`, (evt) => {
    // close all ports
    devices.forEach((d) => d.close());
    // then bind to the indicated device
    const name = evt.target.value;
    const desired = devices.find((v) => v.name === name);
    desired
      .open()
      .then((d) => console.log(`Now using ${d.name}`))
      .catch((e) => console.error(`Error connecting to ${name}`));
    desired.onmidimessage = getMIDIMessage;
  });

  let msg;
  if (devices.length === 0) {
    msg = `No MIDI devices were found.`;
  } else {
    htmlNode.removeAttribute(`disabled`);
  }
  return run(msg);
}

// even if midi device access fails, we still have a synth to play with
function onMidiFail() {
  return run(
    `Web MIDI is available, but MIDI device access failed (and the\nspec does not give me more details to help you find out why...)`
  );
}

// kick it all of.
async function connectMIDI() {
  if (!navigator.requestMIDIAccess) {
    // Warn the user that they won't have MIDI functionality. Then load anyway
    run(
      `WebMIDI is not supported (without plugins?) in this browser.\nYou can still play around, just... no MIDI functionality, obviously.`
    );
  } else {
    try {
      const result = await navigator.requestMIDIAccess();
      return onMidiSuccess(result);
    } catch (e) {
      onMidiFail();
    }
  }
}

export { connectMIDI };
