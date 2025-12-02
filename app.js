class VoiceAnalysisApp {
    constructor() {
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.audioContext = null;
        this.analyser = null;
        this.recordingStartTime = null;
        this.timerInterval = null;
        this.isRecording = false;
        this.analysisResults = [];
        this.currentGraph = 'waveform';
        
        this.initElements();
        this.initEventListeners();
        this.initVisualizations();
        this.loadHistory();
        
        // Simulate loading
        setTimeout(() => {
            document.getElementById('loading-screen').style.display = 'none';
            this.updateStatus('Analysis Engine', 'Ready');
        }, 1500);
    }
    
    initElements() {
        // Navigation
        this.navButtons = document.querySelectorAll('.nav-btn');
        this.contentViews = document.querySelectorAll('.content-view');
        
        // Recording
        this.recordBtn = document.getElementById('record-btn');
        this.stopBtn = document.getElementById('stop-btn');
        this.playBtn = document.getElementById('play-btn');
        this.audioPlayer = document.getElementById('audio-player');
        this.recordingStatus = document.getElementById('recording-status');
        this.timerDisplay = document.getElementById('timer');
        
        // Results
        this.riskValue = document.getElementById('risk-value');
        this.riskLevel = document.getElementById('risk-level');
        this.riskText = document.getElementById('risk-text');
        
        // Feature metrics
        this.jitterValue = document.getElementById('jitter-value');
        this.shimmerValue = document.getElementById('shimmer-value');
        this.hnrValue = document.getElementById('hnr-value');
        this.pitchValue = document.getElementById('pitch-value');
        
        // Graphs
        this.visualizerCanvas = document.getElementById('visualizer-canvas');
        this.graphCanvas = document.getElementById('graph-canvas');
        this.trendChartCanvas = document.getElementById('trend-chart');
        
        // Feature grid
        this.featureGrid = document.getElementById('feature-grid');
        
        // Recommendations
        this.recommendations = document.getElementById('recommendations');
        
        // Modals
        this.guideModal = document.getElementById('guide-modal');
        this.guideBtn = document.getElementById('guide-btn');
        this.modalClose = document.querySelector('.modal-close');
        
        // Status
        this.engineStatus = document.getElementById('engine-status');
        this.lastAnalysis = document.getElementById('last-analysis');
        
        // Visualizer context
        this.visualizerCtx = this.visualizerCanvas.getContext('2d');
        this.graphCtx = this.graphCanvas.getContext('2d');
    }
    
    initEventListeners() {
        // Navigation
        this.navButtons.forEach(btn => {
            btn.addEventListener('click', () => this.switchView(btn.dataset.view));
        });
        
        // Recording controls
        this.recordBtn.addEventListener('click', () => this.startRecording());
        this.stopBtn.addEventListener('click', () => this.stopRecording());
        this.playBtn.addEventListener('click', () => this.audioPlayer.play());
        
        // Graph controls
        document.querySelectorAll('.graph-control-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.graph-control-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentGraph = btn.dataset.graph;
                this.updateGraph();
            });
        });
        
        // Modal
        this.guideBtn.addEventListener('click', () => this.guideModal.classList.add('active'));
        this.modalClose.addEventListener('click', () => this.guideModal.classList.remove('active'));
        this.guideModal.addEventListener('click', (e) => {
            if (e.target === this.guideModal) {
                this.guideModal.classList.remove('active');
            }
        });
        
        // Audio player events
        this.audioPlayer.addEventListener('play', () => this.visualizePlayback());
        this.audioPlayer.addEventListener('pause', () => this.stopVisualization());
        
        // Export button
        document.getElementById('export-btn').addEventListener('click', () => this.exportReport());
        
        // Clear history
        document.getElementById('clear-history').addEventListener('click', () => this.clearHistory());
        
        // Settings
        document.getElementById('audio-quality').addEventListener('change', (e) => {
            this.updateStatus('Quality Setting', e.target.value);
        });
        
        document.getElementById('recording-duration').addEventListener('change', (e) => {
            this.updateStatus('Recording Duration', `${e.target.value}s`);
        });
        
        // Check microphone availability
        this.checkMicrophone();
    }
    
    initVisualizations() {
        // Set canvas sizes
        this.updateCanvasSizes();
        window.addEventListener('resize', () => this.updateCanvasSizes());
        
        // Draw empty visualizations
        this.drawEmptyVisualizer();
        this.drawEmptyGraph();
        
        // Initialize trend chart
        this.initTrendChart();
    }
    
    updateCanvasSizes() {
        const dpr = window.devicePixelRatio || 1;
        
        // Visualizer canvas
        const visualizerRect = this.visualizerCanvas.getBoundingClientRect();
        this.visualizerCanvas.width = visualizerRect.width * dpr;
        this.visualizerCanvas.height = visualizerRect.height * dpr;
        this.visualizerCtx.scale(dpr, dpr);
        
        // Graph canvas
        const graphRect = this.graphCanvas.getBoundingClientRect();
        this.graphCanvas.width = graphRect.width * dpr;
        this.graphCanvas.height = graphRect.height * dpr;
        this.graphCtx.scale(dpr, dpr);
    }
    
    drawEmptyVisualizer() {
        const width = this.visualizerCanvas.width / (window.devicePixelRatio || 1);
        const height = this.visualizerCanvas.height / (window.devicePixelRatio || 1);
        
        this.visualizerCtx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        this.visualizerCtx.fillRect(0, 0, width, height);
        
        this.visualizerCtx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        this.visualizerCtx.font = '14px Inter';
        this.visualizerCtx.textAlign = 'center';
        this.visualizerCtx.textBaseline = 'middle';
        this.visualizerCtx.fillText('Ready for recording...', width / 2, height / 2);
    }
    
    drawEmptyGraph() {
        const width = this.graphCanvas.width / (window.devicePixelRatio || 1);
        const height = this.graphCanvas.height / (window.devicePixelRatio || 1);
        
        this.graphCtx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        this.graphCtx.fillRect(0, 0, width, height);
        
        this.graphCtx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        this.graphCtx.font = '14px Inter';
        this.graphCtx.textAlign = 'center';
        this.graphCtx.textBaseline = 'middle';
        this.graphCtx.fillText('Record voice to see analysis', width / 2, height / 2);
    }
    
    initTrendChart() {
        const ctx = this.trendChartCanvas.getContext('2d');
        this.trendChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Risk Score Trend',
                    data: [],
                    borderColor: '#2563eb',
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.7)'
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.7)'
                        }
                    }
                }
            }
        });
    }
    
    checkMicrophone() {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(() => {
                    this.updateStatus('Mic', 'Available');
                })
                .catch(() => {
                    this.updateStatus('Mic', 'Not Available');
                    this.recordBtn.disabled = true;
                    this.recordBtn.innerHTML = '<i class="fas fa-microphone-slash"></i><span>Mic Not Available</span>';
                });
        } else {
            this.updateStatus('Mic', 'Not Supported');
            this.recordBtn.disabled = true;
            this.recordBtn.innerHTML = '<i class="fas fa-microphone-slash"></i><span>Recording Not Supported</span>';
        }
    }
    
    switchView(view) {
        // Update navigation
        this.navButtons.forEach(btn => btn.classList.remove('active'));
        document.querySelector(`.nav-btn[data-view="${view}"]`).classList.add('active');
        
        // Update content views
        this.contentViews.forEach(v => v.classList.remove('active'));
        document.getElementById(`${view}-view`).classList.add('active');
        
        // Update trend chart if on insights view
        if (view === 'insights') {
            this.updateTrendChart();
        }
    }
    
    async startRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100
                }
            });
            
            // Initialize audio context for visualization
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            const source = this.audioContext.createMediaStreamSource(stream);
            source.connect(this.analyser);
            this.analyser.fftSize = 2048;
            
            // Set up media recorder
            this.mediaRecorder = new MediaRecorder(stream);
            this.audioChunks = [];
            
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            };
            
            this.mediaRecorder.onstop = () => {
                const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
                const audioUrl = URL.createObjectURL(audioBlob);
                this.audioPlayer.src = audioUrl;
                this.playBtn.disabled = false;
                
                // Analyze the recording
                this.analyzeRecording(audioBlob);
                
                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());
                
                // Close audio context
                if (this.audioContext) {
                    this.audioContext.close();
                }
            };
            
            // Start recording
            this.mediaRecorder.start();
            this.isRecording = true;
            
            // Update UI
            this.recordBtn.disabled = true;
            this.stopBtn.disabled = false;
            this.recordingStatus.classList.add('recording');
            this.recordingStatus.querySelector('span').textContent = 'Recording';
            
            // Start timer
            this.recordingStartTime = Date.now();
            this.startTimer();
            
            // Start visualization
            this.visualizeRecording();
            
            this.updateStatus('Analysis Engine', 'Recording...');
            
        } catch (error) {
            console.error('Error starting recording:', error);
            alert('Unable to access microphone. Please check permissions and try again.');
        }
    }
    
    stopRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.isRecording = false;
            
            // Update UI
            this.recordBtn.disabled = false;
            this.stopBtn.disabled = true;
            this.recordingStatus.classList.remove('recording');
            this.recordingStatus.querySelector('span').textContent = 'Processing...';
            
            // Stop timer
            this.stopTimer();
            
            // Stop visualization
            this.stopVisualization();
            
            this.updateStatus('Analysis Engine', 'Processing...');
        }
    }
    
    startTimer() {
        this.timerInterval = setInterval(() => {
            const elapsed = Date.now() - this.recordingStartTime;
            const seconds = Math.floor(elapsed / 1000);
            const minutes = Math.floor(seconds / 60);
            const displaySeconds = seconds % 60;
            this.timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${displaySeconds.toString().padStart(2, '0')}`;
            
            // Auto-stop after 30 seconds
            if (seconds >= 30) {
                this.stopRecording();
            }
        }, 1000);
    }
    
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }
    
    visualizeRecording() {
        if (!this.analyser) return;
        
        const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        const width = this.visualizerCanvas.width / (window.devicePixelRatio || 1);
        const height = this.visualizerCanvas.height / (window.devicePixelRatio || 1);
        
        const draw = () => {
            if (!this.isRecording) return;
            
            requestAnimationFrame(draw);
            this.analyser.getByteFrequencyData(dataArray);
            
            this.visualizerCtx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            this.visualizerCtx.fillRect(0, 0, width, height);
            
            const barWidth = (width / dataArray.length) * 2.5;
            let barHeight;
            let x = 0;
            
            for (let i = 0; i < dataArray.length; i++) {
                barHeight = (dataArray[i] / 255) * height;
                
                const gradient = this.visualizerCtx.createLinearGradient(0, height - barHeight, 0, height);
                gradient.addColorStop(0, '#2563eb');
                gradient.addColorStop(1, '#7c3aed');
                
                this.visualizerCtx.fillStyle = gradient;
                this.visualizerCtx.fillRect(x, height - barHeight, barWidth, barHeight);
                
                x += barWidth + 1;
            }
        };
        
        draw();
    }
    
    visualizePlayback() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        const source = this.audioContext.createMediaElementSource(this.audioPlayer);
        this.analyser = this.audioContext.createAnalyser();
        source.connect(this.analyser);
        this.analyser.connect(this.audioContext.destination);
        
        const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        const width = this.visualizerCanvas.width / (window.devicePixelRatio || 1);
        const height = this.visualizerCanvas.height / (window.devicePixelRatio || 1);
        
        const draw = () => {
            if (this.audioPlayer.paused) return;
            
            requestAnimationFrame(draw);
            this.analyser.getByteFrequencyData(dataArray);
            
            this.visualizerCtx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            this.visualizerCtx.fillRect(0, 0, width, height);
            
            const barWidth = (width / dataArray.length) * 2.5;
            let barHeight;
            let x = 0;
            
            for (let i = 0; i < dataArray.length; i++) {
                barHeight = (dataArray[i] / 255) * height;
                
                const gradient = this.visualizerCtx.createLinearGradient(0, height - barHeight, 0, height);
                gradient.addColorStop(0, '#0d9488');
                gradient.addColorStop(1, '#059669');
                
                this.visualizerCtx.fillStyle = gradient;
                this.visualizerCtx.fillRect(x, height - barHeight, barWidth, barHeight);
                
                x += barWidth + 1;
            }
        };
        
        draw();
    }
    
    stopVisualization() {
        // Draw empty visualizer when stopped
        setTimeout(() => {
            if (!this.isRecording && this.audioPlayer.paused) {
                this.drawEmptyVisualizer();
            }
        }, 100);
    }
    
    async analyzeRecording(audioBlob) {
        // Simulate API call to backend
        this.updateStatus('Analysis Engine', 'Analyzing...');
        
        // Create form data for API
        const formData = new FormData();
        formData.append('file', audioBlob, 'recording.webm');
        
        try {
            // Uncomment this when your backend is ready
            /*
            const response = await fetch('https://your-backend-url/predict', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            this.displayResults(result);
            */
            
            // For demo purposes - simulate analysis
            setTimeout(() => {
                const simulatedResult = this.generateSimulatedResult();
                this.displayResults(simulatedResult);
                this.updateStatus('Analysis Engine', 'Ready');
                this.recordingStatus.querySelector('span').textContent = 'Analysis Complete';
                
                // Save to history
                this.saveToHistory(simulatedResult);
                
                // Update last analysis time
                const now = new Date();
                this.lastAnalysis.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            }, 2000);
            
        } catch (error) {
            console.error('Analysis error:', error);
            this.updateStatus('Analysis Engine', 'Error');
            this.recordingStatus.querySelector('span').textContent = 'Analysis Failed';
            
            // Show error result
            this.displayErrorResult();
        }
    }
    
    generateSimulatedResult() {
        const riskScore = Math.floor(Math.random() * 100);
        
        return {
            score: riskScore / 100,
            label: riskScore > 70 ? 'High Risk' : riskScore > 40 ? 'Moderate Risk' : 'Low Risk',
            features: {
                jitter_local: (Math.random() * 0.02).toFixed(4),
                jitter_abs: (Math.random() * 0.0001).toFixed(6),
                shimmer_local: (Math.random() * 0.1).toFixed(4),
                hnr: (Math.random() * 30).toFixed(1),
                pitch_variability: (Math.random() * 50).toFixed(1),
                jitter_rap: (Math.random() * 0.01).toFixed(4),
                jitter_ppq5: (Math.random() * 0.01).toFixed(4),
                shimmer_apq3: (Math.random() * 0.05).toFixed(4),
                shimmer_apq5: (Math.random() * 0.05).toFixed(4),
                shimmer_apq11: (Math.random() * 0.05).toFixed(4),
                mean_pitch: (100 + Math.random() * 100).toFixed(1),
                std_pitch: (5 + Math.random() * 20).toFixed(1),
                fraction_unvoiced: (Math.random() * 0.3).toFixed(3)
            }
        };
    }
    
    displayResults(result) {
        // Update risk indicator
        const riskPercentage = Math.round(result.score * 100);
        this.riskValue.textContent = `${riskPercentage}%`;
        
        // Update risk circle gradient
        const riskCircle = document.querySelector('.risk-circle');
        const riskColor = riskPercentage > 70 ? '#dc2626' : riskPercentage > 40 ? '#ea580c' : '#059669';
        riskCircle.style.background = `conic-gradient(${riskColor} 0% ${riskPercentage}%, var(--border-color) ${riskPercentage}% 100%)`;
        
        // Update risk level and text
        this.riskLevel.textContent = result.label;
        this.riskLevel.style.color = riskColor;
        
        let riskText = '';
        if (riskPercentage > 70) {
            riskText = 'Voice analysis shows significant biomarkers associated with Parkinson\'s disease. Clinical evaluation recommended.';
        } else if (riskPercentage > 40) {
            riskText = 'Moderate vocal biomarkers detected. Consider follow-up monitoring.';
        } else {
            riskText = 'Minimal vocal biomarkers detected. Continue regular monitoring.';
        }
        this.riskText.textContent = riskText;
        
        // Update feature metrics
        if (result.features) {
            this.jitterValue.textContent = `${(result.features.jitter_local * 100).toFixed(2)}%`;
            this.shimmerValue.textContent = `${(result.features.shimmer_local * 100).toFixed(2)}%`;
            this.hnrValue.textContent = `${result.features.hnr} dB`;
            this.pitchValue.textContent = `${result.features.pitch_variability} Hz`;
            
            // Update feature grid
            this.updateFeatureGrid(result.features);
            
            // Update graph
            this.updateGraph();
            
            // Update recommendations
            this.updateRecommendations(riskPercentage);
        }
    }
    
    displayErrorResult() {
        this.riskValue.textContent = 'Error';
        this.riskLevel.textContent = 'Analysis Failed';
        this.riskLevel.style.color = '#dc2626';
        this.riskText.textContent = 'Unable to analyze recording. Please try again.';
        
        // Reset feature metrics
        this.jitterValue.textContent = '--';
        this.shimmerValue.textContent = '--';
        this.hnrValue.textContent = '--';
        this.pitchValue.textContent = '--';
        
        // Clear feature grid
        this.featureGrid.innerHTML = '';
        
        // Show error in recommendations
        this.recommendations.innerHTML = `
            <div class="recommendation-item">
                <i class="fas fa-exclamation-circle"></i>
                <span>Analysis failed. Please ensure good recording quality and try again.</span>
            </div>
        `;
    }
    
    updateFeatureGrid(features) {
        this.featureGrid.innerHTML = '';
        
        const featureLabels = {
            jitter_local: 'Jitter (local)',
            jitter_abs: 'Jitter (absolute)',
            shimmer_local: 'Shimmer (local)',
            hnr: 'Harmonic-to-Noise Ratio',
            pitch_variability: 'Pitch Variability',
            jitter_rap: 'Jitter (RAP)',
            jitter_ppq5: 'Jitter (PPQ5)',
            shimmer_apq3: 'Shimmer (APQ3)',
            shimmer_apq5: 'Shimmer (APQ5)',
            shimmer_apq11: 'Shimmer (APQ11)',
            mean_pitch: 'Mean Pitch',
            std_pitch: 'Pitch STD',
            fraction_unvoiced: 'Unvoiced Frames'
        };
        
        Object.entries(features).forEach(([key, value]) => {
            if (featureLabels[key]) {
                const featureItem = document.createElement('div');
                featureItem.className = 'feature-item';
                featureItem.innerHTML = `
                    <div class="feature-name">${featureLabels[key]}</div>
                    <div class="feature-value">${value}</div>
                `;
                this.featureGrid.appendChild(featureItem);
            }
        });
    }
    
    updateGraph() {
        const width = this.graphCanvas.width / (window.devicePixelRatio || 1);
        const height = this.graphCanvas.height / (window.devicePixelRatio || 1);
        
        this.graphCtx.clearRect(0, 0, width, height);
        
        switch (this.currentGraph) {
            case 'waveform':
                this.drawWaveform();
                break;
            case 'spectrogram':
                this.drawSpectrogram();
                break;
            case 'pitch':
                this.drawPitch();
                break;
        }
    }
    
    drawWaveform() {
        const width = this.graphCanvas.width / (window.devicePixelRatio || 1);
        const height = this.graphCanvas.height / (window.devicePixelRatio || 1);
        
        // Draw grid
        this.graphCtx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.graphCtx.lineWidth = 1;
        
        // Vertical lines
        for (let i = 0; i <= width; i += width / 10) {
            this.graphCtx.beginPath();
            this.graphCtx.moveTo(i, 0);
            this.graphCtx.lineTo(i, height);
            this.graphCtx.stroke();
        }
        
        // Horizontal lines
        for (let i = 0; i <= height; i += height / 5) {
            this.graphCtx.beginPath();
            this.graphCtx.moveTo(0, i);
            this.graphCtx.lineTo(width, i);
            this.graphCtx.stroke();
        }
        
        // Draw simulated waveform
        const points = 500;
        this.graphCtx.beginPath();
        this.graphCtx.strokeStyle = '#2563eb';
        this.graphCtx.lineWidth = 2;
        
        for (let i = 0; i < points; i++) {
            const x = (i / points) * width;
            const y = height / 2 + Math.sin(i * 0.1) * 50 + Math.random() * 20;
            
            if (i === 0) {
                this.graphCtx.moveTo(x, y);
            } else {
                this.graphCtx.lineTo(x, y);
            }
        }
        
        this.graphCtx.stroke();
        
        // Add labels
        this.graphCtx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        this.graphCtx.font = '12px Inter';
        this.graphCtx.textAlign = 'center';
        this.graphCtx.fillText('Time (ms)', width / 2, height - 10);
        
        this.graphCtx.save();
        this.graphCtx.translate(20, height / 2);
        this.graphCtx.rotate(-Math.PI / 2);
        this.graphCtx.fillText('Amplitude', 0, 0);
        this.graphCtx.restore();
    }
    
    drawSpectrogram() {
        const width = this.graphCanvas.width / (window.devicePixelRatio || 1);
        const height = this.graphCanvas.height / (window.devicePixelRatio || 1);
        
        // Create gradient for spectrogram
        const gradient = this.graphCtx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#2563eb');
        gradient.addColorStop(0.5, '#7c3aed');
        gradient.addColorStop(1, '#0d9488');
        
        // Draw simulated spectrogram
        const barCount = 100;
        const barWidth = width / barCount;
        
        for (let i = 0; i < barCount; i++) {
            const barHeight = Math.random() * height;
            const x = i * barWidth;
            
            this.graphCtx.fillStyle = gradient;
            this.graphCtx.fillRect(x, height - barHeight, barWidth - 1, barHeight);
        }
        
        // Add labels
        this.graphCtx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        this.graphCtx.font = '12px Inter';
        this.graphCtx.textAlign = 'center';
        this.graphCtx.fillText('Frequency Bins', width / 2, height - 10);
        
        this.graphCtx.save();
        this.graphCtx.translate(20, height / 2);
        this.graphCtx.rotate(-Math.PI / 2);
        this.graphCtx.fillText('Intensity (dB)', 0, 0);
        this.graphCtx.restore();
    }
    
    drawPitch() {
        const width = this.graphCanvas.width / (window.devicePixelRatio || 1);
        const height = this.graphCanvas.height / (window.devicePixelRatio || 1);
        
        // Draw grid
        this.graphCtx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.graphCtx.lineWidth = 1;
        
        // Vertical lines
        for (let i = 0; i <= width; i += width / 10) {
            this.graphCtx.beginPath();
            this.graphCtx.moveTo(i, 0);
            this.graphCtx.lineTo(i, height);
            this.graphCtx.stroke();
        }
        
        // Horizontal lines
        for (let i = 0; i <= height; i += height / 5) {
            this.graphCtx.beginPath();
            this.graphCtx.moveTo(0, i);
            this.graphCtx.lineTo(width, i);
            this.graphCtx.stroke();
        }
        
        // Draw simulated pitch contour
        const points = 200;
        this.graphCtx.beginPath();
        this.graphCtx.strokeStyle = '#dc2626';
        this.graphCtx.lineWidth = 2;
        
        for (let i = 0; i < points; i++) {
            const x = (i / points) * width;
            const baseY = height / 2;
            const variation = Math.sin(i * 0.05) * 30 + Math.random() * 15;
            const y = baseY + variation;
            
            if (i === 0) {
                this.graphCtx.moveTo(x, y);
            } else {
                this.graphCtx.lineTo(x, y);
            }
        }
        
        this.graphCtx.stroke();
        
        // Add labels
        this.graphCtx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        this.graphCtx.font = '12px Inter';
        this.graphCtx.textAlign = 'center';
        this.graphCtx.fillText('Time (ms)', width / 2, height - 10);
        
        this.graphCtx.save();
        this.graphCtx.translate(20, height / 2);
        this.graphCtx.rotate(-Math.PI / 2);
        this.graphCtx.fillText('Pitch (Hz)', 0, 0);
        this.graphCtx.restore();
    }
    
    updateRecommendations(riskScore) {
        let recommendations = [];
        
        if (riskScore > 70) {
            recommendations = [
                'Immediate clinical consultation recommended',
                'Schedule comprehensive neurological evaluation',
                'Consider voice therapy consultation',
                'Regular monitoring every 3 months',
                'Maintain voice diary for tracking changes'
            ];
        } else if (riskScore > 40) {
            recommendations = [
                'Follow-up voice analysis in 6 months',
                'Consult with speech-language pathologist',
                'Practice vocal exercises daily',
                'Monitor for any voice changes',
                'Consider baseline neurological assessment'
            ];
        } else {
            recommendations = [
                'Continue regular annual voice screening',
                'Maintain healthy vocal hygiene practices',
                'Stay hydrated and avoid vocal strain',
                'Consider baseline recording for future comparison',
                'Report any sudden voice changes immediately'
            ];
        }
        
        this.recommendations.innerHTML = '';
        recommendations.forEach(rec => {
            const item = document.createElement('div');
            item.className = 'recommendation-item';
            item.innerHTML = `
                <i class="fas fa-check-circle"></i>
                <span>${rec}</span>
            `;
            this.recommendations.appendChild(item);
        });
    }
    
    saveToHistory(result) {
        const analysis = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            score: result.score,
            label: result.label,
            features: result.features
        };
        
        this.analysisResults.unshift(analysis);
        this.saveHistory();
        this.updateHistoryList();
        this.updateTrendChart();
    }
    
    saveHistory() {
        localStorage.setItem('voiceAnalysisHistory', JSON.stringify(this.analysisResults));
    }
    
    loadHistory() {
        const saved = localStorage.getItem('voiceAnalysisHistory');
        if (saved) {
            this.analysisResults = JSON.parse(saved);
            this.updateHistoryList();
            this.updateTrendChart();
        }
    }
    
    updateHistoryList() {
        const historyList = document.getElementById('history-list');
        historyList.innerHTML = '';
        
        this.analysisResults.slice(0, 10).forEach(analysis => {
            const date = new Date(analysis.timestamp);
            const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const dateString = date.toLocaleDateString();
            
            const riskColor = analysis.score > 0.7 ? '#dc2626' : analysis.score > 0.4 ? '#ea580c' : '#059669';
            
            const item = document.createElement('div');
            item.className = 'history-item';
            item.innerHTML = `
                <div class="history-item-header">
                    <div class="history-timestamp">
                        <i class="far fa-calendar"></i>
                        <span>${dateString} ${timeString}</span>
                    </div>
                    <div class="history-score" style="color: ${riskColor}">
                        ${Math.round(analysis.score * 100)}%
                    </div>
                </div>
                <div class="history-item-body">
                    <div class="history-label">${analysis.label}</div>
                    <div class="history-features">
                        <span>Jitter: ${(analysis.features.jitter_local * 100).toFixed(2)}%</span>
                        <span>Shimmer: ${(analysis.features.shimmer_local * 100).toFixed(2)}%</span>
                        <span>HNR: ${analysis.features.hnr} dB</span>
                    </div>
                </div>
            `;
            
            historyList.appendChild(item);
        });
    }
    
    updateTrendChart() {
        if (!this.trendChart) return;
        
        const recentResults = this.analysisResults.slice(0, 10).reverse();
        const labels = recentResults.map(r => {
            const date = new Date(r.timestamp);
            return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
        });
        
        const scores = recentResults.map(r => Math.round(r.score * 100));
        
        this.trendChart.data.labels = labels;
        this.trendChart.data.datasets[0].data = scores;
        this.trendChart.update();
    }
    
    clearHistory() {
        if (confirm('Are you sure you want to clear all analysis history?')) {
            this.analysisResults = [];
            this.saveHistory();
            this.updateHistoryList();
            this.updateTrendChart();
        }
    }
    
    exportReport() {
        if (this.analysisResults.length === 0) {
            alert('No analysis data to export.');
            return;
        }
        
        const latest = this.analysisResults[0];
        const report = {
            title: 'NeuroVoice AI Analysis Report',
            timestamp: new Date().toISOString(),
            analysis: latest,
            summary: `Risk Score: ${Math.round(latest.score * 100)}% - ${latest.label}`,
            recommendations: this.generateReportRecommendations(latest.score)
        };
        
        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `voice-analysis-report-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    generateReportRecommendations(score) {
        if (score > 0.7) {
            return [
                'Urgent clinical evaluation recommended',
                'Comprehensive neurological assessment needed',
                'Voice therapy consultation advised',
                'Regular monitoring every 3 months'
            ];
        } else if (score > 0.4) {
            return [
                'Follow-up analysis in 6 months',
                'Speech-language pathology consultation',
                'Daily vocal exercises recommended',
                'Monitor for voice changes'
            ];
        } else {
            return [
                'Annual voice screening sufficient',
                'Maintain vocal hygiene practices',
                'Stay hydrated and avoid strain',
                'Baseline recording for comparison'
            ];
        }
    }
    
    updateStatus(field, value) {
        switch(field) {
            case 'Analysis Engine':
                this.engineStatus.textContent = value;
                break;
            case 'Quality Setting':
                document.getElementById('model-status').textContent = value;
                break;
            case 'Recording Duration':
                document.getElementById('mic-status').textContent = value;
                break;
            case 'Mic':
                document.getElementById('mic-status').textContent = value;
                break;
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.voiceAnalysisApp = new VoiceAnalysisApp();
});
