document.getElementById('generateBtn').addEventListener('click', function () {
    const prompt = document.getElementById('prompt').value;
    const width = document.getElementById('width').value;
    const height = document.getElementById('height').value;

    let coins = parseInt(document.getElementById('coins').innerText);

    // Check if coins are available
    if (coins <= 0) {
        alert('You have run out of coins for today. Please try again tomorrow!');
        return;
    }

    // Validate the prompt
    if (!prompt) {
        alert('Please enter a prompt.');
        return;
    }

    // Show loader
    document.getElementById('loader').style.display = 'flex';

    // Generate a random seed between 0 and 50
    const seed = Math.floor(Math.random() * 51);

    // Call the image generation API
    fetch(`https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&seed=${seed}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Image generation failed. Please try again.');
            }
            return response.blob(); // Read the response as a Blob (image)
        })
        .then(imageBlob => {
            // Create a local URL for the image blob
            const imageUrl = URL.createObjectURL(imageBlob);

            // Update coin count
            coins -= 1;
            document.getElementById('coins').innerText = coins;

            // Hide loader
            document.getElementById('loader').style.display = 'none';

            // Show popup
            document.getElementById('imagePopup').style.display = 'flex';
            document.getElementById('popupPrompt').innerText = prompt;
            document.getElementById('popupDimensions').innerText = `Dimensions: ${width} x ${height}`;

            // Set the generated image source
            const img = document.getElementById('generatedImagePopup');
            img.src = imageUrl; // Use the created object URL

            // Store the image URL for downloading later
            document.getElementById('downloadBtn').dataset.imageUrl = imageUrl;
        })
        .catch(error => {
            console.error('Error:', error);
            alert(error.message);
            // Hide loader if there's an error
            document.getElementById('loader').style.display = 'none';
        });
});

// Download functionality
document.getElementById('downloadBtn').addEventListener('click', function () {
    const img = this.dataset.imageUrl; // Get the stored image URL
    const a = document.createElement('a');
    a.href = img;
    a.download = 'generated_image.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
});

// Close popup functionality
document.getElementById('closePopup').addEventListener('click', function () {
    document.getElementById('imagePopup').style.display = 'none';
});

// Floating close button functionality
document.getElementById('floatingCloseBtn').addEventListener('click', function () {
    document.getElementById('imagePopup').style.display = 'none';
});

// Coin Reset Logic
const resetCoins = () => {
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const timeToMidnight = midnight - now;

    setTimeout(() => {
        document.getElementById('coins').innerText = 10; // Reset coins to 10
        resetCoins(); // Recursively set the next reset
    }, timeToMidnight);
};

// Start the coin reset process
resetCoins();
