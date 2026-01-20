<script setup>
import { ref, computed } from "vue";
import MarkdownIt from "markdown-it";
import { useConfig } from "../composables/useConfig";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const md = new MarkdownIt();
const { apiKey, modelName, useEnvKey, framesPerSecond, totalSessionCost, lastAnalysisCost } = useConfig();

const isDragging = ref(false);
const processing = ref(false);
const analyzing = ref(false);
const error = ref("");
const frames = ref([]);
const progress = ref(0);
const analysisResult = ref("");
const analysisType = ref(""); // 'summary' or 'frame'
const selectedFrameTime = ref(null);
const uploadedVideoUrl = ref(null);
const videoFileName = ref("");
const isGeneratingPdf = ref(false);
const isCopying = ref(false);


const handleDragEnter = (e) => {
  e.preventDefault();
  isDragging.value = true;
};

const handleDragLeave = (e) => {
  e.preventDefault();
  isDragging.value = false;
};

const handleDragOver = (e) => {
  e.preventDefault();
  isDragging.value = true;
};

const handleDrop = async (e) => {
  e.preventDefault();
  isDragging.value = false;
  error.value = "";

  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
    const file = e.dataTransfer.files[0];
    await processFile(file);
  }
};

const processFile = async (file) => {
  if (!file.type.startsWith("video/")) {
    error.value = "Please upload a valid video file.";
    return;
  }

  // Revoke previous URL if it exists
  if (uploadedVideoUrl.value) {
    URL.revokeObjectURL(uploadedVideoUrl.value);
    uploadedVideoUrl.value = null;
  }

  processing.value = true;
  frames.value = [];
  progress.value = 0;
  analysisResult.value = "";
  analysisType.value = "";
  videoFileName.value = file.name;

  const videoUrl = URL.createObjectURL(file);
  // Store the URL for the player
  uploadedVideoUrl.value = videoUrl;
  
  const video = document.createElement("video");
  video.src = videoUrl;
  video.muted = true;
  video.playsInline = true;

  try {
    await new Promise((resolve, reject) => {
      video.onloadedmetadata = () => {
        if (video.duration > 60) {
          reject(new Error("Video length exceeds 1 minute limit."));
        } else {
          resolve();
        }
      };
      video.onerror = () => reject(new Error("Error loading video file."));
    });

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const duration = Math.floor(video.duration);

    // Resize frames for AI analysis (to avoid payload limits)
    // Max dimension 512px is usually sufficient for analysis and saves tokens
    const MAX_DIM = 512;
    let width = video.videoWidth;
    let height = video.videoHeight;
    if (width > height) {
      if (width > MAX_DIM) {
        height *= MAX_DIM / width;
        width = MAX_DIM;
      }
    } else {
      if (height > MAX_DIM) {
        width *= MAX_DIM / height;
        height = MAX_DIM;
      }
    }
    canvas.width = width;
    canvas.height = height;

    const interval = 1 / framesPerSecond.value;
    for (let time = 0; time <= duration; time += interval) {
      await new Promise((resolve) => {
        video.currentTime = time;
        video.onseeked = () => resolve();
      });

      ctx.drawImage(video, 0, 0, width, height);
      frames.value.push({
        time: parseFloat(time.toFixed(2)),
        src: canvas.toDataURL("image/jpeg", 0.6), // Lower quality for size
      });
      progress.value = Math.round((time / duration) * 100);
    }
  } catch (err) {
    error.value = err.message;
    if (uploadedVideoUrl.value) {
      URL.revokeObjectURL(uploadedVideoUrl.value);
      uploadedVideoUrl.value = null;
    }
  } finally {
    processing.value = false;
    video.remove();
    // Do NOT revoke uploadedVideoUrl here, we need it for the player
  }
};

const getApiKey = () => {
  const key = useEnvKey.value
    ? import.meta.env.VITE_OPENROUTER_API_KEY
    : apiKey.value;
  if (!key) {
    error.value = "Please enter a valid OpenRouter API Key.";
    return null;
  }
  return key;
};

const callOpenRouter = async (content) => {
  const key = getApiKey();
  if (!key) return;

  analyzing.value = true;
  error.value = "";

  try {
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: modelName.value,
          include_reasoning: true, // often helps with detailed analysis
          transforms: [],
          messages: [
            {
              role: "user",
              content: content,
            },
          ],
        }),
      },
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`API Error ${response.status}: ${errText}`);
    }

    const data = await response.json();
    
    // Handle Cost
    if (data.usage && data.usage.cost) {
      const cost = parseFloat(data.usage.cost);
      lastAnalysisCost.value = cost; // Keep high precision
      totalSessionCost.value += cost;
    }

    if (data.choices && data.choices[0] && data.choices[0].message) {
      analysisResult.value = md.render(data.choices[0].message.content);
    } else {
      throw new Error("Unexpected response format");
    }
  } catch (err) {
    error.value = `Analysis failed: ${err.message}`;
  } finally {
    analyzing.value = false;
  }
};

