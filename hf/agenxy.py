import os
import io
import time
import json
import base64
import contextlib
import logging
import requests
import feedparser
import textwrap
import urllib.request
import urllib.parse
import threading
import concurrent.futures
import zipfile
import re
import uuid
import socket
import hashlib
import random
import gradio as gr
from PIL import Image, ImageDraw, ImageFont, ImageOps

# Base output directory (HF Spaces aman pakai /tmp)
OUTPUT_DIR = os.getenv("OUTPUT_DIR", "outputs").strip() or "outputs"

# Configure robust logging for production
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)
logging.getLogger("httpx").setLevel(logging.WARNING)

# ==========================================
# CONFIGURATION LAYER
# ==========================================
RSS_FEEDS = {
    "🔥 Aggregated (60+ Feeds)": "AGGREGATED",
    "TechCrunch": "https://techcrunch.com/feed/",
    "BBC News": "http://feeds.bbci.co.uk/news/rss.xml",
    "Google News (Tech)": "https://news.google.com/rss/search?q=technology",
    "Wired": "https://www.wired.com/feed/rss"
}

# The massive list of sources (Expanded to 60+ sources to guarantee 200+ news easily)
MASSIVE_RSS_SOURCES = [
    # ANTARA (Updated to more reliable links)
    "https://www.antaranews.com/rss/terkini.xml",
    "https://www.antaranews.com/rss/ekonomi.xml",
    "https://www.antaranews.com/rss/tekno.xml",
    "https://www.antaranews.com/rss/olahraga.xml",
    "https://www.antaranews.com/rss/hiburan.xml",
    "https://www.antaranews.com/rss/metro.xml",
    "https://www.antaranews.com/rss/warta-bumi.xml",
    
    # CNN INDONESIA
    "https://www.cnnindonesia.com/nasional/rss",
    "https://www.cnnindonesia.com/ekonomi/rss",
    "https://www.cnnindonesia.com/teknologi/rss",
    "https://www.cnnindonesia.com/olahraga/rss",
    "https://www.cnnindonesia.com/hiburan/rss",
    "https://www.cnnindonesia.com/gaya-hidup/rss",
    "https://www.cnnindonesia.com/otomotif/rss",
    
    # CNBC INDONESIA
    "https://www.cnbcindonesia.com/news/rss",
    "https://www.cnbcindonesia.com/tech/rss",
    "https://www.cnbcindonesia.com/market/rss",
    "https://www.cnbcindonesia.com/syariah/rss",
    "https://www.cnbcindonesia.com/entrepreneur/rss",
    "https://www.cnbcindonesia.com/lifestyle/rss",
    
    # TEMPO
    "https://rss.tempo.co/nasional",
    "https://rss.tempo.co/tekno",
    "https://rss.tempo.co/bisnis",
    "https://rss.tempo.co/dunia",
    "https://rss.tempo.co/bola",
    "https://rss.tempo.co/otomotif",
    
    # REPUBLIKA
    "https://www.republika.co.id/rss/news",
    "https://www.republika.co.id/rss/nasional",
    "https://www.republika.co.id/rss/internasional",
    "https://www.republika.co.id/rss/ekonomi",
    "https://www.republika.co.id/rss/bola",
    "https://www.republika.co.id/rss/dunia-islam",
    
    # SINDONEWS
    "https://tekno.sindonews.com/rss",
    "https://nasional.sindonews.com/rss",
    "https://ekbis.sindonews.com/rss",
    "https://metro.sindonews.com/rss",
    "https://sports.sindonews.com/rss",
    "https://international.sindonews.com/rss",
    
    # OTHER DIRECT RSS
    "https://sindikasi.okezone.com/index.php/rss/1/RSS2.0",
    "https://techcrunch.com/feed/",
    "https://www.theverge.com/rss/index.xml",
    "https://www.wired.com/feed/rss",
    "https://www.engadget.com/rss.xml",
    "http://feeds.bbci.co.uk/news/rss.xml",
    "https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml",
    
    # GOOGLE NEWS FALLBACKS FOR MASSIVE UNIQUE HITS
    "https://news.google.com/rss/search?q=teknologi&hl=id&gl=ID&ceid=ID:id",
    "https://news.google.com/rss/search?q=bisnis&hl=id&gl=ID&ceid=ID:id",
    "https://news.google.com/rss/search?q=startup+indonesia&hl=id&gl=ID&ceid=ID:id",
    "https://news.google.com/rss/search?q=kecerdasan+buatan&hl=id&gl=ID&ceid=ID:id",
    "https://news.google.com/rss/search?q=inovasi+digital&hl=id&gl=ID&ceid=ID:id"
]
# Added 60+ highly active feeds for aggregation, sufficient to get 200+ unique news per day.

DEFAULT_IMAGE_MODELS = "black-forest-labs/FLUX.1-schnell,runwayml/stable-diffusion-v1-5,stabilityai/stable-diffusion-2-1,CompVis/stable-diffusion-v1-4"
IMAGE_MODEL_IDS = [
    model.strip()
    for model in os.getenv("HF_IMAGE_MODELS", DEFAULT_IMAGE_MODELS).split(",")
    if model.strip()
]
HF_API_BASE = "https://api-inference.huggingface.co/models/"
HF_IMAGE_API_BASES = [
    os.getenv("HF_IMAGE_API_BASE", "https://router.huggingface.co/hf-inference/models/").strip(),
    HF_API_BASE,
]
DEFAULT_IMAGE_PROVIDER = os.getenv("IMAGE_PROVIDER", "pollinations").strip().lower() or "pollinations"
DEFAULT_HF_SPACE_IDS_RAW = (
    os.getenv("HF_SPACE_IDS")
    or os.getenv("HF_SPACE_ID")
    or "mrfakename/Z-Image-Turbo,black-forest-labs/FLUX.2-klein-9B"
).strip()
ENABLE_HF_INFERENCE_FALLBACK = os.getenv("ENABLE_HF_INFERENCE_FALLBACK", "").strip().lower() in {"1", "true", "yes", "on"}
MAX_NEWS_ITEMS = 200
OUTPUT_WIDTH = 1080
OUTPUT_HEIGHT = 1350
OUTPUT_SIZE = (OUTPUT_WIDTH, OUTPUT_HEIGHT)
IMAGE_CLEAR_RATIO = 0.60
PANEL_SOLID_RATIO = 0.70
PANEL_COLOR = (30, 32, 36)
REQUEST_HEADERS = {"User-Agent": "Agenxy/1.0 (+https://huggingface.co/spaces/xolvon/Agenxy)"}
UNAVAILABLE_IMAGE_MODELS = set()
BILLING_UNAVAILABLE = False
POLLINATIONS_SEMAPHORE = threading.Semaphore(1)
HF_SPACE_SEMAPHORE = threading.Semaphore(1)
HF_SPACE_CLIENT_LOCK = threading.Lock()
HF_SPACE_CLIENTS = {}

