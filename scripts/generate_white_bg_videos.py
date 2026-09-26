"""
考亭先生白底情境视频生成引擎 (White Background Digital Human Video Engine v9.0)
用户明确要求：
1. "背景是白色的" —— 纯白高雅卡片背景 (#ffffff)，带有自然地面软阴影，彻底消除黑边与背景色差。
2. "放入那个数字人框中" —— 嵌入精致白底数字人讲席独立卡框。
3. "自己根据不同问题做出不同动作" —— 对应 4 大核心情境：
   - 讲述/教学 (Speaking/Teaching): 挥袖手势、同步开口唇动、抑扬顿挫传道点头
   - 思考 (Thinking): 手抚长髯、哲思微仰、深沉缓释呼吸
   - 微笑 (Smile): 躬身微颔、开颜微笑、双眸舒展
   - 正视镜头/待机 (Idle/Gaze): 鲜活起伏呼吸、重心轻摆、正视镜头
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
STANDALONE_DIR = os.path.join(WORKSPACE, "static", "avatar_standalone")
os.makedirs(OUT_DIR, exist_ok=True)

FFMPEG_EXE = imageio_ffmpeg.get_ffmpeg_exe()

CANVAS_W = 360
CANVAS_H = 640
FPS = 30
TOTAL_FRAMES = 90  # 3.0 秒完整动作周期

Y_GROUND = 632.0   # 地面基线绝对锁死
Y_CHEST = 220.0
Y_NECK = 160.0
Y_HEAD_TOP = 36.0
X_CENTER = 180.0

def create_base_composites():
    """生成完全对齐的标准站姿与动作全身对齐底图"""
    stand = Image.open(os.path.join(STANDALONE_DIR, "master_standing.png"))
    stand_x = (CANVAS_W - stand.width) // 2
    stand_y = 20

    canvas_stand = Image.new("RGBA", (CANVAS_W, CANVAS_H), (0, 0, 0, 0))
    canvas_stand.paste(stand, (stand_x, stand_y), stand)

    actions = {
        "stand": None,
        "teach": ("action_teaching.png", -66, 4, 220, 265),
        "think": ("action_thinking.png", -64, 4, 220, 265),
        "smile": ("action_smile.png", -80, 16, 215, 265),
    }

    composites = {}
    composites["stand"] = np.array(canvas_stand, dtype=np.float32)

    for key, val in actions.items():
        if key == "stand":
            continue
        filename, dx, dy, y_s, y_e = val
        act_img = Image.open(os.path.join(STANDALONE_DIR, filename))
        canvas_act = Image.new("RGBA", (CANVAS_W, CANVAS_H), (0, 0, 0, 0))
        canvas_act.paste(act_img, (stand_x + dx, stand_y + dy), act_img)

        arr_act = np.array(canvas_act, dtype=np.float32)

        mask = np.zeros((CANVAS_H, CANVAS_W, 1), dtype=np.float32)
        for y in range(CANVAS_H):
            if y < stand_y + y_s:
                mask[y, :, :] = 1.0
            elif y > stand_y + y_e:
                mask[y, :, :] = 0.0
            else:
                t = (y - (stand_y + y_s)) / (y_e - y_s)
                mask[y, :, :] = 0.5 * (1.0 + math.cos(math.pi * t))

        act_alpha = arr_act[:, :, 3:4] / 255.0
        effective_weight = mask * act_alpha
        blended = arr_act * effective_weight + composites["stand"] * (1.0 - effective_weight)
        composites[key] = np.clip(blended, 0, 255)

    return composites

def get_white_bg_with_shadow():
    """预制高雅纯白背景与真实地面柔和接触投影 (RGB float32)"""
    bg = Image.new("RGBA", (CANVAS_W, CANVAS_H), (255, 255, 255, 255))
    shadow = Image.new("RGBA", (CANVAS_W, CANVAS_H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(shadow)
    # 在 Y_GROUND 处绘制真实接触投影
    draw.ellipse([X_CENTER - 70, 622, X_CENTER + 70, 638], fill=(60, 50, 45, 70))
    draw.ellipse([X_CENTER - 45, 626, X_CENTER + 45, 636], fill=(40, 30, 25, 95))
    shadow = shadow.filter(ImageFilter.GaussianBlur(radius=5))
    bg.paste(shadow, (0, 0), shadow)
    return np.array(bg.convert("RGB"), dtype=np.float32)

def composite_on_white(rgba_frame, white_bg):
    """将带透明度的 RGBA 人物帧完美复合至纯白背景 (返回 RGB uint8)"""
    alpha = (rgba_frame[:, :, 3:4].astype(np.float32)) / 255.0
    fg_rgb = rgba_frame[:, :, :3].astype(np.float32)
    composite = fg_rgb * alpha + white_bg * (1.0 - alpha)
    return np.clip(composite, 0, 255).astype(np.uint8)

def apply_eyelid_blink(arr, blink_val):
    if blink_val <= 0.02:
        return arr
    res = arr.copy()
    eye_y_center = 97.0
    for y in range(90, 106):
        for x in range(162, 202):
            if res[y, x, 3] > 50:
                dist = abs(y - eye_y_center)
                factor = 1.0 - blink_val * math.exp(-(dist ** 2) / 8.0) * 0.5
                for c in range(3):
                    res[y, x, c] = int(res[y, x, c] * factor)
    return res

def apply_mouth_articulation(arr, open_amount, nod_disp=0.0, head_turn=0.0):
    if open_amount <= 0.04:
        return arr

    res = arr.copy()
    H, W, _ = res.shape
    y_mouth = int(round(117 + nod_disp))
    x_c = int(round(182.0 + head_turn))
    w_m = 11.0
    drop = int(round(7.5 * open_amount))

    # 下颌胡须下移
    for y in range(min(H - 1, 220), y_mouth, -1):
        if y - drop >= y_mouth:
            weight = np.exp(-((np.arange(W) - x_c) ** 2) / (2 * (18.0 ** 2)))
            for x in range(max(0, x_c - 28), min(W, x_c + 28)):
                src_y = int(round(y - drop * weight[x]))
                if y_mouth <= src_y < H:
                    res[y, x] = arr[src_y, x]

    # 口腔内腔
    for dy in range(drop):
        y = y_mouth + dy
        if 0 <= y < H:
            for x in range(max(0, x_c - 12), min(W, x_c + 12)):
                dx = (x - x_c) / w_m
                dy_norm = (dy - drop / 2.0) / (drop / 2.0 + 0.1)
                if dx * dx + dy_norm * dy_norm <= 1.15:
                    res[y, x, 0] = int(42 * (1.0 - open_amount * 0.2))
                    res[y, x, 1] = int(18 * (1.0 - open_amount * 0.2))
                    res[y, x, 2] = int(20 * (1.0 - open_amount * 0.2))
                    res[y, x, 3] = 255

    return res

def encode_rgb_frames(frames_list, base_filename, fps=30):
    """
    同时编码为通用 MP4 (H.264) 与 WebM (VP9)，白底纯净无损封装
    """
    mp4_path = os.path.join(OUT_DIR, base_filename + ".mp4")
    webm_path = os.path.join(OUT_DIR, base_filename + ".webm")

    # 1. 编码 MP4 (通用硬件加速，全设备极速播放)
    cmd_mp4 = [
        FFMPEG_EXE, "-y",
        "-f", "rawvideo",
        "-pix_fmt", "rgb24",
        "-s", f"{CANVAS_W}x{CANVAS_H}",
        "-r", str(fps),
        "-i", "-",
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-preset", "veryfast",
        "-movflags", "+faststart",
        "-b:v", "1500k",
        mp4_path
    ]
    proc = subprocess.Popen(cmd_mp4, stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    for frame in frames_list:
        proc.stdin.write(frame.tobytes())
    proc.stdin.close()
    proc.wait()

    # 2. 从 MP4 极速转码 WebM 备用
    cmd_webm = [
        FFMPEG_EXE, "-y",
        "-i", mp4_path,
        "-c:v", "libvpx-vp9",
        "-b:v", "1200k",
        "-auto-alt-ref", "0",
        "-cpu-used", "4",
        webm_path
    ]
    subprocess.run(cmd_webm, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    print(f"✔ 成功生成白底双格式视频: {base_filename}.mp4 ({os.path.getsize(mp4_path)} B) / .webm")

# ==============================================================================
# 1. 讲述 / 教学场景视频 (avatar_speaking)
# ==============================================================================
def render_speaking(composites, white_bg):
    base_teach = composites["teach"]
    H, W, C = base_teach.shape
    y_coords, x_coords = np.mgrid[0:H, 0:W].astype(np.float32)

    frames = []
    for f in range(TOTAL_FRAMES):
        t = f / TOTAL_FRAMES
        # 说话节律 (~3.3 Hz)
        speech_rhythm = math.sin(6.0 * math.pi * t) * math.cos(2.0 * math.pi * t)
        mouth_open = max(0.0, speech_rhythm) ** 1.15

        # 讲学节点点头 (8px)
        nod_phase = math.sin(4.0 * math.pi * t)
        nod_disp = 8.0 * max(0.0, nod_phase)
        head_turn = 3.0 * math.sin(2.0 * math.pi * t)
        head_mask = np.clip((Y_NECK + 20.0 - y_coords) / 100.0, 0.0, 1.0)

        # 挥袖手势起伏 (+-14px)
        arm_wave = math.sin(4.0 * math.pi * t - math.pi / 4.0)
        arm_weight = np.exp(-((x_coords - 210.0)**2 / (2 * (65.0**2)) + (y_coords - 180.0)**2 / (2 * (60.0**2))))
        arm_dy = 14.0 * arm_wave * arm_weight
        arm_dx = 10.0 * arm_wave * arm_weight

        # 呼吸
        h_frac = np.clip((Y_GROUND - y_coords) / (Y_GROUND - Y_HEAD_TOP), 0.0, 1.2)
        vert_breath = 5.5 * math.sin(2.0 * math.pi * t) * (h_frac ** 1.3)

        src_y = y_coords - vert_breath - nod_disp * head_mask - arm_dy
        src_x = x_coords - head_turn * head_mask - arm_dx

        warped = np.zeros_like(base_teach)
        coords = [src_y, src_x]
        for c in range(C):
            warped[:, :, c] = map_coordinates(base_teach[:, :, c], coords, order=1, mode='constant', cval=0.0)

        warped = np.clip(warped, 0, 255).astype(np.uint8)
        warped = apply_mouth_articulation(warped, mouth_open, nod_disp=nod_disp, head_turn=head_turn)

        blink = 0.0
        if 36 <= f <= 46:
            blink = math.sin(math.pi * (f - 36) / 10.0)
        warped = apply_eyelid_blink(warped, blink)

        frame_rgb = composite_on_white(warped, white_bg)
        frames.append(frame_rgb)

    encode_rgb_frames(frames, "avatar_speaking", FPS)

# ==============================================================================
# 2. 思考 / 穷理场景视频 (avatar_thinking)
# ==============================================================================
def render_thinking(composites, white_bg):
    base_think = composites["think"]
    H, W, C = base_think.shape
    y_coords, x_coords = np.mgrid[0:H, 0:W].astype(np.float32)

    frames = []
    for f in range(TOTAL_FRAMES):
        t = f / TOTAL_FRAMES

        # 抚须微拂 (9px)
        stroke_phase = math.sin(2.0 * math.pi * t)
        hand_weight = np.exp(-((x_coords - 225.0)**2 / (2 * (50.0**2)) + (y_coords - 175.0)**2 / (2 * (45.0**2))))
        hand_dy = 9.0 * stroke_phase * hand_weight

        # 头部哲思微仰微偏
        head_nod = -4.5 + 2.5 * math.cos(2.0 * math.pi * t)
        head_turn = -3.5 + 1.5 * math.sin(2.0 * math.pi * t)
        head_mask = np.clip((Y_NECK + 20.0 - y_coords) / 100.0, 0.0, 1.0)

        # 沉思深长呼吸 (7px)
        h_frac = np.clip((Y_GROUND - y_coords) / (Y_GROUND - Y_HEAD_TOP), 0.0, 1.2)
        breath = 7.0 * math.sin(2.0 * math.pi * t) * (h_frac ** 1.35)

        src_y = y_coords - breath - head_nod * head_mask - hand_dy
        src_x = x_coords - head_turn * head_mask

        warped = np.zeros_like(base_think)
        coords = [src_y, src_x]
        for c in range(C):
            warped[:, :, c] = map_coordinates(base_think[:, :, c], coords, order=1, mode='constant', cval=0.0)

        warped = np.clip(warped, 0, 255).astype(np.uint8)

        blink = 0.0
        if 50 <= f <= 62:
            blink = 0.8 * math.sin(math.pi * (f - 50) / 12.0)
        warped = apply_eyelid_blink(warped, blink)

        frame_rgb = composite_on_white(warped, white_bg)
        frames.append(frame_rgb)

    encode_rgb_frames(frames, "avatar_thinking", FPS)

# ==============================================================================
# 3. 侧耳倾听 / 审问场景视频 (avatar_listening)
# ==============================================================================
def render_listening(composites, white_bg):
    base_stand = composites["stand"]
    H, W, C = base_stand.shape
    y_coords, x_coords = np.mgrid[0:H, 0:W].astype(np.float32)

    frames = []
    for f in range(TOTAL_FRAMES):
        t = f / TOTAL_FRAMES

        # 上身明显前倾探身 (13px)
        lean_weight = math.sin(math.pi * t)
        h_frac = np.clip((Y_GROUND - y_coords) / (Y_GROUND - Y_HEAD_TOP), 0.0, 1.2)
        lean_disp = 13.0 * lean_weight * (h_frac ** 1.2)

        # 两次诚恳肯定点头
        nod = 0.0
        if 20 <= f <= 40:
            nod = 7.5 * math.sin(math.pi * (f - 20) / 20.0)
        elif 55 <= f <= 75:
            nod = 6.0 * math.sin(math.pi * (f - 55) / 20.0)

        head_turn = 4.0 * lean_weight
        head_mask = np.clip((Y_NECK + 20.0 - y_coords) / 100.0, 0.0, 1.0)
        breath = 4.0 * math.sin(2.0 * math.pi * t) * (h_frac ** 1.3)

        src_y = y_coords - breath - lean_disp - nod * head_mask
        src_x = x_coords - head_turn * head_mask

        warped = np.zeros_like(base_stand)
        coords = [src_y, src_x]
        for c in range(C):
            warped[:, :, c] = map_coordinates(base_stand[:, :, c], coords, order=1, mode='constant', cval=0.0)

        warped = np.clip(warped, 0, 255).astype(np.uint8)

        blink = 0.0
        if 42 <= f <= 52:
            blink = math.sin(math.pi * (f - 42) / 10.0)
        warped = apply_eyelid_blink(warped, blink)

        frame_rgb = composite_on_white(warped, white_bg)
        frames.append(frame_rgb)

    encode_rgb_frames(frames, "avatar_listening", FPS)

# ==============================================================================
# 4. 微笑 / 赞许开悟场景视频 (avatar_smile)
# ==============================================================================
def render_smile(composites, white_bg):
    stand = composites["stand"]
    H, W, C = stand.shape
    y_coords, x_coords = np.mgrid[0:H, 0:W].astype(np.float32)

    frames = []
    for f in range(TOTAL_FRAMES):
        t = f / TOTAL_FRAMES

        # 躬身微颔致礼 (14px)
        nod_cycle = math.sin(math.pi * t)
        bow_nod = 14.0 * nod_cycle
        head_mask = np.clip((Y_NECK + 20.0 - y_coords) / 100.0, 0.0, 1.0)

        # 面颊与嘴角舒展微笑
        smile_intensity = nod_cycle
        cheek_warp_y = 3.5 * smile_intensity * np.exp(-((y_coords - 120.0)**2 / (2 * (16.0**2)) + (x_coords - X_CENTER)**2 / (2 * (25.0**2))))

        h_frac = np.clip((Y_GROUND - y_coords) / (Y_GROUND - Y_HEAD_TOP), 0.0, 1.2)
        breath = 4.5 * math.sin(2.0 * math.pi * t) * (h_frac ** 1.3)

        src_y = y_coords - breath - bow_nod * head_mask + cheek_warp_y
        src_x = x_coords

        warped = np.zeros_like(stand)
        coords = [src_y, src_x]
        for c in range(C):
            warped[:, :, c] = map_coordinates(stand[:, :, c], coords, order=1, mode='constant', cval=0.0)

        warped = np.clip(warped, 0, 255).astype(np.uint8)

        blink = 0.45 * smile_intensity
        warped = apply_eyelid_blink(warped, blink)

        frame_rgb = composite_on_white(warped, white_bg)
        frames.append(frame_rgb)

    encode_rgb_frames(frames, "avatar_smile", FPS)

# ==============================================================================
# 5. 正视镜头 / 待机候教场景视频 (avatar_idle)
# ==============================================================================
def render_idle(composites, white_bg):
    base_stand = composites["stand"]
    H, W, C = base_stand.shape
    y_coords, x_coords = np.mgrid[0:H, 0:W].astype(np.float32)

    frames = []
    for f in range(TOTAL_FRAMES):
        t = f / TOTAL_FRAMES

        # 显著胸腔起伏呼吸 (6.5px, 横向 2.4%)
        breath_phase = math.sin(2.0 * math.pi * t)
        h_frac = np.clip((Y_GROUND - y_coords) / (Y_GROUND - Y_HEAD_TOP), 0.0, 1.2)
        vert_breath = 6.5 * breath_phase * (h_frac ** 1.35)

        chest_weight = np.exp(-((y_coords - Y_CHEST)**2) / (2.0 * (85.0**2)))
        lateral_breath = 0.024 * breath_phase * (x_coords - X_CENTER) * chest_weight

        # 重心微晃 (4.0px)
        sway_phase = math.sin(2.0 * math.pi * t - math.pi / 3.0)
        sway_disp = 4.0 * sway_phase * (h_frac ** 1.4)

        head_mask = np.clip((Y_NECK + 20.0 - y_coords) / 100.0, 0.0, 1.0)
        head_turn = 2.0 * math.sin(2.0 * math.pi * t) * head_mask

        src_y = y_coords - vert_breath
        src_x = x_coords - lateral_breath - sway_disp - head_turn

        warped = np.zeros_like(base_stand)
        coords = [src_y, src_x]
        for c in range(C):
            warped[:, :, c] = map_coordinates(base_stand[:, :, c], coords, order=1, mode='constant', cval=0.0)

        warped = np.clip(warped, 0, 255).astype(np.uint8)

        # 瞬目眨眼
        blink = 0.0
        if 48 <= f <= 58:
            blink = math.sin(math.pi * (f - 48) / 10.0)
        warped = apply_eyelid_blink(warped, blink)

        frame_rgb = composite_on_white(warped, white_bg)
        frames.append(frame_rgb)

    encode_rgb_frames(frames, "avatar_idle", FPS)

def main():
    print("==================================================")
    print("▶ 开始生成考亭先生 3D 白底场景连贯视频体系 (v9.0)...")
    print("==================================================")
    composites = create_base_composites()
    white_bg = get_white_bg_with_shadow()
    print("✔ 纯白高雅背景与姿态复合就绪！")

    print("1/5 渲染讲述/教学场景视频 (avatar_speaking.mp4 / .webm)...")
    render_speaking(composites, white_bg)

    print("2/5 渲染思考/穷理场景视频 (avatar_thinking.mp4 / .webm)...")
    render_thinking(composites, white_bg)

    print("3/5 渲染倾听/审问场景视频 (avatar_listening.mp4 / .webm)...")
    render_listening(composites, white_bg)

    print("4/5 渲染微笑/开悟场景视频 (avatar_smile.mp4 / .webm)...")
    render_smile(composites, white_bg)

    print("5/5 渲染正视镜头/待机场景视频 (avatar_idle.mp4 / .webm)...")
    render_idle(composites, white_bg)

    print("==================================================")
    print("🎉 全部 5 部白底场景视频已成功生成！")
    print("==================================================")

if __name__ == "__main__":
    main()
