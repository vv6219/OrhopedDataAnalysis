import { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  TextField,
  InputAdornment,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ArticleIcon from '@mui/icons-material/Article';
import BiotechIcon from '@mui/icons-material/Biotech';
import HealingIcon from '@mui/icons-material/Healing';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import UnfoldLessIcon from '@mui/icons-material/UnfoldLess';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import LayersIcon from '@mui/icons-material/Layers';
import { MASTER_CLUSTERS } from '../../pages/OrthoTemplatesManager';

export interface ClinicalTemplateDetail {
  id: number;
  title: string;
  jointCategory: string;
  mkbCode: string;
  category: string;
  cluster_id?: string;
  cluster_name?: string;
  stage_or_severity?: string;
  side: string;
  complaints: string;
  objective: string;
  recommendations: string;
  rom: Record<string, number> | null;
  tests: Array<{ code: string; name: string; expected: string; mandatory: number }>;
  diagnostics: Array<{ code: string; name: string; modality: string; urgency: string; is_primary: number }>;
  tests_count?: number;
  diagnostics_count?: number;
}

export const CLINICAL_TEMPLATES_REGISTRY: ClinicalTemplateDetail[] = [
  {
    "id": 1,
    "title": "Первичный гонартроз II стадии с умеренным выпотом",
    "jointCategory": "knee",
    "mkbCode": "M17.1",
    "category": "Общая ортопедия",
    "side": "right",
    "complaints": "Стандартные клинические проявления для данной патологии опорно-двигательного аппарата.",
    "objective": "Пальпация и функциональные тесты выявляют локальную болезненность и ограничение подвижности.",
    "recommendations": "Курс консервативной терапии, оптимизация осевой нагрузки, ЛФК, повторный осмотр ортопеда.",
    "rom": null,
    "tests": [],
    "diagnostics": []
  },
  {
    "id": 2,
    "title": "Повреждение вращательной манжеты плеча (импиджмент)",
    "jointCategory": "shoulder",
    "mkbCode": "M75.1",
    "category": "Общая ортопедия",
    "side": "right",
    "complaints": "Стандартные клинические проявления для данной патологии опорно-двигательного аппарата.",
    "objective": "Пальпация и функциональные тесты выявляют локальную болезненность и ограничение подвижности.",
    "recommendations": "Курс консервативной терапии, оптимизация осевой нагрузки, ЛФК, повторный осмотр ортопеда.",
    "rom": null,
    "tests": [],
    "diagnostics": []
  },
  {
    "id": 3,
    "title": "Плантарный фасциит (пяточная шпора)",
    "jointCategory": "ankle",
    "mkbCode": "M77.3",
    "category": "Общая ортопедия",
    "side": "right",
    "complaints": "Стандартные клинические проявления для данной патологии опорно-двигательного аппарата.",
    "objective": "Пальпация и функциональные тесты выявляют локальную болезненность и ограничение подвижности.",
    "recommendations": "Курс консервативной терапии, оптимизация осевой нагрузки, ЛФК, повторный осмотр ортопеда.",
    "rom": null,
    "tests": [],
    "diagnostics": []
  },
  {
    "id": 4,
    "title": "Латеральный эпикондилит локтевого сустава («локоть теннисиста»)",
    "jointCategory": "elbow",
    "mkbCode": "M77.1",
    "category": "Энтезопатии и тендиниты",
    "side": "right",
    "complaints": "Жгучая боль по наружной поверхности правого локтя с иррадиацией по тылу предплечья. Усиливается при удержании чашки, рукопожатии, повороте дверной ручки или работе за мышью.",
    "objective": "Локальная резкая болезненность при пальпации латерального надмыщелка плечевой кости и сухожилий разгибателей. Отека нет.",
    "recommendations": "Ортезирование предплечья бандажом с силиконовым пилотом. Исключение монотонных разгибательных нагрузок на кисть.",
    "rom": {
      "flexion_active": 145,
      "flexion_passive": 150,
      "extension_deficit": 0,
      "rotation_ext": 85,
      "rotation_int": 85
    },
    "tests": [
      {
        "code": "cozen",
        "name": "Тест Козена",
        "expected": "positive",
        "mandatory": 1
      },
      {
        "code": "mill",
        "name": "Тест Милля",
        "expected": "positive",
        "mandatory": 1
      },
      {
        "code": "golfer",
        "name": "Тест локтя гольфиста",
        "expected": "negative",
        "mandatory": 1
      },
      {
        "code": "tinel_cubital",
        "name": "Симптом Тиннеля кубитального канала",
        "expected": "negative",
        "mandatory": 1
      },
      {
        "code": "valgus_stress_elbow",
        "name": "Вальгус-стресс тест локтя",
        "expected": "negative",
        "mandatory": 0
      }
    ],
    "diagnostics": [
      {
        "code": "us_elbow_epicond",
        "name": "УЗИ сухожилий надмыщелков локтевого сустава",
        "modality": "ultrasound",
        "urgency": "routine",
        "is_primary": 1
      },
      {
        "code": "xray_elbow_2v",
        "name": "Рентгенография локтевого сустава (2 проекции)",
        "modality": "xray",
        "urgency": "routine",
        "is_primary": 0
      }
    ]
  },
  {
    "id": 5,
    "title": "Первичный гонартроз II стадии с реактивным синовитом",
    "jointCategory": "knee",
    "mkbCode": "M17.1",
    "category": "Дегенеративно-дистрофические заболевания",
    "side": "right",
    "complaints": "Боль по внутренней поверхности коленного сустава при физической нагрузке, спуске по лестнице и в начале ходьбы («стартовые боли»). Чувство распирания и припухлость в области супрапателлярного заворота.",
    "objective": "Ось конечности: умеренный genu varum. Синовит: II степень (умеренный). Пальпация медиальной суставной щели и гусиной лапки резко болезненна.",
    "recommendations": "Разгрузка сустава тростью при длительной ходьбе, индивидуальные ортопедические стельки с компенсацией перекоса.",
    "rom": {
      "flexion_active": 110,
      "flexion_passive": 120,
      "extension_deficit": -5
    },
    "tests": [
      {
        "code": "mcmurray",
        "name": "Тест Мак-Мюррея",
        "expected": "positive_medial",
        "mandatory": 1
      },
      {
        "code": "patella_ballottement",
        "name": "Баллотирование надколенника",
        "expected": "positive",
        "mandatory": 1
      },
      {
        "code": "lachman",
        "name": "Тест Лахмана",
        "expected": "negative",
        "mandatory": 1
      },
      {
        "code": "anterior_drawer",
        "name": "Передний выдвижной ящик колена",
        "expected": "negative",
        "mandatory": 0
      },
      {
        "code": "patella_grind",
        "name": "Тест Кларка (трения надколенника)",
        "expected": "positive",
        "mandatory": 0
      }
    ],
    "diagnostics": [
      {
        "code": "xray_knee_2v",
        "name": "Рентгенография коленного сустава под нагрузкой",
        "modality": "xray",
        "urgency": "routine",
        "is_primary": 1
      },
      {
        "code": "us_knee",
        "name": "УЗИ коленного сустава с оценкой заворотов",
        "modality": "ultrasound",
        "urgency": "routine",
        "is_primary": 1
      },
      {
        "code": "lab_synovial",
        "name": "Микроскопическое и биохимическое исследование синовии",
        "modality": "lab",
        "urgency": "routine",
        "is_primary": 0
      }
    ]
  },
  {
    "id": 6,
    "title": "Медиальный эпикондилит («локоть гольфиста»)",
    "jointCategory": "elbow",
    "mkbCode": "M77.0",
    "category": "Энтезопатии и тендиниты",
    "side": "right",
    "complaints": "Ноющая и острая боль по внутренней поверхности локтя при сгибании кисти, подъеме тяжестей хватом снизу.",
    "objective": "Пальпация медиального надмыщелка плеча резко болезненна. Локтевой нерв интактен, борозда безболезненна.",
    "recommendations": "Локальная криотерапия, ортезирование предплечья разгрузочным бандажом.",
    "rom": {
      "flexion_active": 145,
      "flexion_passive": 150,
      "extension_deficit": 0,
      "rotation_ext": 85,
      "rotation_int": 85
    },
    "tests": [
      {
        "code": "golfer",
        "name": "Тест локтя гольфиста",
        "expected": "positive",
        "mandatory": 1
      },
      {
        "code": "cozen",
        "name": "Тест Козена",
        "expected": "negative",
        "mandatory": 1
      },
      {
        "code": "tinel_cubital",
        "name": "Симптом Тиннеля кубитального канала",
        "expected": "negative",
        "mandatory": 1
      },
      {
        "code": "valgus_stress_elbow",
        "name": "Вальгус-стресс тест локтя",
        "expected": "negative",
        "mandatory": 0
      }
    ],
    "diagnostics": [
      {
        "code": "us_elbow_epicond",
        "name": "УЗИ сухожилий надмыщелков локтевого сустава",
        "modality": "ultrasound",
        "urgency": "routine",
        "is_primary": 1
      },
      {
        "code": "xray_elbow_2v",
        "name": "Рентгенография локтевого сустава (2 проекции)",
        "modality": "xray",
        "urgency": "routine",
        "is_primary": 0
      }
    ]
  },
  {
    "id": 7,
    "title": "Асептический бурсит локтевого отростка (олекранона)",
    "jointCategory": "elbow",
    "mkbCode": "M70.2",
    "category": "Бурситы и синовиты",
    "side": "left",
    "complaints": "Округлое флюктуирующее образование в области задней поверхности локтя размером с грецкий орех. Безболезненное или малоболезненное при пальпации.",
    "objective": "В проекции bursa olecrani мягкоэластичное образование 4х3 см, симптом флюктуации (+), местная температура не повышена, гиперемии нет.",
    "recommendations": "Давящая спиртовая повязка, эластичный налокотник с разгрузочным силиконовым кольцом.",
    "rom": {
      "flexion_active": 145,
      "flexion_passive": 150,
      "extension_deficit": 0,
      "rotation_ext": 85,
      "rotation_int": 85
    },
    "tests": [
      {
        "code": "tinel_cubital",
        "name": "Симптом Тиннеля кубитального канала",
        "expected": "negative",
        "mandatory": 1
      },
      {
        "code": "cozen",
        "name": "Тест Козена",
        "expected": "negative",
        "mandatory": 0
      }
    ],
    "diagnostics": [
      {
        "code": "us_elbow_epicond",
        "name": "УЗИ сухожилий надмыщелков локтевого сустава",
        "modality": "ultrasound",
        "urgency": "routine",
        "is_primary": 1
      },
      {
        "code": "lab_synovial",
        "name": "Микроскопическое и биохимическое исследование синовии",
        "modality": "lab",
        "urgency": "routine",
        "is_primary": 1
      }
    ]
  },
  {
    "id": 8,
    "title": "Синдром кубитального канала (невропатия локтевого нерва)",
    "jointCategory": "elbow",
    "mkbCode": "G56.2",
    "category": "Туннельные невропатии",
    "side": "right",
    "complaints": "Онемение, «мурашки» и снижение чувствительности в IV и V пальцах кисти. Слабость захвата кисти, неловкость мелких движений.",
    "objective": "Гипестезия локтевого края кисти и V пальца. Симптом Фромана (+): слабость приведения I пальца.",
    "recommendations": "Ночной иммобилизирующий ортез, препятствующий сгибанию локтя более 45°. Нейротропная терапия.",
    "rom": {
      "flexion_active": 145,
      "flexion_passive": 150,
      "extension_deficit": 0,
      "rotation_ext": 85,
      "rotation_int": 85
    },
    "tests": [
      {
        "code": "tinel_cubital",
        "name": "Симптом Тиннеля кубитального канала",
        "expected": "positive",
        "mandatory": 1
      },
      {
        "code": "cozen",
        "name": "Тест Козена",
        "expected": "negative",
        "mandatory": 0
      },
      {
        "code": "valgus_stress_elbow",
        "name": "Вальгус-стресс тест локтя",
        "expected": "negative",
        "mandatory": 0
      }
    ],
    "diagnostics": [
      {
        "code": "enmg_ulnar",
        "name": "Стимуляционная ЭНМГ локтевого нерва",
        "modality": "enmg",
        "urgency": "cito",
        "is_primary": 1
      },
      {
        "code": "us_elbow_epicond",
        "name": "УЗИ сухожилий надмыщелков локтевого сустава",
        "modality": "ultrasound",
        "urgency": "routine",
        "is_primary": 1
      }
    ]
  },
  {
    "id": 9,
    "title": "Субакромиальный импинджмент-синдром плеча",
    "jointCategory": "shoulder",
    "mkbCode": "M75.1",
    "category": "Энтезопатии и тендиниты",
    "side": "right",
    "complaints": "Боль по наружной поверхности плеча при отведении руки в диапазоне 60–120° («дуга болезненного отведения»). Боль при заведении руки за спину, невозможность спать на правом боку.",
    "objective": "Пальпация субакромиальной зоны болезненна. Атрофии дельтовидной мышцы нет.",
    "recommendations": "Избегать движений руки выше уровня плеча. Кинезиотейпирование дельтовидной зоны.",
    "rom": {
      "abduction": 90,
      "flexion_active": 100,
      "flexion_passive": 160,
      "rotation_ext": 45,
      "rotation_int": 50
    },
    "tests": [
      {
        "code": "neer",
        "name": "Тест Нира",
        "expected": "positive",
        "mandatory": 1
      },
      {
        "code": "hawkins",
        "name": "Тест Хокинса-Кеннеди",
        "expected": "positive",
        "mandatory": 1
      },
      {
        "code": "empty_can_jobe",
        "name": "Тест «пустой банки» Джобса",
        "expected": "positive",
        "mandatory": 1
      },
      {
        "code": "drop_arm",
        "name": "Тест падающей руки",
        "expected": "negative",
        "mandatory": 1
      },
      {
        "code": "apprehension",
        "name": "Тест тревоги (передней нестабильности)",
        "expected": "negative",
        "mandatory": 0
      }
    ],
    "diagnostics": [
      {
        "code": "mri_shoulder",
        "name": "МРТ плечевого сустава",
        "modality": "mri",
        "urgency": "routine",
        "is_primary": 1
      },
      {
        "code": "us_shoulder",
        "name": "УЗИ плечевого сустава с функциональными пробами",
        "modality": "ultrasound",
        "urgency": "routine",
        "is_primary": 0
      },
      {
        "code": "xray_shoulder_2v",
        "name": "Рентгенография плечевого сустава в 2 проекциях",
        "modality": "xray",
        "urgency": "routine",
        "is_primary": 0
      }
    ]
  },
  {
    "id": 10,
    "title": "Массивный полнослойный разрыв вращательной манжеты плеча",
    "jointCategory": "shoulder",
    "mkbCode": "M75.1",
    "category": "Травмы и повреждения капсульно-связочного аппарата",
    "side": "right",
    "complaints": "Резкая слабость и невозможность поднять руку выше горизонтального уровня («рука не слушается»). Постоянная ночная боль.",
    "objective": "Атрофия надостной и подостной ямок. Пассивные движения в полном объеме, активные резко ограничены.",
    "recommendations": "Отводящая шина-подушка на плечевой сустав. Направление на артроскопический шов вращательной манжеты якорями.",
    "rom": {
      "abduction": 40,
      "flexion_active": 50,
      "flexion_passive": 160,
      "rotation_ext": 30,
      "rotation_int": 40
    },
    "tests": [
      {
        "code": "drop_arm",
        "name": "Тест падающей руки",
        "expected": "positive",
        "mandatory": 1
      },
      {
        "code": "empty_can_jobe",
        "name": "Тест «пустой банки» Джобса",
        "expected": "positive",
        "mandatory": 1
      },
      {
        "code": "neer",
        "name": "Тест Нира",
        "expected": "positive",
        "mandatory": 1
      }
    ],
    "diagnostics": [
      {
        "code": "mri_shoulder",
        "name": "МРТ плечевого сустава",
        "modality": "mri",
        "urgency": "cito",
        "is_primary": 1
      }
    ]
  },
  {
    "id": 11,
    "title": "Адгезивный капсулит («синдром замороженного плеча»)",
    "jointCategory": "shoulder",
    "mkbCode": "M75.0",
    "category": "Дегенеративно-дистрофические заболевания",
    "side": "left",
    "complaints": "Выраженная скованность и тугоподвижность плеча во всех плоскостях. Боль усиливается при любых резких попытках движения.",
    "objective": "Глобальное пропорциональное ограничение как активных, так и пассивных движений (капсулярный паттерн). Резкий дефицит наружной ротации.",
    "recommendations": "Гидродилатационная дистензионная блокада сустава. Ранняя разработка амплитуды на аппарате Artromot.",
    "rom": {
      "abduction": 60,
      "flexion_active": 70,
      "flexion_passive": 80,
      "rotation_ext": 15,
      "rotation_int": 20
    },
    "tests": [
      {
        "code": "neer",
        "name": "Тест Нира",
        "expected": "positive",
        "mandatory": 0
      },
      {
        "code": "hawkins",
        "name": "Тест Хокинса-Кеннеди",
        "expected": "positive",
        "mandatory": 0
      }
    ],
    "diagnostics": [
      {
        "code": "mri_shoulder",
        "name": "МРТ плечевого сустава",
        "modality": "mri",
        "urgency": "routine",
        "is_primary": 1
      },
      {
        "code": "xray_shoulder_2v",
        "name": "Рентгенография плечевого сустава в 2 проекциях",
        "modality": "xray",
        "urgency": "routine",
        "is_primary": 0
      }
    ]
  },
  {
    "id": 12,
    "title": "Пателлофеморальный артроз и латеральная гиперпрессия надколенника",
    "jointCategory": "knee",
    "mkbCode": "M22.2",
    "category": "Дегенеративно-дистрофические заболевания",
    "side": "bilateral",
    "complaints": "Боль по передней поверхности коленей, усиливающаяся при длительном сидении («симптом кинотеатра»), спуске с горы или лестницы. Хруст и крепитация при сгибании.",
    "objective": "Положительный симптом скольжения надколенника с крепитацией. Вальгусная установка коленей.",
    "recommendations": "Кинезиотейпирование надколенника с медиализирующей тягой. Укрепление медиальной широкой мышцы бедра (VMO).",
    "rom": {
      "flexion_active": 135,
      "flexion_passive": 140,
      "extension_deficit": 0
    },
    "tests": [
      {
        "code": "patella_grind",
        "name": "Тест Кларка (трения надколенника)",
        "expected": "positive",
        "mandatory": 1
      },
      {
        "code": "patella_apprehension",
        "name": "Тест тревоги надколенника (Fairbank)",
        "expected": "negative",
        "mandatory": 1
      },
      {
        "code": "lachman",
        "name": "Тест Лахмана",
        "expected": "negative",
        "mandatory": 0
      }
    ],
    "diagnostics": [
      {
        "code": "xray_knee_2v",
        "name": "Рентгенография коленного сустава под нагрузкой",
        "modality": "xray",
        "urgency": "routine",
        "is_primary": 1
      },
      {
        "code": "mri_knee_high",
        "name": "МРТ коленного сустава на томографе 1.5–3.0 Тл",
        "modality": "mri",
        "urgency": "routine",
        "is_primary": 0
      }
    ]
  },
  {
    "id": 13,
    "title": "Первичный коксартроз II стадии",
    "jointCategory": "hip",
    "mkbCode": "M16.1",
    "category": "Дегенеративно-дистрофические заболевания",
    "side": "right",
    "complaints": "Глубокая ноющая боль в паховой области, иррадиирующая по передней поверхности бедра в колено. Затруднение при надевании обуви и носков, утренняя скованность до 20 минут. Хромота при длительной ходьбе.",
    "objective": "Походка щадящая на правую ногу. Гипотрофия ягодичных мышц. Ограничение внутренней ротации и отведения.",
    "recommendations": "Разгрузка сустава тростью при длительной ходьбе, индивидуальные ортопедические стельки с компенсацией перекоса таза.",
    "rom": {
      "flexion_active": 95,
      "flexion_passive": 105,
      "rotation_ext": 25,
      "rotation_int": 15
    },
    "tests": [
      {
        "code": "faber",
        "name": "Тест FABER (Патрика)",
        "expected": "positive",
        "mandatory": 1
      },
      {
        "code": "thomas",
        "name": "Тест Томаса",
        "expected": "positive",
        "mandatory": 1
      },
      {
        "code": "trendelenburg",
        "name": "Симптом Тренделенбурга",
        "expected": "positive",
        "mandatory": 1
      },
      {
        "code": "fadir",
        "name": "Тест FADIR",
        "expected": "positive",
        "mandatory": 0
      }
    ],
    "diagnostics": [
      {
        "code": "xray_pelvis_hip",
        "name": "Обзорная рентгенография таза и обоих ТБС",
        "modality": "xray",
        "urgency": "routine",
        "is_primary": 1
      },
      {
        "code": "mri_hip",
        "name": "МРТ тазобедренного сустава",
        "modality": "mri",
        "urgency": "routine",
        "is_primary": 0
      }
    ]
  },
  {
    "id": 14,
    "title": "Вертлужный трохантерит (большой вертельный бурсит)",
    "jointCategory": "hip",
    "mkbCode": "M70.6",
    "category": "Бурситы и синовиты",
    "side": "right",
    "complaints": "Боль по наружной поверхности бедра в области «галифе», усиливается при лежании на больном боку, подъеме по лестнице и вставании со стула. В пах не иррадиирует.",
    "objective": "Пальпация верхушки большого вертела бедренной кости вызывает резкую локальную боль («симптом прыжка»). Движения в ТБС в полном объеме.",
    "recommendations": "Исключить сон на пораженном боку, курс локальной противовоспалительной терапии.",
    "rom": {
      "flexion_active": 115,
      "flexion_passive": 125,
      "rotation_ext": 40,
      "rotation_int": 35
    },
    "tests": [
      {
        "code": "faber",
        "name": "Тест FABER (Патрика)",
        "expected": "negative",
        "mandatory": 1
      },
      {
        "code": "fadir",
        "name": "Тест FADIR",
        "expected": "negative",
        "mandatory": 1
      },
      {
        "code": "trendelenburg",
        "name": "Симптом Тренделенбурга",
        "expected": "negative",
        "mandatory": 0
      },
      {
        "code": "ober",
        "name": "Тест Обера",
        "expected": "positive",
        "mandatory": 1
      }
    ],
    "diagnostics": [
      {
        "code": "us_hip_trochanter",
        "name": "УЗИ области большого вертела и ТБС",
        "modality": "ultrasound",
        "urgency": "routine",
        "is_primary": 1
      },
      {
        "code": "xray_pelvis_hip",
        "name": "Обзорная рентгенография таза и обоих ТБС",
        "modality": "xray",
        "urgency": "routine",
        "is_primary": 0
      }
    ]
  },
  {
    "id": 15,
    "title": "Феморо-ацетабулярный импинджмент (FAI, Cam/Pincer)",
    "jointCategory": "hip",
    "mkbCode": "M24.8",
    "category": "Дегенеративно-дистрофические заболевания",
    "side": "left",
    "complaints": "Острая «стреляющая» боль в глубине паха при глубоком приседании, посадке в низкий автомобиль или занятиях спортом (бег, единоборства).",
    "objective": "Ограничение внутренней ротации бедра при сгибании 90° (до 10°).",
    "recommendations": "Модификация спортивных нагрузок (исключение глубокого сгибания бедра). Консультация артроскопического хирурга.",
    "rom": {
      "flexion_active": 100,
      "flexion_passive": 110,
      "rotation_ext": 35,
      "rotation_int": 10
    },
    "tests": [
      {
        "code": "fadir",
        "name": "Тест FADIR",
        "expected": "positive",
        "mandatory": 1
      },
      {
        "code": "faber",
        "name": "Тест FABER (Патрика)",
        "expected": "negative",
        "mandatory": 1
      }
    ],
    "diagnostics": [
      {
        "code": "xray_pelvis_hip",
        "name": "Обзорная рентгенография таза и обоих ТБС",
        "modality": "xray",
        "urgency": "routine",
        "is_primary": 1
      },
      {
        "code": "mri_hip",
        "name": "МРТ тазобедренного сустава",
        "modality": "mri",
        "urgency": "routine",
        "is_primary": 1
      }
    ]
  },
  {
    "id": 16,
    "title": "Асептический некроз головки бедренной кости (АНГБК) I-II стадии",
    "jointCategory": "hip",
    "mkbCode": "M87.0",
    "category": "Дегенеративно-дистрофические заболевания",
    "side": "right",
    "complaints": "Постоянная глухая боль в паху и ягодице, не проходящая в покое и беспокоящая по ночам. Быстрое прогрессирование хромоты.",
    "objective": "Резкое ограничение ротации бедра из-за боли. Пальпация передней поверхности капсулы ТБС резко болезненна.",
    "recommendations": "Строгая разгрузка конечности костылями (исключение осевой нагрузки). Направление на туннелизацию с PRP.",
    "rom": {
      "flexion_active": 85,
      "flexion_passive": 95,
      "rotation_ext": 15,
      "rotation_int": 10
    },
    "tests": [
      {
        "code": "faber",
        "name": "Тест FABER (Патрика)",
        "expected": "positive",
        "mandatory": 1
      },
      {
        "code": "fadir",
        "name": "Тест FADIR",
        "expected": "positive",
        "mandatory": 1
      }
    ],
    "diagnostics": [
      {
        "code": "mri_hip",
        "name": "МРТ тазобедренного сустава",
        "modality": "mri",
        "urgency": "cito",
        "is_primary": 1
      },
      {
        "code": "xray_pelvis_hip",
        "name": "Обзорная рентгенография таза и обоих ТБС",
        "modality": "xray",
        "urgency": "routine",
        "is_primary": 0
      }
    ]
  },
  {
    "id": 17,
    "title": "Разрыв медиального мениска (Stoller IIIb)",
    "jointCategory": "knee",
    "mkbCode": "M23.2",
    "category": "Травмы и повреждения капсульно-связочного аппарата",
    "side": "right",
    "complaints": "Острая «кинжальная» боль по внутренней суставной щели при глубоком приседании и ротации голени. Периодические блокировки («заклинивание») сустава.",
    "objective": "Синовит: I степень. Резкая локальная болезненность в точке проекции заднего рога медиального мениска.",
    "recommendations": "Консультация артроскопического хирурга по результатам МРТ. Ограничение глубокого приседания и ударных нагрузок.",
    "rom": {
      "flexion_active": 105,
      "flexion_passive": 115,
      "extension_deficit": -10
    },
    "tests": [
      {
        "code": "mcmurray",
        "name": "Тест Мак-Мюррея",
        "expected": "positive_medial",
        "mandatory": 1
      },
      {
        "code": "appley",
        "name": "Тест Эпли",
        "expected": "positive",
        "mandatory": 1
      },
      {
        "code": "lachman",
        "name": "Тест Лахмана",
        "expected": "negative",
        "mandatory": 1
      },
      {
        "code": "pivot_shift",
        "name": "Тест Pivot-Shift",
        "expected": "negative",
        "mandatory": 0
      }
    ],
    "diagnostics": [
      {
        "code": "mri_knee_high",
        "name": "МРТ коленного сустава на томографе 1.5–3.0 Тл",
        "modality": "mri",
        "urgency": "cito",
        "is_primary": 1
      },
      {
        "code": "xray_knee_2v",
        "name": "Рентгенография коленного сустава под нагрузкой",
        "modality": "xray",
        "urgency": "routine",
        "is_primary": 0
      }
    ]
  },
  {
    "id": 18,
    "title": "Частичный разрыв передней таранно-малоберцовой связки голеностопа",
    "jointCategory": "ankle",
    "mkbCode": "S93.4",
    "category": "Травмы и повреждения капсульно-связочного аппарата",
    "side": "right",
    "complaints": "Боль по наружной поверхности голеностопа, отек латеральной лодыжки, подкожная гематома. Хромота при нагрузке.",
    "objective": "Отечность в проекции латеральной лодыжки, гематома, распространяющаяся на тыл стопы.",
    "recommendations": "Иммобилизация голеностопным полужестким ортезом с боковыми пластинами на 3 недели. Режим R.I.C.E.",
    "rom": {
      "dorsiflexion": 10,
      "plantarflexion": 25
    },
    "tests": [
      {
        "code": "anterior_drawer_ankle",
        "name": "Передний выдвижной ящик голеностопа",
        "expected": "positive",
        "mandatory": 1
      },
      {
        "code": "talar_tilt",
        "name": "Стресс-тест таранной кости",
        "expected": "positive",
        "mandatory": 1
      },
      {
        "code": "thompson",
        "name": "Тест Томпсона",
        "expected": "negative",
        "mandatory": 1
      }
    ],
    "diagnostics": [
      {
        "code": "xray_foot_load",
        "name": "Рентгенография стоп с физиологической нагрузкой",
        "modality": "xray",
        "urgency": "cito",
        "is_primary": 1
      },
      {
        "code": "us_achilles",
        "name": "УЗИ ахиллова сухожилия и плантарной фасции",
        "modality": "ultrasound",
        "urgency": "routine",
        "is_primary": 0
      }
    ]
  },
  {
    "id": 19,
    "title": "Хронический тендинит ахиллова сухожилия (ахиллодиния)",
    "jointCategory": "ankle",
    "mkbCode": "M76.6",
    "category": "Энтезопатии и тендиниты",
    "side": "left",
    "complaints": "Тянущая боль в области задней поверхности голени на 3–5 см выше пятки, возникающая в начале бега и ходьбы. Утолщение сухожилия.",
    "objective": "Локальное веретенообразное утолщение сухожилия, пальпация резко болезненна.",
    "recommendations": "Курс эксцентрических тренировок по Альфредсону. Подпяточники силиконовые 1 см.",
    "rom": {
      "dorsiflexion": 15,
      "plantarflexion": 40
    },
    "tests": [
      {
        "code": "thompson",
        "name": "Тест Томпсона",
        "expected": "negative",
        "mandatory": 1
      },
      {
        "code": "windlass",
        "name": "Тест Уиндласса",
        "expected": "negative",
        "mandatory": 0
      }
    ],
    "diagnostics": [
      {
        "code": "us_achilles",
        "name": "УЗИ ахиллова сухожилия и плантарной фасции",
        "modality": "ultrasound",
        "urgency": "routine",
        "is_primary": 1
      }
    ]
  },
  {
    "id": 20,
    "title": "Hallux Valgus II степени, метатарзалгия",
    "jointCategory": "ankle",
    "mkbCode": "M20.1",
    "category": "Дегенеративно-дистрофические заболевания",
    "side": "bilateral",
    "complaints": "Отклонение первого пальца стопы кнаружи, воспаление и натирание «косточки» в обуви. Боль под головками II-III плюсневых костей («натоптыши»).",
    "objective": "Вальгусное отклонение I пальца >25°, гиперкератоз подошвы под II плюсневой костью.",
    "recommendations": "Индивидуальные ортопедические стельки с метатарзальным валиком Зейца. Ночной отводящий бандаж.",
    "rom": {
      "dorsiflexion": 20,
      "plantarflexion": 45
    },
    "tests": [
      {
        "code": "windlass",
        "name": "Тест Уиндласса",
        "expected": "negative",
        "mandatory": 0
      }
    ],
    "diagnostics": [
      {
        "code": "xray_foot_load",
        "name": "Рентгенография стоп с физиологической нагрузкой",
        "modality": "xray",
        "urgency": "routine",
        "is_primary": 1
      },
      {
        "code": "plantography",
        "name": "Компьютерная подометрия и оптическая плантография",
        "modality": "plantography",
        "urgency": "routine",
        "is_primary": 1
      }
    ]
  },
  {
    "id": 21,
    "title": "Синдром запястного (карпального) канала",
    "jointCategory": "wrist",
    "mkbCode": "G56.0",
    "category": "Туннельные невропатии",
    "side": "right",
    "complaints": "Онемение, покалывание и жгучие боли в I, II, III пальцах кисти, особенно ночью и под утро («будят по ночам, приходится трясти кистью»). Слабость удержания чашки, выпадение предметов.",
    "objective": "Гипестезия в зоне иннервации n. medianus (ладонная поверхность 1-3 пальцев). Гипотрофия мышц thenar.",
    "recommendations": "Ночной нейтральный шинирующий ортез на запястье (cock-up splint). Избегать длительного сгибания кисти.",
    "rom": {
      "flexion_active": 75,
      "flexion_passive": 80,
      "extension_deficit": 0
    },
    "tests": [
      {
        "code": "phalen",
        "name": "Тест Фалена",
        "expected": "positive",
        "mandatory": 1
      },
      {
        "code": "tinel_wrist",
        "name": "Симптом Тиннеля на запястье",
        "expected": "positive",
        "mandatory": 1
      },
      {
        "code": "finkelstein",
        "name": "Тест Финкельштейна",
        "expected": "negative",
        "mandatory": 1
      },
      {
        "code": "piano_key",
        "name": "Симптом клавиши пианино",
        "expected": "negative",
        "mandatory": 0
      }
    ],
    "diagnostics": [
      {
        "code": "enmg_carpal",
        "name": "Стимуляционная ЭНМГ срединного нерва кисти",
        "modality": "enmg",
        "urgency": "cito",
        "is_primary": 1
      },
      {
        "code": "us_wrist_carpal",
        "name": "УЗИ срединного нерва в карпальном канале",
        "modality": "ultrasound",
        "urgency": "routine",
        "is_primary": 1
      }
    ]
  },
  {
    "id": 22,
    "title": "Стенозирующий лигаментит де Кервена",
    "jointCategory": "wrist",
    "mkbCode": "M65.4",
    "category": "Энтезопатии и тендиниты",
    "side": "right",
    "complaints": "Резкая боль у основания первого пальца и по лучевому краю запястья при захвате предметов, открывании крышек банок, отведении пальца.",
    "objective": "Припухлость и резкая пальпаторная болезненность в проекции шиловидного отростка лучевой кости (I костно-фиброзный канал).",
    "recommendations": "Ортез лучезапястный с жесткой фиксацией I пальца (Spica splint).",
    "rom": {
      "flexion_active": 70,
      "flexion_passive": 75,
      "extension_deficit": 0
    },
    "tests": [
      {
        "code": "finkelstein",
        "name": "Тест Финкельштейна",
        "expected": "positive",
        "mandatory": 1
      },
      {
        "code": "phalen",
        "name": "Тест Фалена",
        "expected": "negative",
        "mandatory": 1
      },
      {
        "code": "tinel_wrist",
        "name": "Симптом Тиннеля на запястье",
        "expected": "negative",
        "mandatory": 1
      }
    ],
    "diagnostics": [
      {
        "code": "us_wrist_carpal",
        "name": "УЗИ срединного нерва в карпальном канале",
        "modality": "ultrasound",
        "urgency": "routine",
        "is_primary": 1
      },
      {
        "code": "xray_wrist_2v",
        "name": "Рентгенография лучезапястного сустава в 2 проекциях",
        "modality": "xray",
        "urgency": "routine",
        "is_primary": 0
      }
    ]
  },
  {
    "id": 23,
    "title": "Ризартроз (артроз первого запястно-пястного сустава)",
    "jointCategory": "wrist",
    "mkbCode": "M18.1",
    "category": "Дегенеративно-дистрофические заболевания",
    "side": "bilateral",
    "complaints": "Ноющая боль у основания большого пальца кисти при силовом щипковом хвате (поворот ключа в замке, открытие бутылок). Утренняя скованность.",
    "objective": "Деформация сустава («квадратная кисть»), крепитация при аксиальном давлении.",
    "recommendations": "Индивидуальный термопластичный ортез на седловидный сустав кисти.",
    "rom": {
      "flexion_active": 75,
      "flexion_passive": 80,
      "extension_deficit": 0
    },
    "tests": [
      {
        "code": "grind_thumb",
        "name": "Тест шлифовки 1-го ПЗП (Grind test)",
        "expected": "positive",
        "mandatory": 1
      },
      {
        "code": "finkelstein",
        "name": "Тест Финкельштейна",
        "expected": "negative",
        "mandatory": 1
      }
    ],
    "diagnostics": [
      {
        "code": "xray_wrist_2v",
        "name": "Рентгенография лучезапястного сустава в 2 проекциях",
        "modality": "xray",
        "urgency": "routine",
        "is_primary": 1
      }
    ]
  },
  {
    "id": 24,
    "title": "Посттравматическая нестабильность дистального радиоульнарного сустава (DRUJ)",
    "jointCategory": "wrist",
    "mkbCode": "M24.2",
    "category": "Травмы и повреждения капсульно-связочного аппарата",
    "side": "right",
    "complaints": "Боль по локтевому краю запястья при ротации кисти (выжимание тряпки, поворот ключа), ощущение щелчков и соскальзывания локтевой кости.",
    "objective": "Головка локтевой кости выстоит к тылу, болезненна при пальпации.",
    "recommendations": "Полужесткий фиксатор запястья с ограничением ротации предплечья.",
    "rom": {
      "flexion_active": 65,
      "flexion_passive": 70,
      "extension_deficit": 0
    },
    "tests": [
      {
        "code": "piano_key",
        "name": "Симптом клавиши пианино",
        "expected": "positive",
        "mandatory": 1
      },
      {
        "code": "tinel_wrist",
        "name": "Симптом Тиннеля на запястье",
        "expected": "negative",
        "mandatory": 0
      }
    ],
    "diagnostics": [
      {
        "code": "mri_wrist",
        "name": "МРТ лучезапястного сустава",
        "modality": "mri",
        "urgency": "routine",
        "is_primary": 1
      },
      {
        "code": "xray_wrist_2v",
        "name": "Рентгенография лучезапястного сустава в 2 проекциях",
        "modality": "xray",
        "urgency": "routine",
        "is_primary": 1
      }
    ]
  },
  {
    "id": 25,
    "title": "Люмбалгия с радикулопатией L5–S1 (вертеброгенный ишиас)",
    "jointCategory": "spine",
    "mkbCode": "M54.4",
    "category": "Дегенеративно-дистрофические заболевания",
    "side": "right",
    "complaints": "Стреляющая, пронизывающая боль в пояснице, иррадиирующая по ягодице, задне-наружной поверхности правого бедра и голени до пятки и V пальца стопы. Онемение стопы. Усиливается при кашле, чихании и наклоне вперед.",
    "objective": "Сглажен поясничный лордоз, анталгический сколиоз с наклоном туловища в здоровую сторону. Напряжение длинных мышц спины («симптом вожжей»). Снижение правого ахиллова рефлекса.",
    "recommendations": "Полужесткий поясничный корсет при вертикализации. Исключение осевой нагрузки и сидения более 30 минут подряд.",
    "rom": {
      "flexion_active": 40,
      "flexion_passive": 50,
      "extension_deficit": -10
    },
    "tests": [
      {
        "code": "lasegue",
        "name": "Симптом Ласега",
        "expected": "positive",
        "mandatory": 1
      },
      {
        "code": "wassermann",
        "name": "Тест Вассермана / бедренного нерва",
        "expected": "negative",
        "mandatory": 1
      },
      {
        "code": "adams",
        "name": "Проба Адамса",
        "expected": "negative",
        "mandatory": 0
      }
    ],
    "diagnostics": [
      {
        "code": "mri_lumbosacral",
        "name": "МРТ пояснично-крестцового отдела позвоночника",
        "modality": "mri",
        "urgency": "cito",
        "is_primary": 1
      },
      {
        "code": "xray_spine_flex",
        "name": "Рентгенография позвоночника с функциональными пробами",
        "modality": "xray",
        "urgency": "routine",
        "is_primary": 0
      }
    ]
  },
  {
    "id": 26,
    "title": "Цервикалгия с миофасциальным болевым синдромом и цефалгией",
    "jointCategory": "spine",
    "mkbCode": "M54.2",
    "category": "Миофасциальные синдромы",
    "side": "bilateral",
    "complaints": "Тяжесть и скованность в шейно-воротниковой зоне, распространяющиеся в затылочную область («каска неврастеника»). Усиливаются к концу рабочего дня за компьютером.",
    "objective": "Пальпация трапециевидных мышц, мышцы, поднимающей лопатку, выявляет плотные болезненные триггерные тяжи.",
    "recommendations": "Эргономика рабочего места, ортопедическая подушка с эффектом памяти. ЛФК.",
    "rom": {
      "flexion_active": 50,
      "flexion_passive": 60,
      "extension_deficit": 0
    },
    "tests": [
      {
        "code": "spurling",
        "name": "Тест Сперлинга",
        "expected": "negative",
        "mandatory": 1
      },
      {
        "code": "lasegue",
        "name": "Симптом Ласега",
        "expected": "negative",
        "mandatory": 0
      }
    ],
    "diagnostics": [
      {
        "code": "xray_spine_flex",
        "name": "Рентгенография позвоночника с функциональными пробами",
        "modality": "xray",
        "urgency": "routine",
        "is_primary": 1
      }
    ]
  },
  {
    "id": 27,
    "title": "Торакалгия на фоне мышечно-тонического синдрома и остеохондроза",
    "jointCategory": "spine",
    "mkbCode": "M54.6",
    "category": "Дегенеративно-дистрофические заболевания",
    "side": "bilateral",
    "complaints": "Межлопаточная боль, чувство «кола» в спине между лопатками, усиливающееся при глубоком вдохе и длительной сидячей позе.",
    "objective": "Болезненность паравертебральных точек Th4–Th7. Экскурсия грудной клетки сохранена.",
    "recommendations": "Межлопаточный миофасциальный релиз, курс ЛФК с акцентом на грудной отдел.",
    "rom": {
      "flexion_active": 50,
      "flexion_passive": 55,
      "extension_deficit": 0
    },
    "tests": [
      {
        "code": "adams",
        "name": "Проба Адамса",
        "expected": "negative",
        "mandatory": 1
      },
      {
        "code": "lasegue",
        "name": "Симптом Ласега",
        "expected": "negative",
        "mandatory": 0
      }
    ],
    "diagnostics": [
      {
        "code": "xray_spine_flex",
        "name": "Рентгенография позвоночника с функциональными пробами",
        "modality": "xray",
        "urgency": "routine",
        "is_primary": 1
      }
    ]
  },
  {
    "id": 28,
    "title": "Идиопатический сколиоз позвоночника II степени",
    "jointCategory": "spine",
    "mkbCode": "M41.2",
    "category": "Деформации позвоночника",
    "side": "bilateral",
    "complaints": "Асимметрия надплечий, выстояние угла лопатки, быстрая утомляемость спины при статической нагрузке. Боли незначительные.",
    "objective": "Асимметрия треугольников талии, правое надплечье выше левого. При наклоне вперед контурируется реберный горб.",
    "recommendations": "Специализированная гимнастика по методу Шрот. Консультация ортезиста по корсету Шено.",
    "rom": {
      "flexion_active": 60,
      "flexion_passive": 65,
      "extension_deficit": 0
    },
    "tests": [
      {
        "code": "adams",
        "name": "Проба Адамса",
        "expected": "positive",
        "mandatory": 1
      },
      {
        "code": "lasegue",
        "name": "Симптом Ласега",
        "expected": "negative",
        "mandatory": 0
      }
    ],
    "diagnostics": [
      {
        "code": "xray_spine_total",
        "name": "Панорамная спондилография позвоночника стоя",
        "modality": "xray",
        "urgency": "primary",
        "is_primary": 1
      },
      {
        "code": "plantography",
        "name": "Компьютерная подометрия и оптическая плантография",
        "modality": "plantography",
        "urgency": "routine",
        "is_primary": 1
      }
    ]
  },
  {
    "id": 29,
    "title": "Тендинит сухожилия длинной головки двуглавой мышцы плеча",
    "jointCategory": "shoulder",
    "mkbCode": "M75.2",
    "category": "Энтезопатии и тендиниты",
    "side": "right",
    "complaints": "Боль по передней поверхности плечевого сустава с иррадиацией по ходу бицепса, усиливается при подъеме тяжестей перед собой.",
    "objective": "Локальная болезненность при пальпации в sulcus intertubercularis. Движения в плече полные.",
    "recommendations": "Ограничение тракционных нагрузок на руку, курс локальной криотерапии.",
    "rom": {
      "abduction": 160,
      "flexion_active": 160,
      "flexion_passive": 170,
      "rotation_ext": 60,
      "rotation_int": 60
    },
    "tests": [
      {
        "code": "speed",
        "name": "Тест Спида",
        "expected": "positive",
        "mandatory": 1
      },
      {
        "code": "neer",
        "name": "Тест Нира",
        "expected": "negative",
        "mandatory": 1
      },
      {
        "code": "hawkins",
        "name": "Тест Хокинса-Кеннеди",
        "expected": "negative",
        "mandatory": 1
      }
    ],
    "diagnostics": [
      {
        "code": "us_shoulder",
        "name": "УЗИ плечевого сустава с функциональными пробами",
        "modality": "ultrasound",
        "urgency": "routine",
        "is_primary": 1
      },
      {
        "code": "mri_shoulder",
        "name": "МРТ плечевого сустава",
        "modality": "mri",
        "urgency": "routine",
        "is_primary": 0
      }
    ]
  },
  {
    "id": 30,
    "title": "Полный разрыв передней крестообразной связки (ПКС)",
    "jointCategory": "knee",
    "mkbCode": "S83.5",
    "category": "Травмы и повреждения капсульно-связочного аппарата",
    "side": "left",
    "complaints": "Ощущение «выскакивания» или подкашивания голени при ходьбе и попытке сменить направление движения. Нестабильность колена.",
    "objective": "Симптом баллотирования (+). Атрофия четырехглавой мышцы бедра (-1.5 см в окружности).",
    "recommendations": "Жесткий функциональный рамный ортез. Направление на плановую артроскопическую аутопластику ПКС.",
    "rom": {
      "flexion_active": 125,
      "flexion_passive": 130,
      "extension_deficit": 0
    },
    "tests": [
      {
        "code": "lachman",
        "name": "Тест Лахмана",
        "expected": "positive",
        "mandatory": 1
      },
      {
        "code": "anterior_drawer",
        "name": "Передний выдвижной ящик колена",
        "expected": "positive",
        "mandatory": 1
      },
      {
        "code": "pivot_shift",
        "name": "Тест Pivot-Shift",
        "expected": "positive",
        "mandatory": 1
      },
      {
        "code": "mcmurray",
        "name": "Тест Мак-Мюррея",
        "expected": "negative",
        "mandatory": 0
      }
    ],
    "diagnostics": [
      {
        "code": "mri_knee_high",
        "name": "МРТ коленного сустава на томографе 1.5–3.0 Тл",
        "modality": "mri",
        "urgency": "cito",
        "is_primary": 1
      }
    ]
  },
  {
    "id": 31,
    "title": "Плантарный фасциит с пяточным энтезофитом («пяточная шпора»)",
    "jointCategory": "ankle",
    "mkbCode": "M77.3",
    "category": "Энтезопатии и тендиниты",
    "side": "right",
    "complaints": "Острая жгучая боль в подошвенной поверхности пятки при первых утренних шагах («стартовая боль»), пациент вынужден наступать на носок. После расхаживания боль немного стихает, к вечеру нарастает.",
    "objective": "Локальная резкая болезненность при пальпации медиального бугра пяточной кости. Свод стопы уплощен.",
    "recommendations": "Ночной страсбургский носок / ночной фиксатор фасции. Индивидуальные ортопедические стельки с разгрузочным окном под пяткой.",
    "rom": {
      "dorsiflexion": 15,
      "plantarflexion": 40
    },
    "tests": [
      {
        "code": "windlass",
        "name": "Тест Уиндласса",
        "expected": "positive",
        "mandatory": 1
      },
      {
        "code": "thompson",
        "name": "Тест Томпсона",
        "expected": "negative",
        "mandatory": 1
      },
      {
        "code": "anterior_drawer_ankle",
        "name": "Передний выдвижной ящик голеностопа",
        "expected": "negative",
        "mandatory": 0
      }
    ],
    "diagnostics": [
      {
        "code": "xray_foot_load",
        "name": "Рентгенография стоп с физиологической нагрузкой",
        "modality": "xray",
        "urgency": "routine",
        "is_primary": 1
      },
      {
        "code": "plantography",
        "name": "Компьютерная подометрия и оптическая плантография",
        "modality": "plantography",
        "urgency": "routine",
        "is_primary": 1
      },
      {
        "code": "us_achilles",
        "name": "УЗИ ахиллова сухожилия и плантарной фасции",
        "modality": "ultrasound",
        "urgency": "routine",
        "is_primary": 0
      }
    ]
  }
];

const BASE_JOINT_LABELS: Record<string, string> = {
  all: 'Все суставы',
  knee: 'Коленный',
  shoulder: 'Плечевой',
  elbow: 'Локтевой',
  hip: 'Тазобедренный',
  ankle: 'Стопа и голеностоп',
  wrist: 'Кисть и запястье',
  spine: 'Позвоночник'
};

const SIDE_LABELS: Record<string, string> = {
  right: 'Правая сторона',
  left: 'Левая сторона',
  bilateral: 'Двустороннее',
  affected: 'Пораженная сторона'
};

export default function OrthoTemplatesGuideRegistry() {
  const navigate = useNavigate();
  const [registryTemplates, setRegistryTemplates] = useState<ClinicalTemplateDetail[]>(CLINICAL_TEMPLATES_REGISTRY);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCluster, setSelectedCluster] = useState<string>('all');
  const [selectedJoint, setSelectedJoint] = useState<string>('all');
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    fetch('/api/ortho/templates/detailed?with_details=1')
      .then(r => r.json())
      .then(data => {
        if (isMounted && data.success && Array.isArray(data.templates) && data.templates.length > 0) {
          const mapped: ClinicalTemplateDetail[] = data.templates.map((t: any) => {
            let parsedRom = null;
            try {
              parsedRom = typeof t.rom_norm_preset === 'string' ? JSON.parse(t.rom_norm_preset) : t.rom_norm_preset;
            } catch {}
            return {
              id: t.id,
              title: t.title,
              jointCategory: t.jointCategory || t.joint_name || 'knee',
              mkbCode: t.mkbCode || t.default_mkb_code || '',
              category: t.category || '',
              cluster_id: t.cluster_id || '',
              cluster_name: t.cluster_name || '',
              stage_or_severity: t.stage_or_severity || '',
              side: t.side || t.default_side || 'right',
              complaints: t.complaints || t.complaints_template || '',
              objective: t.objective || t.objective_template || '',
              recommendations: t.recommendations || t.recommendations_template || '',
              rom: t.rom || parsedRom,
              tests: t.tests || [],
              diagnostics: t.diagnostics || [],
              tests_count: t.tests_count ?? (t.tests ? t.tests.length : 0),
              diagnostics_count: t.diagnostics_count ?? (t.diagnostics ? t.diagnostics.length : 0)
            };
          });
          setRegistryTemplates(mapped);
        }
      })
      .catch(err => {
        console.error('Failed to fetch full templates for guide:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => { isMounted = false; };
  }, []);

  const clusterCounts = useMemo(() => {
    const counts: Record<string, number> = { all: registryTemplates.length };
    registryTemplates.forEach(t => {
      if (t.cluster_id) {
        counts[t.cluster_id] = (counts[t.cluster_id] || 0) + 1;
      }
    });
    return counts;
  }, [registryTemplates]);

  const jointCounts = useMemo(() => {
    const counts: Record<string, number> = { all: registryTemplates.length };
    registryTemplates.forEach(t => {
      if (t.jointCategory) {
        counts[t.jointCategory] = (counts[t.jointCategory] || 0) + 1;
      }
    });
    return counts;
  }, [registryTemplates]);

  const filtered = useMemo(() => {
    return registryTemplates.filter((t) => {
      const matchCluster = selectedCluster === 'all' || t.cluster_id === selectedCluster;
      const matchJoint = selectedJoint === 'all' || t.jointCategory === selectedJoint;
      if (!matchCluster || !matchJoint) return false;

      if (!search.trim()) return true;
      const q = search.toLowerCase();
      const testsStr = (t.tests || []).map((x) => x.name + ' ' + x.code).join(' ').toLowerCase();
      const diagsStr = (t.diagnostics || []).map((x) => x.name + ' ' + x.code).join(' ').toLowerCase();

      return (
        t.title.toLowerCase().includes(q) ||
        t.mkbCode.toLowerCase().includes(q) ||
        (t.stage_or_severity && t.stage_or_severity.toLowerCase().includes(q)) ||
        (t.cluster_name && t.cluster_name.toLowerCase().includes(q)) ||
        t.category.toLowerCase().includes(q) ||
        t.complaints.toLowerCase().includes(q) ||
        t.objective.toLowerCase().includes(q) ||
        t.recommendations.toLowerCase().includes(q) ||
        testsStr.includes(q) ||
        diagsStr.includes(q)
      );
    });
  }, [registryTemplates, search, selectedCluster, selectedJoint]);

  const handleToggle = async (id: number) => {
    const isNowExpanded = !expanded[id];
    setExpanded((prev) => ({ ...prev, [id]: isNowExpanded }));
    if (isNowExpanded) {
      const target = registryTemplates.find(t => t.id === id);
      if (target && (!target.tests || target.tests.length === 0) && (target.tests_count || 0) > 0) {
        try {
          const res = await fetch(`/api/ortho/templates/${id}/full`);
          const d = await res.json();
          if (d.success && d.template) {
            setRegistryTemplates(prev => prev.map(item => item.id === id ? {
              ...item,
              tests: (d.template.tests || []).map((tt: any) => ({
                code: tt.test_code,
                name: tt.name_ru || tt.name_lat || tt.test_code,
                expected: tt.expected_result,
                mandatory: tt.is_mandatory
              })),
              diagnostics: (d.template.diagnostics || []).map((dd: any) => ({
                code: dd.diagnostic_code,
                name: dd.name || dd.diagnostic_code,
                modality: dd.modality || '',
                urgency: dd.urgency || 'routine',
                is_primary: dd.is_primary || 1
              }))
            } : item));
          }
        } catch (e) {
          console.error('Failed to lazy load template detail:', e);
        }
      }
    }
  };

  const expandAll = () => {
    const next: Record<number, boolean> = {};
    filtered.forEach((t) => { next[t.id] = true; });
    setExpanded(next);
  };

  const collapseAll = () => {
    setExpanded({});
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      {/* Top Banner and Summary */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          borderRadius: 2.5,
          border: '1px solid #BAE6FD',
          bgcolor: '#F0F9FF',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2
        }}
      >
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#0369A1', display: 'flex', alignItems: 'center', gap: 1 }}>
            <ArticleIcon sx={{ color: '#0284C7' }} />
            Эталонный реестр: {registryTemplates.length} структурированных клинических протоколов (10 Кластеров)
          </Typography>
          <Typography variant="body2" sx={{ color: '#0284C7', mt: 0.5 }}>
            Корпоративная база доказательной ортопедии МИС «ОртоERP»: классификация по 10 клиническим кластерам и МКБ-10, готовые формулировки жалоб и локального статуса, Neutral-0 нормы ROM, профильные доказательные тесты и план инструментального обследования с ценами servdict.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            size="small"
            startIcon={<OpenInNewIcon />}
            onClick={() => navigate('/ortho-templates')}
            sx={{ bgcolor: '#0284C7', textTransform: 'none', fontWeight: 700, borderRadius: 1.5 }}
          >
            Справочник шаблонов 2.0
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<MedicalServicesIcon />}
            onClick={() => navigate('/ortho-workstation')}
            sx={{ borderColor: '#0284C7', color: '#0284C7', textTransform: 'none', fontWeight: 700, borderRadius: 1.5 }}
          >
            АРМ врача
          </Button>
        </Box>
      </Paper>

      {/* Cluster Horizon Carousel / Strip */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          p: 1.25,
          bgcolor: '#FFFFFF',
          borderRadius: 2,
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          border: '1px solid #E2E8F0',
          overflowX: 'auto',
          whiteSpace: 'nowrap',
          '&::-webkit-scrollbar': { height: 5 },
          '&::-webkit-scrollbar-thumb': { bgcolor: '#CBD5E1', borderRadius: 3 }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, pl: 0.5, pr: 1, borderRight: '1px solid #E2E8F0', flexShrink: 0 }}>
          <LayersIcon sx={{ fontSize: 18, color: '#0F3C64' }} />
          <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F3C64', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Кластеры:
          </Typography>
        </Box>

        {MASTER_CLUSTERS.map(c => {
          const isSelected = selectedCluster === c.id;
          const count = clusterCounts[c.id] || 0;
          return (
            <Chip
              key={c.id}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  {c.id !== 'all' && (
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: isSelected ? '#FFFFFF' : c.badge_color }} />
                  )}
                  <span>{c.name_ru}</span>
                  <span
                    style={{
                      backgroundColor: isSelected ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.06)',
                      padding: '1px 6px',
                      borderRadius: 10,
                      fontSize: '0.7rem',
                      fontWeight: 800
                    }}
                  >
                    {count}
                  </span>
                </Box>
              }
              clickable
              size="small"
              onClick={() => setSelectedCluster(c.id)}
              sx={{
                fontWeight: isSelected ? 800 : 600,
                fontSize: '0.76rem',
                height: 30,
                px: 0.5,
                flexShrink: 0,
                color: isSelected ? '#FFFFFF' : '#334155',
                bgcolor: isSelected ? c.badge_color : '#F8FAFC',
                border: `1px solid ${isSelected ? c.badge_color : '#E2E8F0'}`,
                transition: 'all 0.15s',
                '&:hover': {
                  bgcolor: isSelected ? c.badge_color : '#E2E8F0'
                }
              }}
            />
          );
        })}
      </Box>

      {/* Joint Tabs Filter */}
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {Object.entries(BASE_JOINT_LABELS).map(([key, label]) => {
          const isSelected = selectedJoint === key;
          const count = jointCounts[key] || 0;
          return (
            <Chip
              key={key}
              label={`${label} (${count})`}
              onClick={() => setSelectedJoint(key)}
              sx={{
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer',
                bgcolor: isSelected ? '#0F3C64' : '#F1F5F9',
                color: isSelected ? '#FFFFFF' : '#475569',
                border: isSelected ? '1px solid #0F3C64' : '1px solid #CBD5E1',
                '&:hover': {
                  bgcolor: isSelected ? '#156C9C' : '#E2E8F0'
                }
              }}
            />
          );
        })}
      </Box>

      {/* Search and Action Buttons */}
      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder="Поиск по названию, коду МКБ-10, стадии, тестам, диагностике или тексту..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ flexGrow: 1, minWidth: 260 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#94A3B8' }} />
                </InputAdornment>
              )
            }
          }}
        />
        <Button
          size="small"
          variant="outlined"
          startIcon={<UnfoldMoreIcon />}
          onClick={expandAll}
          sx={{ textTransform: 'none', fontWeight: 600, color: '#0F3C64', borderColor: '#CBD5E1' }}
        >
          Развернуть все
        </Button>
        <Button
          size="small"
          variant="outlined"
          startIcon={<UnfoldLessIcon />}
          onClick={collapseAll}
          sx={{ textTransform: 'none', fontWeight: 600, color: '#64748B', borderColor: '#CBD5E1' }}
        >
          Свернуть
        </Button>
      </Box>

      {/* Templates List */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
            <CircularProgress size={36} />
          </Box>
        ) : filtered.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
            <Typography variant="body1" color="text.secondary">
              Шаблоны не найдены по заданным критериям фильтрации
            </Typography>
            {(selectedCluster !== 'all' || selectedJoint !== 'all' || search) && (
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  setSelectedCluster('all');
                  setSelectedJoint('all');
                  setSearch('');
                }}
                sx={{ mt: 1.5, textTransform: 'none' }}
              >
                Сбросить фильтры
              </Button>
            )}
          </Paper>
        ) : (
          filtered.map((t) => {
            const isExp = !!expanded[t.id];
            const cluster = MASTER_CLUSTERS.find(c => c.id === t.cluster_id);
            const clusterColor = cluster?.badge_color || '#0F3C64';
            return (
              <Accordion
                key={t.id}
                expanded={isExp}
                onChange={() => handleToggle(t.id)}
                sx={{
                  border: '1px solid #CBD5E1',
                  borderLeft: `5px solid ${clusterColor}`,
                  borderRadius: '10px !important',
                  overflow: 'hidden',
                  boxShadow: isExp ? '0 4px 12px rgba(15, 60, 100, 0.08)' : 'none',
                  '&:before': { display: 'none' }
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon sx={{ color: '#0F3C64' }} />}
                  sx={{
                    bgcolor: isExp ? '#F8FAFC' : '#FFFFFF',
                    px: 2.5,
                    py: 1,
                    borderBottom: isExp ? '1px solid #E2E8F0' : 'none'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, width: '100%', flexWrap: 'wrap' }}>
                    {cluster && (
                      <Chip
                        size="small"
                        label={cluster.code}
                        sx={{
                          bgcolor: clusterColor,
                          color: '#FFFFFF',
                          fontWeight: 800,
                          fontSize: '0.68rem',
                          height: 24,
                          borderRadius: '4px'
                        }}
                      />
                    )}
                    <Chip
                      size="small"
                      label={t.mkbCode || 'Без МКБ'}
                      sx={{
                        fontWeight: 800,
                        bgcolor: '#0F3C64',
                        color: '#FFFFFF',
                        fontSize: '0.8rem',
                        height: 24
                      }}
                    />
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F3C64', flexGrow: 1, minWidth: 220 }}>
                      {t.title}
                    </Typography>
                    {t.stage_or_severity && (
                      <Chip
                        size="small"
                        label={t.stage_or_severity}
                        variant="outlined"
                        sx={{ fontWeight: 600, color: '#0284C7', borderColor: '#BAE6FD', bgcolor: '#F0F9FF', fontSize: '0.72rem' }}
                      />
                    )}
                    <Chip
                      size="small"
                      label={t.category}
                      variant="outlined"
                      sx={{ fontWeight: 600, color: '#475569', borderColor: '#E2E8F0', bgcolor: '#F8FAFC', fontSize: '0.72rem' }}
                    />
                    <Chip
                      size="small"
                      label={SIDE_LABELS[t.side] || t.side}
                      sx={{ fontWeight: 600, color: '#475569', bgcolor: '#F1F5F9', fontSize: '0.72rem' }}
                    />
                    {(t.tests_count ?? t.tests.length) > 0 && (
                      <Chip
                        size="small"
                        icon={<HealingIcon sx={{ fontSize: '14px !important' }} />}
                        label={`${t.tests_count ?? t.tests.length} тестов`}
                        sx={{ fontWeight: 700, color: '#166534', bgcolor: '#DCFCE7', fontSize: '0.72rem' }}
                      />
                    )}
                    {(t.diagnostics_count ?? t.diagnostics.length) > 0 && (
                      <Chip
                        size="small"
                        icon={<BiotechIcon sx={{ fontSize: '14px !important' }} />}
                        label={`${t.diagnostics_count ?? t.diagnostics.length} исслед.`}
                        sx={{ fontWeight: 700, color: '#9333EA', bgcolor: '#F3E8FF', fontSize: '0.72rem' }}
                      />
                    )}
                  </Box>
                </AccordionSummary>
              <AccordionDetails sx={{ p: 2.5, bgcolor: '#FFFFFF' }}>
                <Grid container spacing={2.5}>
                  {/* Left Column: Clinical Text Presets */}
                  <Grid size={{ xs: 12, md: 7 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.8 }}>
                      <Box>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block' }}>
                          Стандартные жалобы пациента:
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#1E293B', mt: 0.5, lineHeight: 1.6, bgcolor: '#F8FAFC', p: 1.5, borderRadius: 1.5, border: '1px solid #E2E8F0' }}>
                          {t.complaints}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block' }}>
                          Локальный статус (Status Localis):
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#1E293B', mt: 0.5, lineHeight: 1.6, bgcolor: '#F8FAFC', p: 1.5, borderRadius: 1.5, border: '1px solid #E2E8F0' }}>
                          {t.objective}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block' }}>
                          Рекомендации, режим и план лечения:
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#1E293B', mt: 0.5, lineHeight: 1.6, bgcolor: '#F8FAFC', p: 1.5, borderRadius: 1.5, border: '1px solid #E2E8F0' }}>
                          {t.recommendations}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>

                  {/* Right Column: Tests, Diags, ROM */}
                  <Grid size={{ xs: 12, md: 5 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {/* ROM Norms */}
                      {t.rom && (
                        <Box sx={{ p: 1.5, border: '1px solid #E2E8F0', borderRadius: 2, bgcolor: '#F8FAFC' }}>
                          <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F3C64', textTransform: 'uppercase', display: 'block', mb: 1 }}>
                            📏 Физиологические нормы ROM (гониометрия):
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {Object.entries(t.rom).map(([k, v]) => (
                              <Chip
                                key={k}
                                size="small"
                                label={`${k}: ${v}°`}
                                sx={{ fontWeight: 700, bgcolor: '#FFFFFF', border: '1px solid #CBD5E1', color: '#0F3C64' }}
                              />
                            ))}
                          </Box>
                        </Box>
                      )}

                      {/* Profile Tests */}
                      <Box sx={{ p: 1.5, border: '1px solid #DCFCE7', borderRadius: 2, bgcolor: '#F0FDF4' }}>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: '#166534', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                          <HealingIcon fontSize="small" sx={{ color: '#166534' }} /> Обязательные тесты доказательной ортопедии:
                        </Typography>
                        {t.tests.length === 0 ? (
                          <Typography variant="caption" sx={{ color: '#64748B', fontStyle: 'italic' }}>
                            Базовый общеклинический осмотр
                          </Typography>
                        ) : (
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.6 }}>
                            {t.tests.map((tt) => (
                              <Box key={tt.code} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                                <Typography variant="caption" sx={{ fontWeight: 700, color: '#166534' }}>
                                  • {tt.name} (`{tt.code}`)
                                </Typography>
                                <Chip
                                  size="small"
                                  label={tt.expected === 'positive' ? 'Ожидается (+)' : tt.expected}
                                  sx={{ height: 20, fontSize: '0.72rem', fontWeight: 700, bgcolor: '#BBF7D0', color: '#14532D' }}
                                />
                              </Box>
                            ))}
                          </Box>
                        )}
                      </Box>

                      {/* Profile Diagnostics */}
                      <Box sx={{ p: 1.5, border: '1px solid #F3E8FF', borderRadius: 2, bgcolor: '#FAF5FF' }}>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: '#7E22CE', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                          <BiotechIcon fontSize="small" sx={{ color: '#7E22CE' }} /> План инструментального обследования:
                        </Typography>
                        {t.diagnostics.length === 0 ? (
                          <Typography variant="caption" sx={{ color: '#64748B', fontStyle: 'italic' }}>
                            По клиническим показаниям
                          </Typography>
                        ) : (
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.6 }}>
                            {t.diagnostics.map((dd) => (
                              <Box key={dd.code} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                                <Typography variant="caption" sx={{ fontWeight: 700, color: '#6B21A8' }}>
                                  • {dd.name}
                                </Typography>
                                <Chip
                                  size="small"
                                  label={dd.modality.toUpperCase()}
                                  sx={{ height: 20, fontSize: '0.72rem', fontWeight: 700, bgcolor: '#E9D5FF', color: '#581C87' }}
                                />
                              </Box>
                            ))}
                          </Box>
                        )}
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          );
        }))}
      </Box>
    </Box>
  );
}
