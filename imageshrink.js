document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('file-input');
    const uploadArea = document.getElementById('upload-area');
    const editorSection = document.getElementById('editor-section');
    const previewImage = document.getElementById('preview-image');
    const widthInput = document.getElementById('width-input');
    const heightInput = document.getElementById('height-input');
    const qualityInput = document.getElementById('quality-input');
    const resizeMethod = document.getElementById('resize-method');
    const formatSelect = document.getElementById('format-select');
    const filenameInput = document.getElementById('filename-input');
    const maintainAspectRatio = document.getElementById('maintain-aspect-ratio');
    const fileSizeDisplay = document.getElementById('file-size');
    const resetButton = document.getElementById('reset-button');
    const downloadButton = document.getElementById('download-button');
    const canvas = document.getElementById('canvas');
    const menuToggle = document.querySelector('.menu-toggle');
    const navbarMenu = document.querySelector('.navbar-menu');

    let originalImage = null;
    let aspectRatio = 1;

    // Mobile menu toggle
    menuToggle.addEventListener('click', () => {
        navbarMenu.classList.toggle('active');
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.navbar') && navbarMenu.classList.contains('active')) {
            navbarMenu.classList.remove('active');
        }
    });

    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', (e) => e.preventDefault());
    uploadArea.addEventListener('drop', handleFileDrop);
    fileInput.addEventListener('change', handleFileSelect);
    widthInput.addEventListener('input', handleWidthChange);
    heightInput.addEventListener('input', handleHeightChange);
    qualityInput.addEventListener('input', updateImage);
    resizeMethod.addEventListener('change', updateImage);
    formatSelect.addEventListener('change', updateImage);
    maintainAspectRatio.addEventListener('change', updateImage);
    resetButton.addEventListener('click', resetImage);
    downloadButton.addEventListener('click', downloadImage);

    function handleFileDrop(e) {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            processFile(file);
        }
    }

    function handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            processFile(file);
        }
    }

    function processFile(file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            originalImage = new Image();
            originalImage.onload = function() {
                aspectRatio = originalImage.width / originalImage.height;
                widthInput.value = originalImage.width;
                heightInput.value = originalImage.height;
                updateImage();
                editorSection.classList.remove('hidden');
                scrollToEditor();
            };
            originalImage.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    function handleWidthChange() {
        if (maintainAspectRatio.checked) {
            heightInput.value = Math.round(widthInput.value / aspectRatio);
        }
        updateImage();
    }

    function handleHeightChange() {
        if (maintainAspectRatio.checked) {
            widthInput.value = Math.round(heightInput.value * aspectRatio);
        }
        updateImage();
    }

    function updateImage() {
        if (!originalImage) return;

        const ctx = canvas.getContext('2d');
        const width = parseInt(widthInput.value);
        const height = parseInt(heightInput.value);
        canvas.width = width;
        canvas.height = height;

        if (resizeMethod.value === 'crop') {
            const scaleFactor = Math.max(width / originalImage.width, height / originalImage.height);
            const scaledWidth = originalImage.width * scaleFactor;
            const scaledHeight = originalImage.height * scaleFactor;
            const offsetX = (width - scaledWidth) / 2;
            const offsetY = (height - scaledHeight) / 2;
            ctx.drawImage(originalImage, offsetX, offsetY, scaledWidth, scaledHeight);
        } else {
            ctx.drawImage(originalImage, 0, 0, width, height);
        }

        const format = formatSelect.value;
        const quality = parseInt(qualityInput.value) / 100;
        const dataUrl = canvas.toDataURL(`image/${format}`, quality);

        previewImage.src = dataUrl;
        updateFileSize(dataUrl);
    }

    function updateFileSize(dataUrl) {
        const head = 'data:image/png;base64,';
        const fileSizeBytes = Math.round((dataUrl.length - head.length) * 3 / 4);
        const fileSizeKB = (fileSizeBytes / 1024).toFixed(2);
        fileSizeDisplay.textContent = `Estimated file size: ${fileSizeKB} KB`;
    }

    function resetImage() {
        if (originalImage) {
            widthInput.value = originalImage.width;
            heightInput.value = originalImage.height;
            qualityInput.value = 80;
            resizeMethod.value = 'stretch';
            formatSelect.value = 'jpeg';
            maintainAspectRatio.checked = true;
            updateImage();
        }
    }

    function downloadImage() {
        if (!originalImage) return;

        const format = formatSelect.value;
        const filename = filenameInput.value || 'resized-image';
        const link = document.createElement('a');
        link.download = `${filename}.${format}`;
        link.href = previewImage.src;
        link.click();
    }

    function scrollToEditor() {
        editorSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });
});
