window.onload = function() {
	var video = document.getElementById('video');
	var outputImage = document.getElementById('outputImage');
	var promptInput = document.getElementById('promptInput');
	var keyId = 'urfalkeyid'; // change to ur FAL Key ID
	var keySecret = 'urfalkeysecret'; // change to ur FAL Key Secret
	var filestackApiKey = 'ur api key'; // change to ur Filestack API Key

	// 设置摄像头流
	if (navigator.mediaDevices.getUserMedia) {
		navigator.mediaDevices.getUserMedia({
				video: true
			})
			.then(function(stream) {
				video.srcObject = stream;
			})
			.catch(function(error) {
				console.log("Error accessing camera: ", error);
			});
	}

	setInterval(captureAndSend, 5000); // the frequency to send image (5s)

	function captureAndSend() {
		var canvas = document.createElement('canvas');
		canvas.width = video.videoWidth;
		canvas.height = video.videoHeight;
		var ctx = canvas.getContext('2d');
		ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
		var imageDataUrl = canvas.toDataURL('image/jpeg');


		uploadToFilestack(imageDataUrl)
			.then(filestackUrl => {
				console.log("Filestack URL: ", filestackUrl);
				sendToFalApi(filestackUrl, promptInput.value);
			})
			.catch(error => {
				console.error('Filestack upload error:', error);
			});
	}

	function uploadToFilestack(imageDataUrl) {
		return new Promise((resolve, reject) => {
			var xhr = new XMLHttpRequest();
			xhr.open('POST', 'https://www.filestackapi.com/api/store/S3?key=' + filestackApiKey, true);

			xhr.onload = function() {
				if (this.status === 200) {
					try {
						var responseJson = JSON.parse(xhr.responseText);
						if (responseJson.url) {
							resolve(responseJson.url);
						} else {
							reject('URL not found in response');
						}
					} catch (e) {
						reject('Failed to parse JSON response: ' + e.message);
					}
				} else {
					reject('HTTP Error: ' + this.status);
				}
			};

			xhr.onerror = function() {
				reject('Network Error');
			};

			var data = new FormData();
			var binary = atob(imageDataUrl.split(',')[1]);
			var array = [];
			for (var i = 0; i < binary.length; i++) {
				array.push(binary.charCodeAt(i));
			}
			var blob = new Blob([new Uint8Array(array)], {
				type: 'image/jpeg'
			});
			data.append('fileUpload', blob);

			xhr.send(data);
		});
	}


	function sendToFalApi(imageUrl, prompt) {
		var headers = {
			"Authorization": "Key " + keyId + ":" + keySecret,
			"Content-Type": "application/json"
		};

		var body = {
			model: "sdv1-5",
			prompt: prompt + "",
			image_url: imageUrl + "",
			seed: 49935

		};

		fetch("https://110602490-lcm.gateway.alpha.fal.ai", {
				method: "POST",
				body: JSON.stringify(body),
				headers: headers,
			})
			.then((response) => {
				if (!response.ok) {
					throw new Error('API Request failed with status ' + response.status);
				}
				return response.json();
			})
			.then((data) => {
				console.log('FAL API Response:', data);

				if (data.images && data.images.length > 0) {
					var imageUrl = data.images[0].url;

					if (data.nsfw_content_detected[0]) {
						console.warn('NSFW content detected');

					}

					outputImage.src = imageUrl;
				} else {
					console.error('Image URL not found in response');

				}
			})
			.catch((error) => {
				console.error('Error:', error);
			});
	}
};
