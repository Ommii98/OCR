# ExtractText - AI OCR Web Tool

![ExtractText Demo](https://img.shields.io/badge/Status-Live-success?style=for-the-badge) ![Tech Stack](https://img.shields.io/badge/Tech-HTML%20%7C%20CSS%20%7C%20JS-blue?style=for-the-badge)

A powerful, entirely browser-based Optical Character Recognition (OCR) tool that extracts text from images and PDFs without ever sending your files to a server.

**Live Demo:** [ommii98.github.io/OCR](https://ommii98.github.io/OCR/)

---

## 🛠️ How I Built This

I wanted to create a highly responsive, professional web tool that could magically read text out of images and PDFs, but I had one strict requirement: **Privacy**. 

Many free OCR tools upload your sensitive documents to a backend server to process them. I wanted everything to run locally in the browser. 

Here is the breakdown of how I achieved that:

### 1. The OCR Engine: Tesseract.js
To handle the image-to-text conversion natively in the browser, I relied on [Tesseract.js](https://tesseract.projectnaptha.com/). Tesseract.js is a WebAssembly port of the famous Tesseract OCR engine (originally developed by HP and Google). By fetching the WebAssembly worker and language data on the fly, the entire heavy-lifting AI process happens right in the user's RAM.

### 2. Handling PDFs: PDF.js
Tesseract.js works wonderfully with images, but it doesn't natively understand PDFs. To solve this, I integrated Mozilla's [PDF.js](https://mozilla.github.io/pdf.js/) library. 
When a user uploads a PDF, the application intercepts it, uses `pdf.js` to parse the document, renders the first page onto an invisible HTML5 `<canvas>`, and then extracts a high-quality `PNG` data URL from that canvas. That newly generated image is what ultimately gets passed into Tesseract!

### 3. Modern Glassmorphism UI
I focused heavily on the user experience. The app doesn't just work; it feels premium.
- **Vanilla CSS:** Everything is styled using pure CSS, ensuring zero bloat.
- **Glassmorphism:** The main container uses `backdrop-filter: blur()` over floating gradient blobs to give it an ethereal, modern look.
- **Fully Responsive:** The layout seamlessly shifts from a desktop dashboard to a mobile-friendly stacked view.

### 4. Zero Backend
Because everything runs client-side:
- **No server costs:** It can be hosted entirely for free on GitHub Pages.
- **Instant speed:** There is no upload latency.
- **100% Data Privacy:** You can turn off your Wi-Fi after the page loads, and the tool will still work perfectly.

---

## 🚀 Running Locally

If you'd like to run this code on your own machine:

1. Clone this repository.
2. Open your terminal in the project directory.
3. Because Tesseract.js requires downloading language models via web requests, standard file protocols (`file://`) will block it due to CORS restrictions. You must run a local web server:
   ```bash
   npx serve
   # or
   python -m http.server
   ```
4. Open the localhost link in your browser!

## 📜 License
Feel free to use this code, learn from it, or modify it for your own projects!
