FROM python:3.11-slim

# 创建非 root 用户，适配云端安全规范
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=7860 \
    HOST=0.0.0.0

WORKDIR $HOME/app

# 安装依赖
COPY --chown=user requirements.txt $HOME/app/
RUN pip install --no-cache-dir --upgrade -r requirements.txt

# 复制工程源码与典籍数据
COPY --chown=user . $HOME/app

# 开放服务端口
EXPOSE 7860

# 启动大儒智能体服务
CMD ["python", "run.py"]
