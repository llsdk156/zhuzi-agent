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
                author: "南宋 · 考亭先生 编注（历四十载心血）",
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
                    commentary: "把道德自律（诚意正心）与天下治理（治国平天下）融汇贯通，奠定了儒家经世报国的生命图式。"
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
                overview: "子思恐道统失传而作此书。朱子晚年作《中庸章句》并撰《中庸序》，提出著名的‘人心道心’十六字心传（人心惟危，道心惟微，惟精惟一，允执厥中），乃宋代理学性命天道之最高殿堂。",
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
                author: "考亭先生、吕祖谦 共同选编（淳熙二年）",
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
                overview: "武夷学院特色文献库珍藏。系统考订朱子文化自宋元以降传入东亚及欧美的全历史路径。涵盖朝鲜李朝退溪学、日本江户时代水户学与朱子学派、越南儒学，以及近代以来欧美汉学界（如陈荣捷、狄培瑞等）对朱子新儒学的诠释。",
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
                    order: "吟咏相随：将诗篇与朱子当时之著述（如作《四书集注》之时）对照品读。",
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
                overview: "武夷学院朱子学研究中心权威经典。全面系统考证朱子学在福建（建州建阳、武夷精舍、考亭书院）形成的社会经济文化土壤，剖析朱熹门下福建籍弟子门人（黄榦、蔡元定、陈淳、刘爚等）的学术事迹与思想演进谱系。",
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

        this.init();
    }

    init() {
        this.containerEl = document.getElementById("library-3d-container");
        if (!this.containerEl) return;

        // 1. 将15部典籍按照学术流派渲染到四大对应分类实木搁板上
        this.render3DBookshelf();

        // 2. 挂载 3D 鼠标透视视差微动力学
        this.setupParallaxTilt();

        // 3. 默认优先呈现进学第一核心流派【四书章句类】专属立体书架 (舒展宽绰，杜绝拥挤与切顶)
        this.filterCategory("sishu");
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

    // 打开立体古籍阅览器 (包含：简介、学习方法、朱子文化)
    openBookReader(bookKey) {
        const book = this.booksData[bookKey];
        if (!book) return;
        this.selectedBookKey = bookKey;

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
                    <button class="reader-close-btn" onclick="this.closest('.modal-overlay').remove()">✕ 闭卷归架</button>
                </div>

                <!-- 卷中三大核心研读书斋面板 (简介 / 读书法 / 理学精义) -->
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

                    <!-- 板块 4：武夷学院逸夫图书馆特藏与全文查阅指引 (若有) -->
                    ${book.libraryInfo ? `
                    <div class="reader-section library-loc-box" style="background:#fefce8; border:1.5px solid #d97706; border-radius:10px; padding:14px 18px; margin-top:14px;">
                        <div class="section-gold-head">
                            <span class="head-icon">🏛️</span>
                            <h3 style="color:#92400e;">【武夷学院图书馆 · 逸夫特藏实时馆藏与获取指引】</h3>
                        </div>
                        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:10px; margin:10px 0; font-size:12.5px;">
                            <div style="background:#fff; padding:8px 12px; border-radius:6px; border:1px solid #fde68a;">
                                <strong style="color:#b45309;">📌 索书号：</strong><code style="font-weight:700; color:#1e293b;">${book.libraryInfo.callNumber}</code>
                            </div>
                            <div style="background:#fff; padding:8px 12px; border-radius:6px; border:1px solid #fde68a;">
                                <strong style="color:#b45309;">📍 馆藏地点：</strong><span>${book.libraryInfo.holding}</span>
                            </div>
                            <div style="background:#fff; padding:8px 12px; border-radius:6px; border:1px solid #fde68a;">
                                <strong style="color:#b45309;">📗 在馆状态：</strong><span style="color:#15803d; font-weight:700;">${book.libraryInfo.copies}</span>
                            </div>
                        </div>
                        <div style="background:#fff; border-left:3px solid #b45309; padding:10px 14px; font-size:12px; line-height:1.6; color:#451a03; border-radius:4px;">
                            <strong>🔐 校内外查阅与登入指南：</strong><br>
                            ① <strong>纸本借阅</strong>：携带校园卡至武夷山市百花路358号武夷学院逸夫图书馆（六楼特藏专区）直接借阅。<br>
                            ② <strong>OPAC公网检索</strong>：访问 <a href="${book.libraryInfo.accessUrl}" target="_blank" style="color:#b45309; text-decoration:underline;">武夷学院书目检索系统 (免登录)</a>。<br>
                            ③ <strong>校外电子全文登入</strong>：${book.libraryInfo.vpnGuide}
                        </div>
                    </div>
                    ` : ''}
                </div>

                <!-- 底部联动操作栏 -->
                <div class="reader-actions-bar">
                    <button class="reader-action-pill red" onclick="library3DEngine.consultInClassroom('${book.title}')">
                        <span>📖 请先生在第一人称讲筵领读此书 ➔</span>
                    </button>
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
