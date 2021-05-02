const videoElement=document.querySelector('video');
const startBtn=document.getElementById('startBtn');
const stopBtn=document.getElementById('stopBtn');
const videoSelectBtn=document.getElementById('videoSelectBtn');

// Importing capturer from electron
// Remote help us build native menues of the OS in our frontend, it allows interprocess communication
const { desktopCapturer, remote } = require('electron');

// On click handeler
videoSelectBtn.onclick = getVideoSources;


const { Menu } = remote;
// Get the available video sources
async function getVideoSources() {
    // Will return all the sources to captuer from
    const inputSources = await desktopCapturer.getSources({
      types: ['window', 'screen']
    });

    // To build "select source"  menu
    const videoOptionsMenu = Menu.buildFromTemplate(

        // Using map function to destructure the list of sources found before
        inputSources.map(source => {
          return {
            label: source.name,
            click: () => selectSource(source)
          };
        })
      );
    
        //for menu popup
      videoOptionsMenu.popup();

  }

  let mediaRecorder; // MediaRecorder instance to capture footage
const recordedChunks = [];

// Change the videoSource window to record
async function selectSource(source) {

    // Update text on select button
  videoSelectBtn.innerText = source.name;

  const constraints = {
    audio: false,
    video: {
      mandatory: {
        chromeMediaSource: 'desktop',
        chromeMediaSourceId: source.id
      }
    }
  };

  // Create a Stream
  // This will return video output of whatever is happening in selected window  
  const stream = await navigator.mediaDevices
    .getUserMedia(constraints);

   // Preview the source in a video element
  videoElement.srcObject = stream;
  videoElement.play();

  // Create the Media Recorder
  const options = { mimeType: 'video/webm; codecs=vp9' };
    //Instantiate MediaRecorder   
  mediaRecorder = new MediaRecorder(stream, options);

  // Register Event Handlers
  mediaRecorder.ondataavailable = handleDataAvailable;
  mediaRecorder.onstop = handleStop;
}

// fs= file system
const { writeFile } = require('fs');
const { dialog } = remote;

// When start button is clicked, to change color and text
startBtn.onclick = e => {
  mediaRecorder.start();
  startBtn.classList.add('is-danger');
  startBtn.innerText = 'Recording';
};

// When stop button is clicked, to change color and text

stopBtn.onclick = e => {
  mediaRecorder.stop();
  startBtn.classList.remove('is-danger');
  startBtn.innerText = 'Start';
};

// Captures all recorded chunks and push data into array
function handleDataAvailable(e) {
    console.log('video data available');
    recordedChunks.push(e.data);
  }

  // Saves the video file on stop
async function handleStop(e) {
    // blob is a data structure to handle raw data, here video file
    const blob = new Blob(recordedChunks, {
      type: 'video/webm; codecs=vp9'
    });
    
    // it is also an object to save raw data, this is the format needed for saving to file
    const buffer = Buffer.from(await blob.arrayBuffer());
  
    // To show save dialog box in native os UI
    const { filePath } = await dialog.showSaveDialog({
  
      buttonLabel: 'Save video',
    //   Default naming convention to save video
      defaultPath: `vid-${Date.now()}.webm`
    });
  
    console.log(filePath);
  
    // File path and buffer passed to save data finally
    writeFile(filePath, buffer, () => console.log('video saved successfully!'));
  }