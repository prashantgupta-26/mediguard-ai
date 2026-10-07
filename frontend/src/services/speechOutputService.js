/**
 * SpeechOutputService
 * Abstraction layer for Text-To-Speech (TTS) using browser SpeechSynthesis.
 * Supports English ('en-US'), Hindi ('hi-IN'), Bengali ('bn-IN').
 */

class SpeechOutputService {
  constructor() {
    this.synth = typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null;
    this.isSpeaking = false;
    this.currentUtterance = null;
  }

  /**
   * Checks if browser supports SpeechSynthesis
   */
  isSupported() {
    return !!this.synth;
  }

  /**
   * Speaks text aloud in specified language
   * @param {string} text Text to read
   * @param {string} langCode 'en' | 'hi' | 'bn'
   * @param {object} callbacks { onStart, onEnd, onError }
   */
  speak(text, langCode = 'en', callbacks = {}) {
    if (!this.isSupported() || !text) {
      if (callbacks.onError) callbacks.onError('Speech synthesis not supported');
      return false;
    }

    this.stop(); // Stop any currently playing audio

    const langMap = {
      en: 'en-US',
      hi: 'hi-IN',
      bn: 'bn-IN'
    };

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langMap[langCode] || 'en-US';
    utterance.rate = 0.95; // Slightly slower, clear patient-friendly speed
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      this.isSpeaking = true;
      if (callbacks.onStart) callbacks.onStart();
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      this.currentUtterance = null;
      if (callbacks.onEnd) callbacks.onEnd();
    };

    utterance.onerror = (event) => {
      this.isSpeaking = false;
      this.currentUtterance = null;
      console.warn('[SpeechOutputService] TTS error:', event.error);
      if (callbacks.onError) callbacks.onError(event.error);
    };

    this.currentUtterance = utterance;

    try {
      this.synth.speak(utterance);
      return true;
    } catch (err) {
      console.warn('[SpeechOutputService] Failed to invoke speak:', err);
      if (callbacks.onError) callbacks.onError(err.message);
      return false;
    }
  }

  /**
   * Stops active speech output
   */
  stop() {
    if (this.synth) {
      try {
        this.synth.cancel();
      } catch (e) {}
    }
    this.isSpeaking = false;
    this.currentUtterance = null;
  }
}

export const speechOutputService = new SpeechOutputService();
