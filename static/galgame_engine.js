/**
 * 考亭书院第一人称 GalGame 沉浸式讲筵研学引擎 (GalGame Engine v1.0)
 * 100% 依准参考图4故事板规范 · 第一人称学生视角 · 先生层层设问引导 · 动态黑板板书 · 分支剧情决策树
 */

class GalGameEngine {
    constructor() {
        this.containerEl = null;
        this.charImgEl = null;
        this.faceImgEl = null;
        this.speakerNameEl = null;
        this.dialogueTextEl = null;
        this.choicesDockEl = null;
        this.blackboardTextEl = null;
        this.scoreBadgeEl = null;
        this.audioBtnEl = null;

        // 剧情状态
        this.currentChapterId = "wuyi_jingshe";
        this.currentStepIndex = 0;
        this.historyLog = [];
        this.studyRecords = [];   // 研学履历与问难记录
        this.enlightenment = 60; // 悟性值
        this.reverence = 70;      // 持敬度
        this.typewriterTimer = null;
        this.isTyping = false;
        this.currentFullText = "";

        // 剧本数据库 (四大经典研学章程，层层设问、启发式因材施教)
        this.chapters = {
        "wuyi_jingshe": {
                "title": "《隐屏结庐·武夷精舍》· 聚徒开山",
                "badge": "武夷精舍开山首讲",
                "steps": [
                        {
                                "speaker": "考亭先生",
                                "pose": "act_stand",
                                "face": "face_calm",
                                "blackboard": "琴书五十载 隐屏云雾深
武夷精舍 聚徒传道",
                                "text": "诸生进前！今日老夫在武夷山隐屏峰下武夷精舍开席。淳熙十年，老夫卜居于此，结构精舍数楹，题曰武夷精舍。诸生环顾窗外，隐屏森秀，天柱玉立，清溪抱门。老夫且问：何以老夫不爱繁华郡邑，偏来这岩壑深秀处开讲？",
                                "choices": [
                                        {
                                                "text": "为避俗嚣扰心，借武夷山川之幽胜，涵养本心，聚志穷理。",
                                                "nextStep": 1,
                                                "gainScore": 8
                                        },
                                        {
                                                "text": "武夷山水奇秀，便于师生游目骋怀、赋诗抒啸。",
                                                "nextStep": 2,
                                                "gainScore": 6
                                        },
                                        {
                                                "text": "请先生开示精舍立心之宏旨！",
                                                "nextStep": 3,
                                                "gainScore": 5
                                        }
                                ]
                        },
                        {
                                "speaker": "考亭先生",
                                "pose": "act_explain_gesture",
                                "face": "face_focused",
                                "blackboard": "收摄放心 主敬存诚
静中涵养 动中省察",
                                "text": "善哉善问！学者当知，闹市之中，人心最易随波逐流、气浮心粗。老夫结庐隐屏，正欲借山川清虚之气，使门人收摄放心，主敬存诚。于静中体认仁义礼智之天理，方有入圣之基！",
                                "choices": [
                                        {
                                                "text": "弟子受教！敢问在精舍之中，每日修道进业次序当如何安排？",
                                                "nextStep": 4,
                                                "gainScore": 8
                                        }
                                ]
                        },
                        {
                                "speaker": "考亭先生",
                                "pose": "act_read_book",
                                "face": "face_gentle",
                                "blackboard": "即景明理 诗以言志
物我两忘 融通太虚",
                                "text": "诗家之游，不过娱情适意；理学之游，贵在即景悟道。老夫作精舍杂咏十二首，自仁智堂至隐求室，无一处不是理学工夫的寄托。山川有条理，正如吾心有准则！",
                                "choices": [
                                        {
                                                "text": "山川草木皆具至理，学生愿闻其详！",
                                                "nextStep": 4,
                                                "gainScore": 8
                                        }
                                ]
                        },
                        {
                                "speaker": "考亭先生",
                                "pose": "act_point_focus",
                                "face": "face_serious",
                                "blackboard": "穷理 正心 修身
不为虚名 务求实学",
                                "text": "精舍讲学之旨，首在穷理、正心、修身。每日黎明起坐，整肃衣冠，端坐默涵。不求浮华虚誉，务使身心日与圣贤之教相孚，方不负此山水灵秀！",
                                "choices": [
                                        {
                                                "text": "弟子谨遵教谕！愿随先生升堂研习下一章程！",
                                                "nextStep": 4,
                                                "gainScore": 8
                                        }
                                ]
                        },
                        {
                                "speaker": "考亭先生",
                                "pose": "act_summary",
                                "face": "face_encouraging",
                                "blackboard": "精舍开山 考亭宗风
道贯古今 理润身心",
                                "text": "好！今日诸生初入精舍，志向既立，根基渐固。下座之后，宜于隐屏石壁下端坐涵泳，将今日所论反复体省。仁兄且勉之！",
                                "choices": [
                                        {
                                                "text": "弟子受教铭心！愿重温精舍开篇讲席",
                                                "nextStep": 0,
                                                "gainScore": 5
                                        },
                                        {
                                                "text": "前往下一讲席：《九曲寻源·棹歌理趣》",
                                                "nextChapter": "jiuqu_zhaoge"
                                        }
                                ]
                        }
                ]
        },
        "jiuqu_zhaoge": {
                "title": "《九曲寻源·棹歌理趣》· 泛舟溯理",
                "badge": "武夷棹歌理趣真诠",
                "steps": [
                        {
                                "speaker": "考亭先生",
                                "pose": "act_stand",
                                "face": "face_calm",
                                "blackboard": "武夷山上有仙灵 山下寒流曲曲清
欲识高人岑寂趣 且听棹歌三两声",
                                "text": "诸生请听！老夫泛舟武夷九曲溪，信手写下武夷九曲棹歌十首。后人多道是山水奇绝之咏，却不知老夫乃是将平生求道寻源之精义，全数融铸于一曲至九曲之行舟之中！仁兄试思，何以老夫之舟是从一曲溯流而上至九曲，而非顺流而下？",
                                "choices": [
                                        {
                                                "text": "溯流寻源，如为学逆水行舟，须由浅入深，穷格道学源头！",
                                                "nextStep": 1,
                                                "gainScore": 10
                                        },
                                        {
                                                "text": "九曲深处清幽绝俗，寓意超凡入圣、返璞归真！",
                                                "nextStep": 2,
                                                "gainScore": 8
                                        },
                                        {
                                                "text": "请先生详拆问渠那得清如许之活水源头！",
                                                "nextStep": 3,
                                                "gainScore": 6
                                        }
                                ]
                        },
                        {
                                "speaker": "考亭先生",
                                "pose": "act_explain_gesture",
                                "face": "face_focused",
                                "blackboard": "由下流溯至源头
由器入道 由粗入精",
                                "text": "善哉！学者读书为学，正如扁舟溯九曲而上。一曲二曲处，风浪湍急，两岸崖壁险峻，此初学者破除客尘、摸索门径之时；行至五曲六曲，隐屏精舍在望，云开日出；及至八曲九曲，桑麻平旷，源头活水汪洋自肆！",
                                "choices": [
                                        {
                                                "text": "先生喻理如神！学生当如棹夫用力，不使片刻停桡！",
                                                "nextStep": 4,
                                                "gainScore": 8
                                        }
                                ]
                        },
                        {
                                "speaker": "考亭先生",
                                "pose": "act_read_book",
                                "face": "face_gentle",
                                "blackboard": "即物明理 鸢飞鱼跃
自然真趣 触目菩提",
                                "text": "溪流之回旋，山岩之参差，皆有必然条理。老夫于棹歌之中，寄托鸢飞鱼跃之道体。诸生舟行溪中，目之所及、耳之所闻，若能体察得天理流行，则无处不是道场！",
                                "choices": [
                                        {
                                                "text": "受教！请先生颁下棹歌研习小结！",
                                                "nextStep": 4,
                                                "gainScore": 8
                                        }
                                ]
                        },
                        {
                                "speaker": "考亭先生",
                                "pose": "act_point_focus",
                                "face": "face_serious",
                                "blackboard": "半亩方塘一鉴开 天光云影共徘徊
问渠那得清如许 为有源头活水来",
                                "text": "源头活水，乃吾心不竭之生机与圣人之道体！若无活水灌注，方塘顷刻便成死水污淖。学者每日读书致知，正是不断引入源头活水，荡涤身心渣滓！",
                                "choices": [
                                        {
                                                "text": "弟子当每日引活水洗涤心性！愿入下一章程！",
                                                "nextStep": 4,
                                                "gainScore": 8
                                        }
                                ]
                        },
                        {
                                "speaker": "考亭先生",
                                "pose": "act_summary",
                                "face": "face_encouraging",
                                "blackboard": "九曲溯源 棹歌理趣
理水相融 考亭心印",
                                "text": "好！今日论及棹歌理趣，诸生当知诗中有理、理中有境。下座后宜默诵棹歌，回思行舟溯源之志！",
                                "choices": [
                                        {
                                                "text": "弟子重温本篇棹歌之旨",
                                                "nextStep": 0,
                                                "gainScore": 5
                                        },
                                        {
                                                "text": "前往下一讲席：《岩壑瀹茗·武夷茶理》",
                                                "nextChapter": "wuyi_tea"
                                        }
                                ]
                        }
                ]
        },
        "wuyi_tea": {
                "title": "《岩壑瀹茗·武夷茶理》· 敬以直内",
                "badge": "武夷茶道理学工夫",
                "steps": [
                        {
                                "speaker": "考亭先生",
                                "pose": "act_stand",
                                "face": "face_calm",
                                "blackboard": "客来莫道无供设 一盏清茶便当席
清虚静泰 涵养本原",
                                "text": "诸生进前，且啜一盏武夷岩茶！山中岩隙所孕灵芽，吸日月精华，经炭火烹瀹，清香内敛。老夫烹茶待客，常以茶道示门人：饮茶不可牛饮，须平心静气、细品其甘苦回甘。仁兄试道其理：茶道与吾儒主敬涵养，有何通感之处？",
                                "choices": [
                                        {
                                                "text": "瀹茗清虚，如君子主敬整躬，涤除胸中客尘杂念！",
                                                "nextStep": 1,
                                                "gainScore": 10
                                        },
                                        {
                                                "text": "茶味先苦后甘，正如修道下苦工夫，后得纯和之乐！",
                                                "nextStep": 2,
                                                "gainScore": 8
                                        },
                                        {
                                                "text": "请问先生客来瀹茗与修身处世之道有何启发？",
                                                "nextStep": 3,
                                                "gainScore": 6
                                        }
                                ]
                        },
                        {
                                "speaker": "考亭先生",
                                "pose": "act_explain_gesture",
                                "face": "face_focused",
                                "blackboard": "主敬以直内 涤除客尘
心若止水 清气自生",
                                "text": "善哉！茗茶之妙，全在一清字。人心本来虚明洞达，只因私欲杂念侵袭，遂致浊气用事。煎水瀹茗之际，看白汽袅袅、茶汤澄澈，学者敛气端坐，心意专注，此即居敬持志之现成法门！",
                                "choices": [
                                        {
                                                "text": "弟子顿悟！日用接物之间，处处皆可行主敬之功！",
                                                "nextStep": 4,
                                                "gainScore": 8
                                        }
                                ]
                        },
                        {
                                "speaker": "考亭先生",
                                "pose": "act_point_focus",
                                "face": "face_serious",
                                "blackboard": "苦尽甘来 纯粹至善
坚韧笃行 方成大器",
                                "text": "岩茶初入口，微苦而涩，旋即生津回甘，芳馨久留舌本。圣学亦然！初学格物致知、收摄心性，甚觉束缚辛苦；及至积习日久，理明心泰，浩然自得，其乐不可胜言！",
                                "choices": [
                                        {
                                                "text": "学生当下苦工夫，不畏初学之艰难！",
                                                "nextStep": 4,
                                                "gainScore": 8
                                        }
                                ]
                        },
                        {
                                "speaker": "考亭先生",
                                "pose": "act_read_book",
                                "face": "face_gentle",
                                "blackboard": "澹泊明志 俭以养德
君子之交 淡若清泉",
                                "text": "一盏清茶待远客，不假膏梁酒馔之费，尽显君子澹泊之风。为官处事，亦当如茶汤一般清澈透明，一尘不染，方不负天理民心！",
                                "choices": [
                                        {
                                                "text": "弟子受教铭心！请先生颁下茶理小结！",
                                                "nextStep": 4,
                                                "gainScore": 8
                                        }
                                ]
                        },
                        {
                                "speaker": "考亭先生",
                                "pose": "act_summary",
                                "face": "face_encouraging",
                                "blackboard": "岩壑瀹茗 理在茶中
以敬直内 终日怡然",
                                "text": "甚好！今日品茶明理，日后诸生提壶啜茗之时，当常思此‘清、敬、澹、远’四字。以此涵养身心，必有受用！",
                                "choices": [
                                        {
                                                "text": "弟子温习武夷茶理讲席",
                                                "nextStep": 0,
                                                "gainScore": 5
                                        },
                                        {
                                                "text": "前往下一讲席：《崇安赈恤·五夫社仓》",
                                                "nextChapter": "wufu_shecang"
                                        }
                                ]
                        }
                ]
        },
        "wufu_shecang": {
                "title": "《崇安赈恤·五夫社仓》· 经世实践",
                "badge": "理学家经世恤民法式",
                "steps": [
                        {
                                "speaker": "考亭先生",
                                "pose": "act_stand",
                                "face": "face_calm",
                                "blackboard": "社仓石碑 垂范万世
实学笃行 理在民心",
                                "text": "诸生严肃！世人多讥老夫理学为虚名空谈、不切世用，此乃不知老夫者之妄言！乾道四年，建宁大饥，老夫力请于府，创置崇安五夫社仓。老夫尝言：天下莫大之恶，莫过于慕虚名而害实事。仁兄今日知老夫立社仓，其法度规矩究竟妙在何处？",
                                "choices": [
                                        {
                                                "text": "规矩严整方能长久！学生领会义利双行之妙！",
                                                "nextStep": 1,
                                                "gainScore": 8
                                        },
                                        {
                                                "text": "社仓不仅赈饥，更寄托天下为公、富民足国之大志！",
                                                "nextStep": 2,
                                                "gainScore": 8
                                        },
                                        {
                                                "text": "请先生开示五夫社仓立制规矩与恤民苦心！",
                                                "nextStep": 3,
                                                "gainScore": 6
                                        }
                                ]
                        },
                        {
                                "speaker": "考亭先生",
                                "pose": "act_explain_gesture",
                                "face": "face_focused",
                                "blackboard": "利不可独专 名不可虚受
仓规严明 公心为上",
                                "text": "立制至为精密！老夫手订社仓规约，设仓官、仓正，由乡贤洁廉者公选充管。每次开仓出纳，明立簿籍，贷谷取息不过极低二分；若遇大歉岁，全免其息；连年大饥，并免本钱！官不经手而民享其利，此所以垂范久远！",
                                "choices": [
                                        {
                                                "text": "制度精微入细，公私交济！学生叹服先生经世才猷！",
                                                "nextStep": 4,
                                                "gainScore": 10
                                        }
                                ]
                        },
                        {
                                "speaker": "考亭先生",
                                "pose": "act_point_focus",
                                "face": "face_serious",
                                "blackboard": "民胞物与 念兹在兹
经世致用 理学归宿",
                                "text": "横渠先生言民胞物与，非空谈也！天下百姓嗷嗷待哺，吾辈读书穷理，若不能设法活其性命、安其生业，虽口谈仁义万卷，与土木何异？理学正是要落实于济世安民之中！",
                                "choices": [
                                        {
                                                "text": "真知必能践履！学生当以实学经世为志！",
                                                "nextStep": 4,
                                                "gainScore": 8
                                        }
                                ]
                        },
                        {
                                "speaker": "考亭先生",
                                "pose": "act_read_book",
                                "face": "face_gentle",
                                "blackboard": "不耗官帑 不累闾阎
自治自足 万世永赖",
                                "text": "五夫社仓历十四年而储谷达数万石，全活数郡生灵。后来宋孝宗闻之，诏令天下诸州通行五夫社仓法。儒者经世，贵在实事求是，深谋远虑，不可图一时侥幸！",
                                "choices": [
                                        {
                                                "text": "学生受教！愿入下一章程研讨鹅湖论道！",
                                                "nextStep": 4,
                                                "gainScore": 8
                                        }
                                ]
                        },
                        {
                                "speaker": "考亭先生",
                                "pose": "act_summary",
                                "face": "face_encouraging",
                                "blackboard": "五夫社仓 经世实学
知行合一 王道根基",
                                "text": "五夫社仓规约刻于石碑，至今犹存五夫里。仁兄切记：天下莫大之恶，莫过于慕虚名而害实事。今日学者读书，必当关切社稷民生，方不负此生顶天立地之身！",
                                "choices": [
                                        {
                                                "text": "弟子受教铭心！愿重温五夫社仓讲席",
                                                "nextStep": 0,
                                                "gainScore": 5
                                        },
                                        {
                                                "text": "探讨理学论辩：进入《鹅湖论道·武夷辨异》",
                                                "nextChapter": "ehu_debate"
                                        }
                                ]
                        }
                ]
        },
        "ehu_debate": {
                "title": "《铅山相逢·鹅湖论道》· 朱陆异同",
                "badge": "宋代理学第一论辩",
                "steps": [
                        {
                                "speaker": "考亭先生",
                                "pose": "act_stand",
                                "face": "face_calm",
                                "blackboard": "淳熙二年 铅山之会
尊德性与道问学 理学两峰对峙",
                                "text": "诸生请了！淳熙二年，东莱吕伯恭敦请老夫与陆九龄、陆九渊兄弟会于铅山鹅湖寺。九渊倡简易之工夫，主心即是理，以为发明本心则千圣自备，讥老夫道问学为支离。诸生且看，这场鹅湖论辩，究竟争的是什么关键？",
                                "choices": [
                                        {
                                                "text": "争在为学门径：一主即物穷理，一主发明本心，功夫次第截然不同！",
                                                "nextStep": 1,
                                                "gainScore": 10
                                        },
                                        {
                                                "text": "九渊之学恐近禅学狂简，先生道问学方是孔孟正脉阶梯！",
                                                "nextStep": 2,
                                                "gainScore": 8
                                        },
                                        {
                                                "text": "请先生开示尊德性与道问学如何兼通并育！",
                                                "nextStep": 3,
                                                "gainScore": 6
                                        }
                                ]
                        },
                        {
                                "speaker": "考亭先生",
                                "pose": "act_explain_gesture",
                                "face": "face_focused",
                                "blackboard": "不可悬空索理
致知格物 方见天理纯粹",
                                "text": "诸生切记：人非生而知之者。若抛开六经群典、抛开天下万物之理，仅向自家里摸索，极易以己之偏见认作天理，流入陆学空疏放肆之弊！故必由格物致知，方能达至诚意正心之境！",
                                "choices": [
                                        {
                                                "text": "先生正本清源！无梯阶何以上高楼，格物正是坚实台阶！",
                                                "nextStep": 4,
                                                "gainScore": 8
                                        }
                                ]
                        },
                        {
                                "speaker": "考亭先生",
                                "pose": "act_point_focus",
                                "face": "face_serious",
                                "blackboard": "德性本尊 问学是功
交相发用 不可偏废",
                                "text": "老夫并非不尊德性！老夫尝言：尊德性而道问学。德性本尊，然而若无道问学之功，何以知所尊为何物？如盲人夜行，虽有向往光明之志，终恐失足深渊！",
                                "choices": [
                                        {
                                                "text": "学问之道，博约并重，学生深受启发！",
                                                "nextStep": 4,
                                                "gainScore": 8
                                        }
                                ]
                        },
                        {
                                "speaker": "考亭先生",
                                "pose": "act_read_book",
                                "face": "face_gentle",
                                "blackboard": "和而不同 求同存异
君子周而不比",
                                "text": "鹅湖之会虽各持己见，然老夫与子静兄弟终生互敬道义。子静登白鹿洞书院讲堂，讲君子喻于义小人喻于利，老夫率诸生肃听，喜极汗下，亲立讲义石碑以昭后学！",
                                "choices": [
                                        {
                                                "text": "先贤旷达坦荡之文人风骨，令后世高山仰止！",
                                                "nextStep": 4,
                                                "gainScore": 8
                                        }
                                ]
                        },
                        {
                                "speaker": "考亭先生",
                                "pose": "act_summary",
                                "face": "face_encouraging",
                                "blackboard": "鹅湖明辨 道统渊澄
即物穷理 虚心涵泳",
                                "text": "好！今日论辩鹅湖大旨，诸生切莫随人附和。学问贵在切己用功，博学审问慎思明辨，而后笃行之！",
                                "choices": [
                                        {
                                                "text": "弟子重温鹅湖之会精义",
                                                "nextStep": 0,
                                                "gainScore": 5
                                        },
                                        {
                                                "text": "前往下一讲席：《万物条理·武夷山川》",
                                                "nextChapter": "daxue_gewu"
                                        }
                                ]
                        }
                ]
        },
        "daxue_gewu": {
                "title": "《万物条理·武夷山川》· 理一分殊",
                "badge": "格物致知终极宇宙观",
                "steps": [
                        {
                                "speaker": "考亭先生",
                                "pose": "act_stand",
                                "face": "face_calm",
                                "blackboard": "未有天地之先 毕竟也先有此理
理一分殊 月印万川",
                                "text": "诸生且望窗外大王峰与玉女峰！万木森罗，溪流逶迤，禽鸟相鸣。老夫尝言：未有天地之先，毕竟是先有此理。天地万物，一草一木皆有其必然之理。仁兄请思，何谓理一分殊、月印万川？",
                                "choices": [
                                        {
                                                "text": "理体本一，散见于万事万物则各具殊用，如一月印现于千江！",
                                                "nextStep": 1,
                                                "gainScore": 10
                                        },
                                        {
                                                "text": "格天地山川草木之理，正是反求吾心之德性！",
                                                "nextStep": 2,
                                                "gainScore": 8
                                        },
                                        {
                                                "text": "请先生传授学者如何在武夷山居日用中真正格物穷理！",
                                                "nextStep": 3,
                                                "gainScore": 6
                                        }
                                ]
                        },
                        {
                                "speaker": "考亭先生",
                                "pose": "act_explain_gesture",
                                "face": "face_focused",
                                "blackboard": "万物皆具一理 理具于万物
物各付物 莫不由理",
                                "text": "善哉善问！上而天地之道，下而一草一木之微，皆有必然之理。比如这一几一案，有做几案的理；君之仁，臣之忠，有为君为臣的理。正如一月当空，千江之水各有一月。理本是一，散于万物则各具殊用！",
                                "choices": [
                                        {
                                                "text": "月印万川！弟子茅塞顿开，领悟全体大用之妙！",
                                                "nextStep": 4,
                                                "gainScore": 8
                                        }
                                ]
                        },
                        {
                                "speaker": "考亭先生",
                                "pose": "act_point_focus",
                                "face": "face_serious",
                                "blackboard": "由浅入深 积久贯通
今日格一件 明日格一件",
                                "text": "老夫岂教诸生走马看花、茫无统绪地去穷万物？万事皆有条理。先从切近处穷起，先读圣贤之言，明夫伦常日用。理通一处，余处自可触类旁通。此即知行相须、积久自融之妙！",
                                "choices": [
                                        {
                                                "text": "受教！弟子当从小处着手，扎实日课！",
                                                "nextStep": 4,
                                                "gainScore": 8
                                        }
                                ]
                        },
                        {
                                "speaker": "考亭先生",
                                "pose": "act_read_book",
                                "face": "face_gentle",
                                "blackboard": "即物穷理 切己体察
知行并进 止于至善",
                                "text": "在武夷山中，一泉一石皆可穷格。看流水向下奔流，知水之理；看草木逢春发生，知仁之理。将万物之理收敛于自家身心，事事求其所当然与所以然，便是真知行！",
                                "choices": [
                                        {
                                                "text": "弟子铭感五内！请先生颁下讲席小结与印可！",
                                                "nextStep": 4,
                                                "gainScore": 8
                                        }
                                ]
                        },
                        {
                                "speaker": "考亭先生",
                                "pose": "act_summary",
                                "face": "face_encouraging",
                                "blackboard": "讲筵圆满 明理笃行
考亭文公印可",
                                "text": "好！今日诸生升筵对问，能于纲领节目层层致疑，颇有精进之机。为学正如造塔，今日打牢基址，明日方可步步登高。仁兄且将今日所悟书写于心，下座后切实涵养践履！",
                                "choices": [
                                        {
                                                "text": "弟子谨遵师训！愿重温万物条理讲席",
                                                "nextStep": 0,
                                                "gainScore": 5
                                        },
                                        {
                                                "text": "圆满结业，前往考校堂检验研学所获！",
                                                "nextAction": "nav_quiz"
                                        }
                                ]
                        }
                ]
        },
        "daxue": {
                "title": "《隐屏结庐·武夷精舍》· 聚徒开山",
                "badge": "武夷精舍开山首讲",
                "steps": [
                        {
                                "speaker": "考亭先生",
                                "pose": "act_stand",
                                "face": "face_calm",
                                "blackboard": "琴书五十载 隐屏云雾深
武夷精舍 聚徒传道",
                                "text": "诸生进前！今日老夫在武夷山隐屏峰下武夷精舍开席。淳熙十年，老夫卜居于此，结构精舍数楹，题曰武夷精舍。诸生环顾窗外，隐屏森秀，天柱玉立，清溪抱门。老夫且问：何以老夫不爱繁华郡邑，偏来这岩壑深秀处开讲？",
                                "choices": [
                                        {
                                                "text": "为避俗嚣扰心，借武夷山川之幽胜，涵养本心，聚志穷理。",
                                                "nextStep": 1,
                                                "gainScore": 8
                                        },
                                        {
                                                "text": "武夷山水奇秀，便于师生游目骋怀、赋诗抒啸。",
                                                "nextStep": 2,
                                                "gainScore": 6
                                        },
                                        {
                                                "text": "请先生开示精舍立心之宏旨！",
                                                "nextStep": 3,
                                                "gainScore": 5
                                        }
                                ]
                        },
                        {
                                "speaker": "考亭先生",
                                "pose": "act_explain_gesture",
                                "face": "face_focused",
                                "blackboard": "收摄放心 主敬存诚
静中涵养 动中省察",
                                "text": "善哉善问！学者当知，闹市之中，人心最易随波逐流、气浮心粗。老夫结庐隐屏，正欲借山川清虚之气，使门人收摄放心，主敬存诚。于静中体认仁义礼智之天理，方有入圣之基！",
                                "choices": [
                                        {
                                                "text": "弟子受教！敢问在精舍之中，每日修道进业次序当如何安排？",
                                                "nextStep": 4,
                                                "gainScore": 8
                                        }
                                ]
                        },
                        {
                                "speaker": "考亭先生",
                                "pose": "act_read_book",
                                "face": "face_gentle",
                                "blackboard": "即景明理 诗以言志
物我两忘 融通太虚",
                                "text": "诗家之游，不过娱情适意；理学之游，贵在即景悟道。老夫作精舍杂咏十二首，自仁智堂至隐求室，无一处不是理学工夫的寄托。山川有条理，正如吾心有准则！",
                                "choices": [
                                        {
                                                "text": "山川草木皆具至理，学生愿闻其详！",
                                                "nextStep": 4,
                                                "gainScore": 8
                                        }
                                ]
                        },
                        {
                                "speaker": "考亭先生",
                                "pose": "act_point_focus",
                                "face": "face_serious",
                                "blackboard": "穷理 正心 修身
不为虚名 务求实学",
                                "text": "精舍讲学之旨，首在穷理、正心、修身。每日黎明起坐，整肃衣冠，端坐默涵。不求浮华虚誉，务使身心日与圣贤之教相孚，方不负此山水灵秀！",
                                "choices": [
                                        {
                                                "text": "弟子谨遵教谕！愿随先生升堂研习下一章程！",
                                                "nextStep": 4,
                                                "gainScore": 8
                                        }
                                ]
                        },
                        {
                                "speaker": "考亭先生",
                                "pose": "act_summary",
                                "face": "face_encouraging",
                                "blackboard": "精舍开山 考亭宗风
道贯古今 理润身心",
                                "text": "好！今日诸生初入精舍，志向既立，根基渐固。下座之后，宜于隐屏石壁下端坐涵泳，将今日所论反复体省。仁兄且勉之！",
                                "choices": [
                                        {
                                                "text": "弟子受教铭心！愿重温精舍开篇讲席",
                                                "nextStep": 0,
                                                "gainScore": 5
                                        },
                                        {
                                                "text": "前往下一讲席：《九曲寻源·棹歌理趣》",
                                                "nextChapter": "jiuqu_zhaoge"
                                        }
                                ]
                        }
                ]
        },
        "reading_methods": {
                "title": "《九曲寻源·棹歌理趣》· 泛舟溯理",
                "badge": "武夷棹歌理趣真诠",
                "steps": [
                        {
                                "speaker": "考亭先生",
                                "pose": "act_stand",
                                "face": "face_calm",
                                "blackboard": "武夷山上有仙灵 山下寒流曲曲清
欲识高人岑寂趣 且听棹歌三两声",
                                "text": "诸生请听！老夫泛舟武夷九曲溪，信手写下武夷九曲棹歌十首。后人多道是山水奇绝之咏，却不知老夫乃是将平生求道寻源之精义，全数融铸于一曲至九曲之行舟之中！仁兄试思，何以老夫之舟是从一曲溯流而上至九曲，而非顺流而下？",
                                "choices": [
                                        {
                                                "text": "溯流寻源，如为学逆水行舟，须由浅入深，穷格道学源头！",
                                                "nextStep": 1,
                                                "gainScore": 10
                                        },
                                        {
                                                "text": "九曲深处清幽绝俗，寓意超凡入圣、返璞归真！",
                                                "nextStep": 2,
                                                "gainScore": 8
                                        },
                                        {
                                                "text": "请先生详拆问渠那得清如许之活水源头！",
                                                "nextStep": 3,
                                                "gainScore": 6
                                        }
                                ]
                        },
                        {
                                "speaker": "考亭先生",
                                "pose": "act_explain_gesture",
                                "face": "face_focused",
                                "blackboard": "由下流溯至源头
由器入道 由粗入精",
                                "text": "善哉！学者读书为学，正如扁舟溯九曲而上。一曲二曲处，风浪湍急，两岸崖壁险峻，此初学者破除客尘、摸索门径之时；行至五曲六曲，隐屏精舍在望，云开日出；及至八曲九曲，桑麻平旷，源头活水汪洋自肆！",
                                "choices": [
                                        {
                                                "text": "先生喻理如神！学生当如棹夫用力，不使片刻停桡！",
                                                "nextStep": 4,
                                                "gainScore": 8
                                        }
                                ]
                        },
                        {
                                "speaker": "考亭先生",
                                "pose": "act_read_book",
                                "face": "face_gentle",
                                "blackboard": "即物明理 鸢飞鱼跃
自然真趣 触目菩提",
                                "text": "溪流之回旋，山岩之参差，皆有必然条理。老夫于棹歌之中，寄托鸢飞鱼跃之道体。诸生舟行溪中，目之所及、耳之所闻，若能体察得天理流行，则无处不是道场！",
                                "choices": [
                                        {
                                                "text": "受教！请先生颁下棹歌研习小结！",
                                                "nextStep": 4,
                                                "gainScore": 8
                                        }
                                ]
                        },
                        {
                                "speaker": "考亭先生",
                                "pose": "act_point_focus",
                                "face": "face_serious",
                                "blackboard": "半亩方塘一鉴开 天光云影共徘徊
问渠那得清如许 为有源头活水来",
                                "text": "源头活水，乃吾心不竭之生机与圣人之道体！若无活水灌注，方塘顷刻便成死水污淖。学者每日读书致知，正是不断引入源头活水，荡涤身心渣滓！",
                                "choices": [
                                        {
                                                "text": "弟子当每日引活水洗涤心性！愿入下一章程！",
                                                "nextStep": 4,
                                                "gainScore": 8
                                        }
                                ]
                        },
                        {
                                "speaker": "考亭先生",
                                "pose": "act_summary",
                                "face": "face_encouraging",
                                "blackboard": "九曲溯源 棹歌理趣
理水相融 考亭心印",
                                "text": "好！今日论及棹歌理趣，诸生当知诗中有理、理中有境。下座后宜默诵棹歌，回思行舟溯源之志！",
                                "choices": [
                                        {
                                                "text": "弟子重温本篇棹歌之旨",
                                                "nextStep": 0,
                                                "gainScore": 5
                                        },
                                        {
                                                "text": "前往下一讲席：《岩壑瀹茗·武夷茶理》",
                                                "nextChapter": "wuyi_tea"
                                        }
                                ]
                        }
                ]
        },
        "jinsi": {
                "title": "《岩壑瀹茗·武夷茶理》· 敬以直内",
                "badge": "武夷茶道理学工夫",
                "steps": [
                        {
                                "speaker": "考亭先生",
                                "pose": "act_stand",
                                "face": "face_calm",
                                "blackboard": "客来莫道无供设 一盏清茶便当席
清虚静泰 涵养本原",
                                "text": "诸生进前，且啜一盏武夷岩茶！山中岩隙所孕灵芽，吸日月精华，经炭火烹瀹，清香内敛。老夫烹茶待客，常以茶道示门人：饮茶不可牛饮，须平心静气、细品其甘苦回甘。仁兄试道其理：茶道与吾儒主敬涵养，有何通感之处？",
                                "choices": [
                                        {
                                                "text": "瀹茗清虚，如君子主敬整躬，涤除胸中客尘杂念！",
                                                "nextStep": 1,
                                                "gainScore": 10
                                        },
                                        {
                                                "text": "茶味先苦后甘，正如修道下苦工夫，后得纯和之乐！",
                                                "nextStep": 2,
                                                "gainScore": 8
                                        },
                                        {
                                                "text": "请问先生客来瀹茗与修身处世之道有何启发？",
                                                "nextStep": 3,
                                                "gainScore": 6
                                        }
                                ]
                        },
                        {
                                "speaker": "考亭先生",
                                "pose": "act_explain_gesture",
                                "face": "face_focused",
                                "blackboard": "主敬以直内 涤除客尘
心若止水 清气自生",
                                "text": "善哉！茗茶之妙，全在一清字。人心本来虚明洞达，只因私欲杂念侵袭，遂致浊气用事。煎水瀹茗之际，看白汽袅袅、茶汤澄澈，学者敛气端坐，心意专注，此即居敬持志之现成法门！",
                                "choices": [
                                        {
                                                "text": "弟子顿悟！日用接物之间，处处皆可行主敬之功！",
                                                "nextStep": 4,
                                                "gainScore": 8
                                        }
                                ]
                        },
                        {
                                "speaker": "考亭先生",
                                "pose": "act_point_focus",
                                "face": "face_serious",
                                "blackboard": "苦尽甘来 纯粹至善
坚韧笃行 方成大器",
                                "text": "岩茶初入口，微苦而涩，旋即生津回甘，芳馨久留舌本。圣学亦然！初学格物致知、收摄心性，甚觉束缚辛苦；及至积习日久，理明心泰，浩然自得，其乐不可胜言！",
                                "choices": [
                                        {
                                                "text": "学生当下苦工夫，不畏初学之艰难！",
                                                "nextStep": 4,
                                                "gainScore": 8
                                        }
                                ]
                        },
                        {
                                "speaker": "考亭先生",
                                "pose": "act_read_book",
                                "face": "face_gentle",
                                "blackboard": "澹泊明志 俭以养德
君子之交 淡若清泉",
                                "text": "一盏清茶待远客，不假膏梁酒馔之费，尽显君子澹泊之风。为官处事，亦当如茶汤一般清澈透明，一尘不染，方不负天理民心！",
                                "choices": [
                                        {
                                                "text": "弟子受教铭心！请先生颁下茶理小结！",
                                                "nextStep": 4,
                                                "gainScore": 8
                                        }
                                ]
                        },
                        {
                                "speaker": "考亭先生",
                                "pose": "act_summary",
                                "face": "face_encouraging",
                                "blackboard": "岩壑瀹茗 理在茶中
以敬直内 终日怡然",
                                "text": "甚好！今日品茶明理，日后诸生提壶啜茗之时，当常思此‘清、敬、澹、远’四字。以此涵养身心，必有受用！",
                                "choices": [
                                        {
                                                "text": "弟子温习武夷茶理讲席",
                                                "nextStep": 0,
                                                "gainScore": 5
                                        },
                                        {
                                                "text": "前往下一讲席：《崇安赈恤·五夫社仓》",
                                                "nextChapter": "wufu_shecang"
                                        }
                                ]
                        }
                ]
        },
        "bailu": {
                "title": "《崇安赈恤·五夫社仓》· 经世实践",
                "badge": "理学家经世恤民法式",
                "steps": [
                        {
                                "speaker": "考亭先生",
                                "pose": "act_stand",
                                "face": "face_calm",
                                "blackboard": "社仓石碑 垂范万世
实学笃行 理在民心",
                                "text": "诸生严肃！世人多讥老夫理学为虚名空谈、不切世用，此乃不知老夫者之妄言！乾道四年，建宁大饥，老夫力请于府，创置崇安五夫社仓。老夫尝言：天下莫大之恶，莫过于慕虚名而害实事。仁兄今日知老夫立社仓，其法度规矩究竟妙在何处？",
                                "choices": [
                                        {
                                                "text": "规矩严整方能长久！学生领会义利双行之妙！",
                                                "nextStep": 1,
                                                "gainScore": 8
                                        },
                                        {
                                                "text": "社仓不仅赈饥，更寄托天下为公、富民足国之大志！",
                                                "nextStep": 2,
                                                "gainScore": 8
                                        },
                                        {
                                                "text": "请先生开示五夫社仓立制规矩与恤民苦心！",
                                                "nextStep": 3,
                                                "gainScore": 6
                                        }
                                ]
                        },
                        {
                                "speaker": "考亭先生",
                                "pose": "act_explain_gesture",
                                "face": "face_focused",
                                "blackboard": "利不可独专 名不可虚受
仓规严明 公心为上",
                                "text": "立制至为精密！老夫手订社仓规约，设仓官、仓正，由乡贤洁廉者公选充管。每次开仓出纳，明立簿籍，贷谷取息不过极低二分；若遇大歉岁，全免其息；连年大饥，并免本钱！官不经手而民享其利，此所以垂范久远！",
                                "choices": [
                                        {
                                                "text": "制度精微入细，公私交济！学生叹服先生经世才猷！",
                                                "nextStep": 4,
                                                "gainScore": 10
                                        }
                                ]
                        },
                        {
                                "speaker": "考亭先生",
                                "pose": "act_point_focus",
                                "face": "face_serious",
                                "blackboard": "民胞物与 念兹在兹
经世致用 理学归宿",
                                "text": "横渠先生言民胞物与，非空谈也！天下百姓嗷嗷待哺，吾辈读书穷理，若不能设法活其性命、安其生业，虽口谈仁义万卷，与土木何异？理学正是要落实于济世安民之中！",
                                "choices": [
                                        {
                                                "text": "真知必能践履！学生当以实学经世为志！",
                                                "nextStep": 4,
                                                "gainScore": 8
                                        }
                                ]
                        },
                        {
                                "speaker": "考亭先生",
                                "pose": "act_read_book",
                                "face": "face_gentle",
                                "blackboard": "不耗官帑 不累闾阎
自治自足 万世永赖",
                                "text": "五夫社仓历十四年而储谷达数万石，全活数郡生灵。后来宋孝宗闻之，诏令天下诸州通行五夫社仓法。儒者经世，贵在实事求是，深谋远虑，不可图一时侥幸！",
                                "choices": [
                                        {
                                                "text": "学生受教！愿入下一章程研讨鹅湖论道！",
                                                "nextStep": 4,
                                                "gainScore": 8
                                        }
                                ]
                        },
                        {
                                "speaker": "考亭先生",
                                "pose": "act_summary",
                                "face": "face_encouraging",
                                "blackboard": "五夫社仓 经世实学
知行合一 王道根基",
                                "text": "五夫社仓规约刻于石碑，至今犹存五夫里。仁兄切记：天下莫大之恶，莫过于慕虚名而害实事。今日学者读书，必当关切社稷民生，方不负此生顶天立地之身！",
                                "choices": [
                                        {
                                                "text": "弟子受教铭心！愿重温五夫社仓讲席",
                                                "nextStep": 0,
                                                "gainScore": 5
                                        },
                                        {
                                                "text": "探讨理学论辩：进入《鹅湖论道·武夷辨异》",
                                                "nextChapter": "ehu_debate"
                                        }
                                ]
                        }
                ]
        }
};

        // 绑定事件与初始化
        this.init();
    }

