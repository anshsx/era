const fileInput = document.getElementById('fileInput');
const uploadArea = document.getElementById('uploadArea');
const fileList = document.getElementById('fileList');
const mergeButton = document.getElementById('mergeButton');
const mergedFileName = document.getElementById('mergedFileName');
const addPageNumbers = document.getElementById('addPageNumbers');
const contactForm = document.getElementById('contactForm');

let files = [];

fileInput.addEventListener('change', handleFileSelect);
uploadArea.addEventListener('dragover', handleDragOver);
uploadArea.addEventListener('drop', handleDrop);
mergeButton.addEventListener('click', mergePDFs);
contactForm.addEventListener('submit', handleContactFormSubmit);

function handleFileSelect(event) {
    const newFiles = Array.from(event.target.files);
    addFiles(newFiles);
}

function handleDragOver(event) {
    event.preventDefault();
    event.stopPropagation();
    uploadArea.classList.add('drag-over');
}

function handleDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    uploadArea.classList.remove('drag-over');
    const newFiles = Array.from(event.dataTransfer.files).filter(file => file.type === 'application/pdf');
    addFiles(newFiles);
}

function addFiles(newFiles) {
    files = [...files, ...newFiles];
    updateFileList();
}

function updateFileList() {
    fileList.innerHTML = '';
    files.forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.classList.add('file-item');
        fileItem.innerHTML = `
            <div class="file-icon">PDF</div>
            <span class="file-name">${file.name}</span>
        `;
        fileList.appendChild(fileItem);
    });
    mergeButton.disabled = files.length < 2;
}

async function mergePDFs() {
    mergeButton.disabled = true;
    mergeButton.textContent = 'Merging...';

    try {
        const mergedPdf = await PDFLib.PDFDocument.create();
        
        for (const file of files) {
            const pdfBytes = await file.arrayBuffer();
            const pdfDoc = await PDFLib.PDFDocument.load(pdfBytes);
            const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
            
            for (const page of copiedPages) {
                const addedPage = mergedPdf.addPage(page);

                if (addPageNumbers.checked) {
                    addPageNumber(addedPage, mergedPdf.getPageCount());
                }
            }
        }
        
        const pdfBytes = await mergedPdf.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = getOutputFileName();
        link.click();
        alert("Pdf has been successfully saved to you device 🥳");
    } catch (error) {
        console.error('Error merging PDFs:', error);
        alert('An error occurred while merging PDFs. Please try again.');
    } finally {
        mergeButton.disabled = false;
        mergeButton.textContent = 'Merge PDFs';
    }
}

function getOutputFileName() {
    const customName = mergedFileName.value.trim();
    if (customName) {
        return customName.endsWith('.pdf') ? customName : `${customName}.pdf`;
    }
    return 'merged.pdf';
}

function addPageNumber(page, pageNumber) {
    const { width, height } = page.getSize();
    page.drawText(`${pageNumber}`, {
        x: width / 2,
        y: 30,
        size: 12,
        color: PDFLib.rgb(0,0,0),
    });
}

function handleContactFormSubmit(event) {
    event.preventDefault();
    const formData = new FormData(contactForm);
    const name = formData.get('name');
    const email = formData.get('email');
    const message = formData.get('message');
    
    // Prepare the mailto link
    const subject = 'Feedback by PDF MERGE USER';
    const body = `Mail by ${name}, ${email}\n\n${message}`;
    const mailToLink = `mailto:erasearch.co@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    // Open the default email client with pre-filled email
    window.location.href = mailToLink;
}

// Add drag and drop visual feedback
uploadArea.addEventListener('dragenter', () => uploadArea.classList.add('drag-over'));
uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('drag-over'));