theme = gr.themes.Monochrome(
    primary_hue="blue",
    secondary_hue="slate",
    neutral_hue="slate",
    font=[gr.themes.GoogleFont("Montserrat"), "ui-sans-serif", "system-ui", "sans-serif"],
).set(
    body_background_fill="#0A192F",
    body_background_fill_dark="#0A192F",
    body_text_color="#E6F1FF",
    body_text_color_dark="#E6F1FF",
    background_fill_primary="#112240",
    background_fill_primary_dark="#112240",
    background_fill_secondary="#0A192F",
    background_fill_secondary_dark="#0A192F",
    border_color_primary="#233554",
    border_color_primary_dark="#233554",
    button_primary_background_fill="#D4AF37",
    button_primary_background_fill_dark="#D4AF37",
    button_primary_text_color="#000000",
    button_primary_text_color_dark="#000000",
)

def clean_html(raw_html):
    cleanr = re.compile('<.*?>')
    return re.sub(cleanr, '', raw_html).strip()

def get_hf_token(user_token=None):
    return (user_token or os.environ.get("HF_TOKEN") or "").strip()

def clamp_max_items(max_items, default=20):
    try:
        value = int(max_items)
    except (TypeError, ValueError):
        value = default
    return max(1, min(value, MAX_NEWS_ITEMS))

def clamp_int(value, default, minimum, maximum):
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        parsed = default
    return max(minimum, min(parsed, maximum))

def is_enabled_env(name, default=False):
    raw_value = os.getenv(name)
    if raw_value is None:
        return default
    return raw_value.strip().lower() in {"1", "true", "yes", "on"}

def safe_error_text(error_text, max_length=180):
    if not error_text:
        return "unknown error"
    return re.sub(r"\s+", " ", str(error_text)).strip()[:max_length]

def is_billing_error(error_text):
    text = (error_text or "").lower()
    return "402" in text or "depleted your monthly included credits" in text or "payment required" in text

def is_deprecated_model_error(error_text):
    text = (error_text or "").lower()
    return "410" in text or "deprecated" in text or "no longer supported" in text

BULK_WORKERS = clamp_int(os.getenv("BULK_WORKERS"), default=2, minimum=1, maximum=4)

# ==========================================
# DATA INGESTION MODULE
# ==========================================
def fetch_aggregated_news(max_items=MAX_NEWS_ITEMS):
    max_items = clamp_max_items(max_items, default=MAX_NEWS_ITEMS)
    all_entries = []
    
    def fetch_feed(url):
        try:
            res = requests.get(url, headers=REQUEST_HEADERS, timeout=10)
            res.raise_for_status()
            feed = feedparser.parse(res.content)
            return feed.entries
        except requests.exceptions.RequestException as e:
            logger.warning("Feed request failed for %s: %s", url, e)
            return []
            
    # Fetch from massive list concurrently
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        futures = [executor.submit(fetch_feed, url) for url in MASSIVE_RSS_SOURCES]
        for future in concurrent.futures.as_completed(futures):
            try:
                entries = future.result()
            except Exception as e:
                logger.warning("Feed worker failed: %s", e)
                continue
            for entry in entries:
                title = entry.get('title', '').strip()
                summary = clean_html(entry.get('summary', ''))
                if title and len(title) > 10:
                    all_entries.append({"title": title, "summary": summary})
                    
    # Deduplicate by title
    seen = set()
    unique_entries = []
    for e in all_entries:
        if e['title'] not in seen:
            seen.add(e['title'])
            unique_entries.append(e)
            
    return unique_entries[:max_items]

def fetch_trending_news(feed_name, max_items=MAX_NEWS_ITEMS):
    max_items = clamp_max_items(max_items, default=MAX_NEWS_ITEMS)
    logger.info(f"Fetching news from {feed_name}")
    
    if feed_name == "🔥 Aggregated (60+ Feeds)":
        entries = fetch_aggregated_news(max_items=max_items)
        if not entries:
            return gr.update(choices=["No entries found."]), []
        titles = [e['title'] for e in entries]
        return gr.update(choices=titles, value=titles[0] if titles else None), entries
    
    if feed_name not in RSS_FEEDS:
        return gr.update(choices=["Error: Invalid feed selected."]), []
        
    url = RSS_FEEDS[feed_name]
    try:
        response = requests.get(url, headers=REQUEST_HEADERS, timeout=15)
        response.raise_for_status()
        feed = feedparser.parse(response.content)
        
        if not feed.entries:
            return gr.update(choices=["No entries found in the feed."]), []
            
        entries = []
        titles = []
        for entry in feed.entries[:max_items]:
            title = entry.get('title', 'Untitled').strip()
            summary = clean_html(entry.get('summary', ''))
            entries.append({"title": title, "summary": summary})
            titles.append(title)
            
        return gr.update(choices=titles, value=titles[0] if titles else None), entries
    except Exception as e:
        logger.error("Error fetching feed %s: %s", feed_name, e)
        return gr.update(choices=["Error: Unable to fetch this feed right now."]), []

# ==========================================
# PROMPT & TEXT ENGINEERING ENGINE
# ==========================================
def translate_to_indonesian(text, hf_token):
    if not text: return ""
    token = get_hf_token(hf_token)
    if not token:
        return text
    url = "https://router.huggingface.co/hf-inference/models/HuggingFaceH4/zephyr-7b-beta"
    headers = {"Authorization": f"Bearer {token}"}
    prompt = f"<|system|>\nYou are a professional translator.<|end|>\n<|user|>\nTerjemahkan teks berikut ke bahasa Indonesia yang ringkas dan rapi. HANYA berikan hasil terjemahannya saja, tanpa tanda kutip atau penjelasan.\n\nTeks: {text}<|end|>\n<|assistant|>\n"
    
    payload = {
        "inputs": prompt,
        "parameters": {"max_new_tokens": 150, "temperature": 0.3, "return_full_text": False}
    }
    try:
        res = requests.post(url, headers=headers, json=payload, timeout=12)
        if res.status_code == 200:
            data = res.json()
            if isinstance(data, list) and data and "generated_text" in data[0]:
                return data[0]['generated_text'].strip(" '\"\n")
            logger.warning("Unexpected translation response shape: %s", str(data)[:200])
    except (requests.exceptions.RequestException, ValueError, KeyError, IndexError, TypeError) as e:
        logger.warning("Translation request failed: %s", e)
    return text