    init() {
        this.containerEl = document.getElementById("galgame-screen-wrap");
        this.charImgEl = document.getElementById("galgame-char-img");
        this.faceImgEl = document.getElementById("galgame-face-thumb");
        this.speakerNameEl = document.getElementById("galgame-speaker-name");
        this.dialogueTextEl = document.getElementById("galgame-dialogue-text");
        this.choicesDockEl = document.getElementById("galgame-choices-dock");
        this.blackboardTextEl = document.getElementById("galgame-blackboard-text");
        this.scoreBadgeEl = document.getElementById("galgame-score-display");
        this.audioBtnEl = document.getElementById("galgame-tts-btn");

        if (!this.containerEl) {
            console.log("[GalGame] 宿主容器未挂载，稍后按需初始化");
            return;
        }

        // 初始化研学履历初始记录
        if (this.studyRecords.length === 0) {
            this.studyRecords.push({
                time: new Date().toLocaleTimeString(),
                stepName: "第一节 · 升堂定纲",
                choiceText: "步入书院讲筵，端坐静听先生开篇讲授《大学》三纲八目。",
                gainScore: 0,
                masterReply: "诸生后学端坐！子程子尝言：《大学》，孔氏之遗书，而初学入德之门也。"
            });
        }
        this.renderStudyRecords();
        this.updateStudyStats();

        // 默认载入《大学》首讲
        this.loadChapter("wuyi_jingshe", 0);
    }

