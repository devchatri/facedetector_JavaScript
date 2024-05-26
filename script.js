const video = document.getElementById('video');

// Charger les modèles de face-api.js
Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri('models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('models'),
  faceapi.nets.faceRecognitionNet.loadFromUri('models')
]).then(startVideo).catch(err => console.error('Erreur de chargement des modèles:', err));

// Fonction pour démarrer la vidéo
function startVideo() {
  navigator.mediaDevices.getUserMedia({ video: {} })
    .then(stream => {
      video.srcObject = stream;
      console.log('Vidéo démarrée');
    })
    .catch(err => console.error('Erreur de démarrage de la vidéo:', err));
}

video.addEventListener('play', () => {
  const canvas = faceapi.createCanvasFromMedia(video);
  document.body.append(canvas);
  const displaySize = { width: video.width, height: video.height };
  faceapi.matchDimensions(canvas, displaySize);

  setInterval(async () => {
    const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptors();
    const resizedDetections = faceapi.resizeResults(detections, displaySize);
    
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    faceapi.draw.drawDetections(canvas, resizedDetections);
    faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
  }, 100);
});

document.getElementById('loginButton').addEventListener('click', async () => {
  console.log('Bouton login cliqué');
  const labeledFaceDescriptors = await loadLabeledImages();
  const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6);

  const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptors();
  const results = detections.map(d => faceMatcher.findBestMatch(d.descriptor));

  console.log('Résultats:', results);

  if (results.some(result => result.label !== 'unknown')) {
    alert('Login réussi');
  } else {
    alert('Échec de l\'authentification');
  }
});

async function loadLabeledImages() {
  const labels = ['Personne1', 'Personne2']; // Remplacez par les noms des personnes autorisées
  return Promise.all(
    labels.map(async label => {
      const descriptions = [];
      for (let i = 1; i <= 3; i++) { // Charger plusieurs images pour chaque personne
        const img = await faceapi.fetchImage(`labeled_images/${label}/${i}.jpg`);
        const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();
        descriptions.push(detections.descriptor);
      }
      return new faceapi.LabeledFaceDescriptors(label, descriptions);
    })
  );
}
