import { Component, ChangeDetectionStrategy, output, inject, signal, viewChild, ElementRef, afterNextRender, OnDestroy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GeminiService } from '../../services/gemini.service';
import { SecurityUtil } from '../../utils/security.util';

interface Message {
  role: 'user' | 'model';
  html: string;
}

@Component({
  selector: 'app-chatbot',
  templateUrl: './chatbot.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
})
export class ChatbotComponent implements OnDestroy {
  closeChat = output<void>();
  
  private geminiService = inject(GeminiService);
  private messagesContainer = viewChild<ElementRef>('messagesContainer');
  
  messages = signal<Message[]>([
    { role: 'model', html: '<p>Hi! I\'m <strong>AI Scout</strong> 🤖</p><p>I can help you:</p><ul><li>Create and manage leads</li><li>Find addresses on the map</li><li>Update lead status</li><li>Switch between views</li><li>Delete leads</li></ul><p><em>Try asking: "Create a lead for 123 Main Street" or "Show me my leads"</em></p>' }
  ]);
  userInput = signal('');
  isLoading = signal(false);
  
  isMicrophoneAvailable = signal(false);
  isLiveConversation = signal(false);

  // -- NEW STATE FOR LIVE CONVERSATION --
  // Mic and Audio processing
  private audioContext: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private processor: AudioWorkletNode | ScriptProcessorNode | null = null;

  // Audio playback
  private playbackAudioContext: AudioContext | null = null;
  private currentPlaybackSource: AudioBufferSourceNode | null = null;
  private audioChunkQueue: string[] = [];
  isSpeaking = signal(false); // When TTS audio is playing

  // Display
  liveUserTranscript = signal('');
  liveModelTranscript = signal('');

  constructor() {
    afterNextRender(() => {
        this.scrollToBottom();
    });
    this.isMicrophoneAvailable.set(!!navigator.mediaDevices?.getUserMedia);

    // Effect to handle live connection state changes
    effect(() => {
        const state = this.geminiService.liveConnectionState();
        if ((state === 'error' || state === 'disconnected') && this.isLiveConversation()) {
            this.stopLiveConversation();
        }
    });

    // Effect to handle incoming model responses (text and audio)
    effect(() => {
        const response = this.geminiService.liveModelResponse();
        if (!response) return;

        if (response.text === 'INTERRUPTED') {
            this.stopPlayback();
            return;
        }

        if (response.text) {
            this.liveModelTranscript.update(current => current + response.text);
        }
        if (response.audio) {
            this.audioChunkQueue.push(response.audio);
            this.playQueuedAudio();
        }
    });

    // Effect to handle user speech transcripts
    effect(() => {
        const transcript = this.geminiService.liveUserTranscript();
        if (!transcript) return;
        
        this.liveUserTranscript.set(transcript.text);

        if (transcript.isFinal) {
            if (transcript.text.trim()) {
                // Sanitize user transcript to prevent XSS
                const sanitizedText = SecurityUtil.sanitizeText(transcript.text);
                this.messages.update(m => [...m, { role: 'user', html: `<p>${sanitizedText}</p>` }]);
                this.scrollToBottom();
            }
            if (this.liveModelTranscript().trim()) {
                // Sanitize model transcript to prevent XSS
                const sanitizedText = SecurityUtil.sanitizeText(this.liveModelTranscript());
                this.messages.update(m => [...m, { role: 'model', html: `<p>${sanitizedText}</p>` }]);
                this.scrollToBottom();
            }
            this.liveUserTranscript.set('');
            this.liveModelTranscript.set('');
        } else {
            // User is speaking, so we should interrupt any AI playback.
            this.stopPlayback();
        }
    });
  }

  ngOnDestroy() {
    this.stopLiveConversation();
    this.playbackAudioContext?.close();
  }

  async toggleLiveConversation() {
    if (this.isLiveConversation()) {
        this.stopLiveConversation();
    } else {
        await this.startLiveConversation();
    }
  }

  private async startLiveConversation() {
    if (this.isLiveConversation()) return;

    this.messages.update(m => [...m, { role: 'model', html: '<p><em>Live conversation started...</em></p>' }]);
    this.liveUserTranscript.set('');
    this.liveModelTranscript.set('');
    this.audioChunkQueue = [];
    this.isLiveConversation.set(true);
    await this.geminiService.connectLiveSession();

    try {
        this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.audioContext = new AudioContext({ sampleRate: 16000 });

        // Resume audio context if it's in suspended state
        if (this.audioContext.state === 'suspended') {
            console.log('Resuming suspended AudioContext for recording');
            await this.audioContext.resume();
        }

        // Load the AudioWorklet processor
        await this.audioContext.audioWorklet.addModule('/src/components/chatbot/audio-processor.worklet.js');

        const source = this.audioContext.createMediaStreamSource(this.stream);
        this.processor = new AudioWorkletNode(this.audioContext, 'audio-capture-processor');

        // Listen for audio data from the worklet
        this.processor.port.onmessage = (event) => {
            if (!this.isLiveConversation()) return;
            this.geminiService.sendLiveAudio(event.data);
        };

        source.connect(this.processor);
        // Connect to destination with a gain of 0 to avoid feedback
        const gain = this.audioContext.createGain();
        gain.gain.value = 0;
        this.processor.connect(gain);
        gain.connect(this.audioContext.destination);

    } catch (error) {
        console.error("Microphone access denied or error:", error);
        this.messages.update(m => [...m, { role: 'model', html: '<p><em>Microphone access denied. Live conversation cannot start.</em></p>' }]);
        this.stopLiveConversation();
    }
  }