    // 载入章节与步骤
    loadChapter(chapterId, stepIndex = 0) {
        if (!this.chapters[chapterId]) return;
        this.currentChapterId = chapterId;
        this.currentStepIndex = stepIndex;

        const chapter = this.chapters[chapterId];
        const step = chapter.steps[stepIndex];
        if (!step) return;

        // 动态根据武夷特色讲席主题平滑切换专属古典意境大图（多个场景图替换）
        const bgImgEl = document.getElementById("galgame-bg-img");
        if (bgImgEl) {
            const chapterBgMap = {
                "wuyi_jingshe": "/static/galgame_assets/classroom_pov_hd.png",
                "jiuqu_zhaoge": "/static/banner_scenic_clean.png",
                "wuyi_tea": "/static/banner_scenic_bg.png",
                "wufu_shecang": "/static/galgame_assets/classroom_empty_hd.jpg",
                "ehu_debate": "/static/galgame_assets/classroom_bg_empty.png",
                "daxue_gewu": "/static/banner_scenic_clean2.png"
            };
            const targetBg = chapter.bgImage || chapterBgMap[chapterId] || "/static/galgame_assets/classroom_pov_hd.png";
            const currentSrc = bgImgEl.getAttribute("src") || "";
            const targetFilename = targetBg.split("/").pop();
            if (!currentSrc.includes(targetFilename)) {
                bgImgEl.style.transition = "opacity 0.3s ease";
                bgImgEl.style.opacity = "0.35";
                setTimeout(() => {
                    bgImgEl.src = targetBg;
                    bgImgEl.style.opacity = "1";
                }, 150);
            }
        }

        this.renderStep(step);
        this.updateStudyStats();
    }

