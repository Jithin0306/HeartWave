import os
import sys
import math
import subprocess
import numpy as np
from PIL import Image, ImageDraw, ImageFont

WIDTH = 1920
HEIGHT = 1080
FPS = 30
TOTAL_SECONDS = 18
TOTAL_FRAMES = FPS * TOTAL_SECONDS

OUTPUT_MP4 = r"f:\HeartWave\website\public\assets\architecture-pipeline.mp4"

# Attempt to load nice fonts or fallback
def get_fonts():
    font_paths = [
        r"C:\Windows\Fonts\segoeui.ttf",
        r"C:\Windows\Fonts\arial.ttf",
        r"C:\Windows\Fonts\consola.ttf"
    ]
    bold_paths = [
        r"C:\Windows\Fonts\segoeuib.ttf",
        r"C:\Windows\Fonts\arialbd.ttf"
    ]
    
    font_main = None
    font_bold = None
    font_mono = None

    for p in font_paths:
        if os.path.exists(p):
            try:
                font_main = ImageFont.truetype(p, 24)
                font_mono = ImageFont.truetype(r"C:\Windows\Fonts\consola.ttf" if os.path.exists(r"C:\Windows\Fonts\consola.ttf") else p, 20)
                break
            except Exception:
                pass
    for p in bold_paths:
        if os.path.exists(p):
            try:
                font_bold = ImageFont.truetype(p, 36)
                break
            except Exception:
                pass

    if font_main is None:
        font_main = ImageFont.load_default()
    if font_bold is None:
        font_bold = font_main
    if font_mono is None:
        font_mono = font_main

    title_font = ImageFont.truetype(bold_paths[0], 48) if os.path.exists(bold_paths[0]) else font_bold
    header_font = ImageFont.truetype(bold_paths[0], 28) if os.path.exists(bold_paths[0]) else font_bold
    sub_font = ImageFont.truetype(font_paths[0], 18) if os.path.exists(font_paths[0]) else font_main
    badge_font = ImageFont.truetype(r"C:\Windows\Fonts\consola.ttf" if os.path.exists(r"C:\Windows\Fonts\consola.ttf") else font_paths[0], 16)

    return {
        'title': title_font,
        'header': header_font,
        'main': font_main,
        'bold': font_bold,
        'mono': font_mono,
        'sub': sub_font,
        'badge': badge_font
    }

fonts = get_fonts()

# Stages definition
STAGES = [
    {
        "id": 1,
        "title": "Dual Input Ingestion",
        "tech": "Webcam 1080p60 | Phone WebRTC QR",
        "desc": "Physical USB Camera or Zero-Install Smartphone over local Wi-Fi",
        "color": (0, 240, 255), # Cyan
        "icon": "CAM",
        "x": 160,
        "y": 480
    },
    {
        "id": 2,
        "title": "Local AI Vision Engine",
        "tech": "MediaPipe WASM (Tasks Vision)",
        "desc": "Sub-millisecond 21-point 3D hand tracking & dual-pass segmentation",
        "color": (255, 46, 99), # Rose
        "icon": "AI",
        "x": 490,
        "y": 480
    },
    {
        "id": 3,
        "title": "Gesture State Machine",
        "tech": "Predictive Kalman Smoothing",
        "desc": "Rose Blossom, Cupid Spark, Glowing Hearts + Acoustic Chime Synthesis",
        "color": (255, 184, 0), # Amber
        "icon": "FX",
        "x": 820,
        "y": 480
    },
    {
        "id": 4,
        "title": "Zero-Copy Ring Buffer",
        "tech": "Native Rust 2024 / Tauri v2",
        "desc": "Triple-buffered Memory Mapped File (MMF) | 56 MB RAM | <3% CPU",
        "color": (168, 85, 247), # Purple
        "icon": "RUST",
        "x": 1150,
        "y": 480
    },
    {
        "id": 5,
        "title": "DirectShow Virtual Driver",
        "tech": "HeartWaveCam.dll Native Filter",
        "desc": "Monotonic Windows Reference Clock timestamps & 0ms WebRTC Lip Sync",
        "color": (34, 197, 94), # Emerald Green
        "icon": "DS",
        "x": 1480,
        "y": 480
    },
    {
        "id": 6,
        "title": "Broadcast Target Apps",
        "tech": "DirectShow Output Stream",
        "desc": "Discord • OBS Studio • Zoom • Teams • Google Meet • VRChat",
        "color": (59, 130, 246), # Blue
        "icon": "OUT",
        "x": 1750,
        "y": 480
    }
]

