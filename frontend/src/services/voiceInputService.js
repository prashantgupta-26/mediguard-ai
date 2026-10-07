/**
 * VoiceInputService
 * Abstraction layer for browser SpeechRecognition (STT - Speech to Text).
 * Supports English ('en-US'), Hindi ('hi-IN'), Bengali ('bn-IN').
 * Tracks status: 'idle' | 'listening' | 'processing' | 'got_it' | 'error'
 */

class VoiceInputService {
  constructor() {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    this.SpeechRecognition = SpeechRecognition || null;
    this.recognition = null;
    this.isListening = false;
    this.onResultCallback = null;
    this.onErrorCallback = null;
    this.onStateChangeCallback = null;
  }

  /**
   * Checks if browser supports SpeechRecognition
   */
  isSupported() {
    return !!this.SpeechRecognition;
  }

  /**
   * Initializes SpeechRecognition with target language
   * @param {string} langCode 'en' | 'hi' | 'bn'
   */
  init(langCode = 'en') {
    if (!this.isSupported()) return false;

    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {}
    }

    this.recognition = new this.SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = true;

    // Map language codes
    const langMap = {
      en: 'en-US',
      hi: 'hi-IN',
      bn: 'bn-IN'
    };
    this.recognition.lang = langMap[langCode] || 'en-US';

    this.recognition.onstart = () => {
      this.isListening = true;
      if (this.onStateChangeCallback) {
        this.onStateChangeCallback('listening');
      }
    };

    this.recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (this.onStateChangeCallback && interimTranscript) {
        this.onStateChangeCallback('listening', interimTranscript);
      }

      if (finalTranscript.trim()) {
        if (this.onStateChangeCallback) {
          this.onStateChangeCallback('processing');
        }
        if (this.onResultCallback) {
          this.onResultCallback(finalTranscript.trim());
        }
      }
    };

    this.recognition.onerror = (event) => {
      this.isListening = false;
      console.warn('[VoiceInputService] Speech recognition error:', event.error);
      
      let friendlyError = 'Speech recognition error. Please try again or type.';
      if (event.error === 'not-allowed') {
        friendlyError = 'Microphone permission denied. Please allow microphone access or use touch/type input.';
      } else if (event.error === 'no-speech') {
        friendlyError = 'No speech heard. Please tap the microphone and try speaking again.';
      }

      if (this.onStateChangeCallback) {
        this.onStateChangeCallback('error', friendlyError);
      }
      if (this.onErrorCallback) {
        this.onErrorCallback(friendlyError, event.error);
      }
    };

    this.recognition.onend = () => {
      this.isListening = false;
    };

    return true;
  }

  /**
   * Start listening for voice input
   * @param {object} callbacks
   * @param {function} callbacks.onResult Callback when final speech text is transcribed
   * @param {function} callbacks.onError Callback on error
   * @param {function} callbacks.onStateChange Callback when state changes ('listening', 'processing', 'got_it', 'error')
   */
  start(langCode = 'en', callbacks = {}) {
    this.onResultCallback = callbacks.onResult || null;
    this.onErrorCallback = callbacks.onError || null;
    this.onStateChangeCallback = callbacks.onStateChange || null;

    if (!this.init(langCode)) {
      const err = 'Speech recognition is not supported in this browser. Please type your response.';
      if (this.onStateChangeCallback) this.onStateChangeCallback('error', err);
      if (this.onErrorCallback) this.onErrorCallback(err, 'not_supported');
      return false;
    }

    try {
      this.recognition.start();
      return true;
    } catch (err) {
      console.warn('[VoiceInputService] Failed to start recognition:', err);
      if (this.onErrorCallback) this.onErrorCallback(err.message, 'start_failed');
      return false;
    }
  }

  /**
   * Stop listening
   */
  stop() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (e) {}
    }
    this.isListening = false;
    if (this.onStateChangeCallback) {
      this.onStateChangeCallback('idle');
    }
  }
}

export const voiceInputService = new VoiceInputService();