    // 渲染剧情步骤
    renderStep(step) {
        if (!step) return;

        // 1. 切换先生体态与神态特写
        if (this.charImgEl && step.pose) {
            this.charImgEl.style.opacity = "0.7";
            setTimeout(() => {
                this.charImgEl.src = `/static/galgame_assets/${step.pose}.png`;
                this.charImgEl.style.opacity = "1";
            }, 120);
        }

        if (this.faceImgEl && step.face) {
            this.faceImgEl.src = `/static/galgame_assets/${step.face}.png`;
        }

        // 2. 动态黑板板书更新 (墨韵粉笔字渐显)
        if (this.blackboardTextEl) {
            this.blackboardTextEl.style.opacity = "0.4";
            setTimeout(() => {
                this.blackboardTextEl.textContent = step.blackboard || "即物穷理 虚心涵泳";
                this.blackboardTextEl.style.opacity = "1";
            }, 200);
        }

        // 3. 说话者姓名
        if (this.speakerNameEl) {
            this.speakerNameEl.textContent = step.speaker || "考亭先生";
        }

        // 4. 打字机逐字输出台词
        this.typewriterEffect(step.text);

        // 5. 渲染选择分支
        this.renderChoices(step.choices || []);

        // 6. 记录历史
        this.historyLog.push({
            speaker: step.speaker,
            text: step.text,
            time: new Date().toLocaleTimeString()
        });

        // 7. 更新悟性与持敬指标
        this.updateScoreDisplay();
    }

