#!/usr/bin/env python3
"""Synthesise the narration scene by scene, measure it, and write the timings
and caption cues the compositions read.

  python3 scripts/make-voice.py            # both cuts
  python3 scripts/make-voice.py --voice en-GB-SoniaNeural

Needs the edge-tts package (pip install edge-tts) and ffprobe. Behind the
session proxy, append /root/.ccr/ca-bundle.crt to certifi's cacert.pem first.
"""
import argparse, asyncio, json, os, re, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)

LEAD, TAIL = 0.5, 1.1   # silence before the first word and after the last, per scene

def read_lines(name):
    """The caption lines from src/script.ts — the narration is its join."""
    src = open(os.path.join(ROOT, "src", "script.ts")).read()
    m = re.search(name + r"[^=]*=\s*(\[[\s\S]*?\n\]);", src)
    return json.loads(re.sub(r",\s*([\]}])", r"\1", m.group(1).replace("\n", "")))

def words(s):
    return re.findall(r"[A-Za-z0-9'’%.,;:-]+", s)

async def synth(text, out, voice, attempts=8):
    """Synthesise one scene. Every finished scene is kept content-addressed
    in voice/cache/<sha1 of voice+text>.mp3 with its word bounds in a .json
    beside it, and the numbered file is a copy. So a run that dies halfway
    resumes, an unchanged scene is never redone, and a scene inserted before
    the others re-does only itself."""
    import edge_tts, hashlib, shutil
    key = hashlib.sha1((voice + "|" + text).encode()).hexdigest()
    cdir = os.path.join(ROOT, "public", "voice", "cache")
    os.makedirs(cdir, exist_ok=True)
    cmp3, cjson = os.path.join(cdir, key + ".mp3"), os.path.join(cdir, key + ".json")
    if not (os.path.exists(cmp3) and os.path.getsize(cmp3) > 0 and os.path.exists(cjson)):
        for attempt in range(attempts):
            try:
                com = edge_tts.Communicate(text, voice, rate="-4%", boundary="WordBoundary")
                bounds = []
                with open(cmp3 + ".tmp", "wb") as f:
                    async for chunk in com.stream():
                        if chunk["type"] == "audio":
                            f.write(chunk["data"])
                        elif chunk["type"] == "WordBoundary":
                            # offset and duration in 100-ns ticks
                            bounds.append((chunk["offset"] / 1e7, (chunk["offset"] + chunk["duration"]) / 1e7, chunk["text"]))
                os.replace(cmp3 + ".tmp", cmp3)
                json.dump({"key": key, "voice": voice, "text": text, "bounds": bounds}, open(cjson, "w"))
                break
            except Exception as e:  # the service sometimes closes the stream early; try again
                print(f"  attempt {attempt + 1} failed: {e}")
                await asyncio.sleep(5 + attempt * 5)
        else:
            raise RuntimeError(f"no audio for: {text[:40]}")
    shutil.copyfile(cmp3, out)
    return [tuple(b) for b in json.load(open(cjson))["bounds"]]

def duration(path):
    return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path]).decode().strip())

async def build(cut, name, voice):
    lines = read_lines(name)
    outdir = os.path.join(ROOT, "public", "voice", cut)
    os.makedirs(outdir, exist_ok=True)
    secs, cues, marks = [], [], []
    for i, scene in enumerate(lines):
        text = " ".join(scene)
        mp3 = os.path.join(outdir, f"{i}.mp3")
        bounds = await synth(text, mp3, voice)
        d = duration(mp3)
        secs.append(round(LEAD + d + TAIL, 3))
        # group the word boundaries into the caption lines
        scene_cues, wi = [], 0
        for line in scene:
            n = len(words(line))
            group = bounds[wi:wi + n] if bounds else []
            wi += n
            if group:
                scene_cues.append({"text": line, "start": round(LEAD + group[0][0], 3), "end": round(LEAD + group[-1][1] + 0.2, 3)})
        # close the gaps: each cue runs until the next begins
        for a, b in zip(scene_cues, scene_cues[1:]):
            a["end"] = b["start"]
        if scene_cues:
            scene_cues[-1]["end"] = round(LEAD + d + 0.6, 3)
        cues.append(scene_cues)
        # the first moment each word is spoken, so a scene can move on the word
        m = {}
        for b in bounds or []:
            w = re.sub(r"[^a-z0-9']", "", b[2].lower())
            if w and w not in m:
                m[w] = round(LEAD + b[0], 3)
        marks.append(m)
        print(f"{cut} scene {i}: {d:.2f}s speech, {len(bounds or [])} words, {len(scene_cues)} cues")
    return secs, cues, marks

async def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--voice", default="en-US-AndrewNeural")
    args = ap.parse_args()
    full_secs, full_cues, full_marks = await build("full", "FULL_LINES", args.voice)
    short_secs, short_cues, short_marks = await build("short", "SHORT_LINES", args.voice)
    with open(os.path.join(ROOT, "src", "timings.ts"), "w") as f:
        f.write("/* Generated by scripts/make-voice.py — the measured voice. Do not edit by hand. */\n")
        f.write(f"export const VOICE = {json.dumps(args.voice)};\n")
        f.write(f"export const LEAD = {LEAD};\n")
        f.write(f"export const FULL: number[] = {json.dumps(full_secs)};\n")
        f.write(f"export const SHORT: number[] = {json.dumps(short_secs)};\n")
        f.write('export const FULL_AUDIO: string | null = "voice/full";\n')
        f.write('export const SHORT_AUDIO: string | null = "voice/short";\n')
    with open(os.path.join(ROOT, "src", "cues.ts"), "w") as f:
        f.write("/* Generated by scripts/make-voice.py — caption cues from the voice's own word timings. */\n")
        f.write("import type { Cue } from \"./captions\";\n")
        f.write(f"export const FULL_CUES: Cue[][] = {json.dumps(full_cues)};\n")
        f.write(f"export const SHORT_CUES: Cue[][] = {json.dumps(short_cues)};\n")
        f.write("/* The first moment each word is spoken in a scene, in seconds from its start. */\n")
        f.write(f"export const FULL_MARKS: Record<string, number>[] = {json.dumps(full_marks)};\n")
        f.write(f"export const SHORT_MARKS: Record<string, number>[] = {json.dumps(short_marks)};\n")
    print("full", sum(full_secs), "s · short", sum(short_secs), "s")

asyncio.run(main())
