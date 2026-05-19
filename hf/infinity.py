"""
AUTO SUBTITLE & VOICE OVER - FIXED & OPTIMIZED
===============================================
Version 3.0 - Properly working with correct timing!

Author: Claude AI
Version: 3.0 (Complete Rewrite - Fixed)
"""

import os
import sys
import random
import logging
from pathlib import Path
from datetime import datetime
from typing import List, Tuple, Dict
import json

try:
    from moviepy.editor import VideoFileClip, CompositeVideoClip, ImageClip, AudioFileClip, TextClip
    from moviepy.video.VideoClip import VideoClip
    import numpy as np
    from PIL import Image, ImageDraw, ImageFont
    from pydub import AudioSegment
    from pydub.effects import normalize, compress_dynamic_range
    import edge_tts
    import asyncio
except ImportError as e:
    raise ImportError(
        f"{e}. Install dependencies: moviepy pydub edge-tts numpy pillow imageio[ffmpeg] imageio-ffmpeg"
    ) from e

# Safe logging
class SafeStreamHandler(logging.StreamHandler):
    def emit(self, record):
        try:
            msg = self.format(record)
            msg = msg.encode('ascii', 'ignore').decode('ascii')
            self.stream.write(msg + self.terminator)
            self.flush()
        except:
            self.handleError(record)

log_file = f'subtitle_log_{datetime.now().strftime("%Y%m%d_%H%M%S")}.log'
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(log_file, encoding='utf-8'),
        SafeStreamHandler()
    ]
)
logger = logging.getLogger(__name__)


class SubtitleConfig:
    """Konfigurasi subtitle"""
    
    LAYOUTS = [
        {"name": "Two Horizontal", "words_per_line": 2, "direction": "horizontal"},
        {"name": "Single Vertical", "words_per_line": 1, "direction": "vertical"},
        {"name": "Three Horizontal", "words_per_line": 3, "direction": "horizontal"},
        {"name": "Four Horizontal", "words_per_line": 4, "direction": "horizontal"},
        {"name": "Stagger Two", "words_per_line": 2, "direction": "stagger"},
        {"name": "Pyramid", "words_per_line": "pyramid", "direction": "pyramid"},
        {"name": "Five Horizontal", "words_per_line": 5, "direction": "horizontal"},
        {"name": "Stagger Three", "words_per_line": 3, "direction": "stagger"},
        {"name": "Compact", "words_per_line": 6, "direction": "horizontal"},
        {"name": "Minimalist", "words_per_line": 2, "direction": "centered"}
    ]
    
    SIZES = [
        {"name": "Extra Large", "size": 120},
        {"name": "Large", "size": 100},
        {"name": "Large Medium", "size": 85},
        {"name": "Medium Plus", "size": 75},
        {"name": "Medium", "size": 65},
        {"name": "Medium Small", "size": 55},
        {"name": "Small Plus", "size": 48},
        {"name": "Small", "size": 42},
        {"name": "Tiny Plus", "size": 38},
        {"name": "Tiny", "size": 32}
    ]
    
    TEXT_COLOR = (255, 255, 255)
    STROKE_COLOR = (0, 0, 0)
    STROKE_WIDTH = 3


class VoiceOverGenerator:
    """Voice Over Generator"""
    
    VOICES = {
        'id': {
            'male': 'id-ID-ArdiNeural',
            'female': 'id-ID-GadisNeural'
        },
        'en': {
            'male': 'en-US-GuyNeural',
            'female': 'en-US-JennyNeural'
        }
    }
    
    def __init__(self, language='id', gender='male'):
        self.language = language
        self.gender = gender
        self.voice = self.VOICES[language][gender]
        voice_label = "Cowok" if gender == 'male' else "Cewek"
        logger.info(f"Voice: {self.voice} ({voice_label})")
    
    async def generate_tts(self, text: str, output_path: str) -> str:
        logger.info(f"Generating TTS...")
        try:
            communicate = edge_tts.Communicate(text, self.voice)
            await communicate.save(output_path)
            logger.info(f"TTS saved: {output_path}")
            return output_path
        except Exception as e:
            logger.error(f"TTS failed: {e}")
            raise
    
    def enhance_audio(self, input_path: str, output_path: str) -> str:
        logger.info("Enhancing audio...")
        try:
            audio = AudioSegment.from_file(input_path)
            audio = normalize(audio)
            audio = compress_dynamic_range(audio, threshold=-20.0, ratio=4.0)
            
            # Subtle reverb (50% reduced)
            reverb = audio - 14
            silence = AudioSegment.silent(duration=100)
            echo = silence + reverb
            audio_with_reverb = audio.overlay(echo[:len(audio)])
            audio_with_reverb = normalize(audio_with_reverb)
            
            audio_with_reverb.export(output_path, format="mp3", bitrate="192k")
            logger.info(f"Audio enhanced: {output_path}")
            return output_path
        except Exception as e:
            logger.error(f"Audio enhancement failed: {e}")
            raise
    
    async def generate_word_timings(self, text: str, audio_path: str) -> List[Dict]:
        logger.info("Analyzing word timings...")
        words = text.split()
        audio = AudioSegment.from_file(audio_path)
        duration = len(audio) / 1000.0
        
        words_timing = []
        time_per_word = duration / len(words)
        
        for i, word in enumerate(words):
            words_timing.append({
                'word': word.upper(),  # UPPERCASE
                'start': i * time_per_word,
                'end': (i + 1) * time_per_word,
                'index': i
            })
        
        logger.info(f"Timings generated: {len(words)} words")
        return words_timing


