export interface TalkListenerCallbacks {
  middle: () => void;
  end: () => void;
}

export interface TalkListener {
  start: () => void;
  stop: () => void;
  updateCallbacks(callbacks: TalkListenerCallbacks): void;
}

export function createTalkListener(callbacks: TalkListenerCallbacks): TalkListener {
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
    console.log("result", { isFinal }, ev.results.length, ev.results[ev.results.length - 1][0].transcript);
    if (isFinal) {
      callbacks.end();
    } else {
      callbacks.middle();
    }
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
    updateCallbacks(cbs: TalkListenerCallbacks) {
      callbacks = cbs;
    },
  };
}