STOPWORDS = frozenset(
    {
        "yang", "dan", "di", "ke", "dari", "untuk", "pada", "dengan", "atau", "karena", "agar", "sebagai",
        "ini", "itu", "dalam", "akan", "telah", "sudah", "bisa", "jadi", "jadi", "lebih", "baru", "oleh",
        "the", "a", "an", "to", "of", "in", "on", "for", "with", "and", "or", "as", "at", "from", "by",
        "is", "are", "was", "were", "be", "been", "being", "this", "that", "these", "those", "it",
        "you", "we", "they", "he", "she", "their", "our", "your",
    }
)

def extract_keywords(text, max_keywords=7):
    if not text:
        return []
    tokens = re.findall(r"[A-Za-z0-9]+", text.lower())
    cleaned = []
    seen = set()
    for token in tokens:
        if len(token) < 4:
            continue
        if token in STOPWORDS:
            continue
        if token in seen:
            continue
        seen.add(token)
        cleaned.append(token)
        if len(cleaned) >= max_keywords:
            break
    return cleaned

def parse_space_ids(space_ids_raw):
    raw = (space_ids_raw or "").strip()
    if not raw:
        return []
    parts = re.split(r"[,\\n\\r\\t ]+", raw)
    cleaned = []
    seen = set()
    for part in parts:
        value = (part or "").strip()
        if not value:
            continue
        if value in seen:
            continue
        seen.add(value)
        cleaned.append(value)
    return cleaned

def engineer_prompt(headline):
    if not headline or headline.startswith("Error"):
        return ""
    base_style = (
        "Ultra realistic 4k editorial photojournalism, premium news cover photography, "
        "cinematic lighting, sharp focus, photorealistic people and environments, "
        "high detail, dramatic depth, professional newsroom style, "
        "no text, no logo, no watermark, no typography, "
        "not illustration, not abstract, not vector art, not cartoon, not 3d render, not CGI, "
        "clean background space for headline overlay."
    )
    clean_headline = headline.replace('"', '').replace("'", "")
    keywords = extract_keywords(clean_headline, max_keywords=6)
    keyword_hint = ", ".join(keywords) if keywords else "real-world scene"
    return f"{base_style} Visual concept for this headline: {clean_headline}. Key visual elements: {keyword_hint}."

def generate_fallback_quotes(title):
    base_quotes = [
        "Inovasi dimulai dari langkah kecil yang berani.",
        "Setiap tantangan adalah peluang untuk tumbuh.",
        "Masa depan dibentuk oleh apa yang kita pelajari hari ini.",
        "Keberanian mencoba adalah kunci dari penemuan baru.",
        "Kerja konsisten mengalahkan motivasi sesaat.",
        "Fokus pada proses, hasil akan mengikuti.",
        "Belajar cepat adalah superpower di era digital.",
        "Satu keputusan berani bisa mengubah arah hidup.",
        "Disiplin adalah bentuk cinta pada tujuan.",
        "Jangan takut gagal, takutlah berhenti mencoba.",
        "Peluang sering datang menyamar sebagai masalah.",
        "Hari ini latihan, besok pembuktian.",
    ]
    topic = (title or "").strip()
    keywords = extract_keywords(topic, max_keywords=3)
    keyword = (keywords[0] if keywords else "hari ini").title()
    seed = int(hashlib.sha256(topic.encode("utf-8", errors="ignore")).hexdigest()[:12], 16)
    rng = random.Random(seed)
    templates = [
        "Kemajuan {keyword} lahir dari keberanian mengambil langkah pertama.",
        "Di balik berita {keyword}, selalu ada pelajaran untuk jadi lebih kuat.",
        "Tetap tajam, tetap tenang—{keyword} butuh pikiran yang jernih.",
        "Saat {keyword} berubah cepat, yang menang adalah yang mau belajar.",
        "Gunakan momentum {keyword} untuk membangun kebiasaan yang lebih baik.",
        "Jadikan {keyword} sebagai bahan bakar, bukan alasan untuk berhenti.",
        "Kualitas keputusan hari ini menentukan masa depan {keyword}.",
        "Buktikan dengan aksi—bukan sekadar rencana tentang {keyword}.",
        "Ambil kendali: {keyword} bukan hambatan, itu peta menuju peluang.",
        "Terus melaju, karena {keyword} menghargai konsistensi.",
    ]
    pool = base_quotes + [t.format(keyword=keyword) for t in templates]
    rng.shuffle(pool)
    selected = []
    for q in pool:
        q = q.strip()
        if len(q) < 12:
            continue
        if q in selected:
            continue
        selected.append(q)
        if len(selected) >= 4:
            break
    while len(selected) < 4:
        selected.append(base_quotes[len(selected) % len(base_quotes)])
    return selected[:4]

def generate_quotes(title, hf_token):
    default_quotes = generate_fallback_quotes(title)
    token = get_hf_token(hf_token)
    if not token:
        return default_quotes

    url = "https://router.huggingface.co/hf-inference/models/HuggingFaceH4/zephyr-7b-beta"
    headers = {"Authorization": f"Bearer {token}"}
    prompt = f"<|system|>\nYou are a highly creative copywriter.<|end|>\n<|user|>\nWrite 4 short, highly motivational one-liner quotes in Indonesian inspired by this news topic: '{title}'. Return ONLY the 4 quotes, each on a new line. Do not use numbers or bullet points.<|end|>\n<|assistant|>\n"
    
    payload = {
        "inputs": prompt,
        "parameters": {"max_new_tokens": 150, "temperature": 0.7, "return_full_text": False}
    }
    
    try:
        res = requests.post(url, headers=headers, json=payload, timeout=20)
        if res.status_code == 200:
            data = res.json()
            if not isinstance(data, list) or not data or "generated_text" not in data[0]:
                logger.warning("Unexpected quote response shape: %s", str(data)[:200])
                return default_quotes
            text = data[0]['generated_text'].strip()
            lines = [line.strip("- *\"\'1234567890. ") for line in text.split("\n") if len(line.strip()) > 10]
            if len(lines) >= 4:
                return lines[:4]
            while len(lines) < 4:
                lines.append(default_quotes[len(lines)])
            return lines[:4]
    except (requests.exceptions.RequestException, ValueError, KeyError, IndexError, TypeError) as e:
        logger.warning("Quote generation request failed: %s", e)
    return default_quotes

