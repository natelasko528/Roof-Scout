import { Component, ChangeDetectionStrategy, output, inject, signal, viewChild, ElementRef, afterNextRender, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GeminiService } from '../../services/gemini.service';

interface Message {
  role: 'user' | 'model';
  html: string;
}

// Check for SpeechRecognition API
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

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
  
  // Web Speech API for Input
  private recognition: any | null = SpeechRecognition ? new SpeechRecognition() : null;
  
  // Web Audio API for Output
  private audioContext: AudioContext | null = null;
  
  messages = signal<Message[]>([{ role: 'model', html: '<p>Hi! I\'m AI Scout. How can I help you today? You can ask me to create a lead or find an address on the map.</p>' }]);
  userInput = signal('');
  isLoading = signal(false);
  
  isMicrophoneAvailable = signal(!!this.recognition);
  isListening = signal(false); // When microphone is actively capturing audio
  isSpeaking = signal(false); // When TTS audio is playing
  isLiveConversation = signal(false); // The continuous conversation mode is active

  constructor() {
    afterNextRender(() => {
        this.scrollToBottom();
    });
    this.setupSpeechRecognition();
  }

  ngOnDestroy() {
    this.stopLiveConversation();
    if(this.recognition) {
      this.recognition.stop();
    }
    this.audioContext?.close();
  }

  private setupSpeechRecognition() {
    if (!this.recognition) return;
    
    this.recognition.continuous = false;
    this.recognition.lang = 'en-US';
    this.recognition.interimResults = false;

    this.recognition.onresult = (event: any) => {
      const transcript = event.results[event.results.length - 1][0].transcript;
      this.isListening.set(false);
      this.userInput.set(transcript);
      this.sendMessage();
    };

    this.recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      // Specific handling for common, non-critical errors
      if (event.error === 'no-speech' || event.error === 'audio-capture') {
        // Don't treat this as a fatal error, just stop listening.
        // The onend event will handle restarting if in live mode.
      }
      this.isListening.set(false);
    };
    
    this.recognition.onend = () => {
        this.isListening.set(false);
        // If live mode is on and we are not currently playing back audio, continue the loop.
        if (this.isLiveConversation() && !this.isSpeaking()) {
            // A small delay to prevent rapid-fire restarts on some platforms
            setTimeout(() => this.startListening(), 100);
        }
    };
  }

  toggleLiveConversation() {
    this.isLiveConversation.update(on => !on);
    if (this.isLiveConversation()) {
      this.startListening();
    } else {
      this.stopLiveConversation();
    }
  }

  startManualListen() {
    if (this.isLiveConversation()) {
        this.stopLiveConversation();
    }
    this.startListening();
  }

  private startListening() {
    if (this.recognition && !this.isListening() && !this.isSpeaking()) {
      try {
        this.recognition.start();
        this.isListening.set(true);
      } catch(e) {
        console.error("Could not start recognition:", e);
        this.isListening.set(false);
      }
    }
  }

  private stopLiveConversation() {
      if (this.recognition) {
        this.recognition.abort();
      }
      this.isLiveConversation.set(false);
      this.isListening.set(false);
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
      if (this.isLiveConversation()) {
        await this.speak(responseHtml);
      }
    } catch (error) {
      console.error('Chatbot error:', error);
      const errorMsg = '<p>Sorry, I encountered an error. Please try again.</p>';
      this.messages.update(m => [...m, { role: 'model', html: errorMsg }]);
       if (this.isLiveConversation()) {
        await this.speak(errorMsg);
      }
    } finally {
      this.isLoading.set(false);
      this.scrollToBottom();
    }
  }

  private async speak(text: string) {
    if (this.isSpeaking()) return;

    const audioData = await this.geminiService.textToSpeech(text);
    if (!audioData) {
        console.warn("Could not generate TTS audio.");
        if (this.isLiveConversation()) {
            this.startListening();
        }
        return;
    };

    try {
        this.isSpeaking.set(true);
        if (!this.audioContext) {
            this.audioContext = new AudioContext();
        }
        
        const wavBlob = this.createWavBlob(audioData);
        const arrayBuffer = await wavBlob.arrayBuffer();
        const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

        const source = this.audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(this.audioContext.destination);
        source.start(0);

        source.onended = () => {
            this.isSpeaking.set(false);
            if (this.isLiveConversation()) {
                this.startListening();
            }
        };

    } catch (error) {
        console.error("Failed to play TTS audio:", error);
        this.isSpeaking.set(false);
        if (this.isLiveConversation()) {
            this.startListening();
        }
    }
  }

  private createWavBlob(base64Data: string): Blob {
    // This assumes the raw audio data from the API is 24000Hz, 16-bit, single-channel PCM.
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

    // RIFF chunk descriptor
    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, waveFileSize, true);
    this.writeString(view, 8, 'WAVE');
    // "fmt " sub-chunk
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // Sub-chunk size (16 for PCM)
    view.setUint16(20, 1, true); // Audio format (1 for PCM)
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    // "data" sub-chunk
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