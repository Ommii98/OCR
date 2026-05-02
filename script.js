document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const uploadContent = document.getElementById('upload-content');
    const processingUi = document.getElementById('processing-ui');
    const statusText = document.getElementById('status-text');
    const progressFill = document.getElementById('progress-fill');
    
    const resultArea = document.getElementById('result-area');
    const resultText = document.getElementById('result-text');
    const copyBtn = document.getElementById('copy-btn');
    const resetBtn = document.getElementById('reset-btn');
    
    const languageSelect = document.getElementById('language-select');
    const loadExampleBtn = document.getElementById('load-example-btn');

    let isProcessing = false;

    // --- Drag and Drop Logic ---
    // Prevent default global browser behavior so missing the dropzone doesn't open the file
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        window.addEventListener(eventName, (e) => e.preventDefault(), false);
    });

    dropZone.addEventListener('click', () => {
        if (!isProcessing) fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    });

    dropZone.addEventListener('dragenter', () => {
        if (!isProcessing) dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragover', () => {
        if (!isProcessing) dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        dropZone.classList.remove('dragover');
        
        if (!isProcessing && e.dataTransfer.files.length > 0) {
            handleFile(e.dataTransfer.files[0]);
        }
    });

    // --- Example PDF Logic ---
    loadExampleBtn.addEventListener('click', async () => {
        if (isProcessing) return;
        
        try {
            updateStatus('Downloading example PDF...', 10);
            showProcessingUI();
            
            // Fetch a public domain sample PDF
            const response = await fetch('https://raw.githubusercontent.com/mozilla/pdf.js/master/web/compressed.tracemonkey-pldi-09.pdf');
            const blob = await response.blob();
            const file = new File([blob], 'example.pdf', { type: 'application/pdf' });
            
            await processFile(file);
        } catch (error) {
            console.error(error);
            alert('Failed to load example PDF. Please try uploading a file instead.');
            resetUI();
        }
    });

    // --- File Handling & PDF.js ---
    async function handleFile(file) {
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
        if (!validTypes.includes(file.type)) {
            alert('Please upload a valid PDF or Image file (JPG, PNG, GIF).');
            return;
        }
        
        showProcessingUI();
        await processFile(file);
    }

    async function processFile(file) {
        isProcessing = true;
        let imageToOcr = null;
        let previewSrc = null;

        try {
            if (file.type === 'application/pdf') {
                updateStatus('Converting PDF to Image...', 20);
                imageToOcr = await convertPdfToImage(file);
                previewSrc = imageToOcr;
            } else {
                imageToOcr = file;
                previewSrc = URL.createObjectURL(file);
            }

            // Set preview image
            document.getElementById('preview-image').src = previewSrc;

            await performOCR(imageToOcr);

        } catch (error) {
            console.error(error);
            alert('An error occurred during processing: ' + error.message);
            resetUI();
        } finally {
            isProcessing = false;
        }
    }

    async function convertPdfToImage(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async function(e) {
                try {
                    const typedarray = new Uint8Array(e.target.result);
                    
                    // Load PDF using pdf.js
                    const pdf = await pdfjsLib.getDocument(typedarray).promise;
                    
                    // We'll process the first page
                    const page = await pdf.getPage(1);
                    
                    // Render page to canvas (Scale 1.5 for faster OCR processing while maintaining accuracy)
                    const viewport = page.getViewport({ scale: 1.5 });
                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');
                    
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;
                    
                    await page.render({ canvasContext: context, viewport: viewport }).promise;
                    
                    // Convert canvas to image DataURL
                    resolve(canvas.toDataURL('image/png'));
                } catch (err) {
                    reject(err);
                }
            };
            reader.readAsArrayBuffer(file);
        });
    }

    // --- OCR via Tesseract.js ---
    async function performOCR(imageSource) {
        const lang = languageSelect.value;
        updateStatus('Initializing AI Engine...', 30);

        try {
            const { data: { text } } = await Tesseract.recognize(
                imageSource,
                lang,
                {
                    logger: m => {
                        if (m.status === 'recognizing text') {
                            updateStatus('Extracting text...', 30 + Math.round(m.progress * 70));
                        } else {
                            updateStatus(m.status.charAt(0).toUpperCase() + m.status.slice(1) + '...', 30);
                        }
                    }
                }
            );
            
            showResult(text);
        } catch (err) {
            console.error(err);
            alert("OCR Engine Error. Check the console for more details.");
            resetUI();
        }
    }

    // --- UI State Management ---
    function showProcessingUI() {
        uploadContent.classList.add('hidden');
        processingUi.classList.remove('hidden');
        resultArea.classList.add('hidden');
        dropZone.style.cursor = 'wait';
        fileInput.disabled = true;
        languageSelect.disabled = true;
        loadExampleBtn.disabled = true;
    }

    function updateStatus(text, percent) {
        statusText.textContent = text;
        progressFill.style.width = `${percent}%`;
    }

    function showResult(text) {
        processingUi.classList.add('hidden');
        dropZone.classList.add('hidden');
        resultArea.classList.remove('hidden');
        
        resultText.value = text || 'No text could be found in the image/PDF.';
        
        dropZone.style.cursor = 'pointer';
        fileInput.disabled = false;
        languageSelect.disabled = false;
        loadExampleBtn.disabled = false;
    }

    function resetUI() {
        isProcessing = false;
        fileInput.value = '';
        uploadContent.classList.remove('hidden');
        processingUi.classList.add('hidden');
        resultArea.classList.add('hidden');
        dropZone.classList.remove('hidden');
        
        dropZone.style.cursor = 'pointer';
        fileInput.disabled = false;
        languageSelect.disabled = false;
        loadExampleBtn.disabled = false;
        updateStatus('', 0);
    }

    // --- Result Actions ---
    copyBtn.addEventListener('click', async () => {
        if (!resultText.value) return;
        
        try {
            await navigator.clipboard.writeText(resultText.value);
            
            const originalText = copyBtn.innerHTML;
            copyBtn.innerHTML = '<i class="ph ph-check"></i> Copied!';
            copyBtn.style.color = '#10b981';
            copyBtn.style.borderColor = '#10b981';
            
            setTimeout(() => {
                copyBtn.innerHTML = originalText;
                copyBtn.style.color = '';
                copyBtn.style.borderColor = '';
            }, 2000);
        } catch (err) {
            console.error('Copy failed:', err);
            alert('Failed to copy text.');
        }
    });

    resetBtn.addEventListener('click', resetUI);
});