# ==========================================
# IMAGE PROCESSING & METADATA SCRUBBING
# ==========================================
def scrub_metadata_and_save(image, output_filename):
    try:
        rgb_image = ImageOps.fit(
            image.convert("RGB"),
            (OUTPUT_WIDTH, OUTPUT_WIDTH),
            method=Image.Resampling.LANCZOS,
            centering=(0.5, 0.5),
        )
        clean_image = Image.new("RGB", rgb_image.size)
        clean_image.paste(rgb_image)
        os.makedirs(os.path.dirname(output_filename), exist_ok=True)
        clean_image.save(output_filename, format="JPEG", quality=95, exif=b"")
        return output_filename
    except Exception as e:
        logger.error(f"Error scrubbing metadata: {e}")
        return None

def get_montserrat_font(size, bold=True):
    font_name = "Montserrat-Bold.ttf" if bold else "Montserrat-Medium.ttf"
    font_path = os.path.join("fonts", font_name)
    font_url = f"https://raw.githubusercontent.com/JulietaUla/Montserrat/master/fonts/ttf/{font_name}"
    
    os.makedirs("fonts", exist_ok=True)
    if not os.path.exists(font_path):
        try:
            with urllib.request.urlopen(font_url, timeout=10) as response:
                with open(font_path, "wb") as font_file:
                    font_file.write(response.read())
        except Exception as e:
            logger.error(f"Failed to download font: {e}")
            return ImageFont.load_default()
    try:
        return ImageFont.truetype(font_path, size)
    except Exception as e:
        logger.error(f"Failed to load font: {e}")
        return ImageFont.load_default()

def wrap_text_to_width(draw, text, font, max_width):
    words = text.split()
    if not words:
        return []
    lines = []
    current = words[0]
    for word in words[1:]:
        candidate = f"{current} {word}"
        bbox = draw.textbbox((0, 0), candidate, font=font)
        if bbox[2] - bbox[0] <= max_width:
            current = candidate
        else:
            lines.append(current)
            current = word
    lines.append(current)
    return lines

def overlay_text_on_image(image_path, headline, subheadline, slide_index=1, total_slides=5):
    try:
        source_img = Image.open(image_path).convert("RGB")
        width, height = OUTPUT_SIZE
        clear_image_height = int(height * IMAGE_CLEAR_RATIO)
        solid_panel_start = int(height * PANEL_SOLID_RATIO)

        img = Image.new("RGBA", OUTPUT_SIZE, PANEL_COLOR + (255,))
        top_image = ImageOps.fit(
            source_img,
            (width, solid_panel_start),
            method=Image.Resampling.LANCZOS,
            centering=(0.5, 0.5),
        ).convert("RGBA")
        img.paste(top_image, (0, 0))

        fade = Image.new("RGBA", OUTPUT_SIZE, (0, 0, 0, 0))
        draw_fade = ImageDraw.Draw(fade)
        for y in range(clear_image_height, solid_panel_start):
            progress = (y - clear_image_height) / max(1, solid_panel_start - clear_image_height)
            alpha = int(255 * progress)
            draw_fade.line([(0, y), (width, y)], fill=PANEL_COLOR + (alpha,))
        draw_fade.rectangle(
            (0, solid_panel_start, width, height),
            fill=PANEL_COLOR + (255,),
        )
        img = Image.alpha_composite(img, fade)
        
        draw = ImageDraw.Draw(img)
        
        title_text = re.sub(r"\s+", " ", headline or "").strip().upper()
        max_text_width = int(width * 0.88)
        panel_top = clear_image_height
        panel_bottom = height
        panel_padding_top = int(height * 0.105)
        panel_padding_bottom = int(height * 0.055)
        available_height = panel_bottom - panel_top - panel_padding_top - panel_padding_bottom

        title_font_size = int(width * 0.079) if slide_index == 1 else int(width * 0.082)
        sub_font_size = int(width * 0.036)
        min_title_size = int(width * 0.052)
        min_sub_size = int(width * 0.028)
        sub_text = re.sub(r"\s+", " ", subheadline or "").strip()

        while True:
            title_font = get_montserrat_font(title_font_size, bold=True)
            sub_font = get_montserrat_font(sub_font_size, bold=False)
            title_lines = wrap_text_to_width(draw, title_text, title_font, max_text_width)[:5]
            line_gap = int(title_font_size * 0.10)
            sub_gap = int(height * 0.02) if sub_text else 0

            title_metrics = []
            title_height = 0
            for line in title_lines:
                bbox = draw.textbbox((0, 0), line, font=title_font)
                line_w = bbox[2] - bbox[0]
                line_h = bbox[3] - bbox[1]
                title_metrics.append((line, line_w, line_h))
                title_height += line_h + line_gap
            title_height = max(0, title_height - line_gap)

            sub_lines = wrap_text_to_width(draw, sub_text, sub_font, max_text_width)[:2] if sub_text else []
            sub_height = 0
            sub_line_gap = int(sub_font_size * 0.14)
            for line in sub_lines:
                bbox = draw.textbbox((0, 0), line, font=sub_font)
                sub_height += (bbox[3] - bbox[1]) + sub_line_gap
            sub_height = max(0, sub_height - sub_line_gap)
            total_text_height = title_height + sub_gap + sub_height

            if total_text_height <= available_height or title_font_size <= min_title_size:
                break
            title_font_size = max(min_title_size, int(title_font_size * 0.93))
            sub_font_size = max(min_sub_size, int(sub_font_size * 0.95))

        y = panel_top + panel_padding_top + int((available_height - total_text_height) * 0.42)
        highlight_color = (36, 220, 255, 255)
        white = (255, 255, 255, 255)

        for i, (line, line_w, line_h) in enumerate(title_metrics):
            x = (width - line_w) / 2
            fill = highlight_color if i == len(title_metrics) - 1 else white
            draw.text(
                (x, y),
                line,
                font=title_font,
                fill=fill,
            )
            y += line_h + line_gap

        y += sub_gap
        for line in sub_lines:
            bbox = draw.textbbox((0, 0), line, font=sub_font)
            line_w = bbox[2] - bbox[0]
            line_h = bbox[3] - bbox[1]
            draw.text(
                ((width - line_w) / 2, y),
                line,
                font=sub_font,
                fill=(225, 229, 232, 255),
            )
            y += line_h + sub_line_gap
        
        # Replace base extension with format content_X.slide_index.jpg
        base_dir = os.path.dirname(image_path)
        base_name = os.path.basename(image_path).replace(".jpg", "")
        out_path = os.path.join(base_dir, f"{base_name}.{slide_index}.jpg")
        
        img.convert("RGB").save(out_path, format="JPEG", quality=95, exif=b"")
        return out_path
    except Exception as e:
        logger.error(f"Text overlay error: {e}")
        return image_path

