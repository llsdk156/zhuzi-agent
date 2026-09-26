"""
考亭先生 3D 数字人全时段高动态连贯视频生成引擎 (Dynamic Articulated Digital Human Video Engine v8.5)
彻底告别静态微动图片，构建真正大幅度、生动逼真的高动态数字人视频：
1. speaking: 讲学授课 —— 手部大幅度自然挥袖手势、同步真实开口唇形变化(说话闭合与腔体)、抑扬顿挫点头、生动气韵
2. thinking: 穷理深思 —— 手抚长髯缓抚微动、头部哲思微偏上视、深邃哲理深呼吸
3. listening: 侧耳倾听 —— 上身明显前倾前瞻、两度诚恳微颔迎候、目光专注迎向问者
4. smile: 答毕开悟 —— 躬身微颔致意、慈祥开怀微笑、双眸舒弯、优雅回正
5. idle: 待机候教 —— 显著胸腔起伏呼吸、躯干自然左右重心微晃、生动瞬目闭合

所有视频严密锚定于同一基线坐标系统，确保通过前端双缓冲交叉淡入淡出实现 100% 动作平滑连贯！
"""

import os
import sys
import math
import subprocess
import numpy as np
from PIL import Image
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
TOTAL_FRAMES = 90  # 3.0 秒闭环周期，运动节奏更紧凑生动

# 几何基准锚点
Y_GROUND = 632.0   # 地面基线绝对锁死
Y_CHEST = 220.0
Y_NECK = 160.0
Y_HEAD_TOP = 36.0
X_CENTER = 180.0

def create_base_composites():
    """生成标准站姿与动作全身对齐底图"""
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

def apply_eyelid_blink(arr, blink_val):
    """自然眼睑微闭动效"""
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
    """
    说话时嘴唇与下颌真实开口唇动 (大幅度呈现真人讲学口型)
    - open_amount: [0.0, 1.0]，嘴唇张开幅度
    """
    if open_amount <= 0.04:
        return arr

    res = arr.copy()
    H, W, _ = res.shape
    y_mouth = int(round(117 + nod_disp))
    x_c = int(round(182.0 + head_turn))
    w_m = 11.0
    drop = int(round(7.5 * open_amount))

    # 下颌与长髯整体同步下移
    for y in range(min(H - 1, 220), y_mouth, -1):
        if y - drop >= y_mouth:
            weight = np.exp(-((np.arange(W) - x_c) ** 2) / (2 * (18.0 ** 2)))
            for x in range(max(0, x_c - 28), min(W, x_c + 28)):
                src_y = int(round(y - drop * weight[x]))
                if y_mouth <= src_y < H:
                    res[y, x] = arr[src_y, x]

    # 显现口腔深色内腔 (带深暗红唇腔调，呈现真实说话动态)
    for dy in range(drop):
        y = y_mouth + dy
        if 0 <= y < H:
            for x in range(max(0, x_c - 12), min(W, x_c + 12)):
                dx = (x - x_c) / w_m
                dy_norm = (dy - drop / 2.0) / (drop / 2.0 + 0.1)
                if dx * dx + dy_norm * dy_norm <= 1.15:
                    res[y, x, 0] = int(42 * (1.0 - open_amount * 0.2)) # R
                    res[y, x, 1] = int(18 * (1.0 - open_amount * 0.2)) # G
                    res[y, x, 2] = int(20 * (1.0 - open_amount * 0.2)) # B
                    res[y, x, 3] = 255

    return res

def encode_frames_to_webm(frame_generator, out_path, total_frames, fps=30):
    cmd = [
        FFMPEG_EXE, "-y",
        "-f", "rawvideo",
        "-pix_fmt", "rgba",
        "-s", f"{CANVAS_W}x{CANVAS_H}",
        "-r", str(fps),
        "-i", "-",
        "-c:v", "libvpx-vp9",
        "-pix_fmt", "yuva420p",
        "-b:v", "1000k",
        "-auto-alt-ref", "0",
        "-quality", "good",
        "-cpu-used", "2",
        out_path
    ]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stderr=subprocess.PIPE)
    for frame_arr in frame_generator:
        proc.stdin.write(frame_arr.tobytes())
    proc.stdin.close()
    proc.wait()
    print(f"✔ 成功生成高动态视频: {os.path.basename(out_path)} ({os.path.getsize(out_path)} bytes)")

