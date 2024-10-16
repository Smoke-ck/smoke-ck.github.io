document.addEventListener("DOMContentLoaded",	function() {
	let rpmMeter = new GaugeMeter(document.querySelector(".meter--rpm"), {
		value: 6.3,
		valueMin: 0,
		valueMax: 8000,
		valueStep: 1000,
		valueUnit: "<div>RPM</div><span>x1000</span>",
		angleMin: 30,
		angleMax: 330,
		labelUnit: "RPM",
		labelFormat: function(v) { return Math.round(v / 1000); },
		needleFormat: function(v) { return Math.round(v / 100) * 100; },
		valueRed: 6500
	});

	let speedMeter = new GaugeMeter(document.querySelector(".meter--speed"), {
		value: 203,
		valueMin: 0,
		valueMax: 220,
		valueStep: 20,
		valueUnit: "<span>Speed</span><div>Km/h</div>",
		angleMin: 30,
		angleMax: 330,
		labelUnit: "Km/h",
		labelFormat: function(v) { return Math.round(v); },
		needleFormat: function(v) { return Math.round(v); }
	});

	document.onkeydown = keyDown;
	document.onkeyup = keyUp;

	function keyDown(e) {
		e = e || window.event;

    updateSpeedFromGeolocation(e);
		if (e.keyCode == '38') {
			isAccelerating = true;
		}
		else if (e.keyCode == '40') {
			isBraking = true;
		}
	}

	function keyUp(e) {

		e = e || window.event;

    updateSpeedFromGeolocation(e);
		if (e.keyCode == '38') {
			isAccelerating = false;
		}
		else if (e.keyCode == '40') {
			isBraking = false;
		}
	}

	// VEHICLE CONFIG
	let
      brakeTorqueMax = 1,
      brakeTorque;

  // Set the global speed variable for controlling the star movement speed in the stars animation
  window.speed = 0;

	let
			rpmIdle = 0,
			rpmMax = 7000,
			torqueVal = 30, // in m.kg
			torque,
			rpm = 0,
			isAccelerating = false,
			isBraking = false;

	// Helper functions
	let torqueByRpm = function(rpm) {
		let torque = torqueVal + (rpm / rpmMax) ;
		return torque;
	};

	// MAIN LOOP
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let sourceNodes = {};
  let gainNodes = {};
  let audioBuffers = {};
  let startNode = null;
  let startGain = null;
  let startAudioBuffer = null;
  let isKeyboard = false;

  function updateSpeedFromGeolocation(event) {

    if (event.coords && !isAccelerating) {
      speed = Math.round(event.coords.speed * 3.6);
      isKeyboard = false;
    } else {
      isKeyboard = true;
    }
  }

  const runButton = document.querySelector('.accelerator');
  runButton.disabled = true;

  runButton.addEventListener("mousedown", function(e) {
    e.target.style.transform = "rotateX(30deg)"
    isAccelerating = true;
    isBraking = true;
    isKeyboard = true
    simulateAcceleration();
  });

  runButton.addEventListener("mouseup", function(e) {
    e.target.style.transform = "rotateX(0deg)"
    isAccelerating = false;
    isBraking = false;
  });

  runButton.addEventListener("mouseleave", function(e) {
    e.target.style.transform = "rotateX(0deg)"
    isAccelerating = false;
    isBraking = false;
  });

  runButton.addEventListener("touchstart", (e) => {
    e.preventDefault();
    e.target.style.transform = "rotateX(30deg)"
    isAccelerating = true;
    isBraking = true;
    isKeyboard = true;
    simulateAcceleration();
  },{ passive: false });

  document.addEventListener("touchend", (e) => {
    e.target.style.transform = "rotateX(0deg)"
    isAccelerating = false;
  });

  function simulateAcceleration() {
    if (isAccelerating) {
        setTimeout(simulateAcceleration, 0);
    }
  }

  (function engineLoop(){
    window.requestAnimationFrame(engineLoop);
    torque = isAccelerating && rpm < rpmMax ? torqueByRpm(rpm) : -(rpm * rpm / 1000000);
    brakeTorque = isBraking ? brakeTorqueMax : 0;
    if (isKeyboard) { speed += torque / 10 - brakeTorque; }
    if (speed < 0) { speed = 0; }
    rpm = rpmIdle + (speed / 200)*( rpmMax - rpmIdle);
    speedMeter.setValue(speed);
    rpmMeter.setValue(rpm);
    if (sourceNodes[600]) { updateSound(rpm); }
  })();

  const loadCarSound = async (url) => {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    return await audioCtx.decodeAudioData(arrayBuffer);
  };

  const loadSounds = async (folder) => {
    const startEngine = 'assets/sounds/starter.wav'
      const sounds = {
        600: `assets/sounds/${folder}/600.wav`,
        1000: `assets/sounds/${folder}/1000.wav`,
        2000: `assets/sounds/${folder}/2000.wav`,
        3000: `assets/sounds/${folder}/3000.wav`,
        4000: `assets/sounds/${folder}/4000.wav`,
        5000: `assets/sounds/${folder}/5000.wav`,
        6000: `assets/sounds/${folder}/6000.wav`,
        7000: `assets/sounds/${folder}/7000.wav`
      };

      for (const rpm in sounds) {
        const audioBuffer = await loadCarSound(sounds[rpm]);
        audioBuffers[rpm] = audioBuffer;
      }
    startAudioBuffer = await loadCarSound(startEngine);
  };

  const setAudioBuffer = () => audioCtx.createBufferSource();
  const createGain = () => audioCtx.createGain();

  const updateSound = (rpm) => {
    const interpolate = (rpm, minRpm, maxRpm) => Math.max(0, Math.min(1, (rpm - minRpm) / (maxRpm - minRpm)));

    const t1 = interpolate(rpm, 600, 1000);
    const t2 = interpolate(rpm, 1000, 2000);
    const t3 = interpolate(rpm, 2000, 3000);
    const t4 = interpolate(rpm, 3000, 4000);
    const t5 = interpolate(rpm, 4000, 5000);
    const t6 = interpolate(rpm, 5000, 6000);
    const t7 = interpolate(rpm, 6000, 7000);
    const currentTime = audioCtx.currentTime;
    const keys =  Object.keys(sourceNodes);
    const transitions = [1 - t1, t1 - t2, t2 - t3, t3 - t4, t4 - t5, t5 - t6, t6 - t7, t7];

    if (keys.length) {
      keys.forEach((rpmValue, index) => {
        sourceNodes[rpmValue].playbackRate.value = rpm / rpmValue;
        gainNodes[rpmValue].gain.cancelScheduledValues(currentTime);
        gainNodes[rpmValue].gain.linearRampToValueAtTime(transitions[index], currentTime);
      });
    }
  };

  const startStop = document.querySelector('#startStopButton');
  const buttonText = document.querySelector('.toggle-start-stop__text');
  const buttonIndicator = document.querySelector('.toggle-start-stop__indicator');

  const startEngine = async ()  => {
    await loadSounds('car1')

    const bufferSource = setAudioBuffer();
    bufferSource.buffer = startAudioBuffer;
    const gainNode = createGain();
    bufferSource.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    bufferSource.loop = false;
    bufferSource.start();

    startNode = bufferSource;
    startGain = gainNode;
    startGain.gain.setValueAtTime(1, audioCtx.currentTime);

    setTimeout(() => {

      for (const rpm in audioBuffers) {
        const bufferSource = setAudioBuffer();
        bufferSource.buffer = audioBuffers[rpm];
        const gainNode = createGain();
        bufferSource.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        bufferSource.loop = true;
        bufferSource.start();

        sourceNodes[rpm] = bufferSource;
        gainNodes[rpm] = gainNode;
      }

      for (const node in gainNodes) {
        if (node === '600') {
          gainNodes[node].gain.setValueAtTime(1, audioCtx.currentTime);
        } else {
          gainNodes[node].gain.setValueAtTime(0, audioCtx.currentTime);
        }
      }
      runButton.disabled = false;
      rpmIdle = 600;
      startStop.disabled = false;
      buttonText.style = 'color: #e6bf79;'
      buttonIndicator.style = 'background: #e6bf79;'
    }, 600);
  }

  const stopEngine = () => {
    for (const rpm in sourceNodes) {
      sourceNodes[rpm].stop();
      sourceNodes[rpm].disconnect();
    }

    if (startNode) {
      startNode.stop();
      startNode.disconnect();
    }

    setTimeout(() => {
      sourceNodes = {};
      gainNodes = {};
      audioBuffers = {};
      runButton.disabled = true;
      buttonText.style = 'color: white;'
      buttonIndicator.style = 'background: white;'
      speed = 0;
      rpmIdle = 0;
    }, 300);
  };

  startStop.addEventListener('change', (e) => {
    buttonText.style = 'transform: scale(0.95);'

    if(e.target.checked) {
      startEngine();
      e.target.disabled = true;
    } else {
      stopEngine();
    }
  });
  navigator.geolocation.watchPosition(updateSpeedFromGeolocation, null, { enableHighAccuracy: !0 });
});
