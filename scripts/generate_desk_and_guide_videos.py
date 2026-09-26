"""
生成两部全新专属视频：
1. avatar_desk_reading.mp4 / .webm (白鹿督学：朱熹案前看书伴读视频)
2. avatar_guide_leading.mp4 / .webm (首页总览：朱熹拂袖引路导览视频)
"""

import os
import sys
import math
import subprocess
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy.ndimage import map_coordinates
import imageio_ffmpeg

if sys.stdout.encoding.lower() != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

WORKSPACE = r"c:\Users\15288\Desktop\zhuzi"
OUT_DIR = os.path.join(WORKSPACE, "static", "avatar_videos")
AVATAR_STATES_DIR = os.path.join(WORKSPACE, "static", "avatar_states")
STANDALONE_DIR = os.path.join(WORKSPACE, "static", "avatar_standalone")
FFMPEG_EXE = imageio_ffmpeg.get_ffmpeg_exe()

FPS = 30
TOTAL_FRAMES = 90  # 3.0秒标准无缝循环

def encode_frames(frames_list, width, height, base_filename, fps=30):
    mp4_path = os.path.join(OUT_DIR, base_filename + ".mp4")
    webm_path = os.path.join(OUT_DIR, base_filename + ".webm")

    print(f"-> 正在编码 {base_filename}.mp4 ({width}x{height}, {len(frames_list)}帧)...")
    cmd_mp4 = [
        FFMPEG_EXE, "-y",
        "-f", "rawvideo",
        "-pix_fmt", "rgb24",
        "-s", f"{width}x{height}",
        "-r", str(fps),
        "-i", "-",
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-preset", "veryfast",
        "-movflags", "+faststart",
        "-b:v", "1800k",
        mp4_path
    ]
    proc = subprocess.Popen(cmd_mp4, stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    for frame in frames_list:
        proc.stdin.write(frame.tobytes())
    proc.stdin.close()
    proc.wait()

    print(f"-> 正在编码 {base_filename}.webm...")
    cmd_webm = [
        FFMPEG_EXE, "-y",
        "-f", "rawvideo",
        "-pix_fmt", "rgb24",
        "-s", f"{width}x{height}",
        "-r", str(fps),
        "-i", "-",
        "-c:v", "libvpx-vp9",
        "-b:v", "1000k",
        "-speed", "4",
        webm_path
    ]
    proc2 = subprocess.Popen(cmd_webm, stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    for frame in frames_list:
        proc2.stdin.write(frame.tobytes())
    proc2.stdin.close()
    proc2.wait()
    print(f"✔ {base_filename} 导出成功！")


# ==============================================================================
# 1. 案前看书翻卷伴读视频 (avatar_desk_reading)
# ==============================================================================
def generate_desk_reading_video():
    print("\n[1/2] 生成朱熹案前看书伴读视频 (avatar_desk_reading)...")
    desk_path = os.path.join(AVATAR_STATES_DIR, "pose_desk.png")
    desk_img = Image.open(desk_path).convert("RGBA")

    # 440x480 画布，居中放置桌案人物
    W, H = 440, 480
    bg = Image.new("RGBA", (W, H), (255, 255, 255, 255))

    # 缩放至合适尺寸
    target_w = int(W * 0.92)
    target_h = int(desk_img.height * (target_w / desk_img.width))
    scaled_desk = desk_img.resize((target_w, target_h), Image.Resampling.LANCZOS)

    # 贴合到底部
    x_offset = (W - target_w) // 2
    y_offset = H - target_h - 10

    canvas = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    canvas.paste(scaled_desk, (x_offset, y_offset), scaled_desk)
    base_arr = np.array(canvas, dtype=np.float32)

    y_coords, x_coords = np.mgrid[0:H, 0:W].astype(np.float32)

    # 案头和书卷、头部坐标参考
    y_head = y_offset + target_h * 0.22
    x_head = W / 2.0
    y_book = y_offset + target_h * 0.52
    x_book = W / 2.0 - 20

    frames = []
    for f in range(TOTAL_FRAMES):
        t = f / TOTAL_FRAMES

        # 呼吸与看书颔首动作 (阅卷时头部轻微上下左右微移、沉浸读书)
        read_cycle = math.sin(2.0 * math.pi * t)
        head_nod = 4.0 * math.sin(2.0 * math.pi * t)
        head_scan_x = 2.5 * math.cos(2.0 * math.pi * t)

        # 头部和胸腔区域受权
        head_mask = np.exp(-((y_coords - y_head)**2 / (2 * (60.0**2)) + (x_coords - x_head)**2 / (2 * (55.0**2))))
        chest_mask = np.exp(-((y_coords - (y_head + 60))**2 / (2 * (80.0**2)) + (x_coords - x_head)**2 / (2 * (90.0**2))))

        breath_y = 3.5 * read_cycle * chest_mask
        nod_y = head_nod * head_mask
        scan_x = head_scan_x * head_mask

        # 书卷轻微翻动光泽感微动
        book_mask = np.exp(-((y_coords - y_book)**2 / (2 * (30.0**2)) + (x_coords - x_book)**2 / (2 * (40.0**2))))
        book_shift = 1.2 * math.sin(2.0 * math.pi * t + 1.0) * book_mask

        src_y = y_coords - breath_y - nod_y - book_shift
        src_x = x_coords - scan_x

        warped = np.zeros_like(base_arr)
        coords = [src_y, src_x]
        for c in range(4):
            warped[:, :, c] = map_coordinates(base_arr[:, :, c], coords, order=1, mode='constant', cval=0.0)

        # 眨眼
        if 40 <= f <= 50:
            blink_amt = math.sin(math.pi * (f - 40) / 10.0)
            eye_y = int(y_head + 8)
            eye_x = int(x_head)
            warped[eye_y-3:eye_y+4, eye_x-18:eye_x+18, :3] = warped[eye_y-3:eye_y+4, eye_x-18:eye_x+18, :3] * (1.0 - 0.35 * blink_amt)

        # 合成至纯白底 + 案下阴影
        white_bg = Image.new("RGBA", (W, H), (255, 255, 255, 255))
        draw = ImageDraw.Draw(white_bg)
        # 桌下柔和投影
        draw.ellipse([x_offset + 20, H - 30, x_offset + target_w - 20, H - 8], fill=(60, 50, 45, 60))
        white_bg = white_bg.filter(ImageFilter.GaussianBlur(radius=6))
        bg_rgb = np.array(white_bg.convert("RGB"), dtype=np.float32)

        alpha = warped[:, :, 3:4] / 255.0
        comp = warped[:, :, :3] * alpha + bg_rgb * (1.0 - alpha)
        frame_rgb = np.clip(comp, 0, 255).astype(np.uint8)
        frames.append(frame_rgb)

    encode_frames(frames, W, H, "avatar_desk_reading", FPS)


# ==============================================================================
# 2. 首页朱熹拂袖引路导览视频 (avatar_guide_leading)
# ==============================================================================
def generate_guide_leading_video():
    print("\n[2/2] 生成朱熹拂袖引路导览视频 (avatar_guide_leading)...")
    stand_path = os.path.join(STANDALONE_DIR, "master_standing.png")
    stand_img = Image.open(stand_path).convert("RGBA")

    # 尝试加载带手势的图层做融合
    teach_path = os.path.join(STANDALONE_DIR, "action_teaching.png")
    teach_img = Image.open(teach_path).convert("RGBA") if os.path.exists(teach_path) else None

    W, H = 360, 640
    canvas_stand = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    stand_x = (W - stand_img.width) // 2
    stand_y = 20
    canvas_stand.paste(stand_img, (stand_x, stand_y), stand_img)
    base_stand = np.array(canvas_stand, dtype=np.float32)

    if teach_img:
        canvas_teach = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        canvas_teach.paste(teach_img, (stand_x - 66, stand_y + 4), teach_img)
        base_teach = np.array(canvas_teach, dtype=np.float32)
    else:
        base_teach = base_stand

    y_coords, x_coords = np.mgrid[0:H, 0:W].astype(np.float32)

    frames = []
    for f in range(TOTAL_FRAMES):
        t = f / TOTAL_FRAMES

        # 引路拂袖动作曲线 (起手引路 -> 舒展指向 -> 微微颔首迎客)
        guide_phase = 0.5 * (1.0 - math.cos(2.0 * math.pi * t)) # 0 -> 1 -> 0
        bow_nod = 8.0 * guide_phase
        side_lean = 6.0 * guide_phase

        head_mask = np.clip((180.0 - y_coords) / 100.0, 0.0, 1.0)
        sleeve_mask = np.clip((y_coords - 160.0) / 180.0, 0.0, 1.0) * np.clip((x_coords - 140.0) / 120.0, 0.0, 1.0)

        # 混合手势
        effective_blend = guide_phase * 0.85
        blended_base = base_teach * effective_blend + base_stand * (1.0 - effective_blend)

        src_y = y_coords - bow_nod * head_mask - 4.0 * math.sin(2.0 * math.pi * t)
        src_x = x_coords - side_lean * head_mask

        warped = np.zeros_like(blended_base)
        coords = [src_y, src_x]
        for c in range(4):
            warped[:, :, c] = map_coordinates(blended_base[:, :, c], coords, order=1, mode='constant', cval=0.0)

        # 纯白底 + 地面柔和接触投影
        white_bg = Image.new("RGBA", (W, H), (255, 255, 255, 255))
        draw = ImageDraw.Draw(white_bg)
        draw.ellipse([W//2 - 65, 622, W//2 + 65, 638], fill=(60, 50, 45, 70))
        white_bg = white_bg.filter(ImageFilter.GaussianBlur(radius=5))
        bg_rgb = np.array(white_bg.convert("RGB"), dtype=np.float32)

        alpha = warped[:, :, 3:4] / 255.0
        comp = warped[:, :, :3] * alpha + bg_rgb * (1.0 - alpha)
        frame_rgb = np.clip(comp, 0, 255).astype(np.uint8)
        frames.append(frame_rgb)

    encode_frames(frames, W, H, "avatar_guide_leading", FPS)

def main():
    print("==================================================")
    print("开始生成两部全新专属视频...")
    print("==================================================")
    generate_desk_reading_video()
    generate_guide_leading_video()
    print("==================================================")
    print("🎉 两部全新专属视频全部生成完毕！")
    print("==================================================")

if __name__ == "__main__":
    main()