    // 打字机流光输出
    typewriterEffect(text) {
        if (!this.dialogueTextEl) return;
        clearTimeout(this.typewriterTimer);
        this.currentFullText = text;
        this.dialogueTextEl.textContent = "";
        this.isTyping = true;

        let charIndex = 0;
        const speed = 22; // 毫秒/字

        const typeNext = () => {
            if (charIndex < text.length) {
                this.dialogueTextEl.textContent += text[charIndex];
                charIndex++;
                this.typewriterTimer = setTimeout(typeNext, speed);
            } else {
                this.isTyping = false;
            }
        };

        typeNext();
    }

    // 点击加速完成打字
    fastForwardTyping() {
        if (this.isTyping) {
            clearTimeout(this.typewriterTimer);
            if (this.dialogueTextEl) {
                this.dialogueTextEl.textContent = this.currentFullText;
            }
            this.isTyping = false;
        }
    }

    // 渲染分支选择支
    renderChoices(choices) {
        if (!this.choicesDockEl) return;
        this.choicesDockEl.innerHTML = "";

        if (!choices || choices.length === 0) {
            // 默认继续按钮
            const nextBtn = document.createElement("button");
            nextBtn.className = "gal-choice-btn next-step";
            nextBtn.innerHTML = `<span>▶ 继续听先生讲授</span>`;
            nextBtn.onclick = () => this.nextStep();
            this.choicesDockEl.appendChild(nextBtn);
            return;
        }

        choices.forEach((choice, idx) => {
            const btn = document.createElement("button");
            btn.className = "gal-choice-btn";
            btn.innerHTML = `<span class="choice-prefix">${String.fromCharCode(65 + idx)}.</span> <span class="choice-text">${choice.text}</span>`;
            
            btn.onclick = () => {
                if (choice.gainScore) {
                    this.enlightenment = Math.min(100, this.enlightenment + choice.gainScore);
                    this.reverence = Math.min(100, this.reverence + Math.round(choice.gainScore * 0.8));
                    this.showScoreFloatNotice(`+${choice.gainScore} 悟性`);
                }

                // 实时写入右侧【研学履历记录】
                this.logStudyRecord({
                    time: new Date().toLocaleTimeString(),
                    stepName: `第 ${this.currentStepIndex + 1} 节 · 论学研判`,
                    choiceText: choice.text,
                    gainScore: choice.gainScore || 5,
                    masterReply: this.currentFullText ? this.currentFullText.slice(0, 48) + "..." : "即物穷理，虚心涵泳。"
                });

                if (choice.nextChapter) {
                    this.loadChapter(choice.nextChapter, 0);
                } else if (choice.nextAction === "nav_plan") {
                    if (window.switchNav) switchNav("plan");
                } else if (choice.nextStep !== undefined) {
                    this.loadChapter(this.currentChapterId, choice.nextStep);
                } else {
                    this.nextStep();
                }
            };

            this.choicesDockEl.appendChild(btn);
        });

        // 附带“自主发问/深究”微入口
        const freeInquireBtn = document.createElement("button");
        freeInquireBtn.className = "gal-choice-btn custom-inquire";
        freeInquireBtn.innerHTML = `<span>✍️ 弟子有独到心得或疑义，愿当堂呈请先生辨析...</span>`;
        freeInquireBtn.onclick = () => this.openFreeInquireModal();
        this.choicesDockEl.appendChild(freeInquireBtn);
    }

