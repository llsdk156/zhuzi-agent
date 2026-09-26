import urllib.request
import json
import time

def pull_model(model_name="qwen2.5:0.5b"):
    url = "http://127.0.0.1:11434/api/pull"
    payload = json.dumps({"name": model_name, "stream": True}).encode("utf-8")
    req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"})
    
    print(f"正在通过本地 Ollama 下载高精轻量大模型: {model_name} (约390MB)...")
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            for line in resp:
                if line:
                    data = json.loads(line.decode("utf-8"))
                    status = data.get("status", "")
                    total = data.get("total", 0)
                    completed = data.get("completed", 0)
                    if total > 0:
                        pct = int(completed / total * 100)
                        print(f"\r进度: {status} {pct}%", end="", flush=True)
                    else:
                        print(f"\r状态: {status}", end="", flush=True)
            print("\n[SUCCESS] 模型下载并加载成功！")
    except Exception as e:
        print("\n下载异常:", e)

if __name__ == "__main__":
    pull_model()

