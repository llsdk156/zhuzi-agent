/**
 * 沧洲藏书阁 · 3D 沉浸式互动图书馆 (Library 3D Engine v3.0)
 * 100% 依托古典书院真实图书馆殿堂 · 多层实木分类书架 · 典籍分类列架 · 3D 真实景深与视差
 * 学术分类：① 四书章句类、② 理学道统类、③ 经史政理类、④ 骚体性灵与家塾蒙学
 */

class Library3DEngine {
    constructor() {
        this.containerEl = null;
        this.selectedBookKey = null;
        this.parallaxBound = false;
        this.activeCategory = "all";

        // 十五部经典传世大作全景数据库 (精准对应四大理学学术流派分类)
        this.booksData = {
            // === 一、四书章句类 (进学之阶) ===
            sishu: {
                id: "sishu",
                category: "sishu",
                categoryName: "四书章句类",
                title: "《四书章句集注》",
                seal: "文公手定",
                spineColor: "#1e3a8a",
                tag: "理学第一经 · 进学总纲",
                author: "南宋 · 考亭先生 编注 · 历四十载心血",
                overview: "朱子毕生用力最深、成就最伟之巨著。将《大学》《中庸》《论语》《孟子》汇为四书，熔铸周程张邵诸儒之精微，使儒家学统在南宋为之一振，后世数百年间皆为华夏科举取士之国家准绳与立身圭臬。",
                studyMethod: {
                    order: "朱子手订读书法：先读《大学》以定其规模，次读《论语》以立其根本，次读《孟子》以观其发越，次读《中庸》以极夫精微。",
                    rules: "熟读精思：每句反复沉潜数十遍，使文意融于胸次；不可贪多务得，宁可少立课程，必须字字吃紧；虚心涵泳，切己体察。"
                },
                zhuziCulture: {
                    coreIdea: "格物致知与明明德",
                    commentary: "以理气论筑基，阐明心性修养功夫。提出‘穷事物之理，致吾心之知’，沟通内圣与外王，构筑了穷理立命的完整精神殿堂。"
                }
            },
            daxue: {
                id: "daxue",
                category: "sishu",
                categoryName: "四书章句类",
                title: "《大学章句》",
                seal: "初学入德",
                spineColor: "#1e40af",
                tag: "三纲八目 · 初学入德之门",
                author: "南宋 · 考亭先生 订定章句",
                overview: "朱子手订四书之首卷。以明明德、亲民、止于至善为‘三纲领’，以格物、致知、诚意、正心、修身、齐家、治国、平天下为‘八条目’。朱子补撰‘格致补传’，阐发即物穷理之精微，为治学第一基石。",
                studyMethod: {
                    order: "首重规模：学人未读他书，先当读此，以明圣贤做学问从始至终的大格局与下手处。",
                    rules: "循序渐进：三纲八目条理灿然，当自‘格物致知’切实用力，身心体验，不可躐等求通。"
                },
                zhuziCulture: {
                    coreIdea: "格致诚正与内圣外王",
                    commentary: "把道德自律【诚意正心】与天下治理【治国平天下】融汇贯通，奠定了儒家经世报国的生命图式。"
                }
            },
            lunyu: {
                id: "lunyu",
                category: "sishu",
                categoryName: "四书章句类",
                title: "《论语集注》",
                seal: "立其根本",
                spineColor: "#1d4ed8",
                tag: "二十篇 · 仁义礼智活水源泉",
                author: "南宋 · 考亭先生 集注",
                overview: "汇集宋代二程、张载及门人问答之精粹，逐字逐句深挖孔门师生亲切问难之本心。以‘仁’为核心，条理分明，去汉儒繁琐训诂，直指圣人气象与学者践履下手功夫。",
                studyMethod: {
                    order: "切己体玩：逐段细玩，看圣人当时因何人而发、针砭何病，若自己身在其侧当如何做。",
                    rules: "熟读成诵：涵泳沉潜，如含果咀味，直待自知其味方得。随事操存，在伦常日用中见仁道。"
                },
                zhuziCulture: {
                    coreIdea: "仁者爱人与克己复礼",
                    commentary: "主张‘克去己私，以复天理’，把先秦孔子仁学升华为涵盖宇宙气象与学者心性修省的至高天理。"
                }
            },
            mengzi: {
                id: "mengzi",
                category: "sishu",
                categoryName: "四书章句类",
                title: "《孟子集注》",
                seal: "观其发越",
                spineColor: "#2563eb",
                tag: "七篇十四卷 · 养浩然之正气",
                author: "南宋 · 考亭先生 集注",
                overview: "朱子考证战国大势，详析孟子性善之旨、义利之辨与浩然之气。洋洋洒洒，气象磅礴。朱子注云：‘孟子之言，自有一种发越气象，初学读之，易于激荡振作。’",
                studyMethod: {
                    order: "观其气魄：体会孟子‘万物皆备于我’、‘富贵不能淫’之丈夫节概与浩然道气。",
                    rules: "辨别义利：每读一章，常以‘何必曰利，亦有仁义而已矣’自省求学之初衷。"
                },
                zhuziCulture: {
                    coreIdea: "性本纯善与扩充良知",
                    commentary: "确立人性本善与善端扩充论，指出人人皆有恻隐、羞恶、辞让、是非之心，学问之道在‘求其放心’。"
                }
            },
            zhongyong: {
                id: "zhongyong",
                category: "sishu",
                categoryName: "四书章句类",
                title: "《中庸章句》",
                seal: "极夫精微",
                spineColor: "#3b82f6",
                tag: "三十三章 · 孔门传授心法之极致",
                author: "南宋 · 考亭先生 订定章句",
                overview: "子思恐道统失传而作此书。朱子晚年作《中庸章句》并撰《中庸序》，提出著名的‘人心道心’十六字心传【人心惟危，道心惟微，惟精惟一，允执厥中】，乃宋代理学性命天道之最高殿堂。",
                studyMethod: {
                    order: "终始融通：已熟《大学》《论语》《孟子》三书后方可读此，否则字字空泛难通。",
                    rules: "慎独深思：在‘莫见乎隐，莫显乎微’之处下存养省察功夫，无一刻放逸。"
                },
                zhuziCulture: {
                    coreIdea: "天命之谓性与率性之道",
                    commentary: "融合天道本体与心性修持，达到‘天地位焉，万物育焉’的儒家最高天人合一化境。"
                }
            },

            // === 二、理学道统类 (性理心法) ===
            jinsi: {
                id: "jinsi",
                category: "daotong",
                categoryName: "理学道统类",
                title: "《近思录》",
                seal: "理学入门",
                spineColor: "#78350f",
                tag: "宋代理学第一阶梯部帙",
                author: "考亭先生、吕祖谦 共同选编 · 淳熙二年",
                overview: "朱子与东莱吕祖谦在寒泉精舍会聚，从周敦颐、程颢、程颐、张载四子著作中精选六百余条理学格言编次而成。清代江永称其为‘入道之门，积学之基’，为学者披荆斩棘、开辟登堂入室之无上金针。",
                studyMethod: {
                    order: "学脉次第：先明道体，次究为学大端，次辨异端之失，终致治平之道。",
                    rules: "着紧用力：每段格言须当做警策自身之座右铭；随时省察念虑，在日用应酬处体认理气之行持。"
                },
                zhuziCulture: {
                    coreIdea: "天理本原与存养功夫",
                    commentary: "提炼‘未有天地之先，毕竟是先有此理’之理本论，强调‘涵养须用敬，进学在致知’，奠定了宋代理学辨析义利、存天理去人欲的道德基石。"
                }
            },
            yulei: {
                id: "yulei",
                category: "daotong",
                categoryName: "理学道统类",
                title: "《朱子语类》",
                seal: "师门问答",
                spineColor: "#14532d",
                tag: "百四十卷 · 师生会饮问难实录",
                author: "宋代门人门生手录 · 黎靖德 编次",
                overview: "如实记录考亭先生与四方学者后生谈玄析理、释经答问之生动言论，共一百四十卷。洋洋洒洒数百万言，无宋儒刻板之态，活泼生动、机锋毕现，乃研究朱子一生思想演变之第一手活水源头。",
                studyMethod: {
                    order: "随事问难：初学不必全卷通读，当先选‘理气’、‘性理’及‘读书法’卷次精研。",
                    rules: "心领神会：如同亲聆夫子于武夷精舍升堂开示，学者当把自己置身于门生之席，设身处地推求夫子每句棒喝之针砭所指。"
                },
                zhuziCulture: {
                    coreIdea: "即物穷理与答问机锋",
                    commentary: "充分彰显‘问渠那得清如许，为有源头活水来’的求真求实精神，展现朱子兼收并蓄、随问点化的博大教育气象。"
                }
            },
            taiji: {
                id: "taiji",
                category: "daotong",
                categoryName: "理学道统类",
                title: "《太极图说解》",
                seal: "道体本原",
                spineColor: "#854d0e",
                tag: "濂溪道脉 · 穷究万物本体演化",
                author: "南宋 · 考亭先生 撰解",
                overview: "朱子为周敦颐《太极图说》所撰传世注疏。阐述‘无极而太极’、阴阳动静互为其根之化育妙机，奠定了宋代理学宇宙论与本体论的最高哲学范式。",
                studyMethod: {
                    order: "由博反约：先观动静相生之象，次求其不杂不离之理，自一理散为万物，又由万物统归一理。",
                    rules: "心与理融：静中体认阴阳动静之端倪，收敛心神以达中和。"
                },
                zhuziCulture: {
                    coreIdea: "理气不离不杂与太极一理",
                    commentary: "提出‘人人有一太极，物物有一太极’，彻底解开本体与万物的哲学难题，是朱子学派形上学的奠基石。"
                }
            },
            ximing: {
                id: "ximing",
                category: "daotong",
                categoryName: "理学道统类",
                title: "《西铭解》",
                seal: "仁孝合一",
                spineColor: "#365314",
                tag: "横渠宏章 · 民胞物与之至诚博爱",
                author: "南宋 · 考亭先生 撰解",
                overview: "张载作《西铭》，朱子极为推崇并亲撰解说。‘乾称父，坤称母；予兹藐焉，乃混然中处。故天地之塞，吾其体；天地之帅，吾其性。民吾同胞，物吾与也。’构建儒家博大仁爱生命情怀。",
                studyMethod: {
                    order: "玩味体认：反复讽诵，体会以宇宙为家、以万民为手足的广大博爱气象。",
                    rules: "践履事亲：从孝事双亲生发，推己及人，由近及远，不可做狂妄大言。"
                },
                zhuziCulture: {
                    coreIdea: "民胞物与与理一分殊",
                    commentary: "朱子以‘理一分殊’释《西铭》，既坚持博爱天理之同一性，又肯定世间亲疏尊卑秩序之必然性。"
                }
            },

            // === 三、经史政理类 (春秋史鉴) ===
            gangmu: {
                id: "gangmu",
                category: "jingshi",
                categoryName: "经史政理类",
                title: "《资治通鉴纲目》",
                seal: "春秋义理",
                spineColor: "#991b1b",
                tag: "五十九卷 · 春秋笔法经世史鉴",
                author: "宋 · 考亭先生 撰定纲领，门人分撰细目",
                overview: "朱子承继孔子《春秋》之严谨书法，以‘纲’提要钩玄、正名定分，以‘目’详载史实。大义炳然，区别善恶，使千载治乱兴衰之故判然明白，为宋代士大夫乃至后世君臣从政经世之不祧宝典。",
                studyMethod: {
                    order: "史理互证：不可徒记治乱年代，当先看‘纲’所立大义，考其是非得失。",
                    rules: "正其义不谋其利，明其道不计其功：以天理道德审视千古成败，不以成者为是、败者为非。"
                },
                zhuziCulture: {
                    coreIdea: "经世致用与道统正义",
                    commentary: "强调理学绝非迂腐空谈，而是贯注于华夏历史脉络之浩然正气，将‘修齐治平’外王之道落实于天下政理。"
                }
            },
            shijizhuan: {
                id: "shijizhuan",
                category: "jingshi",
                categoryName: "经史政理类",
                title: "《诗集传》",
                seal: "思无邪",
                spineColor: "#b91c1c",
                tag: "二十卷 · 扫尽曲说，还诗经性情本色",
                author: "南宋 · 考亭先生 撰定",
                overview: "朱子打破两汉毛郑以谶纬政教牵强附会《诗经》的陋习，指出诗本抒写性情之作。首创‘男女相悦之辞’说，训诂严密，审美卓绝，成为后世八百年《诗经》学定本。",
                studyMethod: {
                    order: "虚心涵泳：不可先立主见，且随诗篇反复讽咏，体会男女、士子、君臣言外之性情脉动。",
                    rules: "思无邪：以中正和平之定理，鉴照诗中正变雅郑，感发自家纯正性情。"
                },
                zhuziCulture: {
                    coreIdea: "情发于性与温柔敦厚",
                    commentary: "展现朱子融通义理与文学之极高修养，主张‘性情中发，无非天理之流行’。"
                }
            },
            zhouyi: {
                id: "zhouyi",
                category: "jingshi",
                categoryName: "经史政理类",
                title: "《周易本义》",
                seal: "阴阳消长",
                spineColor: "#7f1d1d",
                tag: "十二卷 · 易本为卜筮而设之至论",
                author: "南宋 · 考亭先生 撰",
                overview: "朱子力纠王弼、程颐‘扫象求理’而空谈玄奥之弊，拨乱反正指出‘易本为卜筮之书’。通过详考卦画、筮法、卦变图，让学者由实测卜筮明晓阴阳消长之天理神妙。",
                studyMethod: {
                    order: "先玩其占：观卦爻象辞，晓得古人遇事为何如此决断，而后深究其中义理。",
                    rules: "居易俟命：学易者当知君子思不出其位，遇变则思通，处否当思泰。"
                },
                zhuziCulture: {
                    coreIdea: "动静有常与与时偕行",
                    commentary: "阐发宇宙天道变化莫测而理自如一之辩证法则，体现了理学家立足现实、随时应变的务实智慧。"
                }
            },

            // === 四、骚体性灵与家塾蒙学 ===
            chuci: {
                id: "chuci",
                category: "wenxue_meng",
                categoryName: "骚体性灵与家塾蒙学",
                title: "《楚辞集注》",
                seal: "骚体风骨",
                spineColor: "#581c87",
                tag: "八卷 · 晚年寄托忠义之性灵文采",
                author: "宋 · 考亭先生 晚岁校定撰注",
                overview: "朱子晚年身处逆境，感佩屈原之忠贞爱国与孤芳高洁，研读楚辞二十余载所成之杰作。训诂精当，音韵严谨，彻底打破两汉汉儒之穿凿牵强，被历代楚辞学界尊为集大成之定本。",
                studyMethod: {
                    order: "讽诵吟咏：先读离骚九歌，次及九章，当引吭高歌、体会三闾大夫之沉痛哀怨与浩然正气。",
                    rules: "体察其心：学者当观屈子‘虽九死其犹未悔’之坚贞志向，以自省吾辈面对坎坷挫折时之进退气节。"
                },
                zhuziCulture: {
                    coreIdea: "忠义风骨与诗性哲思",
                    commentary: "展现了朱子除大哲学家外罕为人知的大文学家风范，倡导文以载道、意发于至情之古雅审美境界。"
                }
            },
            tongmeng: {
                id: "tongmeng",
                category: "wenxue_meng",
                categoryName: "骚体性灵与家塾蒙学",
                title: "《童蒙须知》",
                seal: "蒙学立范",
                spineColor: "#0f766e",
                tag: "修身立范 · 幼学家风金规",
                author: "宋 · 考亭先生 亲订家塾学规",
                overview: "朱子为初入学童所订立之威仪规矩，从衣服冠履、语言步趋、洒扫应对、读书写字等日常生活细务着手。深入浅出，字字谆谆，奠定了华夏童蒙养正、敦品励志之八百年家风传统。",
                studyMethod: {
                    order: "从小学筑基：先做洒扫应对、侍奉长辈之细务，而后进修大学义理。",
                    rules: "不矜细行，终累大德：衣冠必整齐，步履必端祥，说话不可轻浮高声，字迹必求端正沉稳。"
                },
                zhuziCulture: {
                    coreIdea: "日常即道与敦品立本",
                    commentary: "强调天理不在云端远方，就在学者手头一碗一勺、晨起穿衣整冠之间。体现了理学‘下学而上达’的亲民务实精神。"
                }
            },
            xuegui: {
                id: "xuegui",
                category: "wenxue_meng",
                categoryName: "骚体性灵与家塾蒙学",
                title: "《白鹿洞书院学规》",
                seal: "天下宗准",
                spineColor: "#134e4a",
                tag: "五教之目 · 书院八百年最高宗约",
                author: "南宋 · 考亭先生 亲撰揭示",
                overview: "朱子知南康军复建白鹿洞书院时所手订之学规。将修身、处事、接物之纲领，概括为‘父子有亲、君臣有义、夫妇有别、长幼有序、朋友有信’五教，成为天下书院奉为金科玉律的最高办学准则。",
                studyMethod: {
                    order: "入座省视：学者入斋舍，当每日仰视壁间学规，自检言行是否有亏。",
                    rules: "言忠信，行笃敬，惩忿窒欲，迁善改过：不可徒记文辞应试，须切己做真儒者。"
                },
                zhuziCulture: {
                    coreIdea: "德性优先与书院精神",
                    commentary: "力矫科举利禄化倾向，确立华夏书院教化培养真德性、通达通儒的最高教育理想。"
                }
            },

            // === 五、武夷学院特藏 · 朱子特色文献 (闽北文库 / 考亭专藏) ===
            wuyi_kaoting: {
                id: "wuyi_kaoting",
                category: "wuyi_spec",
                categoryName: "武夷学院特藏 · 朱子特色文献",
                title: "《第二届考亭论坛专辑》",
                seal: "武夷特藏",
                spineColor: "#b45309",
                tag: "索书号: B244.75/L43:1 · 纸本(2) 可借(2)",
                author: "南平市委宣传部 / 海峡文艺出版社 2024",
                overview: "武夷学院逸夫图书馆特藏专架重点文献。全称《融通朱子文化 夯实文明根基:第二届考亭论坛专辑》。汇聚当代国内外顶级朱子学泰斗与前沿学者最新学术专论，系统探讨朱子文化的时代价值与精神内核。",
                studyMethod: {
                    order: "名家通读：先研读总论中关于朱子学当代活化路径，次探经学、礼学与社会伦理之交融。",
                    rules: "切己体察：对照武夷学院本地朱子学研究脉络，体认理学在当代的新开展。"
                },
                zhuziCulture: {
                    coreIdea: "融通创新与文明根基",
                    commentary: "以考亭论坛为枢纽，推动宋代理学从历史文献走向当代文化复兴，筑牢中华民族精神命脉。"
                },
                libraryInfo: {
                    callNumber: "B244.75/L43:1",
                    holding: "武夷学院逸夫图书馆 特藏室 · 闽北文库",
                    copies: "纸本馆藏 2 册 / 实时在架可借 2 册",
                    accessUrl: "https://wyutsg.wuyiu.edu.cn/space/index",
                    vpnGuide: "校外请登录武夷学院统一身份认证 WebVPN (mh.wuyiu.edu.cn) -> 图书馆数字资源 -> 闽北文库自建库查阅全文。"
                }
            },
            wuyi_chaosheng: {
                id: "wuyi_chaosheng",
                category: "wuyi_spec",
                categoryName: "武夷学院特藏 · 朱子特色文献",
                title: "《朝圣朱子》",
                seal: "武夷特藏",
                spineColor: "#c2410c",
                tag: "索书号: B244.7/Z46 · 纸本(6) 可借(5)",
                author: "周建平 编著 / 海峡文艺出版社 2024",
                overview: "武夷学院逸夫图书馆高借阅特色典籍。从五夫镇紫阳楼、兴贤书院、刘氏家塾、朱子社仓等实地历史遗存切入，全景式挖掘朱熹在武夷山成长、拜师、创立武夷精舍并授徒讲学长达半个世纪的传奇人生与历史情愫。",
                studyMethod: {
                    order: "地名对证：结合武夷精舍、九曲溪与五夫古镇地理形胜，按朱子青年潜修、中年著述、晚年集大成展开研读。",
                    rules: "身临其境：体会‘半亩方塘一鉴开’在五夫镇活水清泉中的真实物理与心理映射。"
                },
                zhuziCulture: {
                    coreIdea: "武夷精舍与道南正脉",
                    commentary: "武夷山是朱子理学的渊薮与归宿，展示了理学扎根闽北山水、体悟天理生机的独特魅力。"
                },
                libraryInfo: {
                    callNumber: "B244.7/Z46",
                    holding: "武夷学院逸夫图书馆 特藏部 / 闽北地方文献",
                    copies: "纸本馆藏 6 册 / 实时在架可借 5 册",
                    accessUrl: "https://wyutsg.wuyiu.edu.cn/space/index",
                    vpnGuide: "逸夫图书馆三楼与特藏室均有纸本直接外借，亦可通过 CADAL / 超星数字平台在线查阅。"
                }
            },
            wuyi_haiwai: {
                id: "wuyi_haiwai",
                category: "wuyi_spec",
                categoryName: "武夷学院特藏 · 朱子特色文献",
                title: "《朱子文化在海外》",
                seal: "武夷特藏",
                spineColor: "#991b1b",
                tag: "索书号: B244.75/D40 · 纸本(2) 可借(2)",
                author: "戴健 编著 / 海峡文艺出版社 2024.09",
                overview: "武夷学院特色文献库珍藏。系统考订朱子文化自宋元以降传入东亚及欧美的全历史路径。涵盖朝鲜李朝退溪学、日本江户时代水户学与朱子学派、越南儒学，以及近代以来欧美汉学界 —— 如陈荣捷、狄培瑞等 —— 对朱子新儒学的诠释。",
                studyMethod: {
                    order: "东亚到欧美：先读朝鲜李退溪与日本水户学章节，次读欧美现代汉学诠释。",
                    rules: "辨异同：考察异国文化在吸纳朱子学时对‘敬’、‘理气’概念的本土化转化。"
                },
                zhuziCulture: {
                    coreIdea: "世界文明互鉴与儒学全球化",
                    commentary: "印证了朱子学具有跨越国界的深远普适价值，是世界文明宝库中代表东方的璀璨明珠。"
                },
                libraryInfo: {
                    callNumber: "B244.75/D40",
                    holding: "武夷学院逸夫图书馆 特藏室 · 国际朱子学柜",
                    copies: "纸本馆藏 2 册 / 实时在架可借 2 册",
                    accessUrl: "https://wyutsg.wuyiu.edu.cn/space/index",
                    vpnGuide: "通过武夷学院 WebVPN (mh.wuyiu.edu.cn) 统一认证后进入知网或自建特色库即可获取目录与全文。"
                }
            },
            wuyi_shici: {
                id: "wuyi_shici",
                category: "wuyi_spec",
                categoryName: "武夷学院特藏 · 朱子特色文献",
                title: "《朱子的诗和远方》",
                seal: "武夷特藏",
                spineColor: "#854d0e",
                tag: "索书号: I207.227.442/Z43 · 纸本(1)",
                author: "张建光 著 / 海峡文艺出版社 2024",
                overview: "武夷学院逸夫图书馆特藏专架专著。打破理学‘刻板严苛’之偏见，聚焦朱熹作为宋代杰出诗人的艺术与精神境界。深入解读《观书有感》《春日》《云谷诗会》《九曲棹歌》等名作，展现理学家诗意栖居与自然山水相融的浩渺胸襟。",
                studyMethod: {
                    order: "吟咏相随：将诗篇与朱子当时之著述【如作《四书集注》之时】对照品读。",
                    rules: "涵泳澄澈：体会‘等闲识得东风面，万紫千红总是春’中满目天理之欣荣气象。"
                },
                zhuziCulture: {
                    coreIdea: "天理生机与诗意栖居",
                    commentary: "呈现了朱熹人格中活泼澄明的性灵底色，将道德修养化为天地大美的诗意流动。"
                },
                libraryInfo: {
                    callNumber: "I207.227.442/Z43",
                    holding: "武夷学院逸夫图书馆 六楼古籍特藏室",
                    copies: "纸本馆藏 1 册 / 现架阅览",
                    accessUrl: "https://wyutsg.wuyiu.edu.cn/space/index",
                    vpnGuide: "馆内特藏室支持开架阅览，校外通过 CARSI / WebVPN 登录武夷学院学术搜索获取文献篇目。"
                }
            },
            wuyi_fujian: {
                id: "wuyi_fujian",
                category: "wuyi_spec",
                categoryName: "武夷学院特藏 · 朱子特色文献",
                title: "《福建朱子学》",
                seal: "武夷特藏",
                spineColor: "#7c2d12",
                tag: "武夷学院朱子学研究中心奠基文献",
                author: "高令印、陈其芳 著 / 福建人民出版社",
                overview: "武夷学院朱子学研究中心权威经典。全面系统考证朱子学在福建【建州建阳、武夷精舍、考亭书院】形成的社会经济文化土壤，剖析朱熹门下福建籍弟子门人【黄榦、蔡元定、陈淳、刘爚等】的学术事迹与思想演进谱系。",
                studyMethod: {
                    order: "学派溯源：先明闽北地缘文风，再精读门人后学传授源流考。",
                    rules: "考据求真：注重原始文集志乘对证，理解宋代‘理学闽化’的历史转折。"
                },
                zhuziCulture: {
                    coreIdea: "闽学渊薮与弟子道统",
                    commentary: "系统奠定了福建作为朱子学大成本营的历史地位，是研习武夷理学文脉必读的学理巨构。"
                },
                libraryInfo: {
                    callNumber: "B244.75/G49:1",
                    holding: "武夷学院逸夫图书馆 特藏室 · 闽北理学专架",
                    copies: "特藏重点珍藏本",
                    accessUrl: "https://wyutsg.wuyiu.edu.cn/space/index",
                    vpnGuide: "校内读者凭校园卡直接入特藏室查阅；校外通过 WebVPN 统一身份认证访问特色古籍数据。"
                }
            },
            wuyi_century: {
                id: "wuyi_century",
                category: "wuyi_spec",
                categoryName: "武夷学院特藏 · 朱子特色文献",
                title: "《世纪之交的朱子学》",
                seal: "武夷特藏",
                spineColor: "#701a75",
                tag: "朱子文化协同创新文丛 · 三卷本",
                author: "徐公喜等主编 / 武夷学院朱子文化协同创新中心",
                overview: "武夷学院朱子文化协同创新中心重点标志性成果。精选百年来特别是1989至2015年间全球朱子学最高学术水准论文。收录陈来、张岱年、任继愈、杜维明等名家关于朱子理本体论、四书学、礼乐教化及现代价值的深邃思考。",
                studyMethod: {
                    order: "分卷研索：上卷探本体，中卷探经学与礼学，下卷探现代发展与海外传播。",
                    rules: "跨学科视野：结合现代哲学、法学、社会学理论审视宋代理学传统。"
                },
                zhuziCulture: {
                    coreIdea: "百年朱子学之集大成",
                    commentary: "集中展示了当代最高水准的朱子学学术图景，彰显武夷学院在全国理学研究阵地中的核心支撑作用。"
                },
                libraryInfo: {
                    callNumber: "B244.75/X38",
                    holding: "武夷学院逸夫图书馆 特藏室 · 协同创新专柜",
                    copies: "精装上中下三册",
                    accessUrl: "https://wyutsg.wuyiu.edu.cn/space/index",
                    vpnGuide: "通过武夷学院校园网统一身份认证登录 (mh.wuyiu.edu.cn) -> 图书馆数字学术资源平台即可研读。"
                }
            }
        };

        // 统一注入全量22部典籍的武夷学院真实OPAC馆藏与实时在架信息
        this.initOpacRegistry();
        this.init();
    }