const analyzeSummary = async () => {
  if (frames.value.length === 0) return;

  analysisType.value = "summary";
  selectedFrameTime.value = null;
  analysisResult.value = "";

  const prompt =
    "Analyze this sequence of video frames and provide a detailed chronological summary of the events taking place. Describe the visual content, actions, and any text visible. Be concise but thorough.";

  const content = [{ type: "text", text: prompt }];

  // Limit frames for summary to avoid massive payloads
  const step =
    frames.value.length > 30 ? Math.ceil(frames.value.length / 30) : 1;
  for (let i = 0; i < frames.value.length; i += step) {
    content.push({
      type: "image_url",
      image_url: { url: frames.value[i].src },
    });
  }

  await callOpenRouter(content);
};

const analyzeFrame = async (frame) => {
  analysisType.value = "frame";
  selectedFrameTime.value = frame.time;
  analysisResult.value = "";

  const prompt = `Analyze this specific frame at timestamp ${frame.time}s from a video. Describe exactly what is happening in this moment visually.`;

  const content = [
    { type: "text", text: prompt },
    { type: "image_url", image_url: { url: frame.src } },
  ];

  await callOpenRouter(content);
};

const downloadPDF = async () => {
  console.log("Download PDF clicked");
  if (!analysisResult.value) {
    console.warn("No analysis result available for download");
    return;
  }
  
  try {
    isGeneratingPdf.value = true;
    console.log("Starting PDF generation...");
    
    // Wait for DOM update
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const element = document.getElementById('pdf-template');
    if (!element) throw new Error("PDF template not found in DOM");
    console.log("PDF template found:", element);

    // html2canvas requires the element to be in the document and visible
    // We use the off-screen technique which is handled by CSS
    const canvas = await html2canvas(element, {
      scale: 2, // Higher quality
      useCORS: true,
      logging: true, // Enable html2canvas logging
      backgroundColor: '#ffffff',
      windowWidth: 1200, // Force a specific window width for consistent rendering
      onclone: (clonedDoc) => {
        const clonedElement = clonedDoc.getElementById('pdf-template');
        if (clonedElement) {
           clonedElement.style.visibility = 'visible';
        }
      }
    });

    console.log("Canvas created, generating PDF...");
    const imgData = canvas.toDataURL('image/jpeg', 1.0);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(`analysis-${videoFileName.value}.pdf`);
    console.log("PDF saved");

  } catch (err) {
    console.error("PDF Generation failed:", err);
    error.value = "Failed to generate PDF: " + (err.message || err);
  } finally {
    isGeneratingPdf.value = false;
  }
};

const copySummary = async () => {
  if (!analysisResult.value) return;

  try {
    isCopying.value = true;
    await navigator.clipboard.writeText(analysisResult.value);
    
    // Reset copy state after 2 seconds
    setTimeout(() => {
      isCopying.value = false;
    }, 2000);
  } catch (err) {
    console.error('Failed to copy text: ', err);
    error.value = "Failed to copy summary to clipboard";
  }
};

const hasActiveAnalysis = computed(() => {
  return (
    analyzing.value || (analysisResult.value && analysisResult.value.length > 0)
  );
});
</script>