  private stopLiveConversation() {
    if (!this.isLiveConversation() && !this.geminiService.liveSession()) return;

    this.isLiveConversation.set(false);
    this.geminiService.disconnectLiveSession();
    this.stopPlayback();

    this.processor?.disconnect();
    this.processor = null;
    this.audioContext?.close().catch(console.error);
    this.audioContext = null;
    this.stream?.getTracks().forEach(track => track.stop());
    this.stream = null;
    
    this.messages.update(m => [...m, { role: 'model', html: '<p><em>Live conversation ended.</em></p>' }]);
  }

  async sendMessage() {
    const messageText = this.userInput().trim();
    if (!messageText || this.isLoading()) {
      return;
    }

    // Sanitize user input to prevent XSS
    const sanitizedText = SecurityUtil.sanitizeText(messageText);
    this.messages.update(m => [...m, { role: 'user', html: `<p>${sanitizedText}</p>` }]);
    this.userInput.set('');
    this.isLoading.set(true);
    this.scrollToBottom();

    try {
      const responseHtml = await this.geminiService.sendMessageToChat(messageText);
      // Sanitize AI response to prevent XSS
      const sanitizedResponse = SecurityUtil.sanitizeHtml(responseHtml);
      this.messages.update(m => [...m, { role: 'model', html: sanitizedResponse }]);
    } catch (error) {
      console.error('Chatbot error:', error);

      // Provide more specific error messages based on error type
      let errorMsg = '<p><strong>⚠️ Error</strong></p><p>Sorry, I encountered an error. ';

      if (error instanceof Error) {
        if (error.message.includes('API Key')) {
          errorMsg += 'Please check your API key configuration.</p>';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMsg += 'There was a network error. Please check your connection.</p>';
        } else {
          errorMsg += 'Please try again later.</p>';
        }
      } else {
        errorMsg += 'Please try again.</p>';
      }

      this.messages.update(m => [...m, { role: 'model', html: errorMsg }]);
    } finally {
      this.isLoading.set(false);
      this.scrollToBottom();
    }
  }
  
  private async playQueuedAudio() {
    if (this.isSpeaking() || this.audioChunkQueue.length === 0) {
        return;
    }

    this.isSpeaking.set(true);
    const audioData = this.audioChunkQueue.shift();
    if (!audioData) {
        this.isSpeaking.set(false);
        return;
    }

    try {
      if (!this.playbackAudioContext || this.playbackAudioContext.state === 'closed') {
        this.playbackAudioContext = new AudioContext();
      }

      // Resume audio context if it's in suspended state
      if (this.playbackAudioContext.state === 'suspended') {
        console.log('Resuming suspended AudioContext');
        await this.playbackAudioContext.resume();
      }

      const wavBlob = this.createWavBlob(audioData);
      const arrayBuffer = await wavBlob.arrayBuffer();
      const audioBuffer = await this.playbackAudioContext.decodeAudioData(arrayBuffer);

      this.currentPlaybackSource = this.playbackAudioContext.createBufferSource();
      this.currentPlaybackSource.buffer = audioBuffer;
      this.currentPlaybackSource.connect(this.playbackAudioContext.destination);
      this.currentPlaybackSource.start(0);

      this.currentPlaybackSource.onended = () => {
          this.isSpeaking.set(false);
          this.currentPlaybackSource = null;
          this.playQueuedAudio();
      };
    } catch (e) {
      console.error("Error playing audio chunk:", e);
      this.isSpeaking.set(false);
      setTimeout(() => this.playQueuedAudio(), 100);
    }
  }

  private stopPlayback() {
    this.audioChunkQueue = [];
    if (this.currentPlaybackSource) {
        this.currentPlaybackSource.onended = null;
        try { this.currentPlaybackSource.stop(); } catch(e) {}
        this.currentPlaybackSource = null;
    }
    this.isSpeaking.set(false);
  }

  private createWavBlob(base64Data: string): Blob {
    const sampleRate = 16000;
    const numChannels = 1;
    const bitsPerSample = 16;
    
    const binaryString = window.atob(base64Data);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    const pcmData = bytes.buffer;

    const blockAlign = (numChannels * bitsPerSample) / 8;
    const byteRate = sampleRate * blockAlign;
    const dataSize = pcmData.byteLength;
    const waveFileSize = 36 + dataSize;

    const buffer = new ArrayBuffer(44);
    const view = new DataView(buffer);

    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, waveFileSize, true);
    this.writeString(view, 8, 'WAVE');
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    this.writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);

    return new Blob([view, pcmData], { type: 'audio/wav' });
  }

  private writeString(view: DataView, offset: number, str: string) {
    for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
    }
  }

  private scrollToBottom(): void {
    setTimeout(() => {
        const container = this.messagesContainer()?.nativeElement;
        if (container) {
            container.scrollTop = container.scrollHeight;
        }
    }, 0);
  }
}
