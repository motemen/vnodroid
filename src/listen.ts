export interface TalkListener {
  start: () => void;
  stop: () => void;
}

export type Callback = (arg: { text: string; isFinal: boolean }) => void;

export function createTalkListener(callback: Callback): TalkListener {
  const recognition = new webkitSpeechRecognition();
  recognition.interimResults = true;
  recognition.continuous = true;
  // recognition.lang = "ja-JP";

  Array<keyof SpeechRecognitionEventMap>(
    "audioend",
    "audiostart",
    "end",
    "error",
    "nomatch",
    "result",
    "soundend",
    "soundstart",
    "speechend",
    "speechstart",
    "start"
  ).forEach((name) => {
    recognition.addEventListener(name, (ev: Event) => {
      console.debug(`speechRecognition:${name}`, ev);
    });
  });

  recognition.addEventListener("result", (ev: SpeechRecognitionEvent) => {
    const isFinal = ev.results[ev.results.length - 1].isFinal;
    console.log(`[speech${isFinal ? " finished" : ""}]`, ev.results[ev.results.length - 1][0].transcript);
    const text = ev.results[ev.results.length - 1][0].transcript;
    callback({ text, isFinal });
  });
  recognition.addEventListener("end", () => {
    recognition.start();
  });
  recognition.addEventListener("error", (ev: SpeechRecognitionErrorEvent) => {
    console.error(ev);
  });

  return {
    start() {
      recognition.start();
    },
    stop() {
      recognition.stop();
    },
  };
}