# ==========================================
# INFERENCE PIPELINE
# ==========================================
def build_image_payload(prompt, model_id):
    model_key = model_id.lower()
    
    # FLUX needs specific parameters
    if "flux" in model_key:
        return {
            "inputs": prompt,
            "parameters": {
                "width": 1024,
                "height": 1024,
                "num_inference_steps": 4,
                "guidance_scale": 0.0,
            },
            "options": {"wait_for_model": True}
        }
    
    # Generic Stable Diffusion models work best with simple payloads on free tier
    return {
        "inputs": prompt,
        "options": {"wait_for_model": True}
    }

def parse_hf_error(response):
    try:
        data = response.json()
        if isinstance(data, dict):
            return data.get("error") or data.get("message") or str(data)
        return str(data)
    except ValueError:
        return response.text[:500]

def try_decode_base64_image(payload):
    if not payload:
        return None
    candidates = []
    if isinstance(payload, dict):
        for key in ("image", "generated_image", "output", "data"):
            value = payload.get(key)
            if value:
                candidates.append(value)
    elif isinstance(payload, list) and payload:
        candidates.extend(payload)
    for item in candidates:
        if isinstance(item, dict):
            for key in ("image", "generated_image", "data", "b64_json"):
                value = item.get(key)
                if value:
                    candidates.append(value)
        if isinstance(item, str) and len(item) > 64:
            try:
                return io.BytesIO(base64.b64decode(item, validate=False)).getvalue()
            except Exception:
                continue
    return None

def create_fallback_editorial_image(prompt, output_filename):
    seed = int(hashlib.sha256(prompt.encode("utf-8", errors="ignore")).hexdigest()[:12], 16)
    rng = random.Random(seed)
    width, height = OUTPUT_WIDTH, OUTPUT_WIDTH
    palette = [
        ((10, 25, 47), (212, 175, 55), (46, 90, 140)),
        ((18, 24, 38), (225, 86, 78), (64, 145, 108)),
        ((8, 31, 38), (245, 166, 35), (54, 110, 160)),
        ((23, 23, 32), (130, 200, 190), (230, 220, 180)),
    ]
    bg, accent, secondary = palette[seed % len(palette)]
    image = Image.new("RGB", (width, height), bg)
    draw = ImageDraw.Draw(image, "RGBA")

    for y in range(height):
        ratio = y / height
        color = tuple(int(bg[i] * (1 - ratio) + secondary[i] * ratio * 0.65) for i in range(3))
        draw.line([(0, y), (width, y)], fill=color + (255,))

    for _ in range(18):
        x = rng.randint(-200, width)
        y = rng.randint(-200, height)
        size = rng.randint(120, 420)
        alpha = rng.randint(18, 55)
        color = accent if rng.random() > 0.45 else secondary
        draw.ellipse((x, y, x + size, y + size), fill=color + (alpha,))

    for _ in range(10):
        x1 = rng.randint(-100, width)
        y1 = rng.randint(0, height)
        x2 = x1 + rng.randint(200, 650)
        y2 = y1 + rng.randint(-160, 160)
        draw.line((x1, y1, x2, y2), fill=accent + (45,), width=rng.randint(4, 14))

    os.makedirs(os.path.dirname(output_filename), exist_ok=True)
    image.save(output_filename, format="JPEG", quality=94, exif=b"")
    return output_filename

def call_hf_api(api_url, headers, payload, max_retries=4):
    retryable_statuses = {408, 409, 423, 429, 500, 502, 503, 504}
    for attempt in range(max_retries):
        try:
            response = requests.post(api_url, headers=headers, json=payload, timeout=60)
            if response.status_code == 200:
                content_type = response.headers.get('content-type', '')
                if 'image' in content_type:
                    return response.content, None
                try:
                    decoded = try_decode_base64_image(response.json())
                except ValueError:
                    decoded = None
                if decoded:
                    return decoded, None
                return None, f"API returned non-image data: {safe_error_text(parse_hf_error(response))}"

            error_text = parse_hf_error(response)
            if response.status_code in retryable_statuses:
                wait_time = min(8 * (attempt + 1), 30)
                try:
                    err_data = response.json()
                    if isinstance(err_data, dict):
                        wait_time = min(float(err_data.get('estimated_time', wait_time)), 30)
                except ValueError:
                    pass
                logger.warning(
                    "HF API retryable error %s on attempt %s/%s: %s",
                    response.status_code,
                    attempt + 1,
                    max_retries,
                    safe_error_text(error_text),
                )
                time.sleep(wait_time)
                continue

            if response.status_code in {401, 403}:
                return None, "HF token rejected or missing permission for this model/provider."
            return None, f"API Error {response.status_code}: {safe_error_text(error_text)}"
        except requests.exceptions.RequestException as e:
            logger.warning("HF image request failed on attempt %s/%s: %s", attempt + 1, max_retries, e)
            time.sleep(min(5 * (attempt + 1), 20))
    return None, "Max retries exceeded while waiting for image provider."

def call_pollinations(prompt, width=1024, height=1024, max_retries=3):
    seed = int(hashlib.sha256(prompt.encode("utf-8", errors="ignore")).hexdigest()[:8], 16)
    encoded_prompt = urllib.parse.quote(prompt, safe="")
    url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width={width}&height={height}&nologo=true&seed={seed}"
    last_error = None
    POLLINATIONS_SEMAPHORE.acquire()
    try:
        for attempt in range(max_retries):
            try:
                headers = dict(REQUEST_HEADERS)
                headers["Accept"] = "image/*"
                resp = requests.get(url, headers=headers, timeout=180)
                if resp.status_code == 200 and "image" in resp.headers.get("content-type", ""):
                    return resp.content, None
                last_error = f"Pollinations Error {resp.status_code}: {safe_error_text(resp.text)}"
                if resp.status_code in {402, 429, 503}:
                    time.sleep(min(10 * (attempt + 1), 40))
                    continue
            except requests.exceptions.RequestException as e:
                last_error = f"Pollinations request error: {e}"
            time.sleep(min(3 * (attempt + 1), 18))
        return None, safe_error_text(last_error)
    finally:
        POLLINATIONS_SEMAPHORE.release()

