import smoothfade from "smoothfade";
import { logIt } from "@/clients/index";

let windowobject;
let initialized = false;
export function init(window) {
  windowobject = window;
  const lowLag = windowobject.lowLag;
  lowLag.init();
  initialized = true;
  logIt("Initialized LowLag Audio Engine", {
    source: "audioEngine_init",
    raw: {
      window: window,
      lowLag: window.lowLag,
      windowbj: windowobject,
    },
  });
  return true;
}

const audioincache: any = {};
export async function loadAudio(id, { src }): Promise<boolean> {
  return new Promise(async (resolve, reject) => {
    if (!initialized) {
      logIt(
        `Failed to play audio because audio engine has not been initialized`,
        {
          source: "audioEngine_loadAudio",
          raw: { id, src, initialized },
          level: "error",
        }
      );
      return;
    }
    logIt(`Loading Audio with id "${id}" from "${src}"`, {
      source: "audioEngine_loadAudio",
      raw: { id, src },
    });
    const lowLag = windowobject.lowLag;
    await lowLag.load(src, id);
    audioincache[id] = {
      src: src,
    };
    logIt(
      `Successfully loaded Audio and added to cache with id "${id}" from "${src}"`,
      {
        source: "audioEngine_loadAudio",
        raw: { id, src },
      }
    );
    resolve(true);
  });
}

interface AudioData {
  id: string;
  source: AudioBufferSourceNode;
  audioContext: AudioContext;
  gainNode: GainNode;
  sm: {
    fadeIn: Function;
    fadeOut: Function;
  };
}

const currentlyplayingaudios: any = [];
export function playAudio(id): AudioData | null {
  const lowLag = windowobject.lowLag;
  if (!audioincache[id]) {
    console.log(`Audio not found in cache: ${id}`);
    logIt(
      `Audio failed to play becuase it does not exist in cache with id "${id}".`,
      {
        source: "audioEngine_playAudio",
        level: "error",
        raw: { id, audiocache: audioincache },
      }
    );
    return null;
  }
  logIt(`Attempting to play audio with id "${id}"`, {
    source: "audioEngine_playAudio",
    raw: { id, audiocache: audioincache },
  });
  const { source, audioContext, gainNode }: AudioData = lowLag.play(id);
  logIt(`Playing audio with id "${id}"`, {
    source: "audioEngine_playAudio",
    raw: { id, audiocache: audioincache },
  });

  const smoptions = {
    type: "linear",
    fadeLength: 0.7,
  };
  var sm = smoothfade(audioContext, gainNode, smoptions);
  logIt(`Successfully applied smoothfade configuration to audioContext.`, {
    source: "audioEngine_playAudio",
    raw: { smoothfade_options: smoptions },
  });

  const data: AudioData = {
    id: id,
    source,
    audioContext,
    gainNode,
    sm: {
      fadeIn: sm.fadeIn,
      fadeOut: sm.fadeOut,
    },
  };
  currentlyplayingaudios.push(data);
  logIt(`Added AudioContext to audioplaying cache`, {
    source: "audioEngine_playAudio",
    raw: { data: data },
  });
  return data;
}

export function getContext(): AudioContext {
  const lowLag = windowobject.lowLag;
  return lowLag.audioContext;
}

export function getAudio(id): AudioData | null {
  const selectedinarray = currentlyplayingaudios.find(
    (audio) => audio.id == id
  );
  if (!selectedinarray) return null;

  return selectedinarray;
}

export function stopAudio(id): boolean {
  const selectedinarray = currentlyplayingaudios.find(
    (audio) => audio.id == id
  );
  if (!selectedinarray) return false;

  selectedinarray.context.stop();
  return true;
}