# ==============================================================================
# 1. 讲学授课 (Speaking) —— 大幅度挥袖手势 + 真实开口唇动 + 抑扬顿挫节点点头
# ==============================================================================
def generate_speaking(composites):
    base_teach = composites["teach"]
    H, W, C = base_teach.shape
    y_coords, x_coords = np.mgrid[0:H, 0:W].astype(np.float32)

    def frames():
        for f in range(TOTAL_FRAMES):
            t = f / TOTAL_FRAMES
            # 1. 讲学语韵双节拍 (Syllable cadence ~3.3 Hz)
            speech_rhythm = math.sin(6.0 * math.pi * t) * math.cos(2.0 * math.pi * t)
            mouth_open = max(0.0, speech_rhythm) ** 1.15
            
            # 2. 传道点头 (强调重点时点头幅度达到 8px)
            nod_phase = math.sin(4.0 * math.pi * t)
            nod_disp = 8.0 * max(0.0, nod_phase)
            head_turn = 3.0 * math.sin(2.0 * math.pi * t)
            head_mask = np.clip((Y_NECK + 20.0 - y_coords) / 100.0, 0.0, 1.0)

            # 3. 大幅度挥袖手势起伏 (手臂区域 x~210, y~180 上下大幅摆动 +-14px, 左右展臂 +-10px)
            arm_wave = math.sin(4.0 * math.pi * t - math.pi / 4.0)
            arm_weight = np.exp(-((x_coords - 210.0)**2 / (2 * (65.0**2)) + (y_coords - 180.0)**2 / (2 * (60.0**2))))
            arm_dy = 14.0 * arm_wave * arm_weight
            arm_dx = 10.0 * arm_wave * arm_weight

            # 4. 躯干呼吸起伏
            h_frac = np.clip((Y_GROUND - y_coords) / (Y_GROUND - Y_HEAD_TOP), 0.0, 1.2)
            vert_breath = 5.5 * math.sin(2.0 * math.pi * t) * (h_frac ** 1.3)

            src_y = y_coords - vert_breath - nod_disp * head_mask - arm_dy
            src_x = x_coords - head_turn * head_mask - arm_dx

            warped = np.zeros_like(base_teach)
            coords = [src_y, src_x]
            for c in range(C):
                warped[:, :, c] = map_coordinates(base_teach[:, :, c], coords, order=1, mode='constant', cval=0.0)

            warped = np.clip(warped, 0, 255).astype(np.uint8)

            # 5. 真实开口唇动合成
            warped = apply_mouth_articulation(warped, mouth_open, nod_disp=nod_disp, head_turn=head_turn)

            # 6. 自然眨眼
            blink = 0.0
            if 36 <= f <= 46:
                blink = math.sin(math.pi * (f - 36) / 10.0)
            warped = apply_eyelid_blink(warped, blink)

            yield warped

    out_file = os.path.join(OUT_DIR, "avatar_speaking.webm")
    encode_frames_to_webm(frames(), out_file, TOTAL_FRAMES, FPS)

# ==============================================================================
# 2. 穷理深思 (Thinking) —— 手抚长髯上下微拂 + 哲思微仰 + 缓慢深呼吸
# ==============================================================================
def generate_thinking(composites):
    base_think = composites["think"]
    H, W, C = base_think.shape
    y_coords, x_coords = np.mgrid[0:H, 0:W].astype(np.float32)

    def frames():
        for f in range(TOTAL_FRAMES):
            t = f / TOTAL_FRAMES

            # 1. 抚须动作：手部与长髯上下缓抚 (幅度 9px)
            stroke_phase = math.sin(2.0 * math.pi * t)
            hand_weight = np.exp(-((x_coords - 225.0)**2 / (2 * (50.0**2)) + (y_coords - 175.0)**2 / (2 * (45.0**2))))
            hand_dy = 9.0 * stroke_phase * hand_weight

            # 2. 头部哲思微偏与仰视 (偏转 4px，微仰 5px)
            head_nod = -4.5 + 2.5 * math.cos(2.0 * math.pi * t)
            head_turn = -3.5 + 1.5 * math.sin(2.0 * math.pi * t)
            head_mask = np.clip((Y_NECK + 20.0 - y_coords) / 100.0, 0.0, 1.0)

            # 3. 沉思深长呼吸 (幅度 7.0px)
            h_frac = np.clip((Y_GROUND - y_coords) / (Y_GROUND - Y_HEAD_TOP), 0.0, 1.2)
            breath = 7.0 * math.sin(2.0 * math.pi * t) * (h_frac ** 1.35)

            src_y = y_coords - breath - head_nod * head_mask - hand_dy
            src_x = x_coords - head_turn * head_mask

            warped = np.zeros_like(base_think)
            coords = [src_y, src_x]
            for c in range(C):
                warped[:, :, c] = map_coordinates(base_think[:, :, c], coords, order=1, mode='constant', cval=0.0)

            warped = np.clip(warped, 0, 255).astype(np.uint8)

            # 沉思微眯瞬目
            blink = 0.0
            if 50 <= f <= 62:
                blink = 0.8 * math.sin(math.pi * (f - 50) / 12.0)
            warped = apply_eyelid_blink(warped, blink)

            yield warped

    out_file = os.path.join(OUT_DIR, "avatar_thinking.webm")
    encode_frames_to_webm(frames(), out_file, TOTAL_FRAMES, FPS)