<template>
  <div class="container" :class="{ 'has-analysis': hasActiveAnalysis }">
    <div
      class="drop-zone"
      :class="{ dragging: isDragging, processing: processing }"
      @dragenter="handleDragEnter"
      @dragleave="handleDragLeave"
      @dragover="handleDragOver"
      @drop="handleDrop"
    >
      <div v-if="processing" class="status-message">
        <p>Processing Video...</p>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progress + '%' }"></div>
        </div>
        <p>{{ progress }}%</p>
      </div>

      <div v-else-if="error" class="error-message">
        <p>⚠️ {{ error }}</p>
        <p class="sub-text">
          Drag another video to try again or check your settings
        </p>
      </div>

      <div v-else-if="uploadedVideoUrl" class="video-preview">
        <video 
          :src="uploadedVideoUrl" 
          controls 
          class="uploaded-video"
        ></video>
        <button class="remove-video-btn" @click.stop="uploadedVideoUrl = null; frames = [];">
          Change Video
        </button>
      </div>

      <div v-else class="upload-prompt">
        <h3>Upload football clip</h3>
        <p>Drag & drop mp4, mov or webm</p>
      </div>
    </div>

    <div v-if="frames.length > 0" class="analysis-section">
      <h2>AI Analysis</h2>

        <div class="controls-wrapper">
         <button
          @click="analyzeSummary"
          :disabled="analyzing"
          class="analyze-btn"
        >
          {{
            analyzing && analysisType === "summary"
              ? "Analyzing..."
              : analysisResult
                ? "Reanalyze"
                : "Analyze All (Summary)"
          }}
        </button>
        </div>



        <div class="action-buttons-row" v-if="analysisResult && analysisType === 'summary'">
          <button 
            class="copy-btn"
            @click="copySummary"
            :class="{ 'copied': isCopying }"
          >
            {{ isCopying ? '✓ Copied!' : 'Copy Summary' }}
          </button>

          <button 
            class="download-btn"
            @click="downloadPDF"
            :disabled="isGeneratingPdf"
          >
            {{ isGeneratingPdf ? 'Generating PDF...' : 'Download Summary' }}
          </button>
        </div>

        <!-- Hidden PDF Template -->
        <div class="pdf-container">
          <div id="pdf-template">
            <div class="pdf-header">
              <h1>Video Analysis Summary</h1>
              <div class="pdf-meta">
                <div class="meta-item">
                  <span class="label">File:</span>
                  <span class="value">{{ videoFileName }}</span>
                </div>
                <div class="meta-item">
                  <span class="label">Date:</span>
                  <span class="value">{{ new Date().toLocaleString() }}</span>
                </div>
                <div class="meta-item">
                  <span class="label">Frames Analyzed:</span>
                  <span class="value">{{ frames.length }}</span>
                </div>
              </div>
            </div>

            <div class="pdf-preview-image" v-if="frames.length > 0">
              <img :src="frames[0].src" alt="Video Frame" />
              <span class="caption">Frame 1 Capture</span>
            </div>

            <div class="pdf-content">
              <h2>Analysis Report</h2>
              <div v-html="analysisResult" class="markdown-content"></div>
            </div>
            
            <div class="pdf-footer">
              <p>Generated by Frame Analyzer AI</p>
            </div>
          </div>
        </div>

      <div v-if="analysisResult" class="result-box">
        <div v-html="analysisResult" class="markdown-content"></div>
      </div>
    </div>

    <div v-if="frames.length > 0" class="results-area">
      <h2>Extracted Frames ({{ frames.length }})</h2>
      <p class="hint-text">Click on any frame to analyze it individually</p>
      <div class="frames-grid">
        <div
          v-for="frame in frames"
          :key="frame.time"
          class="frame-item"
          :class="{ selected: selectedFrameTime === frame.time }"
          @click="analyzeFrame(frame)"
        >
          <img
            :src="frame.src"
            :alt="`Frame at ${frame.time}s`"
            loading="lazy"
          />
          <span class="timestamp">{{ frame.time }}s</span>
          <div class="frame-overlay">
            <span>Click to analyze</span>
          </div>
          <div
            v-if="analyzing && selectedFrameTime === frame.time"
            class="frame-loader"
          >
            Analyzing...
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container {
  max-width: 100%;
  margin: 0 auto;
  padding: 2rem;
  display: grid;
  gap: 2rem;
  grid-template-columns: minmax(0, 1fr);
  grid-template-areas:
    "upload"
    "analysis"
    "frames";
  transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.container.has-analysis {
  grid-template-columns: minmax(0, 1fr) 480px !important;
  grid-template-rows: auto 1fr !important;
  grid-template-areas:
    "upload analysis"
    "frames analysis" !important;
  align-items: start;
}

/* Drop Zone */
.drop-zone {
  grid-area: upload;
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-sm);
  padding: 4rem 2rem;
  text-align: center;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  background: var(--color-bg-surface);
  cursor: pointer;
  min-height: 480px; /* Made taller for video implementation */
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  box-shadow: var(--shadow-sm);
  position: relative;
  overflow: hidden;
}

.drop-zone:hover {
  border-color: var(--color-primary);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  background: rgba(30, 41, 59, 0.8);
}

.drop-zone.dragging {
  border-color: var(--color-primary);
  background: rgba(20, 184, 166, 0.1);
  transform: scale(1.005);
  box-shadow: var(--shadow-xl);
}