def normalize_gradio_image_result_to_bytes(result):
    if result is None:
        return None, "Space returned empty result."

    queue = [result]
    while queue:
        item = queue.pop(0)
        if isinstance(item, Image.Image):
            buf = io.BytesIO()
            item.save(buf, format="PNG")
            return buf.getvalue(), None
        if isinstance(item, (list, tuple)):
            queue = list(item) + queue
            continue
        if isinstance(item, dict):
            for key in ("url", "path", "name", "file"):
                value = item.get(key)
                if value:
                    queue.insert(0, value)
            continue
        if isinstance(item, str):
            if item.startswith("http://") or item.startswith("https://"):
                try:
                    resp = requests.get(item, headers=REQUEST_HEADERS, timeout=90)
                    if resp.status_code == 200 and "image" in resp.headers.get("content-type", ""):
                        return resp.content, None
                    return None, f"Space image URL returned {resp.status_code}."
                except requests.exceptions.RequestException as e:
                    return None, f"Space image URL request failed: {e}"
            if os.path.isfile(item):
                try:
                    with open(item, "rb") as f:
                        return f.read(), None
                except OSError as e:
                    return None, f"Cannot read image file from Space: {e}"
    return None, f"Unsupported Space output type: {type(result)}"

def call_gradio_space(space_id, prompt, token="", max_retries=2):
    if not space_id:
        return None, "HF Space ID is required for Space provider."
    try:
        from gradio_client import Client
    except Exception as e:
        return None, f"gradio_client is not available: {e}"

    client_kwargs = {}
    if token:
        client_kwargs["hf_token"] = token
    last_error = None
    HF_SPACE_SEMAPHORE.acquire()
    try:
        for _ in range(max_retries):
            try:
                cache_key = (space_id, bool(token))
                with HF_SPACE_CLIENT_LOCK:
                    client = HF_SPACE_CLIENTS.get(cache_key)
                    if client is None:
                        with contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
                            client = Client(space_id, **client_kwargs)
                        HF_SPACE_CLIENTS[cache_key] = client
                for api_name in (None, "/predict", "/run", "/infer", "/generate"):
                    try:
                        with contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
                            if api_name is None:
                                result = client.predict(prompt)
                            else:
                                result = client.predict(prompt, api_name=api_name)
                        image_bytes, err = normalize_gradio_image_result_to_bytes(result)
                        if image_bytes:
                            return image_bytes, None
                        last_error = err or "Space did not return an image."
                    except Exception as e:
                        last_error = str(e)
                time.sleep(2)
            except Exception as e:
                last_error = str(e)
                if "Expecting value" in last_error or "JSONDecodeError" in last_error:
                    with HF_SPACE_CLIENT_LOCK:
                        HF_SPACE_CLIENTS.pop((space_id, bool(token)), None)
                time.sleep(2)
        return None, safe_error_text(last_error)
    finally:
        HF_SPACE_SEMAPHORE.release()

def generate_base_image(prompt, token, output_filename, provider="hf-inference", preferred_model=None, space_id=None, max_retries=4):
    global BILLING_UNAVAILABLE
    errors = []
    provider = (provider or "hf-inference").strip().lower()

    if provider == "pollinations":
        providers_to_try = ["pollinations", "hf-space"]
        if ENABLE_HF_INFERENCE_FALLBACK:
            providers_to_try.append("hf-inference")
    elif provider == "hf-space":
        providers_to_try = ["hf-space", "pollinations"]
        if ENABLE_HF_INFERENCE_FALLBACK:
            providers_to_try.append("hf-inference")
    else:
        providers_to_try = ["hf-inference", "hf-space", "pollinations"]

    for active_provider in providers_to_try:
        active_provider = (active_provider or "").strip().lower()
        if active_provider == "pollinations":
            image_bytes, error_msg = call_pollinations(prompt, width=1024, height=1024, max_retries=max_retries)
            if image_bytes:
                try:
                    image = Image.open(io.BytesIO(image_bytes))
                    scrubbed_path = scrub_metadata_and_save(image, output_filename)
                    if scrubbed_path:
                        return scrubbed_path, "pollinations", errors
                except Exception as e:
                    error_msg = f"invalid image bytes from pollinations: {e}"
            errors.append(f"pollinations: {safe_error_text(error_msg)}")
            logger.warning("Image provider failed: %s", errors[-1])
            continue

        if active_provider == "hf-space":
            active_space_raw = (space_id or DEFAULT_HF_SPACE_IDS_RAW or "").strip()
            spaces_to_try = parse_space_ids(active_space_raw)
            if not spaces_to_try:
                errors.append("hf-space: missing Space IDs")
                continue
            for active_space in spaces_to_try:
                image_bytes, error_msg = call_gradio_space(active_space, prompt, token=token, max_retries=max_retries)
                if image_bytes:
                    try:
                        image = Image.open(io.BytesIO(image_bytes))
                        scrubbed_path = scrub_metadata_and_save(image, output_filename)
                        if scrubbed_path:
                            return scrubbed_path, f"hf-space:{active_space}", errors
                    except Exception as e:
                        error_msg = f"invalid image bytes from Space: {e}"
                errors.append(f"hf-space:{active_space}: {safe_error_text(error_msg)}")
                logger.warning("Image provider failed: %s", errors[-1])
            continue

        if active_provider == "hf-inference":
            if not token:
                errors.append("hf-inference: missing HF token")
                continue
            headers = {
                "Authorization": f"Bearer {token}",
                "Accept": "image/png",
                "User-Agent": REQUEST_HEADERS["User-Agent"],
            }

            models_to_try = []
            if preferred_model and preferred_model.strip():
                models_to_try.append(preferred_model.strip())
            for m in IMAGE_MODEL_IDS:
                if m not in models_to_try:
                    models_to_try.append(m)

            for model_id in models_to_try:
                if model_id in UNAVAILABLE_IMAGE_MODELS:
                    errors.append(f"{model_id}: skipped because it failed earlier.")
                    continue

                payload = build_image_payload(prompt, model_id)
                last_error = None
                for base_url in HF_IMAGE_API_BASES:
                    base_url = (base_url or "").strip()
                    if not base_url:
                        continue
                    api_url = f"{base_url}{model_id}"
                    image_bytes, error_msg = call_hf_api(api_url, headers, payload, max_retries=max_retries)
                    if image_bytes:
                        try:
                            image = Image.open(io.BytesIO(image_bytes))
                            scrubbed_path = scrub_metadata_and_save(image, output_filename)
                            if scrubbed_path:
                                return scrubbed_path, model_id, errors
                        except Exception as e:
                            error_msg = f"invalid image bytes from {model_id}: {e}"
                    last_error = error_msg
                errors.append(f"{model_id}: {safe_error_text(last_error)}")
                logger.warning("Image model failed: %s", errors[-1])
                if is_billing_error(last_error) or is_deprecated_model_error(last_error):
                    if is_billing_error(last_error):
                        BILLING_UNAVAILABLE = True
                    UNAVAILABLE_IMAGE_MODELS.add(model_id)
            continue

    fallback_path = create_fallback_editorial_image(prompt, output_filename)
    errors.append("Generated local fallback base image after all image providers failed.")
    return fallback_path, "local-fallback", errors