    initOpacRegistry() {
        const opacDefaults = {
            sishu: { callNumber: "B222.12/Z90:10", holding: "武夷学院逸夫图书馆 总馆 - 流通书库", copies: "纸本馆藏 1 册 / 实时在架可借 1 册", status: "可借", isBorrowable: true, bibId: "mc7034ec9f084a8217d312a7fbb9d0960" },
            daxue: { callNumber: "B222.12/Z90：1", holding: "武夷学院逸夫图书馆 总馆 - 流通书库", copies: "纸本馆藏 3 册 / 实时在架可借 3 册", status: "可借", isBorrowable: true, bibId: "m1ac8664b61c03d8a5c8a35571d676d66" },
            lunyu: { callNumber: "B222.22/Z90", holding: "武夷学院逸夫图书馆 特藏室 · 宋明理学专柜", copies: "纸本馆藏 2 册 / 借出 (建议预约)", status: "借出", isBorrowable: false, bibId: "m94a1e22d43113bea41afbb3b3fb15046" },
            mengzi: { callNumber: "B222.52/Z90/1", holding: "武夷学院逸夫图书馆 总馆 - 流通书库", copies: "纸本馆藏 2 册 / 实时在架可借 2 册", status: "可借", isBorrowable: true, bibId: "m51f8f17f5b8a91bfc2c86da36d289bc9" },
            zhongyong: { callNumber: "B222.12/Z90：1", holding: "武夷学院逸夫图书馆 总馆 - 流通书库", copies: "纸本馆藏 3 册 / 实时在架可借 3 册", status: "可借", isBorrowable: true, bibId: "m1ac8664b61c03d8a5c8a35571d676d66" },
            jinsi: { callNumber: "B244.74/Z30", holding: "武夷学院逸夫图书馆 总馆 - 流通书库", copies: "纸本馆藏 2 册 / 实时在架可借 2 册", status: "可借", isBorrowable: true, bibId: "ma9ed44adcd8699c1c919d7fe122b33cf" },
            yulei: { callNumber: "B244.71/L42", holding: "武夷学院逸夫图书馆 特藏室 · 宋明理学专柜", copies: "纸本馆藏 1 册 / 借出 (建议预约)", status: "借出", isBorrowable: false, bibId: "m910fe206f504321ab8075f4425a6561e" },
            taiji: { callNumber: "B244.25/Z29", holding: "武夷学院逸夫图书馆 总馆 - 流通书库", copies: "纸本馆藏 1 册 / 实时在架可借 1 册", status: "可借", isBorrowable: true, bibId: "m03a229fed172c6c4457a9d25d0e3472e" },
            ximing: { callNumber: "B222/T94：46", holding: "武夷学院逸夫图书馆 六楼古籍特藏室", copies: "纸本馆藏 1 册 / 借出 (建议预约)", status: "借出", isBorrowable: false, bibId: "m329c4bf8aac402ba94c27628fa60915b" },
            gangmu: { callNumber: "K204.3/Z90:4", holding: "武夷学院逸夫图书馆 总馆 - 流通书库", copies: "纸本馆藏 4 册 / 实时在架可借 4 册", status: "可借", isBorrowable: true, bibId: "m847dd131dfc2f3cd792a696d5fc70bff" },
            shijizhuan: { callNumber: "I222.2/Z90", holding: "武夷学院逸夫图书馆 特藏室 · 古籍专柜", copies: "纸本馆藏 1 册 / 借出 (建议预约)", status: "借出", isBorrowable: false, bibId: "m09f06ea84a2100925179748950beff70" },
            zhouyi: { callNumber: "B221.5/L30", holding: "武夷学院逸夫图书馆 总馆 - 流通书库", copies: "纸本馆藏 2 册 / 实时在架可借 2 册", status: "可借", isBorrowable: true, bibId: "m733ba27d4b6949cbdefd37ffe4fd2f80" },
            chuci: { callNumber: "I222.3/Z90:2", holding: "武夷学院逸夫图书馆 总馆 - 流通书库", copies: "纸本馆藏 2 册 / 实时在架可借 2 册", status: "可借", isBorrowable: true, bibId: "mc81bc1fef94dd6cdc04a36d4466f66be" },
            tongmeng: { callNumber: "B222/T94：44", holding: "武夷学院逸夫图书馆 六楼古籍特藏室", copies: "纸本馆藏 1 册 / 借出 (建议预约)", status: "借出", isBorrowable: false, bibId: "me19479abe54bb4b8467c82ec016450aa" },
            xuegui: { callNumber: "TU-092.2/L70:3", holding: "武夷学院逸夫图书馆 总馆 - 流通书库", copies: "纸本馆藏 1 册 / 实时在架可借 1 册", status: "可借", isBorrowable: true, bibId: "m01a9861554abb51f11ba8d5c015131c8" },
            wuyi_kaoting: { callNumber: "B244.75/L43:1", holding: "武夷学院逸夫图书馆 特藏室 · 闽北文库", copies: "纸本馆藏 2 册 / 实时在架可借 2 册", status: "可借", isBorrowable: true, bibId: "m2b6005a499aa4f3f50aa0f01f5adc36f" },
            wuyi_chaosheng: { callNumber: "B244.7/Z46", holding: "武夷学院逸夫图书馆 特藏部 / 闽北地方文献", copies: "纸本馆藏 6 册 / 实时在架可借 5 册", status: "可借", isBorrowable: true, bibId: "m769fa97c35a89c0a3624980a21003904" },
            wuyi_dongjing: { callNumber: "B222/T94:71", holding: "武夷学院逸夫图书馆 六楼古籍特藏室", copies: "纸本馆藏 1 册 / 现架特藏", status: "借出", isBorrowable: false, bibId: "mfbad133c1b671b185a1e58b0939666e1" },
            wuyi_haiwai: { callNumber: "B244.75/D40", holding: "武夷学院逸夫图书馆 特藏室 · 国际朱子学柜", copies: "纸本馆藏 2 册 / 实时在架可借 2 册", status: "可借", isBorrowable: true, bibId: "m9750078ba9d212e3b9a8c8ddd7e281f2" },
            wuyi_shici: { callNumber: "I207.227.442/Z43", holding: "武夷学院逸夫图书馆 六楼古籍特藏室", copies: "纸本馆藏 1 册 / 现架阅览", status: "可借", isBorrowable: true, bibId: "m5590f490b8512b928c22c8a630f2f93b" },
            wuyi_fujian: { callNumber: "B244.75/G49:1", holding: "武夷学院逸夫图书馆 特藏室 · 闽北理学专架", copies: "纸本馆藏 2 册 / 实时在架可借 1 册", status: "可借", isBorrowable: true, bibId: "mcd9b1f2e032950ae0d77ce38a1bb4770" },
            wuyi_century: { callNumber: "B244.75/X39:2", holding: "武夷学院逸夫图书馆 特藏室 · 协同创新专柜", copies: "精装上中下三册 / 实时在架可借 1 册", status: "可借", isBorrowable: true, bibId: "md0bec348de5285f8b72b7bd977276ee9" }
        };

        for (const [k, d] of Object.entries(opacDefaults)) {
            if (this.booksData[k]) {
                const bibId = d.bibId || "";
                this.booksData[k].libraryInfo = {
                    callNumber: d.callNumber,
                    holding: d.holding,
                    copies: d.copies,
                    status: d.status,
                    isBorrowable: d.isBorrowable,
                    bibId: bibId,
                    accessUrl: bibId ? `https://wyutsg.wuyiu.edu.cn/space/searchDetailLocal/${bibId}` : "https://wyutsg.wuyiu.edu.cn/space/index",
                    vpnGuide: "逸夫图书馆三楼与特藏室均有纸本直接外借，亦可通过 CADAL / 超星数字平台在线查阅。"
                };
            }
        }
    }