class TextImageGenerator:
    """Generate text as transparent PNG images"""
    
    _font_cache = {}
    
    @classmethod
    def get_font(cls, size: int):
        """Get Arial Bold font with caching"""
        if size in cls._font_cache:
            return cls._font_cache[size]
        
        font_paths = [
            'C:\\Windows\\Fonts\\ARIALBD.TTF',
            'C:\\Windows\\Fonts\\arialbd.ttf',
            'C:\\Windows\\Fonts\\Arial Bold.ttf',
            '/System/Library/Fonts/Helvetica.ttc',
            '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf',
            'arial.ttf'
        ]
        
        for font_path in font_paths:
            if os.path.exists(font_path):
                try:
                    font = ImageFont.truetype(font_path, size)
                    cls._font_cache[size] = font
                    return font
                except:
                    continue
        
        font = ImageFont.load_default()
        cls._font_cache[size] = font
        return font
    
    @staticmethod
    def create_text_image(text: str, fontsize: int, text_color: tuple, 
                         stroke_color: tuple, stroke_width: int) -> Image.Image:
        """Create text as transparent PNG"""
        
        font = TextImageGenerator.get_font(fontsize)
        
        # Measure text
        temp_img = Image.new('RGBA', (1, 1), (0, 0, 0, 0))
        temp_draw = ImageDraw.Draw(temp_img)
        
        try:
            bbox = temp_draw.textbbox((0, 0), text, font=font, stroke_width=stroke_width)
            text_width = bbox[2] - bbox[0]
            text_height = bbox[3] - bbox[1]
        except:
            text_width, text_height = temp_draw.textsize(text, font=font)
            text_width += stroke_width * 2
            text_height += stroke_width * 2
        
        # Create image with padding
        padding = stroke_width * 2 + 10
        img_width = text_width + padding * 2
        img_height = text_height + padding * 2
        
        # Transparent background
        img = Image.new('RGBA', (img_width, img_height), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        
        # Draw text with stroke
        draw.text(
            (padding, padding), 
            text, 
            font=font, 
            fill=text_color + (255,),
            stroke_width=stroke_width,
            stroke_fill=stroke_color + (255,)
        )
        
        return img


class VideoSubtitleCreator:
    """Create video with cumulative subtitles"""
    
    def __init__(self, video_path: str):
        self.video_path = video_path
        self.video = VideoFileClip(video_path)
        self.width = self.video.w
        self.height = self.video.h
        self.text_area_width = int(self.height)
        
        logger.info(f"Video: {video_path}")
        logger.info(f"Size: {self.width}x{self.height}")
        logger.info(f"Duration: {self.video.duration:.2f}s")
    
    def get_random_style(self) -> Tuple[Dict, Dict]:
        layout = random.choice(SubtitleConfig.LAYOUTS)
        size = random.choice(SubtitleConfig.SIZES)
        logger.info(f"Style: {layout['name']}, {size['name']} ({size['size']}px)")
        return layout, size
    
    def calculate_positions(self, words: List[str], layout: Dict, size: Dict) -> List[Tuple[str, int, int]]:
        """Calculate word positions"""
        positions = []
        fontsize = size['size']
        words_per_line = layout['words_per_line']
        direction = layout['direction']
        
        start_x = 50
        start_y = self.height // 3
        line_height = fontsize + 20
        word_spacing = fontsize // 2
        
        current_x = start_x
        current_y = start_y
        line_word_count = 0
        
        if direction == "horizontal":
            for word in words:
                positions.append((word, current_x, current_y))
                line_word_count += 1
                if line_word_count >= words_per_line:
                    current_y += line_height
                    current_x = start_x
                    line_word_count = 0
                else:
                    current_x += len(word) * (fontsize // 2) + word_spacing
        
        elif direction == "vertical":
            for word in words:
                positions.append((word, start_x, current_y))
                current_y += line_height
        
        elif direction == "stagger":
            offset = 0
            for word in words:
                positions.append((word, current_x + offset, current_y))
                line_word_count += 1
                if line_word_count >= words_per_line:
                    current_y += line_height
                    current_x = start_x
                    line_word_count = 0
                    offset = 0 if offset == 50 else 50
                else:
                    current_x += len(word) * (fontsize // 2) + word_spacing
        
        elif direction == "pyramid":
            pyramid_pattern = [1, 2, 3, 4, 3, 2, 1]
            pattern_idx = 0
            for word in words:
                words_in_line = pyramid_pattern[pattern_idx % len(pyramid_pattern)]
                indent = (4 - words_in_line) * (fontsize // 3)
                positions.append((word, start_x + indent + (line_word_count * word_spacing * 2), current_y))
                line_word_count += 1
                if line_word_count >= words_in_line:
                    current_y += line_height
                    line_word_count = 0
                    pattern_idx += 1
        
        elif direction == "centered":
            for word in words:
                center_x = (self.text_area_width - len(word) * (fontsize // 3)) // 2
                positions.append((word, center_x, current_y))
                line_word_count += 1
                if line_word_count >= words_per_line:
                    current_y += line_height
                    line_word_count = 0
        
        return positions
    
    def create_subtitle_clips(self, words_data: List[Dict], layout: Dict, size: Dict) -> List[ImageClip]:
        """Create cumulative subtitle clips - FIXED APPROACH"""
        logger.info("Creating cumulative subtitle clips...")
        
        words = [w['word'] for w in words_data]
        positions = self.calculate_positions(words, layout, size)
        fontsize = size['size']
        
        # Pre-render word images
        logger.info(f"Rendering {len(words)} word images (UPPERCASE)...")
        word_images = []
        for i, (word, x, y) in enumerate(positions):
            try:
                img = TextImageGenerator.create_text_image(
                    word, fontsize,
                    SubtitleConfig.TEXT_COLOR,
                    SubtitleConfig.STROKE_COLOR,
                    SubtitleConfig.STROKE_WIDTH
                )
                word_images.append((img, x, y, word))
            except Exception as e:
                logger.warning(f"Failed to render: {word}")
                continue
        
        logger.info(f"Rendered {len(word_images)} images successfully")
        
        # Create cumulative composite images for each word appearance
        all_clips = []
        
        for i in range(len(words_data)):
            # Create composite image showing words 0 to i
            composite = Image.new('RGBA', (self.width, self.height), (0, 0, 0, 0))
            
            for j in range(i + 1):
                if j < len(word_images):
                    img, x, y, word = word_images[j]
                    composite.paste(img, (x, y), img)
            
            # Convert to numpy array
            img_array = np.array(composite)
            
            # Create ImageClip
            start_time = words_data[i]['start']
            if i < len(words_data) - 1:
                end_time = words_data[i + 1]['start']
                duration = end_time - start_time
            else:
                end_time = words_data[i]['end']
                duration = end_time - start_time
            
            clip = ImageClip(img_array, duration=duration)
            clip = clip.set_start(start_time)
            clip = clip.set_position((0, 0))
            
            all_clips.append(clip)
        
        logger.info(f"Created {len(all_clips)} cumulative clips")
        return all_clips
    
    def create_video(self, words_data: List[Dict], audio_path: str, output_path: str):
        """Create final video with subtitles"""
        logger.info("Creating final video...")
        
        try:
            layout, size = self.get_random_style()
            
            # Create subtitle clips
            subtitle_clips = self.create_subtitle_clips(words_data, layout, size)
            
            # Load audio
            audio_clip = AudioFileClip(audio_path)
            
            # Set video audio
            video_with_audio = self.video.set_audio(audio_clip)
            
            # Composite video with subtitles
            logger.info("Compositing video with subtitles...")
            final_video = CompositeVideoClip([video_with_audio] + subtitle_clips)
            final_video = final_video.set_duration(audio_clip.duration)
            
            # Write video
            logger.info(f"Writing video: {output_path}")
            final_video.write_videofile(
                output_path,
                codec='libx264',
                audio_codec='aac',
                fps=24,
                preset='ultrafast',
                threads=4,
                bitrate='3000k'
            )
            
            # Cleanup
            for clip in subtitle_clips:
                clip.close()
            final_video.close()
            audio_clip.close()
            
            logger.info(f"SUCCESS: {output_path}")
            
        except Exception as e:
            logger.error(f"Video creation failed: {e}")
            raise


class AutoSubtitlePipeline:
    """Main pipeline"""
    
    def __init__(self, video_path: str, caption_text: str, voice_gender: str = 'male', output_dir: str = "output"):
        self.video_path = video_path
        self.caption_text = caption_text
        self.voice_gender = voice_gender
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        self.temp_dir = self.output_dir / "temp"
        self.temp_dir.mkdir(exist_ok=True)
        
        logger.info("="*80)
        logger.info("AUTO SUBTITLE PIPELINE v3.0 (FIXED)")
        logger.info("="*80)
    
    async def run(self):
        try:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            
            logger.info("\nSTEP 1: GENERATING TTS")
            tts_path = self.temp_dir / f"tts_raw_{timestamp}.mp3"
            voice_gen = VoiceOverGenerator(language='id', gender=self.voice_gender)
            await voice_gen.generate_tts(self.caption_text, str(tts_path))
            
            logger.info("\nSTEP 2: ENHANCING AUDIO")
            enhanced_path = self.temp_dir / f"tts_enhanced_{timestamp}.mp3"
            voice_gen.enhance_audio(str(tts_path), str(enhanced_path))
            
            logger.info("\nSTEP 3: ANALYZING TIMINGS")
            words_data = await voice_gen.generate_word_timings(
                self.caption_text, str(enhanced_path)
            )
            
            timings_json = self.output_dir / f"timings_{timestamp}.json"
            with open(timings_json, 'w', encoding='utf-8') as f:
                json.dump(words_data, f, indent=2, ensure_ascii=False)
            
            logger.info("\nSTEP 4: CREATING VIDEO")
            video_creator = VideoSubtitleCreator(self.video_path)
            
            output_video = self.output_dir / f"output_video_{timestamp}.mp4"
            video_creator.create_video(words_data, str(enhanced_path), str(output_video))
            
            logger.info("\n" + "="*80)
            logger.info("SUCCESS!")
            logger.info("="*80)
            logger.info(f"Output: {output_video}")
            
            return str(output_video)
            
        except Exception as e:
            logger.error(f"\nFailed: {e}")
            raise


def select_video_file() -> str:
    root = Tk()
    root.withdraw()
    file_path = filedialog.askopenfilename(
        title="Pilih Video File",
        filetypes=[("Video files", "*.mp4 *.avi *.mov *.mkv"), ("All files", "*.*")]
    )
    root.destroy()
    return file_path


def main():
    print("="*80)
    print("AUTO SUBTITLE & VOICE OVER v3.0 (COMPLETELY FIXED)")
    print("="*80)
    print()
    
    print("Pilih video...")
    video_path = select_video_file()
    if not video_path:
        print("Cancelled.")
        return
    
    print(f"Video: {video_path}")
    print("\nMasukkan caption (Enter 2x untuk selesai):")
    
    lines = []
    while True:
        line = input()
        if line:
            lines.append(line)
        else:
            if lines:
                break
    
    caption_text = " ".join(lines)
    if not caption_text:
        print("Caption kosong.")
        return
    
    print(f"\nCaption: {caption_text[:100]}...")
    
    # Voice selection
    print("\nPilih suara AI:")
    print("1. Cowok (Ardi - Male)")
    print("2. Cewek (Gadis - Female)")
    voice_choice = input("Pilihan (1/2): ").strip()
    
    if voice_choice == '2':
        voice_gender = 'female'
        print("Suara: Cewek (Gadis)")
    else:
        voice_gender = 'male'
        print("Suara: Cowok (Ardi)")
    
    confirm = input("\nMulai? (y/n): ")
    if confirm.lower() != 'y':
        print("Cancelled.")
        return
    
    print("\nProcessing...\n")
    
    pipeline = AutoSubtitlePipeline(video_path, caption_text, voice_gender=voice_gender)
    
    try:
        output_video = asyncio.run(pipeline.run())
        print("\n" + "="*80)
        print("SUCCESS!")
        print("="*80)
        print(f"Output: {output_video}\n")
    except Exception as e:
        print(f"\nERROR: {e}\n")
        logger.exception("Full trace:")


if __name__ == "__main__":
    main()
