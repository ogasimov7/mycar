import type { ChronicProblem } from "../types";

/**
 * Generation-specific chronic problems. The catalogue entry in models.ts
 * describes one "main" generation; cars whose year falls into one of these
 * ranges get the problems listed here instead. Generations were chosen from
 * turbo.az listing shares (≥ ~15% of a model's listings).
 */
export interface GenerationInfo {
  name: string;
  years: [number, number];
  problems: ChronicProblem[];
}

const p = (
  title: string,
  description: string,
  part: ChronicProblem["part"],
  severity: ChronicProblem["severity"],
  costRange: [number, number],
  video: string,
  atKm?: string,
): ChronicProblem => ({ title, description, part, severity, costRange, video, atKm });

export const GENERATIONS: Record<string, GenerationInfo[]> = {
  "mercedes-e-w212": [
    {
      name: "W210",
      years: [1995, 2002],
      problems: [
        p("Kuzov korroziyası", "W210-un ən tanınmış zəif yeri: ön qanadlar, faraların ətrafı, qapı altları və baqaj qapağı paslanır.", "door_fl", "yüksək", [300, 2000], "Mercedes W210 rust repair"),
        p("722.6 qutusunun elektrik bağlayıcısından yağ sızması", "Qutunun 8-pinli bağlayıcısından yağ naqillərə keçir, ötürmələr qəza rejiminə düşür.", "transmission", "orta", [40, 200], "Mercedes 722.6 connector oil leak fix"),
        p("Ön asqı şarovoyları və sükan tyagaları", "Taqqıltı, sükanda boşluq, təkərlərin qeyri-bərabər yeyilməsi.", "suspension", "orta", [150, 500], "Mercedes W210 ball joint replacement"),
      ],
    },
    {
      name: "W211",
      years: [2003, 2009],
      problems: [
        p("SBC əyləc sisteminin nasosu", "Elektrohidravlik SBC sistemi xəta verir, əyləc gücləndiricisi zəifləyir. Geri çağırma kampaniyası olub.", "brakes", "yüksək", [800, 2500], "Mercedes W211 SBC brake pump problem"),
        p("M272 balans valının dişlisi", "2005–2007 M272 V6 mühərriklərində dişli yeyilir, 'Check Engine' (P0016).", "engine", "yüksək", [1500, 3500], "Mercedes M272 balance shaft W211"),
        p("OM642 yağ soyuducusunun contası", "V6 dizeldə yağ blok üzərinə sızır, yanıq yağ iyi.", "engine", "orta", [400, 1000], "Mercedes OM642 oil cooler seal replacement"),
      ],
    },
    {
      name: "W213",
      years: [2017, 2023],
      problems: [
        p("9G-Tronic-də sarsıntılı keçidlər", "Aşağı sürətlərdə zərbəli keçidlər — proqram yeniləməsi və adaptasiya.", "transmission", "aşağı", [100, 400], "Mercedes 9G-Tronic harsh shift update"),
        p("Air Body Control pnevmatik asqı", "Pnevmatik asqılı versiyalarda yastıq və ya kompressor sızması.", "suspension", "orta", [700, 2500], "Mercedes W213 air suspension repair"),
        p("Multimediya və sensor xətaları", "Ekran donur, kameralar və ya parkinq sensorları yalançı xəbərdarlıq verir.", "glass", "aşağı", [0, 400], "Mercedes W213 MBUX COMAND problems"),
      ],
    },
  ],
  "mercedes-c-w205": [
    {
      name: "W202",
      years: [1993, 2000],
      problems: [
        p("Kuzov korroziyası", "Təkər tağları, domkrat yerləri, ön şüşənin ətrafı və qapı altları.", "door_fl", "yüksək", [200, 1500], "Mercedes W202 rust repair"),
        p("Mühərrik naqil dəstəsinin izolyasiyası (1993–1996)", "Erkən M104/M111 mühərriklərində naqillərin izolyasiyası ovulur — titrəmə, qəfil sönmə.", "engine", "yüksək", [200, 600], "Mercedes W202 engine wiring harness replacement"),
        p("Sükan reduktorunda boşluq", "Sükan 'oynayır', maşın yolda düz getmir.", "suspension", "orta", [100, 400], "Mercedes W202 steering box adjustment"),
      ],
    },
  ],
  "mercedes-s-w221": [
    {
      name: "W220",
      years: [1999, 2005],
      problems: [
        p("Airmatic pnevmatik asqı", "Dayaqlar sızır, maşın gecə çökür, kompressor qızır.", "suspension", "yüksək", [600, 2500], "Mercedes W220 Airmatic strut repair"),
        p("ABC hidravlik asqısı (S600 / S55)", "Hidravlik nasos və klapan blokları sızır, 'ABC' xəbərdarlığı.", "suspension", "yüksək", [1000, 4000], "Mercedes W220 ABC suspension problem"),
        p("Elektronika: qapı modulları, COMAND", "Pəncərələr, kilidlər və multimediya ara-sıra işləmir.", "glass", "orta", [100, 800], "Mercedes W220 door module repair"),
      ],
    },
    {
      name: "W222",
      years: [2014, 2020],
      problems: [
        p("Pnevmatik asqı / Magic Body Control", "Yastıq və ya klapan blokları sızır, asqı xəbərdarlığı.", "suspension", "yüksək", [800, 3500], "Mercedes W222 air suspension repair"),
        p("Ötürmə qutusu proqramı", "7G/9G qutularında sarsıntılı keçidlər — proqram yeniləməsi.", "transmission", "aşağı", [100, 500], "Mercedes W222 transmission software update"),
        p("Multimediya və elektronika xətaları", "Ekranlar donur, Burmester / sensorlar ara-sıra sönür.", "glass", "aşağı", [0, 600], "Mercedes W222 COMAND problems"),
      ],
    },
  ],
  "bmw-5-f10": [
    {
      name: "E39",
      years: [1996, 2003],
      problems: [
        p("Soyutma sisteminin plastik hissələri", "Radiator, genişləndirici bak və su nasosunun plastik pəri çatlayır — mühərrik qızır.", "engine", "yüksək", [250, 700], "BMW E39 cooling system overhaul"),
        p("VANOS contaları (M52/M54)", "Soyuqda cingilti, dartmanın azalması, boş gedişdə titrəmə.", "engine", "orta", [150, 450], "BMW E39 VANOS seal repair"),
        p("Karter ventilyasiya klapanı (CCV)", "Yağ sərfi artır, mavi tüstü, boş gedişdə fit səsi.", "engine", "orta", [100, 300], "BMW M54 CCV valve replacement"),
        p("Ön asqı itələyici qollarının sayləntblokları", "Əyləcdə sükan titrəyir, 80–100 km/s-də vibrasiya.", "suspension", "orta", [150, 450], "BMW E39 thrust arm bushings"),
      ],
    },
    {
      name: "G30",
      years: [2018, 2023],
      problems: [
        p("Yağ filtri korpusu contası (B58/B48)", "Yağ mühərrik blokuna sızır, yanıq yağ iyi.", "engine", "orta", [250, 700], "BMW G30 oil filter housing gasket"),
        p("Soyuducu genişləndirici bakın sızması", "Antifriz azalır, 'Coolant level' xəbərdarlığı.", "engine", "orta", [150, 450], "BMW G30 coolant expansion tank leak"),
        p("iDrive proqram xətaları", "Ekran donur, CarPlay kəsilir — proqram yeniləməsi.", "glass", "aşağı", [0, 200], "BMW G30 iDrive update"),
      ],
    },
  ],
  "bmw-3-f30": [
    {
      name: "E46",
      years: [1998, 2005],
      problems: [
        p("Arxa subframe bərkidiciləri çatlayır", "Kuzovun arxa altında subframe yuvaları çatlayır — xüsusən güclü versiyalarda.", "suspension", "yüksək", [400, 1500], "BMW E46 rear subframe crack repair"),
        p("Soyutma sistemi", "Radiator, genişləndirici bak, su nasosu — plastik hissələr çatlayır.", "engine", "yüksək", [250, 700], "BMW E46 cooling system replacement"),
        p("Pəncərə qaldırıcıları", "Şüşə qəfil düşür və ya qalxmır — mexanizmin kabeli qopur.", "door_fl", "aşağı", [60, 200], "BMW E46 window regulator replacement"),
      ],
    },
  ],
  "bmw-x5-e70": [
    {
      name: "E53",
      years: [2000, 2006],
      problems: [
        p("ATC500 paylayıcı qutusu", "Döngələrdə titrəmə, xəbərdarlıqlar, 4x4 işləmir.", "transmission", "yüksək", [600, 2000], "BMW X5 E53 transfer case repair"),
        p("Soyutma sistemi", "Plastik radiator boruları və bak çatlayır, mühərrik qızır.", "engine", "yüksək", [250, 800], "BMW X5 E53 cooling system"),
        p("M62 V8 vaxt zənciri bələdçiləri", "Soyuq işə salanda cingilti — bələdçilər qırılır.", "engine", "yüksək", [1500, 3500], "BMW M62 timing chain guide replacement"),
      ],
    },
    {
      name: "F15",
      years: [2014, 2018],
      problems: [
        p("Yağ sızmaları (N55 / N57)", "Klapan qapağı və yağ filtri korpusu contalarından yağ sızır.", "engine", "orta", [250, 800], "BMW X5 F15 oil leak valve cover"),
        p("Elektrik su nasosu", "Qəfil dayanma, 'mühərrik qızır' xəbərdarlığı.", "engine", "yüksək", [600, 1300], "BMW F15 electric water pump"),
        p("Arxa pnevmatik yastıqlar", "Maşın arxadan çökür, kompressor çox işləyir.", "suspension", "orta", [300, 900], "BMW X5 F15 rear air spring"),
      ],
    },
    {
      name: "G05",
      years: [2019, 2026],
      problems: [
        p("Soyuducu sızmaları (B58)", "Genişləndirici bak və borulardan antifriz itkisi.", "engine", "orta", [150, 600], "BMW G05 coolant leak"),
        p("Pnevmatik asqı", "Yastıqlar və ya kompressor xəbərdarlığı.", "suspension", "orta", [700, 2500], "BMW X5 G05 air suspension"),
        p("Elektronika və iDrive", "Ekranlar, kameralar, rəqəmsal açar — proqram yeniləmələri.", "glass", "aşağı", [0, 300], "BMW G05 iDrive problems"),
      ],
    },
  ],
  "hyundai-sonata-dn8": [
    {
      name: "NF",
      years: [2005, 2009],
      problems: [
        p("Mühərrik yastıqları", "Yerindən tərpənəndə zərbə, boş gedişdə salonda titrəmə.", "engine", "orta", [150, 400], "Hyundai Sonata NF engine mount replacement"),
        p("Sükan reykinin taqqıltısı", "Kələ-kötür yolda sükandan taqqıltı.", "suspension", "orta", [150, 500], "Hyundai Sonata NF steering rack noise"),
        p("Kondisioner kompressoru", "Yayda salon zəif soyuyur.", "engine", "aşağı", [300, 700], "Hyundai Sonata NF AC compressor"),
      ],
    },
    {
      name: "YF",
      years: [2010, 2014],
      problems: [
        p("Theta II 2.4 GDI yataqlarının yeyilməsi", "Döyüntü və yağ təzyiqinin düşməsi. Geniş geri çağırma kampaniyası olub — VIN ilə yoxlatdırın.", "engine", "yüksək", [2000, 5000], "Hyundai Sonata YF 2.4 GDI engine knock recall", "100 000 km+"),
        p("Sükan valının muftası", "Sükanı çevirəndə tıqqıltı.", "suspension", "aşağı", [40, 150], "Hyundai Sonata YF steering coupler"),
        p("Faraların tərləməsi", "Faraların içində nəm yığılır.", "headlights", "aşağı", [50, 300], "Hyundai Sonata headlight condensation fix"),
      ],
    },
    {
      name: "LF",
      years: [2015, 2019],
      problems: [
        p("Theta II yataqları (2.4 GDI / 2.0T)", "Döyüntü riski — geri çağırma kampaniyası olub.", "engine", "yüksək", [2000, 5000], "Hyundai Sonata LF Theta II engine knock"),
        p("7DCT robot qutusu (1.6T)", "Tıxacda ilişmə qızır, yerindən tərpənəndə gecikmə.", "transmission", "orta", [100, 2000], "Hyundai Sonata 1.6T 7DCT problem"),
        p("Arxa asqı sayləntblokları", "Arxadan taqqıltı, təkərlərin yeyilməsi.", "suspension", "aşağı", [100, 350], "Hyundai Sonata LF rear suspension bushing"),
      ],
    },
  ],
  "hyundai-elantra-ad": [
    {
      name: "MD",
      years: [2011, 2015],
      problems: [
        p("Nu 1.8 mühərrik blokunun çatlaması", "2011–2013 Nu 1.8 mühərriklərində blokdan antifriz sızır. ABŞ-da zəmanət uzadılıb.", "engine", "yüksək", [1500, 4000], "Hyundai Elantra 1.8 engine block crack coolant leak"),
        p("Sükan valının muftası", "Sükanı çevirəndə tıqqıltı — çox yayılmış problemdir.", "suspension", "aşağı", [40, 150], "Hyundai Elantra MD steering coupler fix"),
        p("Arxa amortizatorlar", "Arxadan döyüntü, yolda yırğalanma.", "suspension", "aşağı", [100, 250], "Hyundai Elantra MD rear shocks"),
      ],
    },
  ],
  "hyundai-santa-fe-dm": [
    {
      name: "CM",
      years: [2006, 2012],
      problems: [
        p("Arxa subframe korroziyası", "Arxa altlıq paslanır — ABŞ-da geri çağırma kampaniyası olub.", "suspension", "yüksək", [400, 1500], "Hyundai Santa Fe CM rear subframe rust recall"),
        p("2.2 CRDi forsunkaları", "Qara tüstü, soyuqda çətin işə düşmə, dartmanın azalması.", "engine", "orta", [300, 1200], "Hyundai Santa Fe 2.2 CRDi injector problem"),
        p("Tam ötürücü muftası", "Döngələrdə titrəmə, AWD xəbərdarlığı.", "transmission", "orta", [300, 1200], "Hyundai Santa Fe CM 4WD coupling"),
      ],
    },
    {
      name: "TM",
      years: [2019, 2023],
      problems: [
        p("8DCT / avtomat qutuda sarsıntı", "Aşağı sürətlərdə sarsıntılı keçidlər — proqram yeniləməsi.", "transmission", "aşağı", [100, 600], "Hyundai Santa Fe TM transmission shudder"),
        p("Elektron dayanacaq əyləci", "Dayanacaq əyləci xəta verir və ya açılmır.", "brakes", "aşağı", [100, 400], "Hyundai Santa Fe electronic parking brake fault"),
        p("Multimediya proqram təminatı", "Ekran donur, Bluetooth kəsilir — yeniləmə.", "glass", "aşağı", [0, 100], "Hyundai Santa Fe infotainment update"),
      ],
    },
  ],
  "kia-sorento-um": [
    {
      name: "XM",
      years: [2009, 2014],
      problems: [
        p("Theta II 2.4 yataqları", "Döyüntü riski — geri çağırma kampaniyası olub.", "engine", "yüksək", [2000, 5000], "Kia Sorento XM 2.4 engine knock"),
        p("Tam ötürücü muftası", "Uzun sürüşdə mufta qızır, döngələrdə titrəmə.", "transmission", "orta", [300, 1200], "Kia Sorento XM AWD coupling"),
        p("Arxa amortizatorlar", "Yük altında arxa çökür, yırğalanma.", "suspension", "aşağı", [150, 350], "Kia Sorento XM rear shocks"),
      ],
    },
    {
      name: "MQ4",
      years: [2021, 2026],
      problems: [
        p("Robot qutuda (DCT) sarsıntı", "Dizel və hibrid versiyalarda yerindən tərpənəndə titrəmə.", "transmission", "aşağı", [100, 800], "Kia Sorento MQ4 DCT shudder"),
        p("Multimediya proqram təminatı", "Ekran donur, sensorlar yalançı xəbərdarlıq verir.", "glass", "aşağı", [0, 100], "Kia Sorento 2021 infotainment update"),
      ],
    },
  ],
  "toyota-camry-70": [
    {
      name: "XV40",
      years: [2006, 2011],
      problems: [
        p("2AZ-FE mühərrikində yağ yeməsi", "Porşen halqaları koksa düşür, 1000 km-ə 1 litrə qədər yağ sərfi.", "engine", "yüksək", [600, 2000], "Toyota Camry 2AZ-FE oil consumption fix", "150 000 km+"),
        p("Panelin əriməsi / yapışqanlaşması", "İsti iqlimdə panel yumşalır, parlayır — servis kampaniyası olub.", "glass", "aşağı", [0, 600], "Toyota Camry XV40 melting dashboard"),
        p("Su nasosunun sızması", "Antifriz izləri, səviyyənin düşməsi.", "engine", "orta", [150, 350], "Toyota Camry 2AZ water pump replacement"),
      ],
    },
    {
      name: "XV50",
      years: [2012, 2017],
      problems: [
        p("2AR-FE su nasosunun sızması", "Nasos ətrafında antifriz izləri — çox yayılıb.", "engine", "orta", [150, 400], "Toyota Camry 2AR-FE water pump leak"),
        p("VVT-i muftasının cingiltisi", "Soyuq işə salanda 1–2 saniyəlik cingilti.", "engine", "orta", [250, 600], "Toyota Camry VVT-i actuator rattle cold start"),
        p("Avtomat qutuda titrəmə", "Aşağı sürətlərdə titrəmə — ATF dəyişimi kömək edir.", "transmission", "aşağı", [100, 300], "Toyota Camry XV50 transmission shudder"),
      ],
    },
  ],
  "toyota-prius-30": [
    {
      name: "XW20",
      years: [2003, 2009],
      problems: [
        p("Hibrid batareyanın zəifləməsi", "Yaşa görə hüceyrələr zəifləyir, 'Check Hybrid System', yanacaq sərfi artır.", "battery", "yüksək", [800, 2500], "Prius 2nd gen hybrid battery replacement", "200 000 km+"),
        p("Panel ekranının sönməsi", "Sürət və yanacaq göstəricisinin ekranı sönür — kombinə cihaz təmiri.", "glass", "orta", [150, 500], "Prius 2004 combination meter repair"),
        p("1NZ-FXE yağ sərfi", "Yüksək yürüşdə porşen halqaları, yağ sərfinin artması.", "engine", "orta", [400, 1500], "Prius 1NZ-FXE oil consumption"),
      ],
    },
  ],
  "toyota-corolla-e180": [
    {
      name: "E150",
      years: [2007, 2013],
      problems: [
        p("1ZR-FE yağ sərfi və VVT-i", "Erkən mühərriklərdə yağ sərfi və soyuq işə salanda cingilti.", "engine", "orta", [300, 1500], "Toyota Corolla 1ZR-FE oil consumption"),
        p("Su nasosunun sızması", "Antifriz izləri, səviyyənin azalması.", "engine", "orta", [150, 350], "Toyota Corolla E150 water pump"),
        p("Elektrik sükan gücləndiricisinin taqqıltısı", "Sükanı çevirəndə tıqqıltı — kardan muftası.", "suspension", "aşağı", [50, 400], "Toyota Corolla EPS steering clunk"),
      ],
    },
    {
      name: "E210",
      years: [2020, 2026],
      problems: [
        p("Variatorda (CVT) uğultu", "Bəzi maşınlarda sürətlənəndə uğultu — maye və proqram.", "transmission", "aşağı", [100, 600], "Toyota Corolla 2020 CVT noise"),
        p("Əyləclərin cırıltısı", "Aşağı sürətlərdə əyləc səsi.", "brakes", "aşağı", [50, 200], "Toyota Corolla 2020 brake squeal fix"),
      ],
    },
  ],
  "toyota-prado-150": [
    {
      name: "J120",
      years: [2003, 2009],
      problems: [
        p("1KD-FTV forsunkaları və porşenlər", "Forsunka şaybalarından qaz keçir, ağır hallarda porşen yanır. Dizel versiya üçün əsas risk.", "engine", "yüksək", [500, 4000], "Toyota Prado 1KD-FTV injector piston problem"),
        p("Rama və kuzov korroziyası", "Ramanın arxa hissəsi və astanalar paslanır.", "suspension", "orta", [200, 1500], "Toyota Prado 120 frame rust"),
        p("Arxa pnevmatik asqı (TEMS)", "Pnevmatik asqılı versiyalarda yastıqlar sızır.", "suspension", "orta", [400, 1200], "Toyota Prado 120 rear air suspension"),
      ],
    },
  ],
  "chevrolet-cruze-j300": [
    {
      name: "J400",
      years: [2017, 2020],
      problems: [
        p("1.4 Turbo klapan qapağı / PCV", "Fit səsi, boş gedişdə titrəmə, 'Check Engine'.", "engine", "orta", [100, 300], "Chevy Cruze 2017 1.4T PCV valve cover"),
        p("Su nasosu və termostat korpusu sızması", "Antifriz itkisi, qızma.", "engine", "orta", [150, 500], "Chevy Cruze 2017 water pump leak"),
        p("6T40 qutusunda sarsıntılı keçidlər", "Zərbəli keçidlər — proqram yeniləməsi.", "transmission", "aşağı", [100, 600], "Chevy Cruze 6T40 harsh shift"),
      ],
    },
  ],
  "opel-astra-g-h": [
    {
      name: "G",
      years: [1998, 2004],
      problems: [
        p("Paylayıcı kəmərin qırılması", "Z16XE/Z18XE-də kəmər və rolik vaxtında dəyişilməzsə, klapanlar əyilir.", "engine", "yüksək", [150, 900], "Opel Astra G timing belt replacement"),
        p("Alışdırma modulunun çatlaması", "Mühərrik 'troit' edir, yaş havada daha pis.", "engine", "orta", [60, 200], "Opel Astra G ignition module DIS"),
        p("Ön asqı stabilizator dayaqları və sayləntbloklar", "Taqqıltı və sükanda boşluq.", "suspension", "aşağı", [50, 200], "Opel Astra G front suspension bushing"),
      ],
    },
  ],
  "range-rover-l405": [
    {
      name: "L322",
      years: [2002, 2012],
      problems: [
        p("Pnevmatik asqı", "Yastıqlar, klapan bloku və kompressor — ən çox rast gəlinən xərc.", "suspension", "yüksək", [700, 3000], "Range Rover L322 air suspension repair"),
        p("Soyutma sistemi (V8)", "Su nasosu və plastik borular sızır, mühərrik qızır.", "engine", "yüksək", [400, 1500], "Range Rover L322 water pump coolant leak"),
        p("Elektrik xətaları", "Xəbərdarlıq lampaları, multimediya, açarsız giriş ara-sıra işləmir.", "glass", "orta", [100, 1000], "Range Rover L322 electrical faults"),
      ],
    },
  ],
  "kia-optima-jf": [
    {
      name: "TF",
      years: [2010, 2015],
      problems: [
        p("Theta II 2.4 GDI yataqları", "Döyüntü və yağ təzyiqinin düşməsi — geniş geri çağırma kampaniyası olub.", "engine", "yüksək", [2000, 5000], "Kia Optima 2.4 GDI engine knock recall", "90 000 km+"),
        p("Sükan valının muftası", "Sükanı çevirəndə tıqqıltı.", "suspension", "aşağı", [40, 150], "Kia Optima TF steering coupler"),
        p("Panoram damın drenajı", "Salona su süzülür — drenaj boruları tıxanır.", "roof", "aşağı", [30, 150], "Kia Optima sunroof drain leak"),
      ],
    },
  ],
  "hyundai-accent-rb": [
    {
      name: "MC",
      years: [2006, 2010],
      problems: [
        p("Paylayıcı kəmər (Alpha 1.4/1.6)", "Kəmər vaxtında dəyişilməzsə klapanlar zədələnə bilər.", "engine", "yüksək", [150, 600], "Hyundai Accent MC timing belt"),
        p("Ön asqı qollarının sayləntblokları", "Taqqıltı və sükanda titrəmə.", "suspension", "aşağı", [60, 200], "Hyundai Accent MC control arm bushing"),
      ],
    },
    {
      name: "HC",
      years: [2018, 2026],
      problems: [
        p("1.4/1.6 mühərrikdə yağ sərfi", "Bəzi mühərriklərdə 50–80 min km-dən sonra yağ sərfi artır.", "engine", "orta", [300, 1500], "Hyundai Accent 2018 oil consumption"),
        p("Arxa amortizatorların səsi", "Kiçik çuxurlarda döyüntü.", "suspension", "aşağı", [100, 250], "Hyundai Accent 2018 rear shock noise"),
      ],
    },
  ],
  "kia-sportage-ql": [
    {
      name: "SL",
      years: [2010, 2015],
      problems: [
        p("Theta II 2.4 GDI yataqları", "Döyüntü riski — geri çağırma kampaniyası olub.", "engine", "yüksək", [2000, 5000], "Kia Sportage SL 2.4 engine knock"),
        p("Tam ötürücü muftası", "Döngələrdə titrəmə, AWD xəbərdarlığı.", "transmission", "orta", [300, 1200], "Kia Sportage SL AWD coupling"),
        p("Arxa əyləc supportları", "Bələdçilər ilişir, bəndlər qeyri-bərabər yeyilir.", "brakes", "aşağı", [60, 200], "Kia Sportage rear caliper slide pins"),
      ],
    },
    {
      name: "NQ5",
      years: [2022, 2026],
      problems: [
        p("7DCT robot qutusu (1.6 T-GDI)", "Tıxacda gecikmə və titrəmə — proqram yeniləməsi.", "transmission", "aşağı", [100, 1500], "Kia Sportage 2023 DCT hesitation"),
        p("Multimediya proqram təminatı", "Ekran donur, bağlantı kəsilir.", "glass", "aşağı", [0, 100], "Kia Sportage 2023 infotainment update"),
      ],
    },
  ],
  "hyundai-tucson-tl": [
    {
      name: "LM (ix35)",
      years: [2010, 2015],
      problems: [
        p("2.0 CRDi / 2.4 mühərrik problemləri", "Dizeldə forsunkalar, 2.4 benzində Theta II yataqları.", "engine", "orta", [300, 4000], "Hyundai ix35 engine problems"),
        p("Tam ötürücü muftası", "Mufta qızır, döngələrdə titrəmə.", "transmission", "orta", [300, 1200], "Hyundai ix35 4WD coupling"),
        p("Ön dayaqların yuxarı yastıqları", "Sükanı çevirəndə cırıltı və taqqıltı.", "suspension", "aşağı", [80, 250], "Hyundai ix35 strut mount noise"),
      ],
    },
    {
      name: "NX4",
      years: [2021, 2026],
      problems: [
        p("Robot / avtomat qutuda sarsıntı", "Aşağı sürətlərdə titrəmə — proqram yeniləməsi.", "transmission", "aşağı", [100, 800], "Hyundai Tucson 2022 transmission shudder"),
        p("Multimediya və sensorlar", "Ekran donur, kamera / sensor xətaları.", "glass", "aşağı", [0, 150], "Hyundai Tucson 2022 infotainment problems"),
      ],
    },
  ],
  "kia-rio-4": [
    {
      name: "3-cü nəsil",
      years: [2011, 2016],
      problems: [
        p("1.4/1.6 Gamma porşen cızıqları", "Soyuq mühərrikdə döyüntü, yağ sərfi.", "engine", "orta", [800, 2500], "Kia Rio 2012 engine knock piston"),
        p("Arxa amortizatorlar", "Arxadan döyüntü və yırğalanma.", "suspension", "aşağı", [100, 250], "Kia Rio 2012 rear shock replacement"),
        p("Kondisioner kompressorunun muftası", "Salon soyumur, kompressor səs salır.", "engine", "aşağı", [150, 500], "Kia Rio AC compressor clutch"),
      ],
    },
  ],
  "ford-transit": [
    {
      name: "Mk6",
      years: [2000, 2006],
      problems: [
        p("Duratorq dizel forsunkaları", "Titrəmə, qara tüstü, çətin işə düşmə.", "engine", "orta", [300, 1200], "Ford Transit Mk6 injector problem"),
        p("Kuzov korroziyası", "Tağlar, astanalar, qapı altları paslanır.", "door_fl", "yüksək", [200, 1200], "Ford Transit Mk6 rust repair"),
        p("İkikütləli volan və ilişmə", "Titrəmə və taqqıltı, ötürmələr çətin keçir.", "transmission", "orta", [500, 1200], "Ford Transit Mk6 dual mass flywheel"),
      ],
    },
  ],
  "mercedes-sprinter-906": [
    {
      name: "T1N (W901–905)",
      years: [1995, 2006],
      problems: [
        p("Ağır kuzov korroziyası", "Sprinter-in ən tanınmış problemi: astanalar, qapılar, təkər tağları, şüşə çərçivələri.", "door_rl", "yüksək", [400, 2500], "Mercedes Sprinter T1N rust repair"),
        p("OM611/612 forsunka şaybaları", "Forsunka quyularından qaz keçir, 'qara jele' yığılır.", "engine", "orta", [150, 600], "Mercedes Sprinter injector seal black death"),
        p("Avtomat / mexaniki qutu və ilişmə", "Ağır yükdən ilişmə və qutu yeyilir.", "transmission", "orta", [400, 1500], "Mercedes Sprinter T1N clutch replacement"),
      ],
    },
  ],
};

export function generationFor(modelId: string, year?: number): GenerationInfo | undefined {
  if (!year) return undefined;
  return GENERATIONS[modelId]?.find((g) => year >= g.years[0] && year <= g.years[1]);
}