    async syncOpacBooksData() {
        try {
            const res = await fetch('/api/opac/books');
            if (res.ok) {
                const opacMap = await res.json();
                window.opacBooksCache = opacMap;
                for (const [k, opac] of Object.entries(opacMap)) {
                    if (this.booksData[k]) {
                        const bibId = opac.bibId || "";
                        this.booksData[k].libraryInfo = {
                            callNumber: opac.callNumber || this.booksData[k].libraryInfo?.callNumber || "B222/1",
                            holding: opac.location || this.booksData[k].libraryInfo?.holding || "武夷学院逸夫图书馆 特藏室",
                            copies: opac.copiesDesc || this.booksData[k].libraryInfo?.copies || "在架可借",
                            status: opac.status || "可借",
                            isBorrowable: opac.isBorrowable !== false,
                            bibId: bibId,
                            accessUrl: opac.detailUrl || (bibId ? `https://wyutsg.wuyiu.edu.cn/space/searchDetailLocal/${bibId}` : "https://wyutsg.wuyiu.edu.cn/space/index"),
                            vpnGuide: "逸夫图书馆三楼与特藏室均有纸本直接外借，亦可通过 CADAL / 超星数字平台在线查阅。"
                        };
                    }
                }
            }
        } catch (e) {
            console.warn("OPAC 书目同步微恙:", e);
        }
    }

    init() {
        this.containerEl = document.getElementById("library-3d-container");
        if (!this.containerEl) return;

        // 1. 将15部典籍按照学术流派渲染到四大对应分类实木搁板上
        this.render3DBookshelf();

        // 2. 挂载 3D 鼠标透视视差微动力学
        this.setupParallaxTilt();

        // 3. 默认优先呈现进学第一核心流派【四书章句类】专属立体书架
        this.filterCategory("sishu");

        // 4. 后台同步最新OPAC借阅在架数据
        this.syncOpacBooksData();
    }

    // 切换折叠/展开四书读法次第详解抽屉
    toggleLadderDrawer() {
        const drawer = document.getElementById("ladder-drawer-content");
        const txt = document.getElementById("ladder-toggle-txt");
        if (!drawer) return;
        const isHidden = drawer.style.display === "none" || !drawer.style.display;
        drawer.style.display = isHidden ? "block" : "none";
        if (txt) {
            txt.textContent = isHidden ? "收起次第 ▴" : "查看次第微旨 ▾";
        }
    }

    // 点击考亭手订读法阶梯卡片，自动切入对应列架并即刻展卷阅读
    openLadderBook(bookKey) {
        if (!bookKey) return;
        const book = this.booksData[bookKey];
        if (!book) return;
        // 自动切换至典籍对应列架
        const targetCategory = book.category || "sishu";
        this.filterCategory(targetCategory);
        // 即刻打开展卷研读弹窗
        this.openBookReader(bookKey);
    }