def generate_image_single(prompt, hf_token, headline, provider, space_id, model_choice, entries_state):
    if not prompt:
        return None, "Error: Prompt cannot be empty."
    token = get_hf_token(hf_token)
    if (provider or "").strip().lower() == "hf-inference" and not token:
        return None, "Error: Hugging Face API Token is required untuk provider HF Inference."
        
    summary = ""
    if entries_state:
        for e in entries_state:
            if e['title'] == headline:
                summary = e['summary'][:150] + "..." if len(e['summary']) > 150 else e['summary']
                break

    try:
        date_str = time.strftime("%d%m%y")
        uid = uuid.uuid4().hex[:4]
        folder_path = os.path.join(OUTPUT_DIR, date_str, f"content_{uid}")
        base_img_path = os.path.join(folder_path, f"content_{uid}.jpg")
        scrubbed_path, source, errors = generate_base_image(
            prompt,
            token,
            base_img_path,
            provider=provider,
            preferred_model=model_choice,
            space_id=space_id,
        )

        indo_headline = translate_to_indonesian(headline, token)
        indo_summary = translate_to_indonesian(summary, token) if summary else ""
        quotes = generate_quotes(indo_headline, token)
        
        paths = []
        paths.append(overlay_text_on_image(scrubbed_path, indo_headline, indo_summary, slide_index=1, total_slides=5))
        
        for i, quote in enumerate(quotes[:4]):
            paths.append(overlay_text_on_image(scrubbed_path, quote, "", slide_index=i+2, total_slides=5))

        if source == "local-fallback":
            error_details = " | ".join(errors[:3])
            return paths, f"⚠️ Semua Model AI Gagal. Detail: {error_details}"
        return paths, f"✅ Sukses menggunakan {source}"
    except Exception as e:
        logger.error("Single image processing failed: %s", e)
        return None, f"❌ Error: {str(e)}"

# ==========================================
# BULK CONCURRENT PROCESSING
# ==========================================
def bulk_process(feed_name, hf_token, max_items, provider, space_id, model_choice, progress=gr.Progress()):
    token = get_hf_token(hf_token)
    if (provider or "").strip().lower() == "hf-inference" and not token:
        return None, "Error: Hugging Face API Token is required untuk provider HF Inference."
        
    requested_items = clamp_max_items(max_items)
    _, entries = fetch_trending_news(feed_name, max_items=requested_items)
    if not entries:
        return None, "Error: No news found to process."
        
    os.makedirs(os.path.join(OUTPUT_DIR, "bulk"), exist_ok=True)
    timestamp = int(time.time())
    zip_filename = os.path.join(OUTPUT_DIR, "bulk", f"bulk_carousel_assets_{timestamp}.zip")
    all_results = []
    run_stats = {"ai": 0, "fallback": 0, "failed": 0}
    
    def process_one(index, entry):
        title = entry.get('title', '').strip()
        if not title:
            return [], "failed", "missing title"
        raw_summary = entry.get('summary', '')
        summary = raw_summary[:120] + "..." if len(raw_summary) > 120 else raw_summary
        prompt = engineer_prompt(title)
        if not prompt:
            return [], "failed", "empty prompt"

        try:
            active_provider = (provider or "").strip().lower()
            if active_provider in {"pollinations", "hf-space"}:
                seed = int(hashlib.sha256(title.encode("utf-8", errors="ignore")).hexdigest()[:8], 16)
                rng = random.Random(seed)
                time.sleep(rng.uniform(0.35, 1.15))
            date_str = time.strftime("%d%m%y")
            folder_path = os.path.join(OUTPUT_DIR, "bulk", date_str, f"content_{index}")
            base_img_path = os.path.join(folder_path, f"content_{index}.jpg")
            scrubbed, source, errors = generate_base_image(
                prompt,
                token,
                base_img_path,
                provider=provider,
                preferred_model=model_choice,
                space_id=space_id,
                max_retries=5,
            )

            indo_headline = translate_to_indonesian(title, token)
            indo_summary = translate_to_indonesian(summary, token) if summary else ""
            quotes = generate_quotes(indo_headline, token)
            
            paths = []
            paths.append(overlay_text_on_image(scrubbed, indo_headline, indo_summary, slide_index=1, total_slides=5))
            for i, quote in enumerate(quotes[:4]):
                paths.append(overlay_text_on_image(scrubbed, quote, "", slide_index=i+2, total_slides=5))
            status = "fallback" if source == "local-fallback" else "ai"
            detail = " | ".join(errors[:2]) if errors else source
            return paths, status, detail
        except Exception as e:
            logger.error(f"Bulk item error: {e}")
            return [], "failed", str(e)

    # Keep concurrency modest to avoid aggressive HF rate limiting.
    total_entries = len(entries)
    with concurrent.futures.ThreadPoolExecutor(max_workers=BULK_WORKERS) as executor:
        futures = {executor.submit(process_one, idx+1, e): e for idx, e in enumerate(entries)}
        
        completed = 0
        for future in concurrent.futures.as_completed(futures):
            try:
                res, status, detail = future.result()
            except Exception as e:
                logger.error("Bulk worker failed: %s", e)
                res = []
                status = "failed"
                detail = str(e)
            if res:
                all_results.extend(res)
            run_stats[status] = run_stats.get(status, 0) + 1
            if status != "ai":
                logger.warning("Bulk item finished with %s: %s", status, safe_error_text(detail))
            completed += 1
            progress(float(completed) / total_entries, desc=f"Generasi Gambar: {completed}/{total_entries} Berita Selesai")
                
    if not all_results:
        return None, "Gagal membuat gambar dan fallback lokal juga gagal. Coba turunkan Max Posts atau restart Space."
        
    progress(0.9, desc="Mengompres (Zipping) Ribuan Aset Visual...")
    with zipfile.ZipFile(zip_filename, 'w') as zipf:
        for f in all_results:
            if os.path.isfile(f):
                zipf.write(f, os.path.basename(f))
            
    progress(1.0, desc="Proses Selesai!")
    return zip_filename, (
        f"✅ Bulk generation complete. Memproses {total_entries} berita menjadi {len(all_results)} slide. "
        f"AI: {run_stats['ai']} item, fallback lokal: {run_stats['fallback']} item, gagal: {run_stats['failed']} item. "
        + ("HF credits habis; tambahkan credits/PRO atau pakai provider aktif untuk background AI realistic." if BILLING_UNAVAILABLE else "")
    )