    nextStep() {
        const chapter = this.chapters[this.currentChapterId];
        if (!chapter) return;
        if (this.currentStepIndex + 1 < chapter.steps.length) {
            this.loadChapter(this.currentChapterId, this.currentStepIndex + 1);
        } else {
            // 重新开始或切换
            this.loadChapter(this.currentChapterId, 0);
        }
    }

    showScoreFloatNotice(text) {
        const floatEl = document.createElement("div");
        floatEl.className = "gal-score-float";
        floatEl.textContent = text;
        if (this.containerEl) {
            this.containerEl.appendChild(floatEl);
            setTimeout(() => floatEl.remove(), 1600);
        }
    }

    updateScoreDisplay() {
        if (this.scoreBadgeEl) {
            this.scoreBadgeEl.innerHTML = `
                <span class="score-item" title="学者领悟理学精微之悟境">⭐ 悟性: <strong>${this.enlightenment}</strong></span>
                <span class="score-split">|</span>
                <span class="score-item" title="学者居敬持守、收敛身心之敬意">🌸 持敬: <strong>${this.reverence}</strong></span>
            `;
        }
        this.updateStudyStats();
    }

    // 右侧标签栏切换 (研学履历记录 vs 本篇原典讲义)
    switchRightTab(tab) {
        const tabLog = document.getElementById("galgame-tab-log");
        const tabText = document.getElementById("galgame-tab-text");
        const panelLog = document.getElementById("panel-study-log");
        const panelText = document.getElementById("panel-study-text");

        if (tab === 'log') {
            if (tabLog) tabLog.classList.add("active");
            if (tabText) tabText.classList.remove("active");
            if (panelLog) panelLog.style.display = "block";
            if (panelText) panelText.style.display = "none";
        } else {
            if (tabLog) tabLog.classList.remove("active");
            if (tabText) tabText.classList.add("active");
            if (panelLog) panelLog.style.display = "none";
            if (panelText) panelText.style.display = "block";
        }
    }

