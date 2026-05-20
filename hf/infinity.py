"""
INFINITY — Hero Video Pipeline
================================
Input  : PNG photo (transparent background) + narasi teks
Output : MP4 video 9:16 dengan animasi foto dari bawah + TTS voice + subtitle

Flow:
1. Generate TTS audio dari narasi
2. Enhance audio (normalize, compress)
3. Analyze word timings (uniform distribution)
4. Composite foto PNG di atas background gradient
5. Render video dengan animasi foto slide-up + subtitle word-by-word
6. Output MP4
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
import random
import sys
from datetime import datetime
from pathlib import Path
from typing import List, Dict

import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

try:
    from moviepy.editor import (
        AudioFileClip,
        CompositeVideoClip,
        ImageClip,
        ColorClip,
    )
    from pydub import AudioSegment
    from pydub.effects import normalize, compress_dynamic_range
    import edge_tts
except ImportError as e:
    raise ImportError(
        f"{e}. Install: moviepy pydub edge-tts numpy pillow imageio[ffmpeg] imageio-ffmpeg"
    ) from e

# ── Logging — always write to /tmp on HF Spaces ──
_log_file = f"/tmp/infinity_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
    handlers=[
        logging.FileHandler(_log_file, encoding="utf-8"),
        logging.StreamHandler(sys.stdout),
    ],
)
logger = logging.getLogger(__name__)

# ── Video dimensions (9:16 portrait) ──
VIDEO_W = 1080
VIDEO_H = 1920
FPS = 30

# ── Background gradients ──
GRADIENTS = [
    [(5, 7, 15), (15, 20, 40)],
    [(8, 5, 20), (20, 10, 40)],
    [(5, 15, 10), (10, 30, 20)],
    [(15, 5, 5), (35, 10, 15)],
]


# ══════════════════════════════════════════════════════════════
# VOICE OVER
# ══════════════════════════════════════════════════════════════

class VoiceOverGenerator:
    VOICES = {
        "male":   "id-ID-ArdiNeural",
        "female": "id-ID-GadisNeural",
    }

    def __init__(self, gender: str = "male"):
        self.voice = self.VOICES.get(gender, self.VOICES["male"])
        logger.info("TTS voice: %s", self.voice)

    async def generate(self, text: str, out_path: str) -> str:
        communicate = edge_tts.Communicate(text, self.voice)
        await communicate.save(out_path)
        logger.info("TTS saved: %s", out_path)
        return out_path

    @staticmethod
    def enhance(in_path: str, out_path: str) -> str:
        audio = AudioSegment.from_file(in_path)
        audio = normalize(audio)
        audio = compress_dynamic_range(audio, threshold=-20.0, ratio=4.0)
        audio.export(out_path, format="mp3", bitrate="192k")
        logger.info("Audio enhanced: %s", out_path)
        return out_path

    @staticmethod
    def word_timings(text: str, audio_path: str) -> List[Dict]:
        words = text.split()
        duration = len(AudioSegment.from_file(audio_path)) / 1000.0
        tpw = duration / max(len(words), 1)
        return [
            {"word": w.upper(), "start": i * tpw, "end": (i + 1) * tpw, "index": i}
            for i, w in enumerate(words)
        ]


# ══════════════════════════════════════════════════════════════
# BACKGROUND GENERATOR
# ══════════════════════════════════════════════════════════════

def make_background(seed: int = 0) -> np.ndarray:
    """Generate a dark gradient background 1080×1920 RGBA."""
    rng = random.Random(seed)
    c1, c2 = rng.choice(GRADIENTS)
    img = Image.new("RGBA", (VIDEO_W, VIDEO_H))
    draw = ImageDraw.Draw(img)
    for y in range(VIDEO_H):
        t = y / VIDEO_H
        r = int(c1[0] + (c2[0] - c1[0]) * t)
        g = int(c1[1] + (c2[1] - c1[1]) * t)
        b = int(c1[2] + (c2[2] - c1[2]) * t)
        draw.line([(0, y), (VIDEO_W, y)], fill=(r, g, b, 255))
    # Subtle noise
    arr = np.array(img, dtype=np.float32)
    noise = rng.uniform(-6, 6)
    arr[:, :, :3] = np.clip(arr[:, :, :3] + noise, 0, 255)
    return arr.astype(np.uint8)


# ══════════════════════════════════════════════════════════════
# PHOTO COMPOSITOR
# ══════════════════════════════════════════════════════════════

def composite_photo(
    bg: np.ndarray,
    photo_path: str,
    position: str = "center",  # "center" | "right"
    progress: float = 1.0,     # 0.0 → 1.0 (slide-up animation)
) -> np.ndarray:
    """
    Composite a PNG photo (with transparency) onto the background.
    progress=0 → photo fully below frame, progress=1 → final position.
    """
    frame = Image.fromarray(bg).convert("RGBA")
    photo = Image.open(photo_path).convert("RGBA")

    # Scale photo to fit ~70% of video height, maintain aspect ratio
    max_h = int(VIDEO_H * 0.72)
    max_w = int(VIDEO_W * 0.85)
    photo.thumbnail((max_w, max_h), Image.LANCZOS)
    pw, ph = photo.size

    # Horizontal position
    if position == "right":
        px = VIDEO_W - pw - int(VIDEO_W * 0.04)
    else:  # center
        px = (VIDEO_W - pw) // 2

    # Vertical: photo sits at bottom 15% of frame when fully in
    final_py = VIDEO_H - ph - int(VIDEO_H * 0.08)

    # Slide-up animation: start from below frame
    start_py = VIDEO_H + 20
    py = int(start_py + (final_py - start_py) * _ease_out_quart(progress))

    # Soft shadow under photo
    shadow = Image.new("RGBA", (pw + 40, ph + 40), (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow)
    shadow_draw.ellipse([10, ph - 20, pw + 30, ph + 30], fill=(0, 0, 0, 80))
    shadow = shadow.filter(ImageFilter.GaussianBlur(radius=15))
    frame.paste(shadow, (px - 20, py - 10), shadow)

    # Paste photo with alpha
    frame.paste(photo, (px, py), photo)

    return np.array(frame.convert("RGB"))


def _ease_out_quart(t: float) -> float:
    s = 1.0 - min(max(t, 0.0), 1.0)
    return 1.0 - s * s * s * s


# ══════════════════════════════════════════════════════════════
# SUBTITLE RENDERER
# ══════════════════════════════════════════════════════════════

def _get_font(size: int) -> ImageFont.FreeTypeFont:
    paths = [
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
        "C:\\Windows\\Fonts\\ARIALBD.TTF",
    ]
    for p in paths:
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except Exception:
                continue
    return ImageFont.load_default()


def render_subtitle_frame(
    words_so_far: List[str],
    video_h: int = VIDEO_H,
    video_w: int = VIDEO_W,
) -> np.ndarray:
    """Render transparent RGBA frame with cumulative subtitle words."""
    img = Image.new("RGBA", (video_w, video_h), (0, 0, 0, 0))
    if not words_so_far:
        return np.array(img)

    draw = ImageDraw.Draw(img)
    font_size = max(52, int(video_w * 0.055))
    font = _get_font(font_size)
    stroke_w = max(3, font_size // 18)

    # Wrap words into lines
    max_line_w = int(video_w * 0.88)
    lines: List[List[str]] = []
    current: List[str] = []
    for word in words_so_far:
        test = " ".join(current + [word])
        bbox = draw.textbbox((0, 0), test, font=font)
        if bbox[2] - bbox[0] > max_line_w and current:
            lines.append(current)
            current = [word]
        else:
            current.append(word)
    if current:
        lines.append(current)

    # Keep last 3 lines max
    lines = lines[-3:]

    line_h = font_size + int(font_size * 0.25)
    total_h = len(lines) * line_h
    # Position: 30% from top (above photo area)
    start_y = int(video_h * 0.28) - total_h // 2

    for li, line_words in enumerate(lines):
        text = " ".join(line_words)
        bbox = draw.textbbox((0, 0), text, font=font)
        tw = bbox[2] - bbox[0]
        x = (video_w - tw) // 2
        y = start_y + li * line_h

        # Shadow
        draw.text((x + 3, y + 3), text, font=font, fill=(0, 0, 0, 120))
        # Stroke
        for dx in range(-stroke_w, stroke_w + 1):
            for dy in range(-stroke_w, stroke_w + 1):
                if dx != 0 or dy != 0:
                    draw.text((x + dx, y + dy), text, font=font, fill=(0, 0, 0, 200))
        # Main text — last word highlighted
        words_in_line = line_words
        if li == len(lines) - 1 and words_in_line:
            # Draw all but last word in white
            prefix = " ".join(words_in_line[:-1])
            if prefix:
                draw.text((x, y), prefix + " ", font=font, fill=(255, 255, 255, 255))
                prefix_bbox = draw.textbbox((0, 0), prefix + " ", font=font)
                last_x = x + (prefix_bbox[2] - prefix_bbox[0])
            else:
                last_x = x
            # Last word in cyan
            draw.text((last_x, y), words_in_line[-1], font=font, fill=(100, 220, 255, 255))
        else:
            draw.text((x, y), text, font=font, fill=(255, 255, 255, 255))

    return np.array(img)


# ══════════════════════════════════════════════════════════════
# MAIN PIPELINE
# ══════════════════════════════════════════════════════════════

class AutoSubtitlePipeline:
    def __init__(
        self,
        photo_path: str,
        caption_text: str,
        voice_gender: str = "male",
        photo_position: str = "center",
        output_dir: str = "/tmp/infinity_out",
    ):
        self.photo_path = photo_path
        self.caption_text = caption_text.strip()
        self.voice_gender = voice_gender
        self.photo_position = photo_position
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.tmp_dir = Path("/tmp/infinity_tmp")
        self.tmp_dir.mkdir(parents=True, exist_ok=True)
        logger.info("Pipeline init: photo=%s pos=%s voice=%s", photo_path, photo_position, voice_gender)

    async def run(self) -> str:
        ts = datetime.now().strftime("%Y%m%d_%H%M%S")

        # ── Step 1: TTS ──
        logger.info("Step 1: TTS generation")
        tts_raw = str(self.tmp_dir / f"tts_raw_{ts}.mp3")
        tts_enh = str(self.tmp_dir / f"tts_enh_{ts}.mp3")
        vg = VoiceOverGenerator(self.voice_gender)
        await vg.generate(self.caption_text, tts_raw)

        # ── Step 2: Enhance audio ──
        logger.info("Step 2: Audio enhancement")
        VoiceOverGenerator.enhance(tts_raw, tts_enh)

        # ── Step 3: Word timings ──
        logger.info("Step 3: Word timings")
        timings = VoiceOverGenerator.word_timings(self.caption_text, tts_enh)
        duration = timings[-1]["end"] if timings else 3.0
        logger.info("Duration: %.2fs, words: %d", duration, len(timings))

        # ── Step 4: Build video frames ──
        logger.info("Step 4: Building video")
        output_path = str(self.output_dir / f"hero_{ts}.mp4")
        self._render_video(timings, duration, tts_enh, output_path)

        logger.info("Done: %s", output_path)
        return output_path

    def _render_video(
        self,
        timings: List[Dict],
        duration: float,
        audio_path: str,
        output_path: str,
    ) -> None:
        total_frames = int(duration * FPS)
        seed = hash(self.caption_text) % 1000

        # Pre-render background
        bg = make_background(seed)

        # Build photo slide-up animation duration (first 1.2s)
        slide_duration = min(1.2, duration * 0.25)

        # Build word index lookup: frame → words shown so far
        word_frames: Dict[int, List[str]] = {}
        for wd in timings:
            start_f = int(wd["start"] * FPS)
            for f in range(start_f, total_frames):
                if f not in word_frames:
                    word_frames[f] = []
                word_frames[f].append(wd["word"])

        def make_frame(t: float) -> np.ndarray:
            frame_idx = int(t * FPS)

            # Photo slide-up progress
            progress = min(1.0, t / slide_duration) if slide_duration > 0 else 1.0

            # Composite photo onto background
            frame = composite_photo(bg, self.photo_path, self.photo_position, progress)

            # Overlay subtitles
            words_so_far = word_frames.get(frame_idx, [])
            sub_frame = render_subtitle_frame(words_so_far)
            sub_img = Image.fromarray(sub_frame)
            base_img = Image.fromarray(frame).convert("RGBA")
            base_img.paste(sub_img, (0, 0), sub_img)

            return np.array(base_img.convert("RGB"))

        # Create video clip
        video_clip = ColorClip(size=(VIDEO_W, VIDEO_H), color=[0, 0, 0], duration=duration)
        video_clip = video_clip.fl(lambda gf, t: make_frame(t), apply_to=["mask"])

        # Use ImageClip with make_frame directly
        from moviepy.editor import VideoClip
        video = VideoClip(make_frame, duration=duration)
        audio = AudioFileClip(audio_path)
        final = video.set_audio(audio)

        logger.info("Writing MP4: %s", output_path)
        final.write_videofile(
            output_path,
            fps=FPS,
            codec="libx264",
            audio_codec="aac",
            preset="ultrafast",
            threads=2,
            bitrate="3000k",
            logger=None,
        )
        final.close()
        audio.close()
