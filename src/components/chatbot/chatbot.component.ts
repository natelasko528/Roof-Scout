import { Component, ChangeDetectionStrategy, output, inject, signal, viewChild, ElementRef, afterNextRender, OnDestroy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GeminiService } from '../../services/gemini.service';

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
  
  messages = signal<Message[]>([{ role: 'model', html: '<p>Hi! I\'m AI Scout. How can I help you today? You can ask me to create a lead or find an address on the map.</p>' }]);
  userInput = signal('');
  isLoading = signal(false);
  
  isMicrophoneAvailable = signal(false);
  isLiveConversation = signal(false);

  // -- NEW STATE FOR LIVE CONVERSATION --
  // Mic and Audio processing
  private audioContext: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;

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
                this.messages.update(m => [...m, { role: 'user', html: `<p>${transcript.text}</p>` }]);
                this.scrollToBottom();
            }
            if (this.liveModelTranscript().trim()) {
                this.messages.update(m => [...m, { role: 'model', html: `<p>${this.liveModelTranscript()}</p>` }]);
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
        const source = this.audioContext.createMediaStreamSource(this.stream);
        this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

        this.processor.onaudioprocess = (e) => {
            if (!this.isLiveConversation()) return;
            const inputData = e.inputBuffer.getChannelData(0);
            const pcm16Data = this.float32ToInt16(inputData);
            const base64 = this.arrayBufferToBase64(pcm16Data);
            this.geminiService.sendLiveAudio(base64);
        };

        source.connect(this.processor);
        this.processor.connect(this.audioContext.destination);

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

    this.messages.update(m => [...m, { role: 'user', html: `<p>${messageText}</p>` }]);
    this.userInput.set('');
    this.isLoading.set(true);
    this.scrollToBottom();

    try {
      const responseHtml = await this.geminiService.sendMessageToChat(messageText);
      this.messages.update(m => [...m, { role: 'model', html: responseHtml }]);
    } catch (error) {
      console.error('Chatbot error:', error);
      const errorMsg = '<p>Sorry, I encountered an error. Please try again.</p>';
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

  private float32ToInt16(buffer: Float32Array): ArrayBuffer {
    let l = buffer.length;
    const buf = new Int16Array(l);
    while (l--) {
        buf[l] = Math.min(1, buffer[l]) * 0x7FFF;
    }
    return buf.buffer;
  }
  
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  private createWavBlob(base64Data: string): Blob {
    const sampleRate = 24000;
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