    // 书架列架快速切换 (上一架 / 下一架)
    navTier(targetCat) {
        this.filterCategory(targetCat);
    }

    // 渲染四大分类实木书架上的 3D 古典课本
    render3DBookshelf() {
        const tierMapping = {
            sishu: document.getElementById("tier-books-sishu"),
            daotong: document.getElementById("tier-books-daotong"),
            jingshi: document.getElementById("tier-books-jingshi"),
            wenxue_meng: document.getElementById("tier-books-wenxue_meng"),
            wuyi_spec: document.getElementById("tier-books-wuyi_spec")
        };

        // 清空所有层架
        Object.values(tierMapping).forEach(el => {
            if (el) el.innerHTML = "";
        });

        // 遍历每本典籍，渲染至对应层架
        Object.entries(this.booksData).forEach(([key, book]) => {
            const targetContainer = tierMapping[book.category];
            if (!targetContainer) return;

            const bookItem = document.createElement("div");
            bookItem.className = "book-3d-item";
            bookItem.setAttribute("data-book-id", key);
            bookItem.setAttribute("data-category", book.category);

            bookItem.innerHTML = `
                <div class="book-3d-mesh" style="--book-color: ${book.spineColor};">
                    <!-- 书脊侧面 -->
                    <div class="book-spine">
                        <span class="spine-seal-tag">${book.seal}</span>
                        <span class="spine-vertical-text">${book.title.replace(/[《》]/g, "")}</span>
                        <span class="spine-ornament">❖</span>
                    </div>
                    <!-- 封面立体层 -->
                    <div class="book-cover">
                        <div class="cover-inner-border">
                            <span class="cover-seal-circle">${book.seal}</span>
                            <h4 class="cover-book-title">${book.title}</h4>
                            <p class="cover-book-tag">${book.tag}</p>
                            <span class="cover-author-mark">${book.category === 'wuyi_spec' ? '逸夫特藏' : '考亭先生手撰'}</span>
                        </div>
                    </div>
                    <!-- 纸张书页侧边 -->
                    <div class="book-pages-side"></div>
                </div>
                <!-- 底部阴影与基座 -->
                <div class="book-floor-shadow"></div>
                <!-- 底部交互铭牌 -->
                <div class="book-item-plate">
                    <span class="plate-title">${book.title}</span>
                    <span class="plate-btn">点击展卷阅览 ➔</span>
                </div>
            `;

            // 绑定点击打开立体翻书阅读器
            bookItem.addEventListener("click", () => {
                this.openBookReader(key);
            });

            targetContainer.appendChild(bookItem);
        });
    }

    // 挂载 3D 鼠标透视视差动力学 (令整个多层书架具有立体景深感)
    setupParallaxTilt() {
        const frame = document.getElementById("stereoscopic-bookshelf-frame");
        if (!frame || this.parallaxBound) return;
        this.parallaxBound = true;

        const container = document.getElementById("library-3d-container");
        if (!container) return;

        container.addEventListener("mousemove", (e) => {
            const rect = container.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width - 0.5;
            const y = (e.clientY - rect.top) / rect.height - 0.5;

            const rotateX = -y * 5; // 最大 2.5 度俯仰
            const rotateY = x * 7;  // 最大 3.5 度偏转
            frame.style.transform = `perspective(1400px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg)`;
        });

        container.addEventListener("mouseleave", () => {
            frame.style.transform = "perspective(1400px) rotateX(0deg) rotateY(0deg)";
        });
    }

    // 学术分类筛选：全部典籍 / ①四书章句类 / ②理学道统类 / ③经史政理类 / ④骚体性灵与家塾蒙学
    filterCategory(catKey, pillEl) {
        this.activeCategory = catKey;

        // 1. 更新分类胶囊激活态
        document.querySelectorAll(".category-pill").forEach(p => {
            if (pillEl) {
                if (p === pillEl) p.classList.add("active");
                else p.classList.remove("active");
            } else {
                const isMatch = (catKey === "all" && p.textContent.includes("全部")) ||
                                (catKey === "sishu" && p.textContent.includes("四书")) ||
                                (catKey === "daotong" && p.textContent.includes("理学道统")) ||
                                (catKey === "jingshi" && p.textContent.includes("经史政理")) ||
                                (catKey === "wenxue_meng" && p.textContent.includes("骚体蒙学")) ||
                                (catKey === "wuyi_spec" && p.textContent.includes("武夷学院"));
                if (isMatch) p.classList.add("active");
                else p.classList.remove("active");
            }
        });

        const tiers = {
            sishu: document.getElementById("shelf-tier-sishu"),
            daotong: document.getElementById("shelf-tier-daotong"),
            jingshi: document.getElementById("shelf-tier-jingshi"),
            wenxue_meng: document.getElementById("shelf-tier-wenxue_meng"),
            wuyi_spec: document.getElementById("shelf-tier-wuyi_spec")
        };

        const container = document.getElementById("classified-shelves-container");

        if (catKey === "all") {
            if (container) {
                container.classList.remove("single-tier-mode");
                container.classList.add("all-tiers-mode");
            }
            Object.values(tiers).forEach(tier => {
                if (tier) {
                    tier.style.display = "block";
                    tier.classList.remove("focused-tier", "dimmed-tier");
                }
            });
        } else {
            if (container) {
                container.classList.remove("all-tiers-mode");
                container.classList.add("single-tier-mode");
            }
            Object.entries(tiers).forEach(([k, tier]) => {
                if (!tier) return;
                if (k === catKey) {
                    tier.style.display = "block";
                    tier.classList.add("focused-tier");
                    tier.classList.remove("dimmed-tier");
                } else {
                    tier.style.display = "none";
                    tier.classList.remove("focused-tier");
                }
            });
        }
    }

