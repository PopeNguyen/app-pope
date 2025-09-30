export const speak = (text: string) => {
  if ('speechSynthesis' in window) {
    // Stop any previous speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US'; // Set language to US English
    utterance.rate = 1.0; // Set speech rate
    utterance.pitch = 1.0; // Set speech pitch

    window.speechSynthesis.speak(utterance);
  } else {
    console.error('Sorry, your browser does not support text-to-speech.');
  }
};
