import os, sys, shutil, warnings
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.font_manager as fm
from matplotlib.animation import FFMpegWriter
from matplotlib.offsetbox import OffsetImage, AnnotationBbox
import textwrap
from io import StringIO
from PIL import Image, ImageDraw

def create_circular_mask(img_path, size=80):
    """Crop image into a circle for markers (PFP style)"""
    try:
        img = Image.open(img_path).convert("RGBA")
        img = img.resize((size, size), Image.LANCZOS)
        mask = Image.new('L', (size, size), 0)
        draw = ImageDraw.Draw(mask)
        draw.ellipse((0, 0, size, size), fill=255)
        # Apply mask
        output = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        output.paste(img, (0, 0), mask)
        # Tambahkan border putih (opsional)
        return output
    except Exception as e:
        print(f"Error loading marker image {img_path}: {e}")
        return None

def ease_cubic(t): return t * t * (3.0 - 2.0 * t)
def ease_out_quart(t): s = 1.0 - t; return 1.0 - s * s * s * s
def lerp(a, b, t): return a + (b - a) * t

def render_dynamic_video(
    data_csv: str,
    output_mp4: str,
    title: str = "TABUNGAN VS INVESTASI",
    subtitle: str = "Simulasi",
    theme: str = "black",
    aspect_ratio: str = "16:9",
    colA: str = "Tabungan",
    colB: str = "Investasi",
    colorA: str = "#22C55E",
    colorB: str = "#EF4444",
    emojiA: str = "💰",
    emojiB: str = "📈",
    marker_img_A: str = None,
    marker_img_B: str = None
):
    import pandas as pd
    
    # ── 1. Setup Custom Aspect Ratio (Menghindari Teks Menimpa Frame) ──
    if aspect_ratio == "16:9":     
        W_PX, H_PX = 1920, 1080; ax_r = 0.93; ax_l = 0.09
    elif aspect_ratio == "9:16":   
        W_PX, H_PX = 1080, 1920; ax_r = 0.94; ax_l = 0.15
    elif aspect_ratio == "4:3":    
        W_PX, H_PX = 1440, 1080; ax_r = 0.94; ax_l = 0.12
    elif aspect_ratio == "1:1":    
        W_PX, H_PX = 1080, 1080; ax_r = 0.94; ax_l = 0.15
    else:                          
        W_PX, H_PX = 1920, 1080; ax_r = 0.93; ax_l = 0.09

    DPI, FPS = 200, 30
    is_dark = theme != "white"
    BG = "#000000" if is_dark else "#FFFFFF"
    TEXT_COL = "#F0F0F0" if is_dark else "#111111"
    SPINE_COL = "#555555" if is_dark else "#CCCCCC"

    # ── 2. Load Data (Termasuk Sanitasi & Validasi) ──
    df = pd.read_csv(StringIO(data_csv))
    df = df.dropna().reset_index(drop=True)
    
    # Deteksi nama kolom aktual A dan B (kolom indeks 1 dan 2)
    actA, actB = df.columns[1], df.columns[2]

    # Ekstrak & Interpolasi Mikro untuk kelancaran rendering
    y1_raw = df[actA].astype(float).values
    y2_raw = df[actB].astype(float).values

    n_pts = len(df)
    x_idx = np.arange(n_pts, dtype=float)
    x_fine = np.linspace(0, n_pts - 1, (n_pts - 1) * 18 + 1)
    y1f = np.interp(x_fine, x_idx, y1_raw)
    y2f = np.interp(x_fine, x_idx, y2_raw)
    N = len(x_fine)

    y_min, y_max = min(np.min(y1f), np.min(y2f)), max(np.max(y1f), np.max(y2f))
    pad = (y_max - y_min) * 0.15
    Y_BOT, Y_TOP = max(0, y_min - pad), y_max + pad
    X_MIN, X_MAX = float(x_fine[0]), float(x_fine[-1])

    # ── 3. Persiapan Matplotlib Canvas ──
    fig = plt.figure(figsize=(W_PX / DPI, H_PX / DPI), dpi=DPI, facecolor=BG)
    
    # Auto wrap title based on resolution (menghindari teks memotong layer)
    wrap_len = 20 if W_PX <= 1080 else 40
    t_wrap = "\n".join(textwrap.wrap(title, wrap_len))
    
    fig.text(0.5, 0.90, t_wrap, ha="center", va="center", fontsize=24, fontweight="black", color=TEXT_COL)
    fig.text(0.5, 0.83, subtitle, ha="center", va="center", fontsize=12, color=TEXT_COL, alpha=0.6)

    # Plot axis sizing dynamically
    ax = fig.add_axes([ax_l, 0.18, ax_r - ax_l, 0.60])
    ax.set_facecolor(BG)
    for sn, sp in ax.spines.items():
        sp.set_visible(sn in ("left", "bottom"))
        if sn in ("left", "bottom"): sp.set_color(SPINE_COL); sp.set_linewidth(2)
    
    ax.tick_params(colors=TEXT_COL, bottom=False, labelbottom=False)
    ax.set_xlim(X_MIN, X_MAX)
    ax.set_ylim(Y_BOT, Y_TOP)

    # Inisiasi Line
    (ln1,) = ax.plot([], [], color=colorA, lw=4, solid_capstyle="round", zorder=3)
    (ln2,) = ax.plot([], [], color=colorB, lw=4, solid_capstyle="round", zorder=3)
    
    # ── 4. Image Customization (Marker Gambar Bergerak) ──
    im_arr_A = create_circular_mask(marker_img_A) if marker_img_A else None
    im_arr_B = create_circular_mask(marker_img_B) if marker_img_B else None
    
    abA, abB = None, None
    if im_arr_A:
        imageboxA = OffsetImage(np.array(im_arr_A), zoom=0.35)
        abA = AnnotationBbox(imageboxA, (0,0), frameon=False, zorder=5)
        ax.add_artist(abA)
    else:
        (dot1,) = ax.plot([], [], "o", color=colorA, markersize=14, markeredgecolor=BG, markeredgewidth=2, zorder=5)

    if im_arr_B:
        imageboxB = OffsetImage(np.array(im_arr_B), zoom=0.35)
        abB = AnnotationBbox(imageboxB, (0,0), frameon=False, zorder=4)
        ax.add_artist(abB)
    else:
        (dot2,) = ax.plot([], [], "o", color=colorB, markersize=14, markeredgecolor=BG, markeredgewidth=2, zorder=4)

    # ── 5. HUD Dinamis (Nama Kolom & Warna) ──
    hud_y = 0.08
    fig.text(0.20, hud_y, "●", color=colorA, fontsize=16, ha="center")
    hud1 = fig.text(0.22, hud_y, f"{emojiA} {colA}: 0", color=TEXT_COL, fontsize=14, fontweight="bold", ha="left")
    
    fig.text(0.60, hud_y, "●", color=colorB, fontsize=16, ha="center")
    hud2 = fig.text(0.62, hud_y, f"{emojiB} {colB}: 0", color=TEXT_COL, fontsize=14, fontweight="bold", ha="left")

    def set_data(idx):
        idx = max(2, min(idx, N))
        xs = x_fine[:idx]
        ln1.set_data(xs, y1f[:idx]); ln2.set_data(xs, y2f[:idx])
        
        cx, cy1, cy2 = x_fine[idx-1], y1f[idx-1], y2f[idx-1]
        
        # Offset vertikal untuk Line B agar gambar PFP tidak tumpang tindih mutlak
        if abs(cy1 - cy2) / (Y_TOP - Y_BOT) < 0.03:
            cy2 = cy2 - (Y_TOP - Y_BOT) * 0.04 if cy2 >= cy1 else cy2 + (Y_TOP - Y_BOT) * 0.04
            
        if abA: abA.xybox = (cx, cy1); abA.xy = (cx, cy1)
        else: dot1.set_data([cx], [cy1])
            
        if abB: abB.xybox = (cx, cy2); abB.xy = (cx, cy2)
        else: dot2.set_data([cx], [cy2])

        hud1.set_text(f"{emojiA} {colA}: {cy1:,.0f}")
        hud2.set_text(f"{emojiB} {colB}: {cy2:,.0f}")

    # ── 6. Writer Core Animasi ──
    writer = FFMpegWriter(fps=FPS, bitrate=8000)
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        with writer.saving(fig, output_mp4, dpi=DPI):
            # Phase: Draw (7 detik)
            for k in range(int(7.0 * FPS)): 
                prog = ease_cubic((k + 1) / (7.0 * FPS))
                set_data(int(prog * N))
                writer.grab_frame()
                
            # Phase: Freeze Post-Draw (2.5 detik)
            set_data(N)
            for _ in range(int(2.5 * FPS)):
                writer.grab_frame()

    plt.close(fig)
    return output_mp4
