let useFrontCamera = false;



window.onload = function() {
	var video = document.createElement('video'); // 创建而非获取video元素
	var outputImage = document.getElementById('outputImage');
	var promptInput = document.getElementById('promptInput');
	var keyId = 'ur falai key';
	var keySecret = 'ur falai key';

	if (navigator.mediaDevices.getUserMedia) {
		navigator.mediaDevices.getUserMedia({
				video: true
			})
			.then(function(stream) {
				video.srcObject = stream;
				video.play(); // 确保视频播放
			})
			.catch(function(error) {
				console.log("Error accessing camera: ", error);
			});
	}

	setInterval(captureAndSend, 1500); // the frequency to send image (1.5s)

	function captureAndSend() {
		var canvas = document.createElement('canvas');
		canvas.width = video.videoWidth;
		canvas.height = video.videoHeight;
		var ctx = canvas.getContext('2d');
		ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
		var imageDataUrl = canvas.toDataURL('image/jpeg');

		sendToFalApi(imageDataUrl, promptInput.value);
	}

	function sendToFalApi(imageDataUrl, prompt) {
		var headers = {
			"Authorization": "Key " + keyId + ":" + keySecret,
			"Content-Type": "application/json"
		};

		var body = {
			model: "sdv1-5",
			prompt: prompt + "",
			image_url: imageDataUrl + "",
			seed: -1
		};

		fetch("https://fal.run/fal-ai/lcm", {
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