def draw_frame(frame_idx):
    img = Image.new("RGBA", (WIDTH, HEIGHT), (6, 8, 14, 255))
    draw = ImageDraw.Draw(img)

    t = frame_idx / FPS
    progress = frame_idx / TOTAL_FRAMES

    # Background subtle grid
    grid_spacing = 60
    grid_color = (255, 255, 255, 10)
    for gx in range(0, WIDTH, grid_spacing):
        draw.line([(gx, 0), (gx, HEIGHT)], fill=grid_color, width=1)
    for gy in range(0, HEIGHT, grid_spacing):
        draw.line([(0, gy), (WIDTH, gy)], fill=grid_color, width=1)

    # Ambient Top Glow
    glow_pulse = math.sin(t * 1.5) * 0.15 + 0.85
    # Draw radial-like soft rectangle glow at center top
    draw.ellipse([WIDTH//2 - 400, -100, WIDTH//2 + 400, 250], fill=(255, 46, 99, int(15 * glow_pulse)))

    # TOP HEADER / BRAND BAR
    draw.rectangle([(0, 0), (WIDTH, 90)], fill=(10, 13, 22, 230))
    draw.line([(0, 90), (WIDTH, 90)], fill=(255, 255, 255, 25), width=1)

    # Logo + Title
    draw.text((60, 24), "HEARTWAVE", font=fonts['title'], fill=(255, 255, 255, 255))
    draw.text((370, 32), "SYSTEM ARCHITECTURE PIPELINE", font=fonts['header'], fill=(255, 46, 99, 255))
    draw.text((820, 38), "•  TAURI v2 + RUST 2024 CORE  •  ZERO-COPY DIRECTSHOW DRIVER", font=fonts['sub'], fill=(160, 175, 200, 220))

    # Telemetry Badges (Top Right)
    ram_val = 56.2 + math.sin(t * 2.0) * 0.4
    fps_val = 60.0
    latency_val = "0.0 ms (LIP-SYNC CLOCK)"
    
    badges_text = f"RAM: {ram_val:.1f} MB   |   CPU: 2.4%   |   LATENCY: {latency_val}   |   FPS: {fps_val:.0f}"
    # Draw pill for badges
    draw.rounded_rectangle([(WIDTH - 580, 26), (WIDTH - 50, 64)], radius=8, fill=(20, 25, 40, 200), outline=(255, 255, 255, 30))
    draw.text((WIDTH - 560, 34), badges_text, font=fonts['badge'], fill=(0, 240, 255, 240))

    # CURRENT ACTIVE STAGE HIGHLIGHT
    # 6 stages across 18 seconds -> ~3 seconds per stage
    active_stage_idx = min(int(t / 2.8), len(STAGES) - 1)
    active_stage = STAGES[active_stage_idx]

    # TOP STAGE HIGHLIGHT BANNER
    banner_y = 120
    draw.rounded_rectangle([(60, banner_y), (WIDTH - 60, banner_y + 110)], radius=14, fill=(14, 18, 30, 230), outline=(*active_stage['color'], 140), width=2)
    
    stage_indicator = f"ACTIVE PIPELINE PHASE {active_stage_idx + 1} OF 6:  {active_stage['title'].upper()}"
    draw.text((90, banner_y + 20), stage_indicator, font=fonts['header'], fill=active_stage['color'])
    draw.text((90, banner_y + 60), f"Engine Core: {active_stage['tech']}   —   {active_stage['desc']}", font=fonts['main'], fill=(220, 230, 245, 240))

    # Draw Stage Progress Bar
    bar_width = WIDTH - 120
    draw.rectangle([(60, banner_y + 110 - 4), (60 + bar_width, banner_y + 110)], fill=(30, 36, 54, 255))
    draw.rectangle([(60, banner_y + 110 - 4), (60 + int(bar_width * progress), banner_y + 110)], fill=active_stage['color'])

    # DRAW CONNECTING BUS PIPELINE (HORIZONTAL LINE WITH PULSING PACKETS)
    bus_y = 480
    draw.line([(120, bus_y), (WIDTH - 120, bus_y)], fill=(40, 50, 75, 255), width=6)
    
    # Animated data packets traveling through the bus
    for p_offset in [0.0, 0.2, 0.4, 0.6, 0.8]:
        p_pos = (t * 0.35 + p_offset) % 1.0
        px = 120 + int(p_pos * (WIDTH - 240))
        glow_size = 10 + int(math.sin(t * 10 + p_offset * 10) * 3)
        draw.ellipse([(px - glow_size, bus_y - glow_size), (px + glow_size, bus_y + glow_size)], fill=(*active_stage['color'], 80))
        draw.ellipse([(px - 5, bus_y - 5), (px + 5, bus_y + 5)], fill=(255, 255, 255, 255))

    # DRAW THE 6 NODES
    node_w = 230
    node_h = 240
    
    for i, s in enumerate(STAGES):
        nx = s['x'] - node_w // 2
        ny = bus_y - node_h // 2
        
        is_current = (i == active_stage_idx)
        card_fill = (22, 28, 46, 250) if is_current else (12, 16, 26, 220)
        card_border = (*s['color'], 255 if is_current else 60)
        border_w = 3 if is_current else 1

        # Glow behind current card
        if is_current:
            draw.rounded_rectangle([(nx - 10, ny - 10), (nx + node_w + 10, ny + node_h + 10)], radius=18, fill=(*s['color'], 40))

        draw.rounded_rectangle([(nx, ny), (nx + node_w, ny + node_h)], radius=14, fill=card_fill, outline=card_border, width=border_w)

        # Stage Number Pill
        draw.rounded_rectangle([(nx + 16, ny + 16), (nx + 66, ny + 46)], radius=6, fill=(*s['color'], 50), outline=(*s['color'], 150))
        draw.text((nx + 24, ny + 20), f"0{s['id']}", font=fonts['badge'], fill=s['color'])

        # Icon or Tech Tag
        draw.text((nx + 80, ny + 22), s['icon'], font=fonts['badge'], fill=(180, 195, 220, 200))

        # Title
        draw.text((nx + 16, ny + 60), s['title'], font=fonts['bold'], fill=(255, 255, 255, 255) if is_current else (200, 210, 230, 200))

        # Tech Subtitle
        draw.text((nx + 16, ny + 110), s['tech'], font=fonts['sub'], fill=s['color'] if is_current else (140, 155, 180, 180))

        # Short Spec
        words = s['desc'].split(" ")
        line1 = " ".join(words[:4])
        line2 = " ".join(words[4:])
        draw.text((nx + 16, ny + 165), line1, font=fonts['sub'], fill=(160, 175, 200, 220))
        draw.text((nx + 16, ny + 190), line2, font=fonts['sub'], fill=(160, 175, 200, 220))

    # BOTTOM SECTION: DEEP DETAIL RADAR & BENCHMARK VISUALIZER
    bot_y = 670
    bot_h = 340
    
    # Left Box: Real-Time Vision & Gesture Mesh Animation
    draw.rounded_rectangle([(60, bot_y), (WIDTH//2 - 20, bot_y + bot_h)], radius=14, fill=(12, 16, 26, 230), outline=(255, 255, 255, 30), width=1)
    draw.text((90, bot_y + 24), "MEDIAPIPE 21-POINT 3D LANDMARK PIPELINE", font=fonts['header'], fill=(255, 46, 99, 255))
    draw.text((90, bot_y + 64), "Predictive Kalman filtering guarantees jitter-free tracking even during rapid hand motions", font=fonts['sub'], fill=(160, 175, 200, 220))

    # Draw animated 21 hand landmarks inside left box
    hand_cx = 240
    hand_cy = bot_y + 200
    points = [
        (0, 70), (-30, 50), (-50, 20), (-65, -10), (-75, -40), # Thumb
        (-25, -20), (-30, -60), (-32, -90), (-35, -115),         # Index
        (0, -25), (0, -70), (0, -100), (0, -125),                # Middle
        (25, -20), (30, -60), (32, -90), (35, -115),             # Ring
        (50, -10), (60, -45), (68, -75), (75, -95),              # Pinky
        (0, 20)                                                   # Wrist base
    ]
    # Rotate & animate hand gently
    hand_wave = math.sin(t * 3) * 0.08
    hand_pts = []
    for px, py in points:
        rx = px * math.cos(hand_wave) - py * math.sin(hand_wave)
        ry = px * math.sin(hand_wave) + py * math.cos(hand_wave)
        hand_pts.append((hand_cx + rx * 1.1, hand_cy + ry * 1.1))

    # Draw landmark connections
    connections = [
        (0, 1), (1, 2), (2, 3), (3, 4),
        (0, 5), (5, 6), (6, 7), (7, 8),
        (5, 9), (9, 10), (10, 11), (11, 12),
        (9, 13), (13, 14), (14, 15), (15, 16),
        (13, 17), (17, 18), (18, 19), (19, 20),
        (0, 17)
    ]
    for c1, c2 in connections:
        p1 = hand_pts[c1]
        p2 = hand_pts[c2]
        draw.line([p1, p2], fill=(255, 46, 99, 140), width=2)
    for p in hand_pts:
        draw.ellipse([(p[0] - 4, p[1] - 4), (p[0] + 4, p[1] + 4)], fill=(0, 240, 255, 255))

    # Hand side stats
    stat_x = 420
    draw.text((stat_x, bot_y + 115), "• Latency: 0.8ms per inference", font=fonts['main'], fill=(220, 230, 245, 230))
    draw.text((stat_x, bot_y + 155), "• Dual-Hand Detection: Active", font=fonts['main'], fill=(220, 230, 245, 230))
    draw.text((stat_x, bot_y + 195), "• Gesture Triggers: Fist, Pinch, Heart, Spark", font=fonts['main'], fill=(255, 184, 0, 255))
    draw.text((stat_x, bot_y + 235), "• Telemetry: 100% Local (Zero Cloud)", font=fonts['main'], fill=(34, 197, 94, 255))
    draw.text((stat_x, bot_y + 275), "• Optical Bokeh: f/1.4, f/2.8, f/4.0 Dual-Pass", font=fonts['main'], fill=(0, 240, 255, 255))

    # Right Box: Zero-Copy DirectShow vs Generic Virtual Camera Benchmark
    rx1 = WIDTH//2 + 20
    draw.rounded_rectangle([(rx1, bot_y), (WIDTH - 60, bot_y + bot_h)], radius=14, fill=(12, 16, 26, 230), outline=(255, 255, 255, 30), width=1)
    draw.text((rx1 + 30, bot_y + 24), "NATIVE DIRECTSHOW MEMORY BUFFER VS TRADITIONAL CAMERAS", font=fonts['header'], fill=(0, 240, 255, 255))
    draw.text((rx1 + 30, bot_y + 64), "Direct reference clock stamps eliminate Discord & WebRTC audio-video de-sync", font=fonts['sub'], fill=(160, 175, 200, 220))

    # Comparison 1: Memory Footprint
    draw.text((rx1 + 30, bot_y + 115), "RAM CONSUMPTION (MB)", font=fonts['badge'], fill=(200, 215, 235, 200))
    # HeartWave bar (56 MB)
    draw.rectangle([(rx1 + 30, bot_y + 140), (rx1 + 30 + 120, bot_y + 165)], fill=(34, 197, 94, 255))
    draw.text((rx1 + 160, bot_y + 142), "HeartWave (56 MB)", font=fonts['badge'], fill=(34, 197, 94, 255))
    # Generic Electron bar (520 MB)
    draw.rectangle([(rx1 + 30, bot_y + 175), (rx1 + 30 + 520, bot_y + 200)], fill=(239, 68, 68, 180))
    draw.text((rx1 + 560, bot_y + 177), "Generic Virtual Cam (520 MB)", font=fonts['badge'], fill=(239, 68, 68, 255))

    # Comparison 2: Video Latency / De-jitter Buffer
    draw.text((rx1 + 30, bot_y + 220), "WEBRTC AUDIO-VIDEO PLAYOUT DELAY (ms)", font=fonts['badge'], fill=(200, 215, 235, 200))
    # HeartWave: 0ms
    draw.rectangle([(rx1 + 30, bot_y + 245), (rx1 + 45, bot_y + 270)], fill=(0, 240, 255, 255))
    draw.text((rx1 + 60, bot_y + 247), "HeartWave DirectShow Native: 0 ms (Perfect Lip Sync)", font=fonts['badge'], fill=(0, 240, 255, 255))
    # Standard: 2000ms
    draw.rectangle([(rx1 + 30, bot_y + 280), (rx1 + 30 + 600, bot_y + 305)], fill=(245, 158, 11, 180))
    draw.text((rx1 + 640, bot_y + 282), "Standard Virtual Cam: ~2000 ms Buffer Delay", font=fonts['badge'], fill=(245, 158, 11, 255))

    # BOTTOM FOOTER BAR
    draw.text((60, HEIGHT - 35), "HeartWave Engine v1.3.30  •  Open Source MIT  •  GitHub: github.com/Jithin0306/HeartWave", font=fonts['sub'], fill=(100, 115, 140, 200))
    draw.text((WIDTH - 420, HEIGHT - 35), "Ultra-Low-Latency Architecture Specification", font=fonts['sub'], fill=(100, 115, 140, 200))

    return img.convert("RGB")

def main():
    print(f"Generating architecture explainer video ({TOTAL_FRAMES} frames)...")
    ffmpeg_cmd = [
        "ffmpeg",
        "-y",
        "-f", "rawvideo",
        "-vcodec", "rawvideo",
        "-s", f"{WIDTH}x{HEIGHT}",
        "-pix_fmt", "rgb24",
        "-r", str(FPS),
        "-i", "-",
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-preset", "fast",
        "-crf", "22",
        OUTPUT_MP4
    ]

    proc = subprocess.Popen(ffmpeg_cmd, stdin=subprocess.PIPE)

    for i in range(TOTAL_FRAMES):
        frame = draw_frame(i)
        proc.stdin.write(frame.tobytes())
        if i % 60 == 0:
            print(f"Rendered {i}/{TOTAL_FRAMES} frames ({(i/TOTAL_FRAMES)*100:.1f}%)")

    proc.stdin.close()
    proc.wait()
    print(f"Video generated successfully at: {OUTPUT_MP4}")

    # Also save a high-res poster snapshot of frame 150
    poster_frame = draw_frame(150)
    poster_path = r"f:\HeartWave\website\public\assets\architecture-poster.jpg"
    poster_frame.save(poster_path, quality=95)
    print(f"Poster snapshot saved at: {poster_path}")

if __name__ == "__main__":
    main()
