'use strict';

let mediaRecorder;
let recordedBlobs;

// Aquí se crean las variables con los ID's referentes a las etiquetas HTML
const errorMsgElement = document.querySelector('span#errorMsg');
const gumVideo = document.querySelector('video#gum');
const echoCancellation = document.querySelector('#echoCancellation');
const startButton = document.querySelector('button#start');
const recordButton = document.querySelector('button#record');
const playButton = document.querySelector('button#play');
const downloadButton = document.querySelector('button#download');


// (1) Este código se ejecuta al activar la cámara
startButton.addEventListener('click', async () => {
  const hasEchoCancellation = echoCancellation.checked;
  const constraints = {
    audio: {
      echoCancellation: {
        exact: hasEchoCancellation
      }
    },
    video: {
      width: 1280,
      height: 720
    }
  };
  console.log('Using media constraints:', constraints);
  await init(constraints);
});

async function init(constraints) {
  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    handleSuccess(stream);
  } catch (e) {
    console.error('navigator.getUserMedia error:', e);
    errorMsgElement.innerHTML = `navigator.getUserMedia error:${e.toString()}`;
  }
}

function handleSuccess(stream) {
  recordButton.disabled = false;
  console.log('getUserMedia() got stream:', stream);
  window.stream = stream;
  gumVideo.srcObject = stream;
}
////////////////////////////////////////////////////////

// (2) Este código se utiliza al empezar o detener la grabación
recordButton.addEventListener('click', () => {
  if (recordButton.textContent === 'Start Recording') {
    startRecording();
  } else {
    stopRecording();
    recordButton.textContent = 'Start Recording';
    playButton.disabled = false;
    downloadButton.disabled = false;
  }
});

function startRecording() {
  recordedBlobs = [];
  let options = {
    mimeType: 'video/webm;codecs=vp9,opus'
  };
  if (!MediaRecorder.isTypeSupported(options.mimeType)) {
    console.error(`${options.mimeType} is not supported`);
    options = {
      mimeType: 'video/webm;codecs=vp8,opus'
    };
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      console.error(`${options.mimeType} is not supported`);
      options = {
        mimeType: 'video/webm'
      };
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        console.error(`${options.mimeType} is not supported`);
        options = {
          mimeType: ''
        };
      }
    }
  }

  try {
    mediaRecorder = new MediaRecorder(window.stream, options);
  } catch (e) {
    console.error('Exception while creating MediaRecorder:', e);
    errorMsgElement.innerHTML = `Exception while creating MediaRecorder: ${JSON.stringify(e)}`;
    return;
  }

  console.log('Created MediaRecorder', mediaRecorder, 'with options', options);
  recordButton.textContent = 'Stop Recording';
  playButton.disabled = true;
  downloadButton.disabled = true;
  mediaRecorder.onstop = (event) => {
    console.log('Recorder stopped: ', event);
    console.log('Recorded Blobs: ', recordedBlobs);
  };
  mediaRecorder.ondataavailable = handleDataAvailable;
  mediaRecorder.start();
  console.log('MediaRecorder started', mediaRecorder);
}

function handleDataAvailable(event) {
  console.log('handleDataAvailable', event);
  if (event.data && event.data.size > 0) {
    recordedBlobs.push(event.data);
  }
}

function stopRecording() {
  mediaRecorder.stop();
}
////////////////////////////////////////////////////////

// (3) Este código se utiliza para reproducir la grabación
playButton.addEventListener('click', () => {  
  const superBuffer = new Blob(recordedBlobs, {
    type: 'video/webm'
  });
  gumVideo.src = null;
  gumVideo.srcObject = null;
  gumVideo.src = window.URL.createObjectURL(superBuffer);
  gumVideo.controls = true;
  gumVideo.play();
});

////////////////////////////////////////////////////////

// (4) Este código se utiliza para descargar la grabación
downloadButton.addEventListener('click', () => {
  const blob = new Blob(recordedBlobs, {
    type: 'video/webm'
  });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = 'test.webm';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 100);
});