# ==========================================
# UI LAYOUT
# ==========================================
def create_ui():
    with gr.Blocks(title="Real-Time News-to-Visual Studio", theme=theme) as app:
        gr.Markdown(
            """
            # 🌐 Real-Time News-to-Visual Content Studio
            *Turn breaking global news into a 5-slide carousel for Instagram/LinkedIn in seconds.*
            """
        )
        
        with gr.Tabs():
            # TAB 1: SINGLE GENERATION
            with gr.Tab("Single Generate (Carousel)"):
                with gr.Row():
                    with gr.Column(scale=1):
                        gr.Markdown("### 1. Ingest Data")
                        feed_dropdown = gr.Dropdown(choices=list(RSS_FEEDS.keys()), label="Select News Source", value="🔥 Aggregated (60+ Feeds)")
                        fetch_btn = gr.Button("Fetch Trending News", variant="secondary")
                        news_headlines = gr.Radio(choices=[], label="Trending Headlines (Select One)")
                        entries_state = gr.State([])
                        
                        gr.Markdown("### 2. Configure Output")
                        provider_dropdown = gr.Dropdown(
                            choices=[
                                ("Pollinations (Gratis, Tanpa Token)", "pollinations"),
                                ("HF Space (Gratis, Gradio)", "hf-space"),
                                ("HF Inference (Butuh Token)", "hf-inference"),
                            ],
                            value=DEFAULT_IMAGE_PROVIDER,
                            label="Image Provider",
                        )
                        hf_space_input = gr.Textbox(
                            label="HF Space IDs (pisahkan dengan koma, opsional untuk provider HF Space)",
                            value=DEFAULT_HF_SPACE_IDS_RAW,
                            placeholder="mrfakename/Z-Image-Turbo,black-forest-labs/FLUX.2-klein-9B",
                        )
                        api_token_input = gr.Textbox(label="Hugging Face Token", placeholder="hf_...", type="password")
                        model_dropdown = gr.Dropdown(
                            choices=IMAGE_MODEL_IDS,
                            value=IMAGE_MODEL_IDS[0],
                            label="Primary Image Model (Fallback chain enabled)"
                        )
                        generate_btn = gr.Button("Generate 5-Slide Carousel", variant="primary")
                        
                    with gr.Column(scale=1):
                        gr.Markdown("### 3. Visual Canvas")
                        output_gallery = gr.Gallery(label="Generated 5-Slide Carousel", columns=5)
                        status_log = gr.Textbox(label="Pipeline Status Log", lines=2, interactive=False)
                        
                        gr.Markdown("### 4. Content Curation")
                        engineered_prompt_display = gr.Textbox(label="Engineered Cinematic Prompt", lines=3, interactive=False)
                        
                fetch_btn.click(
                    fn=lambda feed: fetch_trending_news(feed, 200),
                    inputs=[feed_dropdown],
                    outputs=[news_headlines, entries_state],
                    api_name=False
                )
                news_headlines.change(
                    fn=engineer_prompt,
                    inputs=[news_headlines],
                    outputs=[engineered_prompt_display],
                    api_name=False
                )
                
                generate_btn.click(
                    fn=generate_image_single,
                    inputs=[engineered_prompt_display, api_token_input, news_headlines, provider_dropdown, hf_space_input, model_dropdown, entries_state],
                    outputs=[output_gallery, status_log],
                    api_name=False
                )
                
            # TAB 2: BULK CONCURRENT GENERATION
            with gr.Tab("Bulk Generate"):
                gr.Markdown("### 🚀 Concurrent Bulk Generation\nFetch up to 200 news items from 60+ sources and generate 5 slides for **each** item.")
                with gr.Row():
                    with gr.Column(scale=1):
                        bulk_feed = gr.Dropdown(choices=list(RSS_FEEDS.keys()), label="Select News Source", value="🔥 Aggregated (60+ Feeds)")
                        bulk_max = gr.Slider(minimum=1, maximum=200, value=5, step=1, label="Max Posts to Process")
                        bulk_provider = gr.Dropdown(
                            choices=[
                                ("Pollinations (Gratis, Tanpa Token)", "pollinations"),
                                ("HF Space (Gratis, Gradio)", "hf-space"),
                                ("HF Inference (Butuh Token)", "hf-inference"),
                            ],
                            value=DEFAULT_IMAGE_PROVIDER,
                            label="Image Provider",
                        )
                        bulk_hf_space = gr.Textbox(
                            label="HF Space IDs (pisahkan dengan koma, opsional untuk provider HF Space)",
                            value=DEFAULT_HF_SPACE_IDS_RAW,
                            placeholder="mrfakename/Z-Image-Turbo,black-forest-labs/FLUX.2-klein-9B",
                        )
                        bulk_token = gr.Textbox(label="Hugging Face Token", placeholder="hf_...", type="password")
                        bulk_model = gr.Dropdown(
                            choices=IMAGE_MODEL_IDS,
                            value=IMAGE_MODEL_IDS[0],
                            label="Primary Image Model"
                        )
                        bulk_btn = gr.Button("Start Bulk Carousel Process", variant="primary")
                        
                    with gr.Column(scale=1):
                        bulk_output = gr.File(label="Download ZIP Asset Bundle (All Slides)")
                        bulk_status = gr.Textbox(label="Status Log", lines=3, interactive=False)
                        
                bulk_btn.click(
                    fn=bulk_process,
                    inputs=[bulk_feed, bulk_token, bulk_max, bulk_provider, bulk_hf_space, bulk_model],
                    outputs=[bulk_output, bulk_status],
                    api_name=False
                )

    return app

def find_available_port(server_name, preferred_port, max_tries=50):
    for port in range(preferred_port, preferred_port + max_tries):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
            sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            try:
                sock.bind((server_name, port))
            except OSError:
                continue
            return port

    raise OSError(f"Cannot find empty port in range: {preferred_port}-{preferred_port + max_tries - 1}")

if __name__ == "__main__":
    server_name = os.getenv("GRADIO_SERVER_NAME", "0.0.0.0")
    preferred_port = int(os.getenv("GRADIO_SERVER_PORT", "7860"))
    server_port = find_available_port(server_name, preferred_port)

    if server_port != preferred_port:
        logger.warning("Port %s is already in use. Starting Gradio on port %s instead.", preferred_port, server_port)

    app = create_ui()
    app.queue(max_size=10)
    app.launch(
        server_name=server_name,
        server_port=server_port,
        show_error=is_enabled_env("GRADIO_SHOW_ERROR", default=False),
    )