    // 追加记录至履历
    logStudyRecord(record) {
        this.studyRecords.unshift(record); // 最新记录排在前面
        this.renderStudyRecords();
        this.updateStudyStats();
    }

    // 更新右侧头部面板指标
    updateStudyStats() {
        const countEl = document.getElementById("record-count-num");
        const enEl = document.getElementById("record-enlightenment-val");
        const revEl = document.getElementById("record-reverence-val");
        const chEl = document.getElementById("record-current-chapter");
        const stepEl = document.getElementById("record-current-step");

        if (countEl) countEl.textContent = this.studyRecords.length;
        if (enEl) enEl.textContent = this.enlightenment;
        if (revEl) revEl.textContent = this.reverence;
        if (chEl && this.chapters[this.currentChapterId]) {
            chEl.textContent = this.chapters[this.currentChapterId].title.split("·")[0].trim();
        }
        if (stepEl) {
            stepEl.textContent = `第 ${this.currentStepIndex + 1} 讲次`;
        }
    }

    // 渲染右侧研学履历卡片列表
    renderStudyRecords() {
        const listEl = document.getElementById("galgame-study-log-list");
        if (!listEl) return;
        if (this.studyRecords.length === 0) {
            listEl.innerHTML = `<p class="empty-timeline-hint">暂无研学抉择记录，请在左侧点击研习选项与先生论学。</p>`;
            return;
        }
        listEl.innerHTML = this.studyRecords.map(rec => `
            <div class="study-record-card">
                <div class="record-card-top">
                    <span class="record-time">⏱️ ${rec.time}</span>
                    <span class="record-chapter-tag">${rec.stepName || '研学论学'}</span>
                    ${rec.gainScore ? `<span class="record-score-gain">+${rec.gainScore} 悟性</span>` : ''}
                </div>
                <div class="record-choice-line">
                    <strong class="choice-prefix-mark">【生问/所择】</strong>
                    <span>${rec.choiceText}</span>
                </div>
                ${rec.masterReply ? `
                <div class="record-master-line">
                    <span class="master-prefix-mark">【先生点拨】</span>
                    <span>${rec.masterReply}</span>
                </div>` : ''}
            </div>
        `).join("");
    }