    getVideoInfo(bookKey, title) {
        const cleanT = (title || "").replace(/[《》]/g, "").trim();

        const vMap = {
            sishu: {
                title: "《四书章句集注》导论与宋代理学纲领大成",
                lecturer: "陈来 先生 / 朱汉民 教授",
                inst: "清华大学国学院 / 岳麓书院 / 央视纪录频道",
                rating: "⭐️ 9.9分国家级权威",
                duration: "系统专题系列课",
                desc: "全面解读朱子倾注四十年心血之《四书章句集注》。央视大型纪录片《大儒朱熹》第3集《大道集成》深入还原朱子撰集四书学心路；清华陈来教授与岳麓朱汉民教授详析四书学体系建构与宋代理学转向之宏大脉络。",
                cctvTitle: "央视大型历史纪录片《大儒朱熹》第3集《大道集成》",
                cctvQuery: "大儒朱熹 大道集成 朱熹",
                moocTitle: "中国大学MOOC《中国哲学经典著作导读》（朱熹与四书）",
                moocQuery: "四书章句集注 朱熹",
                biliTitle: "清华陈来先生 / 岳麓朱汉民教授《四书章句集注》导学",
                biliQuery: "朱汉民 四书章句集注",
                open163Title: "网易公开课·宋代理学四书学转型精讲",
                open163Query: "四书章句集注 朱熹"
            },
            daxue: {
                title: "《大学章句》精读与三纲八目理学工夫",
                lecturer: "杨立华 教授",
                inst: "北京大学哲学系主任 / 西安交通大学国学院",
                rating: "⭐️ 9.9分北大名讲",
                duration: "大学之道专题精讲",
                desc: "深入阐发《大学章句》明明德、亲民、止于至善之‘三纲领’与格物致知修齐治平之‘八条目’。结合朱熹手撰‘格致补传’，精辟解析‘即物穷理’与内圣外王之生命图式。",
                cctvTitle: "央视《典籍里的中国》·《大学》与朱子理学特辑",
                cctvQuery: "典籍里的中国 大学 朱熹",
                moocTitle: "中国大学MOOC《中国哲学经典》（朱熹《大学章句》导读）",
                moocQuery: "大学章句 朱熹",
                biliTitle: "北京大学杨立华教授《大学章句》全文精讲",
                biliQuery: "杨立华 大学章句",
                open163Title: "网易公开课·宋明理学三纲八目导学",
                open163Query: "大学章句 朱熹"
            },
            lunyu: {
                title: "《论语集注》：孔门师生问对与朱子理学新解",
                lecturer: "杨立华 教授 / 丁耘 教授",
                inst: "北京大学哲学系 / 复旦大学哲学学院",
                rating: "⭐️ 9.9分名校精品",
                duration: "全网名校公开课集萃",
                desc: "复旦大学《论语导读》以朱熹《论语集注》为核心文献；北大杨立华教授逐章细解朱子如何融通二程张载精义，以‘理’释‘仁’，去汉儒繁琐训诂，直探孔门洙泗仁道活水源头。",
                cctvTitle: "央视《典籍里的中国·论语》与朱子集注文化专栏",
                cctvQuery: "典籍里的中国 论语",
                moocTitle: "中国大学MOOC 复旦大学《论语导读》（朱熹集注定本）",
                moocQuery: "论语导读 复旦大学",
                biliTitle: "北京大学杨立华教授《论语集注》哲学思想专题",
                biliQuery: "杨立华 论语集注",
                open163Title: "网易公开课·孔门问答与朱子新诠",
                open163Query: "论语集注 朱熹"
            },
            mengzi: {
                title: "《孟子集注》与浩然之气：心性论与义利之辨",
                lecturer: "朱汉民 教授 / 郭齐勇 教授",
                inst: "湖南大学岳麓书院 / 武汉大学国学院",
                rating: "⭐️ 9.8分名师讲堂",
                duration: "孟子学与宋代理学",
                desc: "深入解构孟子性善论、扩充四端、养浩然之气与何必曰利之崇高节概。详析朱子如何通过《孟子集注》确立儒家道义担当与天理良知之至大至刚。",
                cctvTitle: "央视《典籍里的中国·孟子》思想源流专栏",
                cctvQuery: "典籍里的中国 孟子",
                moocTitle: "中国大学MOOC《孟子与宋代理学》（岳麓书院名师讲堂）",
                moocQuery: "孟子集注 朱熹",
                biliTitle: "岳麓书院朱汉民教授《孟子集注》与心性功夫精讲",
                biliQuery: "朱汉民 孟子集注",
                open163Title: "网易公开课·孟子性善说与宋代理学演进",
                open163Query: "孟子集注 朱熹"
            },
            zhongyong: {
                title: "《中庸章句》：人心道心与十六字心传精要",
                lecturer: "楼宇烈 先生 / 彭林 教授",
                inst: "北京大学哲学系 / 清华大学人文学院",
                rating: "⭐️ 9.9分泰斗名讲",
                duration: "天命心性精微论",
                desc: "北京大学资深国学泰斗楼宇烈先生与清华彭林教授详析《中庸》‘天命之谓性，率性之谓道’。深度剖析朱子《中庸序》人心道心‘十六字心传’与慎独内省工夫，直探理学形上性命精微。",
                cctvTitle: "央视网《百家讲坛》/《文明之旅》儒家心性之道",
                cctvQuery: "中庸之道 朱熹",
                moocTitle: "中国大学MOOC《中国古代哲学》（中庸与理学天道论）",
                moocQuery: "中庸章句 朱熹",
                biliTitle: "北大楼宇烈先生《中庸哲学与传统人文精神》",
                biliQuery: "楼宇烈 中庸",
                open163Title: "网易公开课·中庸之道与慎独工夫",
                open163Query: "中庸章句 朱熹"
            },
            jinsi: {
                title: "《近思录》精讲：宋代理学入门第一部大成纲领",
                lecturer: "钱逊 先生 / 吴震 教授",
                inst: "清华大学思想文化研究所 / 复旦大学哲学学院",
                rating: "⭐️ 9.8分清华名讲",
                duration: "理学阶梯系统课",
                desc: "清华大学钱逊教授系统讲解朱熹与吕祖谦如何从周敦颐、二程、张载四子著作中精选格言编纂《近思录》，指明学者登堂入室之初学阶梯与居敬持志之治学要领。",
                cctvTitle: "央视网人文典籍《近思录》与理学源流特辑",
                cctvQuery: "近思录 朱熹 吕祖谦",
                moocTitle: "中国大学MOOC《中国哲学经典》（《近思录》导读）",
                moocQuery: "近思录 朱熹",
                biliTitle: "清华大学钱逊教授《近思录》导读全套讲席",
                biliQuery: "钱逊 近思录",
                open163Title: "网易公开课·宋代理学阶梯与涵养工夫",
                open163Query: "近思录 朱熹"
            },
            yulei: {
                title: "《朱子语类》导读：武夷讲席师生机锋与理学活水源头",
                lecturer: "吴震 教授",
                inst: "复旦大学哲学学院教授 / 中国哲学史学会会长",
                rating: "⭐️ 9.9分权威导读",
                duration: "武夷讲筵现场纪实",
                desc: "中国哲学史学会会长吴震教授深入还原《朱子语类》生动讲学现场，解析朱熹与黄榦、蔡元定、陈淳等门人论理气心性、格物知行的活水机锋。央视《大儒朱熹》第4集《春风化雨》亦实地重现了武夷精舍师徒对问实况。",
                cctvTitle: "央视大型纪录片《大儒朱熹》第4集《春风化雨》",
                cctvQuery: "大儒朱熹 春风化雨",
                moocTitle: "中国大学MOOC《宋明理学专题》（《朱子语类》研读）",
                moocQuery: "朱子语类 朱熹",
                biliTitle: "复旦吴震教授《朱子学现场：朱子语类中的师生问难》",
                biliQuery: "吴震 朱子语类",
                open163Title: "网易公开课·朱子门人答问与宋代理学现场",
                open163Query: "朱子语类 朱熹"
            },
            taiji: {
                title: "《太极图说解》与周敦颐朱熹理学宇宙生成论",
                lecturer: "郭齐勇 教授",
                inst: "武汉大学国学院名誉院长 / 中国哲学史名家",
                rating: "⭐️ 9.8分名家专讲",
                duration: "本体宇宙论精讲",
                desc: "理学名家郭齐勇教授详析‘无极而太极’、阴阳动静互为其根之本义，阐释朱熹如何借《太极图说解》建立‘理气不离不杂、人人有一太极’的宏大哲学宇宙观。",
                cctvTitle: "央视网《百家讲坛》周敦颐与理学开山特辑",
                cctvQuery: "太极图说 周敦颐 朱熹",
                moocTitle: "中国大学MOOC《中国古代哲学智慧》（太极与天理）",
                moocQuery: "太极图说解 朱熹",
                biliTitle: "武大郭齐勇教授《周敦颐太极图说与宋代理学本体论》",
                biliQuery: "郭齐勇 太极图说",
                open163Title: "网易公开课·理气阴阳宇宙生化精讲",
                open163Query: "太极图说解 朱熹"
            },
            ximing: {
                title: "《西铭解》与张载民胞物与境界：朱子理一分殊极意",
                lecturer: "向世陵 教授",
                inst: "中国人民大学哲学院教授 / 宋明理学专家",
                rating: "⭐️ 9.9分深度导读",
                duration: "天人宇宙博爱论",
                desc: "向世陵教授深入解读张载《西铭》‘天地之塞吾其体，天地之帅吾其性’，析透朱子《西铭解》以‘理一分殊’会通大爱之精奥，融汇宇宙博爱与社会亲疏秩序。",
                cctvTitle: "央视网国学公开课·张载横渠四句与《西铭》精神",
                cctvQuery: "西铭 张载 朱熹",
                moocTitle: "中国大学MOOC 人民大学《宋代理学原著精读》（《西铭》）",
                moocQuery: "西铭解 朱熹",
                biliTitle: "人大向世陵教授《张载西铭与朱熹理一分殊的哲学建构》",
                biliQuery: "向世陵 西铭",
                open163Title: "网易公开课·民胞物与生命情怀导读",
                open163Query: "西铭解 朱熹"
            },
            gangmu: {
                title: "《资治通鉴纲目》与朱子春秋正统史学观",
                lecturer: "虞万里 教授 / 辛德勇 教授",
                inst: "上海交通大学人文学院 / 北京大学历史学系",
                rating: "⭐️ 9.8分史学名篇",
                duration: "春秋大义与千秋史鉴",
                desc: "深入阐释朱熹《资治通鉴纲目》‘纲以提要，目以叙事’之体例，解读宋代理学义理如何化为史家褒贬大义与经世智慧。央视大型纪录片《大儒朱熹》第5集《一片丹心》亦深刻展现了朱子治史之浩然风骨。",
                cctvTitle: "央视大型纪录片《大儒朱熹》第5集《一片丹心》",
                cctvQuery: "大儒朱熹 一片丹心",
                moocTitle: "中国大学MOOC《中国史学名著导读》（资治通鉴纲目）",
                moocQuery: "资治通鉴纲目 朱熹",
                biliTitle: "上海交大虞万里教授《朱熹资治通鉴纲目之春秋书法》",
                biliQuery: "资治通鉴纲目 朱熹",
                open163Title: "网易公开课·宋代史学转型与正统论",
                open163Query: "资治通鉴纲目 朱熹"
            },
            shijizhuan: {
                title: "《诗集传》与朱子诗学革命：弃小序还原风雅性情",
                lecturer: "赵敏俐 教授",
                inst: "首都师范大学文学院 / 中国诗经学会",
                rating: "⭐️ 9.9分经典公开课",
                duration: "诗经学划时代定本",
                desc: "全面剖析朱子《诗集传》打破汉儒以经说诗、穿凿附会的千年陋习，首创‘男女相悦之辞’说，主张‘以诗读诗、涵泳吟咏’，还《诗经》原生态之性情与文学本色。",
                cctvTitle: "央视《诗词大会》/《典籍里的中国·诗经》特辑",
                cctvQuery: "诗经 诗集传 朱熹",
                moocTitle: "中国大学MOOC 首都师大《诗经导读》（朱熹诗集传定本）",
                moocQuery: "诗集传 朱熹",
                biliTitle: "中国诗经学会赵敏俐教授《朱熹诗集传与诗经学历史变革》",
                biliQuery: "赵敏俐 诗集传 朱熹",
                open163Title: "网易公开课·诗集传文学与经学审美",
                open163Query: "诗集传 朱熹"
            },
            zhouyi: {
                title: "《周易本义》：以卜筮明变道·朱熹易学图式与象数义理",
                lecturer: "张善文 教授",
                inst: "福建师范大学易学研究所所长 / 易学宗师",
                rating: "⭐️ 9.9分泰斗名讲",
                duration: "易学图式与变通智慧",
                desc: "当代易学泰斗张善文教授详析朱子《周易本义》九图卦变、象数兼备之体，阐明朱熹‘易本为卜筮而作以教民知变’之伟大发明，揭示阴阳消长与天道生生不息之理。",
                cctvTitle: "央视网《文明之旅》/《百家讲坛》易道智慧专题",
                cctvQuery: "周易本义 朱熹",
                moocTitle: "中国大学MOOC 福建师大《易学概论》（朱熹周易本义）",
                moocQuery: "周易本义 朱熹",
                biliTitle: "易学宗师张善文教授《朱熹周易本义与宋代易学体系》",
                biliQuery: "张善文 周易本义",
                open163Title: "网易公开课·周易象数与理学义理融通",
                open163Query: "周易本义 朱熹"
            },
            chuci: {
                title: "《楚辞集注》：屈原忠义之志与朱子晚年幽愤心声",
                lecturer: "廖名春 教授",
                inst: "清华大学人文学院历史系教授",
                rating: "⭐️ 9.8分清华名讲",
                duration: "骚体文心与忠臣大烈",
                desc: "廖名春教授阐释朱熹晚年遭遇庆元党禁、隐居武夷山编注《楚辞集注》的心路历程，辨明屈原忠君爱国、九死未悔之儒者大烈与宋儒刚毅风节。央视《典籍里的中国·楚辞》亦有深情辉映。",
                cctvTitle: "央视《典籍里的中国·楚辞》与朱熹楚辞集注专栏",
                cctvQuery: "典籍里的中国 楚辞",
                moocTitle: "中国大学MOOC 清华大学《楚辞导读》（朱熹集注本）",
                moocQuery: "楚辞集注 朱熹",
                biliTitle: "清华大学廖名春教授《朱熹楚辞集注之文学与历史意蕴》",
                biliQuery: "廖名春 楚辞集注",
                open163Title: "网易公开课·屈原九死不悔精神与晚宋理学心史",
                open163Query: "楚辞集注 朱熹"
            },
            tongmeng: {
                title: "《童蒙须知》与《朱子家训》：蒙学礼仪教化与立身治家",
                lecturer: "钱文忠 教授",
                inst: "复旦大学历史学系教授",
                rating: "⭐️ 9.8分高口碑经典",
                duration: "童蒙养正与家风传承",
                desc: "复旦名师钱文忠教授生动讲解《童蒙须知》之衣冠步履、语言洒扫进退，阐发中国传统家训立身处世之道。央视大型纪录片《大儒朱熹》第1集《家国天下》亦实地再现了朱子在五夫镇制定童蒙规矩的教化历程。",
                cctvTitle: "央视大型纪录片《大儒朱熹》第1集《家国天下》",
                cctvQuery: "大儒朱熹 家国天下",
                moocTitle: "中国大学MOOC《中华传统家风与蒙学经典》（朱子童蒙须知）",
                moocQuery: "童蒙须知 朱熹",
                biliTitle: "复旦大学钱文忠教授《童蒙须知与朱子家训精读》",
                biliQuery: "钱文忠 童蒙须知 朱熹",
                open163Title: "网易公开课·传统家风家训与启蒙礼仪",
                open163Query: "童蒙须知 朱熹"
            },
            xuegui: {
                title: "《白鹿洞书院学规》与宋代书院讲学精神的千古范式",
                lecturer: "邓洪波 教授",
                inst: "湖南大学岳麓书院教授 / 全国书院研究权威",
                rating: "⭐️ 9.9分书院史权威",
                duration: "千年学规立德树人",
                desc: "著名书院史专家邓洪波教授详解朱熹手订《白鹿洞书院揭示》五教之目、为学之序、修身处事接物之要，重温千年书院立德树人之魂。央视大型纪录片《大儒朱熹》第4集与《中华书院》均将此列为核心篇章。",
                cctvTitle: "央视《中华书院》/ 纪录片《大儒朱熹》书院学规专栏",
                cctvQuery: "白鹿洞书院学规 朱熹",
                moocTitle: "中国大学MOOC 湖南大学《中国书院史》（白鹿洞书院学规）",
                moocQuery: "白鹿洞书院学规 朱熹",
                biliTitle: "岳麓书院邓洪波教授《白鹿洞书院学规与中国传统教育精髓》",
                biliQuery: "邓洪波 白鹿洞书院学规",
                open163Title: "网易公开课·白鹿洞书院揭示与书院教化宗准",
                open163Query: "白鹿洞书院学规 朱熹"
            },
            wuyi_kaoting: {
                title: "考亭论道·当代回响：朱子学与中华优秀传统文化传承创新",
                lecturer: "考亭论坛海内外学界泰斗组（陈来、朱汉民、杨立华等联合讲席）",
                inst: "武夷学院朱子学研究中心 / 福建省南平市朱子文化研究会",
                rating: "⭐️ 9.9分特辑精讲",
                duration: "考亭论坛高峰对话",
                desc: "考亭论坛大会特辑，汇聚海内外顶级学者，研讨朱子理学如何解答当代文明困境，展现考亭学派由武夷走向世界的时代新篇与当代学术活化。",
                cctvTitle: "央视网新闻与专题·考亭论坛朱子文化传承创新大会",
                cctvQuery: "考亭论坛 朱子文化",
                moocTitle: "中国大学MOOC《朱子文化与当代中国》（考亭学派）",
                moocQuery: "考亭论坛 朱子学",
                biliTitle: "第二届考亭论坛名家主旨演讲特辑（陈来、朱汉民、葛荣晋）",
                biliQuery: "考亭论坛 朱子文化",
                open163Title: "网易公开课·考亭理学与当代文明对话",
                open163Query: "考亭论坛 朱子文化"
            },
            wuyi_chaosheng: {
                title: "《朝圣朱子》：从尤溪到武夷山——寻访宋代理学大儒的一生",
                lecturer: "央视人文纪录片摄制组 / 武夷学院特藏部团队",
                inst: "中央广播电视总台 / 武夷学院朱子文化特藏部",
                rating: "⭐️ 9.9分实景巨制",
                duration: "全景式人文历史纪录",
                desc: "循着朱子生平足迹探访尤溪半亩方塘、五夫紫阳楼、武夷精舍与建阳考亭书院，感受大儒山水理学情怀。央视大型纪录片《大儒朱熹》六集全景式展现了朱熹七十一年传奇人生。",
                cctvTitle: "央视官方大型人文纪录片《大儒朱熹》全集专题",
                cctvQuery: "大儒朱熹 纪录片",
                moocTitle: "中国大学MOOC《武夷文化与朱子理学》（实景研学课）",
                moocQuery: "朱熹 武夷山",
                biliTitle: "大型历史纪录片《大儒朱熹》高清全六集聚合",
                biliQuery: "大儒朱熹 纪录片",
                open163Title: "网易公开课·宋代理学泰斗朱熹传记纪录片",
                open163Query: "朱熹 纪录片"
            },
            wuyi_haiwai: {
                title: "《大儒朱熹》第6集《棹歌四海》：朱子学世界传播与东亚文明互鉴",
                lecturer: "国际儒学学者联合讲席 / 央视纪录频道",
                inst: "国际儒学联合会 / 武夷学院特聘客座讲席 / 央视",
                rating: "⭐️ 9.9分全球视野",
                duration: "世界文明互鉴专集",
                desc: "央视大型历史纪录片《大儒朱熹》第六集《棹歌四海》，摄制组远赴韩国、日本、欧洲实地拍摄朱子学东传朝鲜退溪学派、日本江户时代水户学及西传欧洲莱布尼茨的世纪历程，展现世界级哲学巨擘的全球影响。",
                cctvTitle: "央视大型纪录片《大儒朱熹》第6集《棹歌四海》",
                cctvQuery: "大儒朱熹 棹歌四海",
                moocTitle: "中国大学MOOC《东亚儒学史》（朱子学海外传播）",
                moocQuery: "朱子学 海外传播",
                biliTitle: "纪录片《大儒朱熹》第6集：朱子学东传东亚与西传世界历程",
                biliQuery: "大儒朱熹 棹歌四海",
                open163Title: "网易公开课·朱子学在东亚与欧美的跨文化诠释",
                open163Query: "朱子文化 海外"
            },
            wuyi_shici: {
                title: "《武夷九曲棹歌》与理学山水诗：朱子的诗意人生与活水理趣",
                lecturer: "方彦寿 研究员 / 央视《诗词大会》专家组",
                inst: "武夷学院朱子学研究中心顾问 / 地方文史权威",
                rating: "⭐️ 9.9分诗性精讲",
                duration: "九曲山水与理学诗心",
                desc: "武夷学院朱子学权威方彦寿研究员实地行舟九曲，逐曲解析《九曲棹歌》十首与《精舍杂咏》《春日》《观书有感》，揭示理学诗性美学与天地鸢飞鱼跃之生机体悟。",
                cctvTitle: "央视《中国诗词大会》朱熹诗词（观书有感、春日）深度赏析",
                cctvQuery: "九曲棹歌 朱熹",
                moocTitle: "中国大学MOOC《中国古典诗词赏析》（朱熹理学诗精读）",
                moocQuery: "朱熹 诗词",
                biliTitle: "武夷学院方彦寿研究员实地精讲《武夷棹歌与朱子诗意山水》",
                biliQuery: "九曲棹歌 方彦寿",
                open163Title: "网易公开课·理学家的诗意人生与万物生机",
                open163Query: "朱熹 诗词"
            },
            wuyi_fujian: {
                title: "《福建朱子学》：闽学之发祥与福建理学道统渊源考",
                lecturer: "徐公喜 教授",
                inst: "福建社会科学院哲学所原所长 / 武夷学院闽北文库研究室",
                rating: "⭐️ 9.8分道统探源",
                duration: "道南正脉与闽北理学",
                desc: "系统考索杨时道南指教、罗从彦、李延平至朱熹‘延平答问’的闽学传承谱系，详述福建作为理学摇篮与圣地的深厚文化基因与门人学术传承。",
                cctvTitle: "央视网大型人文地理《福建朱子文化遗存与闽学渊源》",
                cctvQuery: "福建朱子学",
                moocTitle: "中国大学MOOC《闽文化概论》（朱子学与宋代福建）",
                moocQuery: "福建朱子学",
                biliTitle: "武夷学院闽北文库徐公喜教授《福建朱子学与考亭学派源流考》",
                biliQuery: "福建朱子学 闽学",
                open163Title: "网易公开课·道南正脉与宋代理学闽化之路",
                open163Query: "福建朱子学"
            },
            wuyi_century: {
                title: "21世纪朱子学研究新走向与世界哲学对话",
                lecturer: "陈来 先生 / 刘笑敢 教授",
                inst: "清华大学国学院 / 北京师范大学哲学学院",
                rating: "⭐️ 9.8分百年学术",
                duration: "百年朱子学学术图景",
                desc: "立足百年朱子学发展脉络，探讨朱熹理本体论、生态伦理与仁学工夫对当代全球化伦理重构的深远启示，全面评介世纪之交海内外朱子学研究标志性成果。",
                cctvTitle: "央视网《面对面》/ 学术访谈：当代朱子学与中华文明新形态",
                cctvQuery: "朱子学 现代价值",
                moocTitle: "中国大学MOOC 清华陈来先生《宋明理学》国家精品课",
                moocQuery: "宋明理学 陈来",
                biliTitle: "清华陈来先生 / 北师大刘笑敢教授《21世纪朱子学展望与对话》",
                biliQuery: "陈来 宋明理学",
                open163Title: "网易公开课·宋明理学当代价值与国际汉学视野",
                open163Query: "朱子学 现代研究"
            }
        };

        // 匹配逻辑
        let item = vMap[bookKey];
        if (!item) {
            if (cleanT.includes("周易") || cleanT.includes("易")) item = vMap["zhouyi"];
            else if (cleanT.includes("楚辞")) item = vMap["chuci"];
            else if (cleanT.includes("诗经") || cleanT.includes("诗集传")) item = vMap["shijizhuan"];
            else if (cleanT.includes("通鉴") || cleanT.includes("纲目")) item = vMap["gangmu"];
            else if (cleanT.includes("白鹿") || cleanT.includes("学规") || cleanT.includes("揭示")) item = vMap["xuegui"];
            else if (cleanT.includes("童蒙") || cleanT.includes("家训")) item = vMap["tongmeng"];
            else if (cleanT.includes("近思录")) item = vMap["jinsi"];
            else if (cleanT.includes("语类")) item = vMap["yulei"];
            else if (cleanT.includes("太极")) item = vMap["taiji"];
            else if (cleanT.includes("西铭")) item = vMap["ximing"];
            else if (cleanT.includes("论语")) item = vMap["lunyu"];
            else if (cleanT.includes("孟子")) item = vMap["mengzi"];
            else if (cleanT.includes("中庸")) item = vMap["zhongyong"];
            else if (cleanT.includes("大学")) item = vMap["daxue"];
            else if (cleanT.includes("四书")) item = vMap["sishu"];
            else if (cleanT.includes("考亭") || cleanT.includes("论坛")) item = vMap["wuyi_kaoting"];
            else if (cleanT.includes("朝圣")) item = vMap["wuyi_chaosheng"];
            else if (cleanT.includes("海外") || cleanT.includes("东亚")) item = vMap["wuyi_haiwai"];
            else if (cleanT.includes("棹歌") || cleanT.includes("诗")) item = vMap["wuyi_shici"];
            else if (cleanT.includes("福建") || cleanT.includes("闽学")) item = vMap["wuyi_fujian"];
            else if (cleanT.includes("世纪") || cleanT.includes("展望")) item = vMap["wuyi_century"];
            else {
                item = {
                    title: `《${cleanT}》理学义理精解与名家公开课`,
                    lecturer: "宋明理学特藏名家",
                    inst: "知名高校哲学系 / 国家级公开课平台",
                    rating: "⭐️ 9.8分全网精选",
                    duration: "45分00秒",
                    desc: `名师深度解构《${cleanT}》义理脉络，字求其训、句索其旨，体悟宋明理学治学生命智慧。全网各大平台均有配套公开课资源。`,
                    cctvTitle: `央视网《${cleanT}》与朱子文化精选专栏`,
                    cctvQuery: `朱熹 ${cleanT}`,
                    moocTitle: `中国大学MOOC《${cleanT}》相关高校精品课`,
                    moocQuery: `朱熹 ${cleanT}`,
                    biliTitle: `B站知名高校哲学名师《${cleanT}》解析视频`,
                    biliQuery: `朱熹 ${cleanT} 讲解`,
                    open163Title: `网易公开课《${cleanT}》人文素养讲座`,
                    open163Query: `朱熹 ${cleanT}`
                };
            }
        }

        const platforms = [
            {
                name: "央视网 (CCTV) 官方专栏 / 纪录片",
                shortName: "央视网",
                icon: "🏛️",
                tag: "国家级纪录特辑",
                color: "#dc2626",
                bgColor: "#fef2f2",
                borderColor: "#fecaca",
                url: `https://search.cctv.com/search.php?qtext=${encodeURIComponent(item.cctvQuery || ('朱熹 ' + cleanT))}`,
                desc: item.cctvTitle || `央视官方《大儒朱熹》六集大型历史纪录片 / 《百家讲坛》 / 《典籍里的中国》专栏`
            },
            {
                name: "中国大学MOOC (iCourse) 高校精品课",
                shortName: "中国大学MOOC",
                icon: "🎓",
                tag: "高校国家精品",
                color: "#16a34a",
                bgColor: "#f0fdf4",
                borderColor: "#bbf7d0",
                url: `https://www.icourse163.org/search.htm?search=${encodeURIComponent(item.moocQuery || ('朱熹 ' + cleanT))}`,
                desc: item.moocTitle || `高校国家精品公开课（北大、复旦、西安交大、岳麓书院名家讲堂）`
            },
            {
                name: "哔哩哔哩 (B站) 高校名家公开课",
                shortName: "哔哩哔哩",
                icon: "🎬",
                tag: "名师高校原版",
                color: "#0284c7",
                bgColor: "#f0f9ff",
                borderColor: "#bae6fd",
                url: `https://search.bilibili.com/all?keyword=${encodeURIComponent(item.biliQuery || ('朱熹 ' + cleanT + ' 讲解'))}`,
                desc: item.biliTitle || `知名高校哲学系教授与理学专家原版讲座视频检索直达`
            },
            {
                name: "网易公开课 / 国图公开课",
                shortName: "网易公开课",
                icon: "📖",
                tag: "开放人文课堂",
                color: "#d97706",
                bgColor: "#fffbeb",
                borderColor: "#fde68a",
                url: `https://open.163.com/search/search.do?query=${encodeURIComponent(item.open163Query || ('朱熹 ' + cleanT))}`,
                desc: item.open163Title || `网易公开课与国家图书馆公益讲座人文典籍精选专题`
            }
        ];

        return {
            ...item,
            platforms,
            url: platforms[0].url
        };
    }