# ==============================================================================
# 3. 侧耳倾听 (Listening) —— 上身明显前倾前瞻 + 两次真切微颔 + 专注迎候
# ==============================================================================
def generate_listening(composites):
    base_stand = composites["stand"]
    H, W, C = base_stand.shape
    y_coords, x_coords = np.mgrid[0:H, 0:W].astype(np.float32)

    def frames():
        for f in range(TOTAL_FRAMES):
            t = f / TOTAL_FRAMES

            # 1. 上身显著前倾迎候 (大幅度位移 13px)
            lean_weight = math.sin(math.pi * t) # 平滑前倾再回原位
            h_frac = np.clip((Y_GROUND - y_coords) / (Y_GROUND - Y_HEAD_TOP), 0.0, 1.2)
            lean_disp = 13.0 * lean_weight * (h_frac ** 1.2)

            # 2. 倾听中两次生动肯定点头 (在 f=25 与 f=65)
            nod = 0.0
            if 20 <= f <= 40:
                nod = 7.5 * math.sin(math.pi * (f - 20) / 20.0)
            elif 55 <= f <= 75:
                nod = 6.0 * math.sin(math.pi * (f - 55) / 20.0)

            head_turn = 4.0 * lean_weight # 侧首专注看向提问者
            head_mask = np.clip((Y_NECK + 20.0 - y_coords) / 100.0, 0.0, 1.0)

            # 3. 专注轻呼吸
            breath = 4.0 * math.sin(2.0 * math.pi * t) * (h_frac ** 1.3)

            src_y = y_coords - breath - lean_disp - nod * head_mask
            src_x = x_coords - head_turn * head_mask

            warped = np.zeros_like(base_stand)
            coords = [src_y, src_x]
            for c in range(C):
                warped[:, :, c] = map_coordinates(base_stand[:, :, c], coords, order=1, mode='constant', cval=0.0)

            warped = np.clip(warped, 0, 255).astype(np.uint8)

            # 自然眨眼
            blink = 0.0
            if 42 <= f <= 52:
                blink = math.sin(math.pi * (f - 42) / 10.0)
            warped = apply_eyelid_blink(warped, blink)

            yield warped

    out_file = os.path.join(OUT_DIR, "avatar_listening.webm")
    encode_frames_to_webm(frames(), out_file, TOTAL_FRAMES, FPS)

# ==============================================================================
# 4. 答毕赞许 (Smile) —— 躬身微颔致礼 + 开颜舒目 + 优雅回正 (单基准零重影)
# ==============================================================================
def generate_smile(composites):
    stand = composites["stand"]
    H, W, C = stand.shape
    y_coords, x_coords = np.mgrid[0:H, 0:W].astype(np.float32)

    def frames():
        for f in range(TOTAL_FRAMES):
            t = f / TOTAL_FRAMES

            # 1. 躬身微颔肯定：前 40% 颔首致意，后 60% 优雅回正
            nod_cycle = math.sin(math.pi * t)
            bow_nod = 14.0 * nod_cycle # 颔首 14px
            head_mask = np.clip((Y_NECK + 20.0 - y_coords) / 100.0, 0.0, 1.0)

            # 2. 面颊与嘴角舒展上扬 (微笑神态变形场)
            smile_intensity = nod_cycle
            cheek_warp_y = 3.5 * smile_intensity * np.exp(-((y_coords - 120.0)**2 / (2 * (16.0**2)) + (x_coords - X_CENTER)**2 / (2 * (25.0**2))))

            # 3. 舒缓呼气
            h_frac = np.clip((Y_GROUND - y_coords) / (Y_GROUND - Y_HEAD_TOP), 0.0, 1.2)
            breath = 4.5 * math.sin(2.0 * math.pi * t) * (h_frac ** 1.3)

            src_y = y_coords - breath - bow_nod * head_mask + cheek_warp_y
            src_x = x_coords

            warped = np.zeros_like(stand)
            coords = [src_y, src_x]
            for c in range(C):
                warped[:, :, c] = map_coordinates(stand[:, :, c], coords, order=1, mode='constant', cval=0.0)

            warped = np.clip(warped, 0, 255).astype(np.uint8)

            # 4. 微笑中眼眸舒缓微弯
            blink = 0.45 * smile_intensity
            warped = apply_eyelid_blink(warped, blink)

            yield warped

    out_file = os.path.join(OUT_DIR, "avatar_smile.webm")
    encode_frames_to_webm(frames(), out_file, TOTAL_FRAMES, FPS)

