/**
 * Audio Worklet Processor for capturing microphone input
 * Converts audio to 16kHz PCM format for Gemini AI live sessions
 */

class AudioCaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._bufferSize = 4096; // Buffer size for audio processing
    this._buffer = [];
    this._bytesPerSample = 2; // 16-bit audio
    this._sampleRate = 16000; // Target sample rate for AI
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];

    if (input.length > 0) {
      const inputChannel = input[0];
      const inputSampleRate = sampleRate;

      // Convert to mono if stereo
      const monoChannel = this._convertToMono(inputChannel);

      // Resample to 16kHz if necessary
      const resampled = this._resampleAudio(monoChannel, inputSampleRate, this._sampleRate);

      // Convert to 16-bit PCM
      const pcmData = this._convertToPCM(resampled);

      // Send to main thread
      this.port.postMessage(pcmData);
    }

    // Pass through audio for monitoring (with gain = 0 to avoid feedback)
    if (output.length > 0) {
      for (let channel = 0; channel < output.length; channel++) {
        output[channel].fill(0); // Silent output to prevent feedback
      }
    }

    return true;
  }

  _convertToMono(channelData) {
    if (channelData.length === 1) {
      return channelData[0];
    }

    // Average stereo to mono
    const mono = new Float32Array(channelData[0].length);
    for (let i = 0; i < mono.length; i++) {
      mono[i] = (channelData[0][i] + channelData[1][i]) / 2;
    }
    return mono;
  }

  _resampleAudio(input, inputRate, outputRate) {
    if (inputRate === outputRate) {
      return input;
    }

    const ratio = inputRate / outputRate;
    const newLength = Math.round(input.length / ratio);
    const output = new Float32Array(newLength);

    let outputIndex = 0;
    let inputIndex = 0;

    while (outputIndex < newLength) {
      output[outputIndex] = input[Math.floor(inputIndex)] || 0;
      outputIndex++;
      inputIndex += ratio;
    }

    return output;
  }

  _convertToPCM(float32Array) {
    const buffer = new ArrayBuffer(float32Array.length * 2);
    const view = new DataView(buffer);

    for (let i = 0; i < float32Array.length; i++) {
      // Clamp to [-1, 1]
      let sample = Math.max(-1, Math.min(1, float32Array[i]));
      // Convert to 16-bit signed integer
      view.setInt16(i * 2, sample * 0x7FFF, true);
    }

    // Convert to base64 for transmission
    const uint8Array = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < uint8Array.byteLength; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    return btoa(binary);
  }
}

// Register the processor
registerProcessor('audio-capture-processor', AudioCaptureProcessor);