.drop-zone.processing {
  border-style: solid;
  border-color: var(--color-primary);
  cursor: wait;
}

@keyframes float {
  0% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
  100% {
    transform: translateY(0px);
  }
}

.upload-prompt h3 {
  margin: 0;
  color: var(--color-text-main);
  font-family: var(--font-primary);
  font-size: 1.75rem;
  font-weight: 600;
  letter-spacing: -0.02em;
}

.upload-prompt p {
  color: var(--color-text-muted);
  margin: 0.75rem 0 0;
  font-size: 1rem;
}

.error-message {
  color: var(--color-error);
  background: #fef2f2;
  padding: 1.5rem;
  border-radius: var(--radius-sm);
  border: 1px solid #fee2e2;
}

/* Video Preview */
.video-preview {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column; /* Stack video and button */
  align-items: center;
  justify-content: center;
  position: relative;
}

.uploaded-video {
  max-width: 100%;
  max-height: 480px; /* Match drop-zone min-height */
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-md);
  margin-bottom: 1rem;
}

.remove-video-btn {
  background: rgba(0, 0, 0, 0.5);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 0.5rem 1rem;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.remove-video-btn:hover {
  background: rgba(0, 0, 0, 0.7);
  transform: translateY(-1px);
}

/* Progress Bar */
.progress-bar {
  width: 100%;
  max-width: 320px;
  height: 6px;
  background: var(--color-border);
  border-radius: 999px;
  margin: 1.5rem auto;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--color-primary);
  transition: width 0.3s ease-out;
  border-radius: 999px;
}

/* Analysis Section */
.analysis-section {
  grid-area: analysis;
  padding: 2rem;
  background: var(--color-bg-surface);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-lg);
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  height: fit-content;
  position: sticky;
  top: 2rem;
  transition: all 0.5s ease;
  z-index: 10;
}

.analysis-section h2 {
  margin-top: 0;
  margin-bottom: 1.5rem;
  color: var(--color-text-main);
  font-family: var(--font-primary);
  font-weight: 600;
  font-size: 1.5rem;
}



.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.input-group label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-main);
  margin-left: 0.25rem;
}

.key-input-wrapper {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.env-badge {
  flex: 1;
  padding: 0.875rem;
  background: rgba(16, 185, 129, 0.1);
  color: var(--color-success);
  border-radius: var(--radius-sm);
  font-weight: 500;
  font-size: 0.9rem;
  text-align: center;
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.input-group input[type="text"],
.input-group input[type="password"] {
  padding: 0.875rem 1rem;
  background: var(--color-bg-darker);
  border: 1px solid var(--color-border);
  color: var(--color-text-main);
  border-radius: var(--radius-sm);
  font-size: 0.95rem;
  width: 100%;
  box-sizing: border-box;
  transition: all 0.2s;
}

.input-group input:focus {
  outline: none;
  background: var(--color-bg-darker);
  border-color: var(--color-primary);
  box-shadow: 0 0 0 1px var(--color-primary);
}

.checkbox-label {
  font-size: 0.875rem;
  white-space: nowrap;
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.analyze-btn {
  padding: 0.875rem 2rem;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 1rem;
  width: 100%;
}

.analyze-btn:hover:not(:disabled) {
  background: var(--color-primary-hover);
  transform: translateY(-1px);
}

.analyze-btn:disabled {
  background: var(--color-text-muted);
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
}

/* Result Box */
.result-box {
  background: transparent; /* Seamless blend */
  padding: 1.5rem 0;
  border-radius: var(--radius-sm);
  line-height: 1.7;
  color: var(--color-text-main);
  max-height: 600px;
  overflow-y: auto;
}

.result-header {
  font-family: var(--font-primary);
  font-weight: 700;
  color: var(--color-text-main);
  margin-bottom: 2rem;
  padding-bottom: 0;
  border: none;
  font-size: 2rem;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
}

.result-header::before {
  content: "GEMINI ANALYSIS REPORT";
  font-size: 0.75rem;
  color: var(--color-primary);
  letter-spacing: 0.1em;
  font-weight: 600;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Markdown Rendering */
:deep(.markdown-content p) {
  margin-bottom: 1em;
}

:deep(.markdown-content ul),
:deep(.markdown-content ol) {
  margin-bottom: 1em;
  padding-left: 1.5em;
}

:deep(.markdown-content h1),
:deep(.markdown-content h2),
:deep(.markdown-content h3) {
  margin-top: 1.5em;
  margin-bottom: 0.5em;
  font-family: var(--font-primary);
  color: var(--color-text-main);
}

:deep(.markdown-content code) {
  background: #e2e8f0;
  padding: 0.2em 0.4em;
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.9em;
}

/* Results Area (Frames) */
.results-area {
  grid-area: frames;
  margin-top: 0; /* Reset margin */
}

.results-area h2 {
  color: var(--color-text-main);
  font-family: var(--font-primary);
  margin-bottom: 0.5rem;
  font-size: 1.75rem;
}

.hint-text {
  color: var(--color-text-muted);
  margin-bottom: 2rem;
}

.frames-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1.5rem;
}

.frame-item {
  background: var(--color-bg-surface);
  border-radius: var(--radius-sm);
  overflow: hidden;
  box-shadow: var(--shadow-md);
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
}

.frame-item:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-xl);
}

.frame-item.selected {
  box-shadow: 0 0 0 3px var(--color-primary);
}

.frame-item img {
  width: 100%;
  aspect-ratio: 16/9;
  object-fit: cover;
  display: block;
}

.timestamp {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
  color: var(--color-text-muted);
  font-size: 0.75rem;
  font-weight: 500;
  background: var(--color-bg-darker);
  border-top: 1px solid var(--color-border);
}

.frame-loader {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary);
  font-weight: 600;
  backdrop-filter: blur(2px);
}