    // 清空研学履历
    clearStudyRecords() {
        this.studyRecords = [];
        this.renderStudyRecords();
        this.updateStudyStats();
    }

    // 播放当前台词语音
    playCurrentVoice() {
        if (!this.currentFullText) return;
        if (window.playVoiceByText) {
            window.playVoiceByText(this.currentFullText, "yunjian");
        } else {
            console.log("[GalGame] 语音引擎调用:", this.currentFullText);
        }
    }

    // 自主向先生当堂问难 · 实时连接知识库与认知智能体
    async openFreeInquireModal() {
        const query = prompt("【门生当堂请教】仁兄对先生方才所授经义有何创见或疑惑？直言道来：");
        if (!query || !query.trim()) return;

        const currentChap = this.chapters[this.currentChapterId] ? this.chapters[this.currentChapterId].title : "武夷讲筵";

        // 记入研学履历
        this.logStudyRecord({
            time: new Date().toLocaleTimeString(),
            stepName: "学者当堂发问",
            choiceText: query,
            gainScore: 10,
            masterReply: "考亭先生正在深思典籍，当堂为汝剖析精微..."
        });

        this.renderStep({
            speaker: "考亭先生",
            pose: "act_pause_think",
            face: "face_thinking",
            blackboard: `学者致疑：\n${query.slice(0, 14)}...`,
            text: "仁兄且静候片刻，老夫正检视经传，当堂为汝剖析精微...",
            choices: []
        });

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    query: `在${currentChap}讲筵上，门生当堂请教：${query}`,
                    session_id: `class_${this.currentChapterId}`
                })
            });
            const data = await res.json();
            const reply = data.reply || "";
            const pureReply = reply.split("📜")[0].trim();

            this.renderStep({
                speaker: "考亭先生",
                pose: "act_explain_gesture",
                face: "face_focused",
                blackboard: `即席点拨：\n${query.slice(0, 14)}...`,
                text: pureReply,
                choices: [
                    { text: "学生受教铭心！愿随先生指引，重归正席研读。", nextStep: this.currentStepIndex, gainScore: 8 },
                    { text: "请先生转入书斋，作更加万言透彻之大论！", nextAction: "nav_qa" }
                ]
            });

            if (this.studyRecords.length > 0) {
                this.studyRecords[0].masterReply = pureReply.slice(0, 80) + "...";
                this.renderStudyRecords();
            }
        } catch (err) {
            console.error(err);
            this.renderStep({
                speaker: "考亭先生",
                pose: "act_explain_gesture",
                face: "face_gentle",
                blackboard: `即席点拨：\n${query.slice(0, 14)}...`,
                text: `“善哉！仁兄能发此问：‘${query}’，足见未肯随人脚跟转！为学当即事穷理，学者且细加思量，此问本原何在？”`,
                choices: [
                    { text: "学生受教！愿随先生指引，重归正席研读。", nextStep: this.currentStepIndex, gainScore: 8 }
                ]
            });
        }
    }
}

// 实例化全局单例
window.galGameEngine = new GalGameEngine();
