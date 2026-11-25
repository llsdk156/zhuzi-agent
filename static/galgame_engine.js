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
        this._initialized = false;
        this._inquirySeq = 0;
        this._inquiryAbortController = null;
        this.sessionId = "galgame_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 7);

        // 原典研习六大专属讲义核心库
        this.syllabusDatabase = {
            "wuyi_jingshe": {
                chapterId: "wuyi_jingshe",
                badge: "精舍初筵 · 聚徒开山",
                title: "《武夷精舍杂咏并序》· 精舍立志",
                summary: "淳熙十年卜居武夷隐屏，避俗嚣之扰，聚徒穷理，立道南正脉。",
                original: "“琴书五十载，隐屏云雾深。淳熙十年，予卜居武夷隐屏峰下，结构精舍数楹，题曰武夷精舍。诸生环居，相与读书讲道。夫岂徒乐其山水之胜哉？盖将以求古圣贤之意，而体诸身也。”",
                commentary: "闹市之中，人心易于流荡；借武夷山川清幽之气，使学者收敛身心，方有从容穷理之基。此乃聚徒立雪之始。",
                thinking: "学者求道，心神常为外物喧嚣所牵。若无一处定静涵养之地，学问从何处扎根生发？"
            },
            "jiuqu_zhaoge": {
                chapterId: "jiuqu_zhaoge",
                badge: "棹歌九曲 · 穷理渐进",
                title: "《九曲棹歌》· 循序渐进",
                summary: "乘舟泛九曲清溪，以一曲至九曲为喻，示后学读书穷理当按部就班、由浅入深之渐进工夫。",
                original: "“武夷山上有仙灵，山下寒流曲曲清。欲识高深通秘奥，请看九曲棹歌行。一曲棹歌初泛处，白云流水引深情；行到九曲源头尽，始见平川水更清。”",
                commentary: "为学如撑上水船，一篙不可放缓。泛舟九曲，必自一曲始，渐进至于九曲平旷之处。未得乎前，不敢求乎后；未通乎上，不敢求乎下。字求其训，句索其旨，方得源头活水。",
                thinking: "仁兄平日开卷，是否贪多求快、走马观花？若未通首卷即急窥末卷，学问何以能‘源清流长’？"
            },
            "wuyi_tea": {
                chapterId: "wuyi_tea",
                badge: "敬以直内 · 日用工夫",
                title: "《朱子家礼·瀹茗工夫》· 茶理存诚",
                summary: "以武夷岩茶之品瀹、火候与清和，阐释‘主敬存诚、事事物物皆有天理’的日常省察与持守工夫。",
                original: "“客至则具茶，整肃几席，涤盏烹泉。水之清冽，火之徐候，茶叶之升降，莫非理之所寓。主敬存诚，心无旁骛，于一啜一饮间体认天理流行，不使毫厘私欲夹杂其中。”",
                commentary: "敬字功夫，是贯通动静之枢纽。煮茗非玩物适情，乃于至微至细之日用事伦中，察理之所当然与所以然。整齐严肃，敬以直内，方能使虚灵不昧之本心常惺惺。",
                thinking: "格物穷理岂在悬空冥想？在日常举止、饮食应接之间，如何做到‘敬以直内，义以方外’？"
            },
            "wufu_shecang": {
                chapterId: "wufu_shecang",
                badge: "经世济民 · 实学笃行",
                title: "《崇安县五夫社仓记》· 义利兼通",
                summary: "乾道四年大饥，朱子躬行赈恤，在崇安五夫里创设社仓法，开创中国民间自治储粮济困之千秋典范。",
                original: "“乾道四年，建宁府崇安县大饥。予劝诸豪右出粟以振饥民。后建社仓于五夫里，春秋敛散，息米折半，岁丰则免息。不耗官帑，不累闾阎，经画有方，万世永赖。”",
                commentary: "五夫社仓历十四年而储谷达数万石，全活数郡生灵。儒者之学，绝非空谈心性之虚术，必当开物成务、兼济天下。正其义以谋万民之利，明其道以成济世之功，此真儒知行合一之至验。",
                thinking: "当世学者常病‘明理者不达时变，任事者不察义理’。五夫社仓法如何启示我们在求学与实践中兼顾义理与民生实效？"
            },
            "ehu_debate": {
                chapterId: "ehu_debate",
                badge: "理学论辩 · 尊德问道",
                title: "《鹅湖之会·答陆子静》· 道问学与尊德性",
                summary: "淳熙二年鹅湖寺世纪论辩，朱陆异同，探究‘泛观博览以格物致知’与‘发明本心以立大本’之同异互补。",
                original: "“鹅湖之会，伯恭招陆子静、子寿兄弟来聚。陆子以‘易简功夫终久大，支离事业竟浮沉’相诮。予答之曰：若不道问学、穷理致知，心何所据？尊德性而道问学，二者相济，不可偏废。”",
                commentary: "尊德性乃立本体，道问学乃致实用。若但空守本心而废博学审问，则流于禅宗之蹈空狂诞；若泛观万物而忘存养德性，则失于支离繁碎。朱子之学，立基于切实体察，两端互发，方臻至纯。",
                thinking: "为学修身之际，‘尊德性’（立志发明本心）与‘道问学’（博学读书穷理）二者，仁兄平日如何兼筹并进？"
            },
            "daxue_gewu": {
                chapterId: "daxue_gewu",
                badge: "穷理致知 · 终极宇宙观",
                title: "《大学章句·格物致知补传》· 理一分殊",
                summary: "朱子倾尽毕生心血补缀《大学》格致亡章，提出‘月印万川、即物穷理’之集大成理学认识论。",
                original: "“所谓致知在格物者，言欲致吾之知，在即物而穷其理也。盖人心之灵莫不有知，而天下之物莫不有理。至于用力之久，而一旦豁然贯通焉，则众物之表里精粗无不到，而吾心之全提大用无不明矣。”",
                commentary: "理一分殊，月印万川。天地万物虽千差万别，皆本于同一天理。今日格一件，明日格一件，积久力深，心物交融，私意尽除，则万事万物之必然之则与本原之道自然豁然贯通，止于至善。",
                thinking: "在纷繁纷杂的万事万物面前，学者当如何从小处切近处下手穷理，方能期待有朝一日‘豁然贯通’？"
            }
        };

        // 剧本数据库 (四大经典研学章程，层层设问、启发式因材施教)
        this.chapters = {
        "wuyi_jingshe": {
                "title": "《隐屏结庐·武夷精舍》· 聚徒开山",
                "badge": "武夷精舍开山首讲",
                "steps": [
                        {
                                "speaker": "考亭先生",
                                "pose": "pose_1_stand",
                                "face": "face_calm",
                                "blackboard": "琴书五十载 隐屏云雾深\n武夷精舍 聚徒传道",
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
                                "pose": "pose_8_salute",
                                "face": "face_focused",
                                "blackboard": "收摄放心 主敬存诚\n静中涵养 动中省察",
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
                                "pose": "pose_4_read",
                                "face": "face_gentle",
                                "blackboard": "即景明理 诗以言志\n物我两忘 融通太虚",
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
                                "pose": "pose_3_gesture",
                                "face": "face_serious",
                                "blackboard": "穷理 正心 修身\n不为虚名 务求实学",
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
                                "pose": "pose_2_side",
                                "face": "face_encouraging",
                                "blackboard": "精舍开山 考亭宗风\n道贯古今 理润身心",
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
                                "pose": "pose_5_walk",
                                "face": "face_calm",
                                "blackboard": "武夷山上有仙灵 山下寒流曲曲清\n欲识高人岑寂趣 且听棹歌三两声",
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
                                "pose": "pose_3_gesture",
                                "face": "face_focused",
                                "blackboard": "由下流溯至源头\n由器入道 由粗入精",
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
                                "pose": "pose_2_side",
                                "face": "face_gentle",
                                "blackboard": "即物明理 鸢飞鱼跃\n自然真趣 触目菩提",
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
                                "pose": "pose_9_point",
                                "face": "face_serious",
                                "blackboard": "半亩方塘一鉴开 天光云影共徘徊\n问渠那得清如许 为有源头活水来",
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
                                "pose": "pose_1_stand",
                                "face": "face_encouraging",
                                "blackboard": "九曲溯源 棹歌理趣\n理水相融 考亭心印",
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
                                "pose": "pose_7_beard",
                                "face": "face_calm",
                                "blackboard": "客来莫道无供设 一盏清茶便当席\n清虚静泰 涵养本原",
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
                                "pose": "pose_3_gesture",
                                "face": "face_focused",
                                "blackboard": "主敬以直内 涤除客尘\n心若止水 清气自生",
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
                                "pose": "pose_9_point",
                                "face": "face_serious",
                                "blackboard": "苦尽甘来 纯粹至善\n坚韧笃行 方成大器",
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
                                "pose": "pose_4_read",
                                "face": "face_gentle",
                                "blackboard": "澹泊明志 俭以养德\n君子之交 淡若清泉",
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
                                "pose": "pose_1_stand",
                                "face": "face_encouraging",
                                "blackboard": "岩壑瀹茗 理在茶中\n以敬直内 终日怡然",
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
                                "pose": "pose_6_desk",
                                "face": "face_calm",
                                "blackboard": "社仓石碑 垂范万世\n实学笃行 理在民心",
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
                                "pose": "pose_3_gesture",
                                "face": "face_focused",
                                "blackboard": "利不可独专 名不可虚受\n仓规严明 公心为上",
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
                                "pose": "pose_7_beard",
                                "face": "face_serious",
                                "blackboard": "民胞物与 念兹在兹\n经世致用 理学归宿",
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
                                "pose": "pose_4_read",
                                "face": "face_gentle",
                                "blackboard": "不耗官帑 不累闾阎\n自治自足 万世永赖",
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
                                "pose": "pose_8_salute",
                                "face": "face_encouraging",
                                "blackboard": "五夫社仓 经世实学\n知行合一 王道根基",
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
                                "pose": "pose_8_salute",
                                "face": "face_calm",
                                "blackboard": "淳熙二年 铅山之会\n尊德性与道问学 理学两峰对峙",
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
                                "pose": "pose_3_gesture",
                                "face": "face_focused",
                                "blackboard": "不可悬空索理\n致知格物 方见天理纯粹",
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
                                "pose": "pose_7_beard",
                                "face": "face_serious",
                                "blackboard": "德性本尊 问学是功\n交相发用 不可偏废",
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
                                "pose": "pose_9_point",
                                "face": "face_gentle",
                                "blackboard": "和而不同 求同存异\n君子周而不比",
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
                                "pose": "pose_5_walk",
                                "face": "face_encouraging",
                                "blackboard": "鹅湖明辨 道统渊澄\n即物穷理 虚心涵泳",
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
                                "pose": "pose_1_stand",
                                "face": "face_calm",
                                "blackboard": "未有天地之先 毕竟也先有此理\n理一分殊 月印万川",
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
                                "pose": "pose_9_point",
                                "face": "face_focused",
                                "blackboard": "万物皆具一理 理具于万物\n物各付物 莫不由理",
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
                                "pose": "pose_3_gesture",
                                "face": "face_serious",
                                "blackboard": "由浅入深 积久贯通\n今日格一件 明日格一件",
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
                                "pose": "pose_4_read",
                                "face": "face_gentle",
                                "blackboard": "即物穷理 切己体察\n知行并进 止于至善",
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
                                "pose": "pose_8_salute",
                                "face": "face_encouraging",
                                "blackboard": "讲筵圆满 明理笃行\n考亭文公印可",
                                "text": "好！今日诸生升筵对问，能于纲领节目层层致疑，颇有精进之机。为学正如造塔，今日打牢基址，明日方可步步登高。仁兄且将今日所悟书写于心，下座后切实涵养践履！",
                                "choices": [
                                        {
                                                "text": "🎓 门生恭领考亭结业文凭 · 功德圆满（点击受封文凭）",
                                                "showCertificate": true,
                                                "gainScore": 10
                                        },
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
                                "blackboard": "琴书五十载 隐屏云雾深\n武夷精舍 聚徒传道",
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
                                "blackboard": "收摄放心 主敬存诚\n静中涵养 动中省察",
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
                                "blackboard": "即景明理 诗以言志\n物我两忘 融通太虚",
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
                                "blackboard": "穷理 正心 修身\n不为虚名 务求实学",
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
                                "blackboard": "精舍开山 考亭宗风\n道贯古今 理润身心",
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
                                "blackboard": "武夷山上有仙灵 山下寒流曲曲清\n欲识高人岑寂趣 且听棹歌三两声",
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
                                "blackboard": "由下流溯至源头\n由器入道 由粗入精",
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
                                "blackboard": "即物明理 鸢飞鱼跃\n自然真趣 触目菩提",
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
                                "blackboard": "半亩方塘一鉴开 天光云影共徘徊\n问渠那得清如许 为有源头活水来",
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
                                "blackboard": "九曲溯源 棹歌理趣\n理水相融 考亭心印",
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
                                "blackboard": "客来莫道无供设 一盏清茶便当席\n清虚静泰 涵养本原",
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
                                "blackboard": "主敬以直内 涤除客尘\n心若止水 清气自生",
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
                                "blackboard": "苦尽甘来 纯粹至善\n坚韧笃行 方成大器",
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
                                "blackboard": "澹泊明志 俭以养德\n君子之交 淡若清泉",
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
                                "blackboard": "岩壑瀹茗 理在茶中\n以敬直内 终日怡然",
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
                                "blackboard": "社仓石碑 垂范万世\n实学笃行 理在民心",
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
                                "blackboard": "利不可独专 名不可虚受\n仓规严明 公心为上",
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
                                "blackboard": "民胞物与 念兹在兹\n经世致用 理学归宿",
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
                                "blackboard": "不耗官帑 不累闾阎\n自治自足 万世永赖",
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
                                "blackboard": "五夫社仓 经世实学\n知行合一 王道根基",
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

    _esc(str) {
        return String(str == null ? "" : str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
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

        // 若已初始化过，切回讲筵标签页时保留当前进度，不再重置回第一章
        if (this._initialized) {
            this.renderStudyRecords();
            this.updateStudyStats();
            this.updateScoreDisplay();
            return;
        }
        this._initialized = true;

        // 初始化研学履历初始记录（与第一章《武夷精舍》保持一致）
        if (this.studyRecords.length === 0) {
            this.studyRecords.push({
                time: new Date().toLocaleTimeString(),
                stepName: "第一节 · 精舍初筵",
                choiceText: "步入武夷精舍讲筵，端坐静听考亭先生开篇讲授。",
                gainScore: 0,
                masterReply: "诸生进前！今日老夫在武夷山隐屏峰下武夷精舍开席论道。"
            });
        }
        this.renderStudyRecords();
        this.updateStudyStats();

        // 默认载入武夷精舍首讲
        this.loadChapter("wuyi_jingshe", 0);
    }

    // 载入章节与步骤
    loadChapter(chapterId, stepIndex = 0) {
        if (!this.chapters[chapterId]) return;
        // 切换章节/步骤时取消在途的自由请益请求，防止陈旧响应覆盖新场景
        if (this._inquiryAbortController) {
            try { this._inquiryAbortController.abort(); } catch (e) {}
            this._inquiryAbortController = null;
        }
        this._inquirySeq++;
        this.currentChapterId = chapterId;
        this.currentStepIndex = stepIndex;

        // 联动更新原典讲义抽屉内容与胶囊选中态
        this.updateSyllabusDrawer(chapterId);

        // 同步更新顶部讲筵章节导航条高亮（第三个图的界面要跟着选项进去下一个场景而改变）
        const pillBtns = document.querySelectorAll(".chapter-tab-pill");
        pillBtns.forEach(btn => {
            const onclickVal = btn.getAttribute("onclick") || "";
            if (onclickVal.includes(`'${chapterId}'`) || onclickVal.includes(`"${chapterId}"`)) {
                btn.classList.add("active");
                if (typeof btn.scrollIntoView === "function") {
                    btn.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
                }
            } else {
                btn.classList.remove("active");
            }
        });

        const chapter = this.chapters[chapterId];
        const step = chapter.steps[stepIndex];
        if (!step) return;

        // 动态根据武夷特色讲席主题平滑切换专属古典意境大图【多个场景图替换】
        const bgImgEl = document.getElementById("galgame-bg-img");
        if (bgImgEl) {
            const chapterBgMap = {
                "wuyi_jingshe": "/static/scenery/wuyi_palace.jpg",
                "jiuqu_zhaoge": "/static/scenery/jiuqu_stream.jpg",
                "wuyi_tea": "/static/scenery/tianyou_peak.jpg",
                "wufu_shecang": "/static/scenery/wufu_ziyanglou.jpg",
                "ehu_debate": "/static/galgame_assets/classroom_empty_hd.jpg",
                "daxue_gewu": "/static/scenery/kaoting_academy.jpg"
            };
            const targetBg = step.bgImage || chapter.bgImage || chapterBgMap[chapterId] || "/static/galgame_assets/classroom_empty_hd.jpg";
            const currentSrc = bgImgEl.getAttribute("src") || "";
            const targetFilename = targetBg.split("/").pop();
            if (!currentSrc.includes(targetFilename)) {
                bgImgEl.style.transition = "opacity 0.4s ease";
                bgImgEl.style.opacity = "0.3";
                setTimeout(() => {
                    bgImgEl.src = targetBg;
                    bgImgEl.style.opacity = "1";
                }, 200);
            }
        }

        this.renderStep(step);
        this.updateStudyStats();
    }

    // 渲染剧情步骤
    renderStep(step, options = {}) {
        if (!step) return;

        // 1. 切换先生体态与神态特写 (确保单一人物自然融合，绝不重叠两尊人物)
        if (this.charImgEl) {
            const poseKey = step.pose || "pose_1_stand";
            const poseFile = this.getPoseFileName(poseKey);
            const targetSrc = `/static/galgame_assets/${poseFile}`;
            const currentSrc = this.charImgEl.getAttribute("src") || "";
            if (!currentSrc.includes(poseFile)) {
                this.charImgEl.style.transition = "opacity 0.25s ease, transform 0.3s ease";
                this.charImgEl.style.opacity = "0.3";
                setTimeout(() => {
                    this.charImgEl.src = targetSrc;
                    this.charImgEl.style.opacity = "1";
                }, 120);
            } else {
                this.charImgEl.style.opacity = "1";
            }
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

        // 8. 实时语音配音（仅在开启 autoTTS 且非占位提示时触发一次，杜绝重叠调用）
        if (!options.skipAutoVoice && typeof autoTTS !== "undefined" && autoTTS && step.text) {
            clearTimeout(this._autoVoiceTimer);
            this._autoVoiceTimer = setTimeout(() => {
                this.playCurrentVoice();
            }, 260);
        }
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
            btn.innerHTML = `<span class="choice-prefix">${String.fromCharCode(65 + idx)}.</span> <span class="choice-text">${this._esc(choice.text)}</span>`;
            
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

                if (choice.showCertificate) {
                    this.showCertificate();
                    return;
                }
                if (choice.isCustom) {
                    this.openFreeInquireModal();
                    return;
                }
                if (choice.followUpQuery) {
                    this.submitInquiry(choice.followUpQuery);
                    return;
                }
                if (choice.nextAction === "nav_quiz") {
                    if (window.openQuizModal) window.openQuizModal();
                    return;
                }
                if (choice.nextAction === "nav_plan") {
                    if (window.openQuizModal) window.openQuizModal();
                    else if (window.switchNav) switchNav("qa");
                    return;
                }
                if (choice.nextAction === "nav_qa") {
                    if (window.switchNav) switchNav("qa");
                    return;
                }
                if (choice.nextChapter) {
                    this.loadChapter(choice.nextChapter, 0);
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
            this.updateSyllabusDrawer(this.currentChapterId);
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
                    <span class="record-time">⏱️ ${this._esc(rec.time)}</span>
                    <span class="record-chapter-tag">${this._esc(rec.stepName || '研学论学')}</span>
                    ${rec.gainScore ? `<span class="record-score-gain">+${this._esc(rec.gainScore)} 悟性</span>` : ''}
                </div>
                <div class="record-choice-line">
                    <strong class="choice-prefix-mark">【生问/所择】</strong>
                    <span>${this._esc(rec.choiceText)}</span>
                </div>
                ${rec.masterReply ? `
                <div class="record-master-line">
                    <span class="master-prefix-mark">【先生点拨】</span>
                    <span>${this._esc(rec.masterReply)}</span>
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

    getPoseFileName(poseKey) {
        const poseMap = {
            "pose_1_stand": "pose_1_stand.png",
            "pose_2_side": "pose_2_side.png",
            "pose_3_gesture": "pose_3_gesture.png",
            "pose_4_read": "pose_4_read.png",
            "pose_5_walk": "pose_5_walk.png",
            "pose_6_desk": "pose_6_desk.png",
            "pose_7_beard": "pose_7_beard.png",
            "pose_8_salute": "pose_8_salute.png",
            "pose_9_point": "pose_9_point.png",
            // Backward-compatible aliases
            "act_stand": "pose_1_stand.png",
            "act_explain_gesture": "pose_3_gesture.png",
            "act_read_book": "pose_4_read.png",
            "act_point_focus": "pose_9_point.png",
            "act_summary": "pose_8_salute.png",
            "act_seated_desk": "pose_6_desk.png",
            "act_pause_think": "pose_7_beard.png",
            "act_walk_teach": "pose_5_walk.png"
        };
        return poseMap[poseKey] || "pose_1_stand.png";
    }

    showCertificate() {
        const modal = document.getElementById("galgame-certificate-modal");
        if (!modal) return;
        const scoreE = document.getElementById("cert-score-enlightenment");
        const scoreR = document.getElementById("cert-score-reverence");
        const dateEl = document.getElementById("cert-date-text");
        if (scoreE) scoreE.textContent = this.enlightenment;
        if (scoreR) scoreR.textContent = this.reverence;
        const now = new Date();
        if (dateEl) {
            dateEl.textContent = `宋庆元四年 · 岁次戊午春（公历 ${now.getFullYear()}年${now.getMonth()+1}月${now.getDate()}日）`;
        }
        modal.classList.add("active");
        if (typeof showToast === "function") {
            showToast("考亭讲筵结业功成！已颁发圣学传道研学结业文凭！");
        }
    }

    closeCertificate() {
        const modal = document.getElementById("galgame-certificate-modal");
        if (modal) modal.classList.remove("active");
    }

    printCertificate() {
        window.print();
    }

    restartAllChapters() {
        this.closeCertificate();
        this.loadChapter("wuyi_jingshe", 0);
        if (typeof showToast === "function") {
            showToast("已重置武夷讲筵，诸生请进前听先生第一讲！");
        }
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

    // 自主向先生当堂问难 · 实时连接知识库与认知智能体【杜绝单一死板，随学者需求应变】
    openFreeInquireModal() {
        const existing = document.getElementById("galgame-inquire-dialog");
        if (existing) existing.remove();

        const presetTopics = [
            "如何克服求学生活中的浮躁与焦虑？",
            "请先生讲讲当年武夷精舍的生活与弟子问答",
            "如何理解‘未发之中’与‘已发之和’？",
            "先生如何看待王安石变法与荆公新学？",
            "知行如何相须并进？"
        ];

        const modal = document.createElement("div");
        modal.id = "galgame-inquire-dialog";
        modal.className = "galgame-inquire-modal";
        modal.innerHTML = `
            <div class="galgame-inquire-card">
                <div class="inquire-card-header">
                    <h3>💡 诸生当堂请益 · 点席问辩</h3>
                    <button onclick="this.closest('.galgame-inquire-modal').remove()" style="background:none; border:none; font-size:18px; cursor:pointer; color:#78350f;">✕</button>
                </div>
                <p style="font-size:13px; color:#5c3a21; margin-top:0; margin-bottom:10px;">
                    仁兄对先生方才所授经义有何创见或疑惑？亦或欲听先生讲述何种理学精义？可自拟论题或点击常研论题：
                </p>
                <div class="inquire-preset-topics">
                    ${presetTopics.map(t => `<button type="button" class="preset-topic-btn" data-topic="${this._esc(t)}">${this._esc(t)}</button>`).join('')}
                </div>
                <textarea id="inquire-custom-text" class="inquire-textarea" placeholder="在此键入仁兄心境之惑、经史疑义或考亭史迹..."></textarea>
                <div class="inquire-actions-row">
                    <button type="button" class="action-pill-btn outline" id="inquire-cancel-btn">
                        <span>暂且收回</span>
                    </button>
                    <button type="button" class="action-pill-btn gold" id="inquire-submit-btn">
                        <span>呈请先生开示 ➔</span>
                    </button>
                </div>
            </div>
        `;

        const textarea = modal.querySelector("#inquire-custom-text");
        modal.querySelectorAll(".preset-topic-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                if (textarea) textarea.value = btn.dataset.topic || "";
                modal.querySelectorAll(".preset-topic-btn").forEach(b => b.classList.remove("active"));
                btn.classList.add("active");
            });
        });

        const doSubmit = () => {
            const val = (textarea ? textarea.value : "").trim();
            if (!val) {
                if (typeof showToast === "function") showToast("请先键入或点击上方常研论题！");
                return;
            }
            modal.remove();
            this.submitInquiry(val);
        };

        modal.querySelector("#inquire-submit-btn").onclick = doSubmit;
        modal.querySelector("#inquire-cancel-btn").onclick = () => modal.remove();

        if (textarea) {
            textarea.addEventListener("keydown", (e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.isComposing && e.keyCode !== 229) {
                    e.preventDefault();
                    doSubmit();
                } else if (e.key === "Escape") {
                    modal.remove();
                }
            });
            if (!window.matchMedia || !window.matchMedia("(pointer: coarse)").matches) {
                setTimeout(() => textarea.focus(), 60);
            }
        }

        modal.addEventListener("click", (e) => {
            if (e.target === modal) modal.remove();
        });

        document.body.appendChild(modal);
    }

    async submitInquiry(query) {
        if (!query || !query.trim()) return;
        query = query.trim();

        // 记入研学履历
        this.logStudyRecord({
            time: new Date().toLocaleTimeString(),
            stepName: "学者当堂发问",
            choiceText: query,
            gainScore: 8,
            masterReply: "考亭先生当堂即席开示，点拨理学心法。"
        });

        const presetKnowledge = {
            "如何克服求学生活中的浮躁与焦虑？": {
                pose: "pose_3_gesture",
                face: "face_gentle",
                blackboard: "未得于前 莫求于后\n小立课程 微加积叠",
                text: "善哉！仁兄深得为学之通病。世间学者多患贪多求速、心浮气躁，未读首卷即急窥末卷。老夫尝示门人：‘读书不可贪多，且须小立课程，微加积叠。未得乎前，不敢求乎后；未通乎上，不敢求乎下。’心平气和，熟读精思，虚心涵泳，浮躁之气自消，方得源头活水！",
                choices: [
                    { text: "弟子谨记先生明训！当从小立课程做起，宁慢勿浮。", nextStep: this.currentStepIndex, gainScore: 8 },
                    { text: "先生言之切切！敢问若遇心神不属、杂念纷飞时，当以何法收摄？", gainScore: 8, followUpQuery: "日常心神不属、杂念纷飞时当以何法收摄本心？" },
                    { text: "领悟定静之道！愿重归正席跟随先生研习。", nextStep: this.currentStepIndex, gainScore: 5 }
                ]
            },
            "请先生讲讲当年武夷精舍的生活与弟子问答": {
                pose: "pose_7_beard",
                face: "face_encouraging",
                blackboard: "隐屏结庐 诸生环居\n琴书五十 讲席不辍",
                text: "哈哈！忆及淳熙隐屏结庐岁月，宛在眼前。当年精舍数楹，诸生从四方云集，环居隐求室与仁智堂。清晨振铎击柝，晨起整肃冠裳，相聚讲道研经；傍晚则携手散步九曲清溪之畔，问难辨折，虽粝食粗衣而乐在其中。学者相聚，贵在相与切磋，以发明古圣贤之大意也！",
                choices: [
                    { text: "诸生相从、切磋琢磨，真乃儒林盛事！学生景仰不已。", nextStep: this.currentStepIndex, gainScore: 8 },
                    { text: "敢问先生当年在精舍教导弟子，第一要义为何？", gainScore: 8, followUpQuery: "当年先生在武夷精舍教导门人弟子，最首要看重何种德性与工夫？" },
                    { text: "愿随先生当年讲筵章程，重回正席细细体察！", nextStep: this.currentStepIndex, gainScore: 5 }
                ]
            },
            "如何理解‘未发之中’与‘已发之和’？": {
                pose: "pose_9_point",
                face: "face_focused",
                blackboard: "喜怒未发 谓之中也\n发皆中节 谓之和也",
                text: "问得极精微！喜怒哀乐之未发，心体廓然大公，湛然虚明，寂然不动，此乃心之本体，故谓之‘中’；感物而动，情随事应，发皆中节，无过不及，此乃心之大用，故谓之‘和’。为学工夫，未发时贵在涵养存诚，主敬以直内；已发时贵在明察审度，断之以义。动静交修，方能浑然天理！",
                choices: [
                    { text: "未发时主敬存诚，已发时顺理应物！学生豁然省悟！", nextStep: this.currentStepIndex, gainScore: 8 },
                    { text: "请教先生：平日独处静坐之时，如何体认‘未发气象’？", gainScore: 8, followUpQuery: "平日独处静坐之时，学者该如何切实察识与体认‘未发之中’的气象？" },
                    { text: "佩服先生析理入微，愿重归正席领悟心性要义。", nextStep: this.currentStepIndex, gainScore: 5 }
                ]
            },
            "先生如何看待王安石变法与荆公新学？": {
                pose: "pose_2_side",
                face: "face_serious",
                blackboard: "正谊谋利 明道计功\n心术关天下 慎哉改弦",
                text: "王荆公才高识博，非流俗所及，其欲富国强兵救弊之志不可诬。然其学术病在喜功利、急事效，以聚敛为良图，引聚敛之徒而逐端士；更创《字说》新学以禁锢天下士人聪明，致使风俗日趋败坏。儒者为政，必先立根本：正其谊不谋其利，明其道不计其功。天下事未有本原不正而末流能济者！",
                choices: [
                    { text: "本正则末治！急功近利往往反害苍生，先生之论振聋发聩！", nextStep: this.currentStepIndex, gainScore: 8 },
                    { text: "敢问先生当年立五夫社仓之法，是否即是对急功敛财之拨乱反正？", gainScore: 8, followUpQuery: "先生当年推行五夫社仓法，与王荆公青苗法在恤民与敛财之别上何在？" },
                    { text: "学生领会先生经世大怀，愿回讲筵继续修学！", nextStep: this.currentStepIndex, gainScore: 5 }
                ]
            },
            "知行如何相须并进？": {
                pose: "pose_1_stand",
                face: "face_encouraging",
                blackboard: "知之愈明 行之愈笃\n行之愈笃 知之益明",
                text: "此乃理学功夫之枢纽！老夫尝言：‘论先后，知为先；论轻重，行为重。’未有知而不行者，知而不行，只是未知。读书穷理，是教你认得路头；真积力久，实践笃行，方是真正履践。知之愈明，则行之愈笃；行之愈笃，则知之益明。二者如车之两轮、鸟之双翼，交相引发，不可偏废！",
                choices: [
                    { text: "知行相发，行笃知明！弟子定当躬行实践，不作口头空谈！", nextStep: this.currentStepIndex, gainScore: 8 },
                    { text: "先生，若在知与行之间遇有脱节犹疑，该如何自策自励？", gainScore: 8, followUpQuery: "若学者日常发现自身知行脱节、明知故犯，当用何种工夫当头棒喝？" },
                    { text: "谨遵师训！愿重归正席，在事事物物上笃行致知。", nextStep: this.currentStepIndex, gainScore: 5 }
                ]
            },
            // 二阶深入追问匹配
            "日常心神不属、杂念纷飞时当以何法收摄本心？": {
                pose: "pose_7_beard",
                face: "face_focused",
                blackboard: "整齐严肃 常惺惺法\n敬以直内 心无私邪",
                text: "学者心神不属，病在无‘敬’字支撑。程夫子尝教人以‘常惺惺法’，老夫更教门人整齐严肃：衣冠必整，几席必洁，步履必正。杂念一生，即刻警惕照破，勿随之流转。心中有主，则私邪自退，此即‘敬以直内’之定静功夫！",
                choices: [
                    { text: "整齐严肃，常惺惺法！学生当下即刻整肃心神！", nextStep: this.currentStepIndex, gainScore: 8 },
                    { text: "💡 弟子就此仍有进一层疑问，欲继续请益先生...", isCustom: true },
                    { text: "重归正席，跟随先生朗诵经训。", nextStep: this.currentStepIndex, gainScore: 5 }
                ]
            },
            "当年先生在武夷精舍教导门人弟子，最首要看重何种德性与工夫？": {
                pose: "pose_3_gesture",
                face: "face_gentle",
                blackboard: "立志居敬 穷理工夫\n知行合一 笃实做人",
                text: "第一是要学者立志，第二便是‘主敬’。学者若无远大圣贤之志，便如无舵之舟；若无敬字工夫，便随境迁徙。老夫在精舍常劝诫诸生：莫作两可之人，休随俗世沉浮。在细微处见天理，在实学处下苦功，切忌以口耳剽窃为博！",
                choices: [
                    { text: "立志居敬，真切受教！学生永铭五内。", nextStep: this.currentStepIndex, gainScore: 8 },
                    { text: "💡 弟子就此仍有进一层疑问，欲继续请益先生...", isCustom: true },
                    { text: "重归正席，跟随先生朗诵经训。", nextStep: this.currentStepIndex, gainScore: 5 }
                ]
            },
            "平日独处静坐之时，学者该如何切实察识与体认‘未发之中’的气象？": {
                pose: "pose_6_desk",
                face: "face_calm",
                blackboard: "静坐澄心 湛然纯白\n不思善恶 默体大公",
                text: "静坐非释氏之槁木死灰、空空坐禅。学者端坐几席，收敛心神，不思过去未来，湛然纯白，私意不萌。此时观自家胸次，是否廓然大公、虚灵不昧？此即‘喜怒哀乐未发’之本原也。常加体察，本体自现！",
                choices: [
                    { text: "虚灵不昧，廓然大公！学生今日始知儒门静坐真髓！", nextStep: this.currentStepIndex, gainScore: 8 },
                    { text: "💡 弟子就此仍有进一层疑问，欲继续请益先生...", isCustom: true },
                    { text: "重归正席，跟随先生朗诵经训。", nextStep: this.currentStepIndex, gainScore: 5 }
                ]
            },
            "先生当年推行五夫社仓法，与王荆公青苗法在恤民与敛财之别上何在？": {
                pose: "pose_9_point",
                face: "face_serious",
                blackboard: "青苗重息 实乃病民\n社仓息半 民间自足",
                text: "问得极中肯綮！青苗法乃官府放贷，名为惠民，实以重息敛民之财入官帑，吏胥因之上下其手，民不聊生。而五夫社仓，乃老夫集民间豪右义谷，自收自放，息米折半，岁丰则免息。利归于民，不耗公帑，这才是儒家富民仁政，岂能同日而语！",
                choices: [
                    { text: "利在民间，公私分明！真乃万世师表之仁术！", nextStep: this.currentStepIndex, gainScore: 8 },
                    { text: "💡 弟子就此仍有进一层疑问，欲继续请益先生...", isCustom: true },
                    { text: "重归正席，跟随先生朗诵经训。", nextStep: this.currentStepIndex, gainScore: 5 }
                ]
            },
            "若学者日常发现自身知行脱节、明知故犯，当用何种工夫当头棒喝？": {
                pose: "pose_8_salute",
                face: "face_focused",
                blackboard: "勇猛精进 克去己私\n如斩如割 方成全人",
                text: "明知故犯，正因‘知’得未曾痛切，私意横流。老夫尝言：克己工夫，要如两军对垒，如斩截乱丝，不可有半分瞻顾迁就！当生大愧耻心，思圣贤如我，我亦如彼，何为甘于自弃？勇猛精进，当下斩断，方见男子气概！",
                choices: [
                    { text: "勇猛精进，克去己私！学生当以大愧耻心自策自厉！", nextStep: this.currentStepIndex, gainScore: 8 },
                    { text: "💡 弟子就此仍有进一层疑问，欲继续请益先生...", isCustom: true },
                    { text: "重归正席，跟随先生朗诵经训。", nextStep: this.currentStepIndex, gainScore: 5 }
                ]
            }
        };

        // 优先精准或模糊匹配预设经典库
        let matched = presetKnowledge[query];
        if (!matched) {
            for (const k in presetKnowledge) {
                if (query.includes(k) || k.includes(query) || (query.length > 4 && k.slice(0, 6) === query.slice(0, 6))) {
                    matched = presetKnowledge[k];
                    break;
                }
            }
        }

        if (matched) {
            this.enlightenment = Math.min(100, this.enlightenment + 8);
            this.reverence = Math.min(100, this.reverence + 6);
            this.renderStep({
                speaker: "考亭先生",
                pose: matched.pose || "pose_3_gesture",
                face: matched.face || "face_gentle",
                blackboard: matched.blackboard || "即席点拨\n即物穷理 居敬存诚",
                text: matched.text,
                choices: matched.choices
            });
            this.showScoreFloatNotice("+8 悟性");
            return;
        }

        // 取消之前的自由请益请求并绑定本次请求序列号（防止并发覆盖）
        if (this._inquiryAbortController) {
            try { this._inquiryAbortController.abort(); } catch (e) {}
        }
        const seq = ++this._inquirySeq;
        const controller = new AbortController();
        this._inquiryAbortController = controller;

        // 展示加载过渡对白（skipAutoVoice 防止误播加载提示语）
        this.renderStep({
            speaker: "考亭先生",
            pose: "pose_7_beard",
            face: "face_thinking",
            blackboard: `学者当堂请益\n${query.slice(0, 8)}...`,
            text: `“善哉！仁兄发问：‘${query}’，且稍候片刻，待老夫梳理先儒成训，当堂为汝剖析精义——”`,
            choices: []
        }, { skipAutoVoice: true });

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    query: query,
                    mode: "galgame",
                    session_id: `${this.sessionId}_${this.currentChapterId}`
                }),
                signal: controller.signal
            });
            if (seq !== this._inquirySeq) return;
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}`);
            }
            const data = await res.json();
            if (seq !== this._inquirySeq) return;

            let rawReply = (data.reply || "").trim();
            if (!rawReply) {
                throw new Error("空回复");
            }
            // 剥离可能残留的参考资料区块
            if (rawReply.includes("【参考资料】")) {
                rawReply = rawReply.split("【参考资料】")[0].trim();
            }

            let blackboardText = "即物穷理 居敬存诚\n知行合一 体认身心";
            let speechText = rawReply;

            if (rawReply.includes("[板书]")) {
                const parts = rawReply.split("[板书]");
                speechText = parts[0].trim();
                const bbRaw = parts[1].trim().split("\n")[0].trim();
                const bbWords = bbRaw.split(/\s+/).filter(Boolean);
                if (bbWords.length >= 2) {
                    blackboardText = `${bbWords[0]}\n${bbWords.slice(1).join(" ")}`;
                } else if (bbRaw) {
                    blackboardText = bbRaw;
                }
            }

            speechText = speechText.replace(/[#*`_~]/g, '').replace(/\n+/g, ' ').trim();
            if (speechText.length > 220) {
                const cut = Math.max(speechText.lastIndexOf("。", 210), speechText.lastIndexOf("！", 210), speechText.lastIndexOf("？", 210));
                speechText = cut > 80 ? speechText.slice(0, cut + 1) : (speechText.slice(0, 200) + "……");
            }

            this.enlightenment = Math.min(100, this.enlightenment + 8);
            this.reverence = Math.min(100, this.reverence + 6);
            this.renderStep({
                speaker: "考亭先生",
                pose: "pose_3_gesture",
                face: "face_focused",
                blackboard: blackboardText,
                text: speechText,
                choices: [
                    { text: "学生受教铭心！当体诸身心，笃行不怠。", nextStep: this.currentStepIndex, gainScore: 8 },
                    { text: "💡 弟子就此仍有进一层疑问，欲继续请益先生...", isCustom: true, gainScore: 5 },
                    { text: "领悟先生教诲！重温精舍正席讲义。", nextStep: this.currentStepIndex, gainScore: 5 }
                ]
            });
            this.showScoreFloatNotice("+8 悟性");
        } catch (err) {
            if (err && err.name === "AbortError") return;
            if (seq !== this._inquirySeq) return;
            console.error(err);
            this.renderStep({
                speaker: "考亭先生",
                pose: "pose_3_gesture",
                face: "face_gentle",
                blackboard: "即物穷理 虚心涵泳\n居敬存诚 切问近思",
                text: `“善哉！仁兄能发此问：‘${query}’，足见未肯随人脚跟转！为学当即事穷理，学者且细加思量，此问本原何在？”`,
                choices: [
                    { text: "学生受教！愿随先生指引，重归正席研读。", nextStep: this.currentStepIndex, gainScore: 8 },
                    { text: "💡 另选议题向先生当堂请益", isCustom: true }
                ]
            });
        } finally {
            if (this._inquiryAbortController === controller) {
                this._inquiryAbortController = null;
            }
        }
    }

    // 更新原典讲义抽屉面板与高亮胶囊
    updateSyllabusDrawer(chapterId) {
        if (!chapterId) chapterId = this.currentChapterId || "wuyi_jingshe";
        const data = this.syllabusDatabase ? this.syllabusDatabase[chapterId] : null;
        if (!data) return;

        const badgeEl = document.getElementById("course-badge");
        const titleEl = document.getElementById("course-title");
        const summaryEl = document.getElementById("course-summary");
        const originalEl = document.getElementById("course-original");
        const commentaryEl = document.getElementById("course-commentary");
        const thinkingEl = document.getElementById("course-thinking");

        if (badgeEl) badgeEl.textContent = data.badge;
        if (titleEl) titleEl.textContent = data.title;
        if (summaryEl) summaryEl.textContent = data.summary;
        if (originalEl) originalEl.textContent = data.original;
        if (commentaryEl) commentaryEl.textContent = data.commentary;
        if (thinkingEl) thinkingEl.textContent = data.thinking;

        // 同步更新抽屉内顶部胶囊按钮高亮
        const pills = document.querySelectorAll(".drawer-chapter-pill");
        pills.forEach(pill => {
            const cAttr = pill.getAttribute("data-chapter") || "";
            const onclickVal = pill.getAttribute("onclick") || "";
            if (cAttr === chapterId || onclickVal.includes(`'${chapterId}'`) || onclickVal.includes(`"${chapterId}"`)) {
                pill.classList.add("active");
            } else {
                pill.classList.remove("active");
            }
        });
    }

    // 抽屉专属章节快速切换入口
    switchSyllabusChapter(chapterId) {
        if (!chapterId) return;
        this.updateSyllabusDrawer(chapterId);
        this.loadChapter(chapterId, 0);
    }

}

// 实例化全局单例
window.galGameEngine = new GalGameEngine();
// 全局容灾与原型防护挂载：即便直接通过 window 调用也能万无一失
GalGameEngine.prototype.updateSyllabusDrawer = GalGameEngine.prototype.updateSyllabusDrawer || function(chapterId) {
    if (window.galGameEngine) window.galGameEngine.updateSyllabusDrawer(chapterId);
};
GalGameEngine.prototype.switchSyllabusChapter = GalGameEngine.prototype.switchSyllabusChapter || function(chapterId) {
    if (window.galGameEngine) window.galGameEngine.switchSyllabusChapter(chapterId);
};
window.switchSyllabusChapter = function(chapterId) {
    if (window.galGameEngine && typeof window.galGameEngine.switchSyllabusChapter === 'function') {
        window.galGameEngine.switchSyllabusChapter(chapterId);
    }
};
window.updateSyllabusDrawer = function(chapterId) {
    if (window.galGameEngine && typeof window.galGameEngine.updateSyllabusDrawer === 'function') {
        window.galGameEngine.updateSyllabusDrawer(chapterId);
    }
};