.frame-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.frame-item:hover .frame-overlay {
  opacity: 1;
}

.frame-overlay span {
  color: white;
  font-weight: 500;
  font-size: 0.875rem;
  background: rgba(0, 0, 0, 0.6);
  padding: 0.5rem 1rem;
  border-radius: 999px;
  backdrop-filter: blur(4px);
  transform: translateY(10px);
  transition: transform 0.2s ease;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.frame-item:hover .frame-overlay span {
  transform: translateY(0);
}



.action-buttons-row {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.copy-btn {
  flex: 1;
  padding: 0.875rem 2rem;
  background: var(--color-bg-surface);
  color: var(--color-text-main);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.copy-btn:hover {
  background: var(--color-bg-darker);
  border-color: var(--color-text-muted);
}

.copy-btn.copied {
  background: rgba(16, 185, 129, 0.1);
  color: var(--color-success);
  border-color: var(--color-success);
}

.download-btn {
  flex: 1;
  padding: 0.875rem 2rem;
  background: var(--color-bg-surface);
  color: var(--color-text-main);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.download-btn:hover:not(:disabled) {
  background: var(--color-bg-darker);
  border-color: var(--color-text-muted);
}

.download-btn:disabled {
  opacity: 0.6;
  cursor: wait;
}

/* PDF Template Styles - Hidden from screen but rendered for PDF */
.pdf-container {
  position: absolute;
  top: 0;
  left: -9999px;
  /* Ensure it's rendered but not visible on screen */
  z-index: -1;
}

/* We need to override visibility for html2canvas to capture it */
#pdf-template {
  width: 794px; /* A4 width at 96dpi approx, but we scale it up */
  min-height: 1123px; /* A4 height */
  background: white;
  padding: 40px;
  color: #1a1a1a;
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  box-sizing: border-box;
  visibility: visible;
  position: relative;
}

.pdf-header {
  border-bottom: 2px solid #e5e7eb;
  padding-bottom: 20px;
  margin-bottom: 30px;
}

.pdf-header h1 {
  font-size: 24px;
  font-weight: 800;
  margin: 0 0 15px 0;
  color: #111827;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.pdf-meta {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
  font-size: 12px;
  color: #4b5563;
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.meta-item .label {
  font-weight: 600;
  text-transform: uppercase;
  font-size: 10px;
  color: #9ca3af;
}

.meta-item .value {
  font-weight: 500;
}

.pdf-preview-image {
  margin-bottom: 30px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
  position: relative;
}

.pdf-preview-image img {
  width: 100%;
  height: 300px;
  object-fit: cover;
  display: block;
}

.pdf-preview-image .caption {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 8px 12px;
  font-size: 10px;
  font-weight: 500;
}

.pdf-content h2 {
  font-size: 18px;
  font-weight: 700;
  color: #111827;
  margin-top: 0;
  margin-bottom: 15px;
  border-left: 4px solid #3b82f6;
  padding-left: 10px;
}

.pdf-content .markdown-content {
  font-size: 14px;
  line-height: 1.6;
}

.pdf-footer {
  margin-top: 40px;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
  text-align: center;
  color: #9ca3af;
  font-size: 10px;
}
</style>