# ==============================================================================
# 5. 待机候教 (Idle) —— 鲜活胸腔呼吸 + 重心微摆 + 真实生息
# ==============================================================================
def generate_idle(composites):
    base_stand = composites["stand"]
    H, W, C = base_stand.shape
    y_coords, x_coords = np.mgrid[0:H, 0:W].astype(np.float32)

    def frames():
        for f in range(TOTAL_FRAMES):
            t = f / TOTAL_FRAMES

            # 1. 显著胸腔舒缩呼吸 (幅度达 6.5px，横向胸腔扩张 2.4%)
            breath_phase = math.sin(2.0 * math.pi * t)
            h_frac = np.clip((Y_GROUND - y_coords) / (Y_GROUND - Y_HEAD_TOP), 0.0, 1.2)
            vert_breath = 6.5 * breath_phase * (h_frac ** 1.35)

            chest_weight = np.exp(-((y_coords - Y_CHEST)**2) / (2.0 * (85.0**2)))
            lateral_breath = 0.024 * breath_phase * (x_coords - X_CENTER) * chest_weight

            # 2. 真实活体左右重心晃动 (幅度 4.0px)
            sway_phase = math.sin(2.0 * math.pi * t - math.pi / 3.0)
            sway_disp = 4.0 * sway_phase * (h_frac ** 1.4)

            # 3. 头部轻柔呼吸起伏微偏
            head_mask = np.clip((Y_NECK + 20.0 - y_coords) / 100.0, 0.0, 1.0)
            head_turn = 2.0 * math.sin(2.0 * math.pi * t) * head_mask

            src_y = y_coords - vert_breath
            src_x = x_coords - lateral_breath - sway_disp - head_turn

            warped = np.zeros_like(base_stand)
            coords = [src_y, src_x]
            for c in range(C):
                warped[:, :, c] = map_coordinates(base_stand[:, :, c], coords, order=1, mode='constant', cval=0.0)

            warped = np.clip(warped, 0, 255).astype(np.uint8)

            # 4. 真实自然瞬目 (在 f=48..58 眨眼)
            blink = 0.0
            if 48 <= f <= 58:
                blink = math.sin(math.pi * (f - 48) / 10.0)
            warped = apply_eyelid_blink(warped, blink)

            yield warped

    out_file = os.path.join(OUT_DIR, "avatar_idle.webm")
    encode_frames_to_webm(frames(), out_file, TOTAL_FRAMES, FPS)

def main():
    print("==================================================")
    print("▶ 开始生成考亭先生 3D 高动态无界透明视频体系 (v8.5)...")
    print("==================================================")
    composites = create_base_composites()
    print("✔ 姿态复合就绪！")

    print("1/5 渲染传道讲学高动态视频 (speaking.webm: 挥袖手势+开口唇动+讲学点头)...")
    generate_speaking(composites)

    print("2/5 渲染穷理深思高动态视频 (thinking.webm: 抚髯缓拂+哲思微偏+深长呼吸)...")
    generate_thinking(composites)

    print("3/5 渲染侧耳倾听高动态视频 (listening.webm: 上身前倾+双度微颔+专注迎候)...")
    generate_listening(composites)

    print("4/5 渲染答毕赞许高动态视频 (smile.webm: 躬身微颔+开颜微笑+回正)...")
    generate_smile(composites)

    print("5/5 渲染待机候教高动态视频 (idle.webm: 鲜活胸腔呼吸+重心晃动+生动眨眼)...")
    generate_idle(composites)

    print("==================================================")
    print("🎉 全部 5 部高动态视频已生成完毕！")
    print("==================================================")

if __name__ == "__main__":
    main()
