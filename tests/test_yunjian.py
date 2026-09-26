import asyncio
import edge_tts

async def test_yunjian():
    text = "后生学者请了！老夫朱元晦。今日诸生莅止考亭书院，不拘经传章句、理气心性，抑或读书治学、为人接物之惑，皆可开诚叩问。老夫当与诸生即物穷理，共究此道。"
    
    # 模拟文人风骨的沉郁庄重：降低频率、舒缓节奏
    communicate = edge_tts.Communicate(
        text,
        voice="zh-CN-YunjianNeural",
        rate="-10%",
        pitch="-3Hz"
    )
    await communicate.save("tests/test_yunjian.mp3")
    print("生成 tests/test_yunjian.mp3 成功！")

if __name__ == "__main__":
    asyncio.run(test_yunjian())