    // 打开立体古籍阅览器
    openBookReader(bookKey) {
        const existingModal = document.querySelector(".reader-overlay");
        if (existingModal) existingModal.remove();

        const book = this.booksData[bookKey];
        if (!book) return;
        this.selectedBookKey = bookKey;
        const video = this.getVideoInfo(bookKey, book.title);
        const lib = book.libraryInfo || {
            callNumber: "B222.12/Z90：1",
            holding: "武夷学院逸夫图书馆 总馆 - 流通书库",
            copies: "纸本馆藏 3 册 / 实时在架可借 3 册",
            status: "可借",
            accessUrl: "https://wyutsg.wuyiu.edu.cn/space/index",
            vpnGuide: "逸夫图书馆三楼与特藏室均有纸本直接外借，亦可通过 CADAL / 超星数字平台在线查阅。"
        };

        const modalHtml = `
            <div class="book-reader-modal">
                <div class="reader-decor-top"></div>
                <!-- 顶部卷首 -->
                <div class="reader-header-row">
                    <div class="reader-title-group">
                        <span class="reader-seal">${book.seal}</span>
                        <h2 class="reader-book-title">${book.title}</h2>
                        <span class="reader-author">${book.author}</span>
                    </div>
                    <div class="reader-header-actions" style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                        <a href="${lib.accessUrl}" target="_blank" rel="noopener noreferrer" class="reader-action-pill reserve-pill-btn" style="background:linear-gradient(135deg, #0284c7 0%, #0369a1 100%); color:#fff; text-decoration:none; padding:6px 14px; font-size:12.5px; font-weight:700; border-radius:6px; display:inline-flex; align-items:center; gap:5px; box-shadow:0 2px 5px rgba(2,132,199,0.3);" title="直达武夷学院图书馆《${book.title}》官方专属预约界面">
                            🏛️ 直达官方预约系统（对应本书）➔
                        </a>
                        <button class="reader-action-pill gold" style="background:#b45309; color:#fff; border:none; padding:6px 12px; font-size:12.5px; font-weight:700; border-radius:6px; cursor:pointer;" onclick="library3DEngine.openFulltextReader('${bookKey}', '${book.title}')" title="阅读完整文章">
                            📖 具体内容：阅读完整文章 ➔
                        </button>
                        <button class="reader-close-btn" onclick="this.closest('.modal-overlay').remove()">✕ 闭卷归架</button>
                    </div>
                </div>

                <!-- 卷中三大核心研读书斋面板 -->
                <div class="reader-scroll-content">
                    <!-- 板块 1：名著提要简介 -->
                    <div class="reader-section">
                        <div class="section-gold-head">
                            <span class="head-icon">📜</span>
                            <h3>【传世名著原委与简介】</h3>
                        </div>
                        <p class="section-p">${book.overview}</p>
                    </div>

                    <!-- 板块 2：朱子手订读书法与进学次第 -->
                    <div class="reader-section highlight-box">
                        <div class="section-gold-head">
                            <span class="head-icon">📖</span>
                            <h3>【朱子手订读书法与学习次第】</h3>
                        </div>
                        <div class="method-sub-row">
                            <div class="method-badge">进学阶梯</div>
                            <p class="method-text">${book.studyMethod.order}</p>
                        </div>
                        <div class="method-sub-row">
                            <div class="method-badge">精思要诀</div>
                            <p class="method-text">${book.studyMethod.rules}</p>
                        </div>
                    </div>

                    <!-- 板块 3：蕴含朱子文化精义解构 -->
                    <div class="reader-section">
                        <div class="section-gold-head">
                            <span class="head-icon">🏮</span>
                            <h3>【蕴含朱子文化与理学精义】</h3>
                        </div>
                        <div class="culture-pill-row">
                            <span class="culture-core-tag">核心义理：${book.zhuziCulture.coreIdea}</span>
                        </div>
                        <p class="section-p">${book.zhuziCulture.commentary}</p>
                    </div>

                    <!-- 板块 4：武夷学院逸夫图书馆特藏与全文查阅指引 -->
                    <div class="reader-section library-loc-box" style="background:#fefce8; border:1.5px solid #d97706; border-radius:10px; padding:14px 18px; margin-top:14px;">
                        <div class="section-gold-head" style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px;">
                            <div style="display:flex; align-items:center; gap:8px;">
                                <span class="head-icon">🏛️</span>
                                <h3 style="color:#92400e; margin:0;">【武夷学院图书馆 · 逸夫特藏实时馆藏与获取指引】</h3>
                            </div>
                            <div style="display:flex; align-items:center; gap:8px;">
                                <span id="lib-reader-status-tag-${bookKey}" class="borrow-status-tag ${lib.status === '可借' ? 'status-ok' : 'status-busy'}" style="padding:4px 12px; border-radius:12px; font-size:12px; font-weight:700; ${lib.status === '可借' ? 'background:#dcfce7; color:#15803d; border:1px solid #86efac;' : 'background:#fee2e2; color:#b91c1c; border:1px solid #fca5a5;'}">
                                    ${lib.status === '可借' ? '🟢 实时在架 · 可借' : '🔴 已全部借出 · 需预约'}
                                </span>
                                <button type="button" id="btn-refresh-live-opac-${bookKey}" onclick="library3DEngine.refreshLiveOpacStatus('${bookKey}', '${book.title}')" style="background:#fff; border:1px solid #d97706; color:#b45309; padding:3px 10px; border-radius:12px; font-size:11.5px; font-weight:700; cursor:pointer; display:inline-flex; align-items:center; gap:4px;" title="强制直连武夷学院OPAC后台刷新当前最新借阅在架状态">
                                    <span>🔄 实时刷新状态</span>
                                </button>
                            </div>
                        </div>
                        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:10px; margin:10px 0; font-size:12.5px;">
                            <div style="background:#fff; padding:8px 12px; border-radius:6px; border:1px solid #fde68a;">
                                <strong style="color:#b45309;">📌 索书号：</strong><code id="lib-reader-callno-${bookKey}" style="font-weight:700; color:#1e293b; background:#fef08a; padding:1px 6px; border-radius:4px;">${lib.callNumber}</code>
                            </div>
                            <div style="background:#fff; padding:8px 12px; border-radius:6px; border:1px solid #fde68a;">
                                <strong style="color:#b45309;">📍 馆藏地点：</strong><span id="lib-reader-location-${bookKey}">${lib.holding}</span>
                            </div>
                            <div style="background:#fff; padding:8px 12px; border-radius:6px; border:1px solid #fde68a;">
                                <strong style="color:#b45309;">📗 在馆状态：</strong><span id="lib-reader-copies-${bookKey}" style="color:#15803d; font-weight:700;">${lib.copies}</span>
                            </div>
                        </div>
                        <!-- OPAC 直达与预约快捷操作行 -->
                        <div style="display:flex; gap:10px; flex-wrap:wrap; margin:12px 0 10px 0;">
                            <a id="lib-reader-detail-url-${bookKey}" href="${lib.accessUrl}" target="_blank" rel="noopener noreferrer" class="opac-direct-jump-btn" style="background:linear-gradient(135deg, #0284c7 0%, #0369a1 100%); color:#fff; text-decoration:none; padding:8px 18px; border-radius:6px; font-size:13px; font-weight:700; display:inline-flex; align-items:center; gap:6px; box-shadow:0 2px 6px rgba(2,132,199,0.3);" title="直达武夷学院OPAC系统该书籍专属详情页，点击页面内蓝色【预约】按钮即可登录并完成预约">
                                🏛️ 直达武夷学院图书馆·${book.title}官方预约系统 ➔
                            </a>
                        </div>
                        <div style="background:#f0fdf4; border-left:3.5px solid #0f766e; padding:10px 14px; font-size:12px; line-height:1.65; color:#166534; border-radius:4px;">
                            <strong>🏛️ 官方借阅预约流程说明：</strong><br>
                            ① <strong>精准直达对应课本</strong>：点击上方<strong>【🏛️ 直达武夷学院图书馆·${book.title}官方预约系统 ➔】</strong>，直接打开武夷学院智慧图书馆针对该课本的官方专属详情页。<br>
                            ② <strong>点击蓝色预约按钮</strong>：在打开的图书馆页面中直接点击蓝色<strong>【预约】</strong>按钮，系统将自动进入登录与预约提交环节，登录后直接锁定该书架位。<br>
                            ③ <strong>实时数据核验</strong>：<span id="lib-reader-sync-time-${bookKey}" style="font-weight:700; color:#0f766e;">已直连武夷学院OPAC后台</span>，索书号与在架状态与学校物理藏书实时同步。<br>
                            ④ <strong>校外电子全文查阅</strong>：${lib.vpnGuide}
                        </div>
                    </div>

                    <!-- 板块 5：学界名家深度导学 · 全网名家与权威公开课矩阵 -->
                    <div class="reader-section video-recommend-box" style="background:#f8fafc; border:1.5px solid #0284c7; border-radius:10px; padding:16px 18px; margin-top:16px;">
                        <div class="section-gold-head" style="margin-bottom:12px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px;">
                            <div style="display:flex; align-items:center; gap:8px;">
                                <span class="head-icon">🌐</span>
                                <h3 style="color:#0369a1; margin:0; font-size:15.5px;">【名著深度导学 · 全网名家与权威公开课矩阵】</h3>
                            </div>
                            <div style="display:flex; align-items:center; gap:8px;">
                                <span style="background:#e0f2fe; color:#0369a1; font-size:11.5px; font-weight:700; padding:3px 10px; border-radius:12px; border:1px solid #7dd3fc;">🌐 全网四大平台互通</span>
                                <span style="background:#f1f5f9; color:#475569; font-size:11.5px; font-weight:600; padding:3px 8px; border-radius:12px;">⏱️ ${video.duration}</span>
                            </div>
                        </div>

                        <!-- 导读总览卡片 -->
                        <div style="background:#ffffff; border:1px solid #cbd5e1; border-radius:8px; padding:14px 16px; box-shadow:0 2px 6px rgba(0,0,0,0.04); margin-bottom:12px;">
                            <div style="margin-bottom:8px;">
                                <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:6px;">
                                    <h4 style="margin:0; font-size:15.5px; color:#0f172a; font-weight:700; font-family:var(--font-serif);">${video.title}</h4>
                                    <span style="font-size:11.5px; background:#fef3c7; color:#92400e; font-weight:700; padding:2px 8px; border-radius:4px; border:1px solid #fde68a;">${video.rating}</span>
                                </div>
                                <p style="margin:6px 0 0 0; font-size:13px; color:#0284c7; font-weight:600;">👨‍🏫 主讲名师/来源：${video.lecturer} · ${video.inst}</p>
                            </div>
                            <p style="margin:0 0 10px 0; font-size:12.5px; color:#475569; line-height:1.65; background:#f8fafc; padding:10px 14px; border-radius:6px; border-left:3.5px solid #0284c7;">
                                ${video.desc}
                            </p>
                            <div style="font-size:12px; color:#64748b; line-height:1.5;">
                                💡 <strong>全网找讲座与纪录片</strong>：系统已为您检索全网各大国家级与高校平台，并建立<strong>央视网官方纪录片、中国大学MOOC国家精品课、B站高校名师专场、网易公开课</strong>四大直达观看通道，点击即可在新窗口直接观看：
                            </div>
                        </div>

                        <!-- 全网四大主流平台直达通道网格卡片 -->
                        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(240px, 1fr)); gap:10px;">
                            ${(video.platforms || []).map(p => `
                                <div style="background:${p.bgColor}; border:1.5px solid ${p.borderColor}; border-radius:8px; padding:12px 14px; display:flex; flex-direction:column; justify-content:space-between; gap:8px;">
                                    <div>
                                        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:4px;">
                                            <strong style="color:${p.color}; font-size:13px; display:flex; align-items:center; gap:6px;">
                                                <span>${p.icon}</span> <span>${p.name}</span>
                                            </strong>
                                            <span style="font-size:10.5px; background:#fff; color:${p.color}; border:1px solid ${p.borderColor}; padding:1px 6px; border-radius:4px; font-weight:700;">${p.tag}</span>
                                        </div>
                                        <p style="margin:0; font-size:12px; color:#475569; line-height:1.45;">${p.desc}</p>
                                    </div>
                                    <div style="display:flex; align-items:center; justify-content:space-between; gap:8px; margin-top:4px;">
                                        <a href="${p.url}" target="_blank" rel="noopener noreferrer" style="flex:1; display:inline-flex; align-items:center; justify-content:center; gap:6px; background:${p.color}; color:#ffffff; padding:7px 12px; border-radius:6px; font-size:12.5px; text-decoration:none; font-weight:700; text-align:center;">
                                            <span>进入观看 ➔</span>
                                        </a>
                                        <button class="copy-link-btn" onclick="navigator.clipboard.writeText('${p.url}').then(()=>{ this.textContent='✅ 已复制'; setTimeout(()=>this.textContent='📋 复制', 2000); })" style="background:#ffffff; border:1px solid ${p.borderColor}; color:${p.color}; font-size:11.5px; padding:6px 10px; border-radius:6px; cursor:pointer; font-weight:600; white-space:nowrap;">📋 复制</button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <!-- 底部联动操作栏 -->
                <div class="reader-actions-bar" style="display:flex; gap:10px; flex-wrap:wrap;">
                    <button class="reader-action-pill red" onclick="library3DEngine.consultInClassroom('${book.title}')">
                        <span>📖 请先生在第一人称讲筵领读此书 ➔</span>
                    </button>
                    <button class="reader-action-pill gold" style="background:#b45309; color:#fff; border:none; font-weight:700;" onclick="library3DEngine.openFulltextReader('${bookKey}', '${book.title}')">
                        <span>📜 具体内容 · 阅读完整文章与篇章精粹 ➔</span>
                    </button>
                    <a href="${lib.accessUrl}" target="_blank" rel="noopener noreferrer" class="reader-action-pill" style="background:linear-gradient(135deg, #0284c7 0%, #0369a1 100%); color:#fff; text-decoration:none; font-weight:700; display:inline-flex; align-items:center; gap:4px; box-shadow:0 2px 5px rgba(2,132,199,0.3);" title="直达武夷学院图书馆该课本官方预约界面">
                        <span>🏛️ 直达官方预约系统（对应本书）➔</span>
                    </a>
                    <button class="reader-action-pill outline" onclick="library3DEngine.askInQA('${book.title}')">
                        <span>💬 移步问学书斋深入请教</span>
                    </button>
                </div>
            </div>
        `;

        const overlay = document.createElement("div");
        overlay.className = "modal-overlay visible reader-overlay";
        overlay.innerHTML = modalHtml;
        overlay.addEventListener("click", (e) => {
            if (e.target === overlay) overlay.remove();
        });
        document.body.appendChild(overlay);

        // 打开藏书详情卡片时，毫秒级异步向武夷学院图书馆后台发起实时架位核验
        setTimeout(() => {
            this.refreshLiveOpacStatus(bookKey, book.title);
        }, 150);
    }

    // 直接对接武夷学院图书馆后台，实时刷新典籍借阅在架与索书号状态
    async refreshLiveOpacStatus(bookKey, bookTitle) {
        const btn = document.getElementById("btn-refresh-live-opac-" + bookKey);
        const tag = document.getElementById("lib-reader-status-tag-" + bookKey);
        const callnoEl = document.getElementById("lib-reader-callno-" + bookKey);
        const holdingEl = document.getElementById("lib-reader-location-" + bookKey);
        const copiesEl = document.getElementById("lib-reader-copies-" + bookKey);
        const syncTimeEl = document.getElementById("lib-reader-sync-time-" + bookKey);
        const detailUrlEl = document.getElementById("lib-reader-detail-url-" + bookKey);

        if (btn) {
            btn.innerHTML = `<span>⏳ 对接后台中...</span>`;
            btn.disabled = true;
        }

        try {
            const res = await fetch(`/api/opac/status?keyword=${encodeURIComponent(bookTitle || bookKey)}&force=true`);
            if (res.ok) {
                const data = await res.json();
                const isAvail = (data.status === "可借");
                if (tag) {
                    tag.className = `borrow-status-tag ${isAvail ? 'status-ok' : 'status-busy'}`;
                    tag.style.background = isAvail ? '#dcfce7' : '#fee2e2';
                    tag.style.color = isAvail ? '#15803d' : '#b91c1c';
                    tag.style.borderColor = isAvail ? '#86efac' : '#fca5a5';
                    tag.textContent = isAvail ? '🟢 实时在架 · 可借' : '🔴 已全部借出 · 需预约';
                }
                if (callnoEl && data.callNumber) callnoEl.textContent = data.callNumber;
                if (holdingEl && data.location) holdingEl.textContent = data.location;
                if (copiesEl && data.copiesDesc) copiesEl.textContent = data.copiesDesc;
                if (detailUrlEl && data.detailUrl) detailUrlEl.href = data.detailUrl;
                if (syncTimeEl) syncTimeEl.textContent = `已于 ${data.lastCheckedTime || new Date().toLocaleTimeString()} 实时对接最新后台`;

                // 同时更新全局缓存
                if (window.opacBooksCache) {
                    window.opacBooksCache[bookKey] = {
                        ...(window.opacBooksCache[bookKey] || {}),
                        ...data,
                        callNumber: data.callNumber,
                        location: data.location,
                        status: data.status,
                        isBorrowable: isAvail,
                        copiesDesc: data.copiesDesc
                    };
                }
            }
        } catch (e) {
            console.warn("OPAC后台实时刷新异常:", e);
        } finally {
            if (btn) {
                btn.innerHTML = `<span>🔄 实时刷新状态</span>`;
                btn.disabled = false;
            }
        }
    }

    // 展开完整文章阅读器（支持关键字/文段特别黄色标注并精准定位）
    async openFulltextReader(bookKey, bookTitle, highlightSnippet = "", filename = "", chapterName = "") {
        try {
            const queryParams = new URLSearchParams();
            if (bookKey) queryParams.set("book_key", bookKey);
            if (filename) queryParams.set("filename", filename);
            if (bookTitle) queryParams.set("title", bookTitle);

            const res = await fetch(`/api/book/content?${queryParams.toString()}`);
            if (!res.ok) {
                alert("未找到该典籍正文，请稍后再试");
                return;
            }
            const data = await res.json();
            const chapters = data.chapters || [];
            const fullText = data.full_text || "";

            // 净化定位文句，提取核心关键词（2-8字）
            const cleanTarget = (highlightSnippet || "")
                .replace(/[#*`_>~[\]()（）“”，。！？；：、与和及在的是]/g, " ")
                .replace(/\s+/g, " ")
                .trim();
            let targetWords = cleanTarget.split(" ").filter(w => w.length >= 2);
            if (targetWords.length === 0 && cleanTarget.length >= 2) {
                targetWords = [cleanTarget];
            }
            if (cleanTarget.length > 4) {
                targetWords.push(cleanTarget.substring(0, 4));
                targetWords.push(cleanTarget.substring(cleanTarget.length - 4));
            }
            targetWords = Array.from(new Set(targetWords.filter(w => w && w.length >= 2)));
            let hasMarked = false;

            // 预先寻找目标章节索引
            let targetChIdx = -1;
            if (chapterName) {
                const cleanCh = chapterName.replace(/[#*`_]/g, "").trim();
                targetChIdx = chapters.findIndex(c => c.title && (c.title.includes(cleanCh) || cleanCh.includes(c.title)));
            }
            if (targetChIdx === -1 && targetWords.length > 0) {
                targetChIdx = chapters.findIndex(c => {
                    const text = (c.lines ? c.lines.join(' ') : (c.content || ''));
                    return targetWords.some(w => text.includes(w));
                });
            }

            const formatHeader = (title) => {
                if (!hasMarked && targetWords.length > 0) {
                    for (const kw of targetWords) {
                        if (title.includes(kw)) {
                            hasMarked = true;
                            const markedTitle = title.split(kw).join(`<mark id="ft-highlight-target" style="background:#fef08a; color:#854d0e; padding:3px 8px; border-radius:4px; font-weight:bold; box-shadow:0 0 12px rgba(234,179,8,0.7); border:1.5px solid #eab308; display:inline-block;">${kw}</mark>`);
                            return markedTitle;
                        }
                    }
                }
                return title;
            };

            const formatLine = (line) => {
                const trimmed = line.trim();
                if (!trimmed) return '';
                if (!hasMarked && targetWords.length > 0) {
                    for (const kw of targetWords) {
                        if (trimmed.includes(kw)) {
                            hasMarked = true;
                            const markedLine = trimmed.split(kw).join(`<mark id="ft-highlight-target" style="background:#fef08a; color:#854d0e; padding:3px 8px; border-radius:4px; font-weight:bold; box-shadow:0 0 12px rgba(234,179,8,0.7); border:1.5px solid #eab308; display:inline-block;">${kw}</mark>`);
                            return `<p style="margin:8px 0; text-indent:2em; background:rgba(254,240,138,0.18); border-left:3px solid #eab308; padding:4px 8px;">${markedLine}</p>`;
                        }
                    }
                }
                return `<p style="margin:8px 0; text-indent:2em;">${trimmed}</p>`;
            };

            const ftModalHtml = `
                <div class="fulltext-reader-modal" style="width:92%; max-width:980px; height:85vh; background:#fdfbf7; border-radius:12px; display:flex; flex-direction:column; overflow:hidden; border:2px solid #c59b4c; box-shadow:0 20px 40px rgba(0,0,0,0.45);">
                    <div style="background:#8b1d1d; color:#fff; padding:12px 20px; display:flex; justify-content:space-between; align-items:center;">
                        <div style="display:flex; align-items:center; gap:10px;">
                            <span style="background:#d97706; color:#fff; font-size:11px; padding:2px 8px; border-radius:10px; font-weight:700;">原典特藏文献</span>
                            <h3 style="margin:0; font-size:17px; font-family:var(--font-serif);">${data.title || bookTitle}</h3>
                            <span style="font-size:12px; opacity:0.85;">全篇共 ${data.char_count || fullText.length} 字</span>
                            ${(highlightSnippet || chapterName) ? `<span style="background:#fef3c7; color:#92400e; font-size:11.5px; padding:2px 8px; border-radius:10px; font-weight:700; border:1px solid #f59e0b;">🎯 已精准定位至该文段所在处并黄底高亮标注</span>` : ''}
                        </div>
                        <div style="display:flex; align-items:center; gap:8px;">
                            <button onclick="library3DEngine.adjustFontSize(1)" style="background:rgba(255,255,255,0.2); border:none; color:#fff; padding:4px 10px; border-radius:4px; cursor:pointer;" title="放大字号">A+</button>
                            <button onclick="library3DEngine.adjustFontSize(-1)" style="background:rgba(255,255,255,0.2); border:none; color:#fff; padding:4px 10px; border-radius:4px; cursor:pointer;" title="缩小字号">A-</button>
                            <button onclick="library3DEngine.copyBookText()" style="background:rgba(255,255,255,0.2); border:none; color:#fff; padding:4px 10px; border-radius:4px; cursor:pointer;" title="复制全文">📋 复制</button>
                            <button onclick="this.closest('.fulltext-overlay').remove()" style="background:none; border:none; color:#fff; font-size:18px; cursor:pointer; padding:0 6px;">✕</button>
                        </div>
                    </div>
                    <div style="flex:1; display:flex; overflow:hidden;">
                        ${chapters.length > 1 ? `
                        <div style="width:230px; border-right:1px solid #e2d9c8; background:#f7f3ec; overflow-y:auto; padding:10px;">
                            <div style="font-size:12px; font-weight:700; color:#8b1d1d; margin-bottom:8px; padding-bottom:4px; border-bottom:1px solid #e2d9c8;">卷次与篇章导航</div>
                            <ul style="list-style:none; padding:0; margin:0;">
                                ${chapters.map((ch, idx) => `
                                    <li class="ft-ch-item ${idx === targetChIdx ? 'active' : ''}" onclick="library3DEngine.jumpToChapter(${idx}, this)" style="padding:6px 8px; font-size:12.5px; border-radius:4px; cursor:pointer; margin-bottom:3px; color:#451a03; border-left:2px solid ${idx === targetChIdx ? '#8b1d1d' : 'transparent'}; background:${idx === targetChIdx ? '#fef3c7' : 'none'}; font-weight:${idx === targetChIdx ? 'bold' : 'normal'};">
                                        ${idx + 1}. ${ch.title || `第${idx + 1}章`}
                                    </li>
                                `).join('')}
                            </ul>
                        </div>
                        ` : ''}
                        <div id="ft-scroll-content" style="flex:1; padding:20px 28px; overflow-y:auto; font-size:15.5px; line-height:1.9; color:#1e293b; font-family:var(--font-serif);">
                            ${chapters.length > 0 ? chapters.map((ch, idx) => `
                                <div id="ft-ch-${idx}" style="margin-bottom:28px;">
                                    <h4 style="color:#8b1d1d; font-size:17px; margin-top:0; border-bottom:1px dashed #d1c7b7; padding-bottom:6px;">${formatHeader(ch.title || '')}</h4>
                                    <div>
                                        ${(ch.lines || (ch.content ? ch.content.split('\n') : [])).map(formatLine).join('')}
                                    </div>
                                </div>
                            `).join('') : `
                                <div>
                                    ${fullText.split('\n').map(formatLine).join('')}
                                </div>
                            `}
                        </div>
                    </div>
                </div>
            `;

            const ftOverlay = document.createElement("div");
            ftOverlay.className = "modal-overlay visible fulltext-overlay";
            ftOverlay.style.zIndex = "9999";
            ftOverlay.innerHTML = ftModalHtml;
            ftOverlay.addEventListener("click", (e) => {
                if (e.target === ftOverlay) ftOverlay.remove();
            });
            document.body.appendChild(ftOverlay);

            // 自动毫秒级平滑滚动至黄底高亮标注目标处或章节处
            setTimeout(() => {
                const target = document.getElementById("ft-highlight-target");
                if (target) {
                    target.scrollIntoView({ behavior: "smooth", block: "center" });
                } else if (targetChIdx >= 0) {
                    const chHeader = document.getElementById(`ft-ch-${targetChIdx}`);
                    if (chHeader) {
                        chHeader.scrollIntoView({ behavior: "smooth", block: "start" });
                    }
                }
            }, 250);
        } catch (err) {
            alert(`获取典籍全文失败: ${err.message}`);
        }
    }

    jumpToChapter(idx, itemEl) {
        document.querySelectorAll(".ft-ch-item").forEach(el => {
            el.style.background = "none";
            el.style.borderLeftColor = "transparent";
            el.style.fontWeight = "normal";
        });
        if (itemEl) {
            itemEl.style.background = "#eedfc8";
            itemEl.style.borderLeftColor = "#8b1d1d";
            itemEl.style.fontWeight = "bold";
        }
        const target = document.getElementById(`ft-ch-${idx}`);
        if (target) {
            target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    }

    adjustFontSize(delta) {
        const content = document.getElementById("ft-scroll-content");
        if (!content) return;
        const currentSize = parseFloat(window.getComputedStyle(content).fontSize) || 15.5;
        const newSize = Math.max(13, Math.min(26, currentSize + delta * 2));
        content.style.fontSize = `${newSize}px`;
    }

    copyBookText() {
        const content = document.getElementById("ft-scroll-content");
        if (!content) return;
        navigator.clipboard.writeText(content.innerText).then(() => {
            alert("典籍全文已成功复制至剪贴板！");
        }).catch(() => {
            alert("复制完成，请自行粘贴。");
        });
    }

    // 联动至讲筵课堂
    consultInClassroom(bookTitle) {
        document.querySelectorAll(".modal-overlay.reader-overlay").forEach(el => el.remove());
        if (window.switchNav) {
            window.switchNav("class");
            setTimeout(() => {
                if (window.galGameEngine) {
                    window.galGameEngine.openFreeInquireModal();
                }
            }, 300);
        }
    }

    // 联动至问学答疑
    askInQA(bookTitle) {
        document.querySelectorAll(".modal-overlay.reader-overlay").forEach(el => el.remove());
        if (window.switchNav) {
            window.switchNav("qa");
            setTimeout(() => {
                if (window.sendQuery) {
                    window.sendQuery("qa", `请先生详尽阐发《${bookTitle.replace(/[《》]/g, "")}》之精义与读书门径。`);
                }
            }, 300);
        }
    }
}

// 实例化全局单例
window.library3DEngine = new Library3DEngine();
