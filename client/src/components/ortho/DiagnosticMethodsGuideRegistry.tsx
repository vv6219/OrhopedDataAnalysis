import React, { useState, useMemo } from 'react';
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
  AccordionDetails
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import BiotechIcon from '@mui/icons-material/Biotech';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import DescriptionIcon from '@mui/icons-material/Description';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import UnfoldLessIcon from '@mui/icons-material/UnfoldLess';

export interface DiagnosticMethodGuideDetail {
  code: string;
  name: string;
  modality: 'xray' | 'mri' | 'ultrasound' | 'enmg' | 'plantography' | 'ct' | 'lab';
  targetJoint: 'knee' | 'shoulder' | 'elbow' | 'hip' | 'ankle' | 'wrist' | 'spine' | 'general';
  priorityLevel: 'primary' | 'secondary';
  clinicalIndications: string;
  protocolPhrase: string;
  servdictId?: number | null;
  servdictName?: string | null;
  price?: number | null;
  clinicalSignificance: string;
}

export const DIAGNOSTIC_METHODS_REGISTRY: DiagnosticMethodGuideDetail[] = [
  // ========================== РЕНТГЕНОГРАФИЯ (X-RAY) ==========================
  {
    code: 'xray_knee_2v',
    name: 'Рентгенография коленного сустава под нагрузкой (2 проекции)',
    modality: 'xray',
    targetJoint: 'knee',
    priorityLevel: 'primary',
    clinicalIndications: 'Оценка ширины суставной щели (гонартроз Kellgren-Lawrence I–IV), краевых остеофитов, субхондрального склероза, осевых деформаций (genu varum/valgum).',
    protocolPhrase: 'Рентгенография коленного сустава в 2-х проекциях (прямая стоя под нагрузкой весом тела и боковая при сгибании 30°).',
    servdictId: 114,
    servdictName: 'Рентгенография сустава 2 проекции',
    price: 1800,
    clinicalSignificance: 'Базовый золотой стандарт первичного обследования. Выполнение снимка стоя под нагрузкой критично: в положении лежа истинное сужение суставной щели может маскироваться.'
  },
  {
    code: 'xray_pelvis_hip',
    name: 'Обзорная рентгенография таза и обоих тазобедренных суставов',
    modality: 'xray',
    targetJoint: 'hip',
    priorityLevel: 'primary',
    clinicalIndications: 'Диагностика коксартроза, асептического некроза головки бедренной кости (АНГБК), дисплазии вертлужной впадины, переломов шейки бедра.',
    protocolPhrase: 'Обзорная цифровая рентгенография костей таза и тазобедренных суставов в прямой переднезадней проекции с внутренней ротацией стоп 15°.',
    servdictId: 114,
    servdictName: 'Рентгенография тазобедренных суставов',
    price: 1800,
    clinicalSignificance: 'Снимок обязательно включает оба ТБС для сравнительной оценки шеечно-диафизарного угла, симметрии суставных щелей и исключения двустороннего процесса.'
  },
  {
    code: 'xray_foot_load',
    name: 'Рентгенография стоп с физиологической статической нагрузкой',
    modality: 'xray',
    targetJoint: 'ankle',
    priorityLevel: 'primary',
    clinicalIndications: 'Продольное и поперечное плоскостопие I–III ст., расчет угла и высоты продольного свода, вальгусная деформация I пальца (Hallux Valgus), пяточная шпора.',
    protocolPhrase: 'Рентгенография стоп в боковой проекции с полной статической нагрузкой весом тела и подометрическим расчетом угла свода.',
    servdictId: 114,
    servdictName: 'Рентгенография стопы с нагрузкой',
    price: 1800,
    clinicalSignificance: 'Фиксация угла свода стопы (норма 125–130°) и высоты свода (> 35 мм). Без нагрузки снимок не несет объективной диагностической ценности для ортезирования.'
  },
  {
    code: 'xray_shoulder_2v',
    name: 'Рентгенография плечевого сустава в 2 проекциях',
    modality: 'xray',
    targetJoint: 'shoulder',
    priorityLevel: 'secondary',
    clinicalIndications: 'Исключение костного шпора нижней поверхности акромиона (тип III по Bigliani), кальцифицирующего тендинита надостной мышцы, артроза АКС.',
    protocolPhrase: 'Рентгенография плечевого сустава в переднезадней и трансторакальной / Y-аксиальной проекциях.',
    servdictId: 114,
    servdictName: 'Рентгенография плечевого сустава 2 проекции',
    price: 1800,
    clinicalSignificance: 'Позволяет верифицировать форму акромиального отростка и выявить кальцификаты в сухожилиях ротаторной манжеты до назначения МРТ.'
  },
  {
    code: 'xray_elbow_2v',
    name: 'Рентгенография локтевого сустава (2 проекции)',
    modality: 'xray',
    targetJoint: 'elbow',
    priorityLevel: 'primary',
    clinicalIndications: 'Деформирующий остеоартроз, внутрисуставные свободные костно-хрящевые тела («суставная мышь»), остеофиты локтевого отростка, посттравматические оссификаты.',
    protocolPhrase: 'Рентгенография локтевого сустава в стандартных прямой и боковой проекциях при сгибании 90°.',
    servdictId: 114,
    servdictName: 'Рентгенография локтевого сустава 2 проекции',
    price: 1800,
    clinicalSignificance: 'Исключает костные причины блокикады сустава и хондроматоз перед проведением лечебно-медикаментозных блокад.'
  },
  {
    code: 'xray_wrist_2v',
    name: 'Рентгенография лучезапястного сустава и кисти (2 проекции)',
    modality: 'xray',
    targetJoint: 'wrist',
    priorityLevel: 'primary',
    clinicalIndications: 'Скрытые переломы ладьевидной кости, болезнь Кинбека (асептический некроз полулунной кости), остеоартроз I ПЗП (ризартроз), радиоульнарный конфликт.',
    protocolPhrase: 'Рентгенография лучезапястного сустава и костей запястья в ладонно-тыльной и строго боковой проекциях.',
    servdictId: 114,
    servdictName: 'Рентгенография лучезапястного сустава 2 проекции',
    price: 1800,
    clinicalSignificance: 'Оценивает правильность взаимоотношений дуг Карпала (Gilula arches) и суставной наклон лучевой кости.'
  },
  {
    code: 'xray_spine_flex',
    name: 'Функциональная рентгенография позвоночника (сгибание / разгибание)',
    modality: 'xray',
    targetJoint: 'spine',
    priorityLevel: 'secondary',
    clinicalIndications: 'Сегментарная нестабильность позвоночно-двигательного сегмента (ПДС), псевдоспондилолистез, динамическое смещение позвонков.',
    protocolPhrase: 'Рентгенография поясничного / шейного отдела позвоночника в боковой проекции с функциональными пробами при максимальном сгибании и разгибании.',
    servdictId: 114,
    servdictName: 'Рентгенография позвоночника функциональная',
    price: 1800,
    clinicalSignificance: 'Выявляет патологическую трансляцию позвонка > 3–4 мм или патологический угол наклона смежных замыкательных пластинок.'
  },
  {
    code: 'xray_spine_total',
    name: 'Панорамная цифровая спондилография позвоночника стоя (Full Spine)',
    modality: 'xray',
    targetJoint: 'spine',
    priorityLevel: 'primary',
    clinicalIndications: 'Идиопатический сколиоз, кифосколиоз, нарушение сагиттального и фронтального баланса, расчет угла Кобба для корсетирования Шено.',
    protocolPhrase: 'Панорамная цифровая спондилография всего позвоночника стоя на длинную кассету в 2-х проекциях с расчетом угла Кобба.',
    servdictId: 114,
    servdictName: 'Рентгенография позвоночника панорамная',
    price: 1800,
    clinicalSignificance: 'Обязательный стандарт мониторинга прогрессирования сколиоза у подростков и контроля эффективности корсетотерапии.'
  },

  // ========================== МРТ (МАГНИТНО-РЕЗОНАНСНАЯ ТОМОГРАФИЯ) ==========================
  {
    code: 'mri_knee_high',
    name: 'МРТ коленного сустава на высокопольном томографе (1.5–3.0 Тл)',
    modality: 'mri',
    targetJoint: 'knee',
    priorityLevel: 'primary',
    clinicalIndications: 'Разрывы менисков (классификация Stoller I–IV), разрыв ПКС/ЗКС, повреждение коллатеральных связок, хондромаляция хряща мыщелков, болезнь Кенига.',
    protocolPhrase: 'Магнитно-резонансная томография коленного сустава на высокопольном томографе (не менее 1.5 Тл) в режимах T1, T2-FS, PD-fat sat в трех плоскостях.',
    servdictId: null,
    price: null,
    clinicalSignificance: 'Золотой стандарт визуализации мягкотканных структур сустава. Разрешение 1.5 Тл позволяет верифицировать расслоение связок без инвазивной артроскопии.'
  },
  {
    code: 'mri_shoulder',
    name: 'МРТ плечевого сустава с оценкой ротаторной манжеты',
    modality: 'mri',
    targetJoint: 'shoulder',
    priorityLevel: 'primary',
    clinicalIndications: 'Полнослойные и частичные разрывы надостной/подостной мышц, субакромиальный импинджмент, отрыв суставной губы (Банкарт, SLAP), тендинит бицепса.',
    protocolPhrase: 'МРТ плечевого сустава в косой коронарной, сагиттальной и аксиальной плоскостях с жироподавлением (T2-FS, PD-SPAIR).',
    servdictId: null,
    price: null,
    clinicalSignificance: 'Критично для дифференциации консервативного тендинита от хирургического полнослойного отрыва сухожилия с ретракцией волокон.'
  },
  {
    code: 'mri_hip',
    name: 'МРТ тазобедренного сустава высокой четкости',
    modality: 'mri',
    targetJoint: 'hip',
    priorityLevel: 'primary',
    clinicalIndications: 'Ранняя стадия асептического некроза головки бедренной кости (до рентгенологических изменений), разрыв вертлужной губы при FAI, транзиторный остеопороз.',
    protocolPhrase: 'МРТ тазобедренного сустава в импульсных последовательностях T1-SE, T2-TIRM, PD с оценкой субхондральной зоны головки бедра и ацетабулярной губы.',
    servdictId: null,
    price: null,
    clinicalSignificance: 'Позволяет выявить отек костного мозга и ранний аваскулярный остеонекроз (I–II стадия по ARCO), когда рентгенография бессильна.'
  },
  {
    code: 'mri_lumbosacral',
    name: 'МРТ пояснично-крестцового отдела позвоночника (диски L1–S1)',
    modality: 'mri',
    targetJoint: 'spine',
    priorityLevel: 'primary',
    clinicalIndications: 'Грыжи и секвестры межпозвонковых дисков, компрессия спинномозговых корешков, стеноз позвоночного канала, спондилодисцит, фасеточный артроз.',
    protocolPhrase: 'МРТ пояснично-крестцового отдела позвоночника в сагиттальной и аксиальной проекциях (T1, T2, STIR) на уровне L1–S1.',
    servdictId: null,
    price: null,
    clinicalSignificance: 'Главное исследование при радикулопатии и положительном тесте Ласега для определения показаний к нуклеопластике или микродискэктомии.'
  },
  {
    code: 'mri_elbow',
    name: 'МРТ локтевого сустава (высокопольная)',
    modality: 'mri',
    targetJoint: 'elbow',
    priorityLevel: 'secondary',
    clinicalIndications: 'Хронический рефрактерный латеральный эпикондилит, отрыв дистального сухожилия двуглавой мышцы, разрыв латеральной коллатеральной связки (LUCL).',
    protocolPhrase: 'МРТ локтевого сустава в Т1, Т2 и PD-FS проекциях с детализацией общего сухожилия разгибателей и медиального связочного комплекса.',
    servdictId: null,
    price: null,
    clinicalSignificance: 'Назначается при неэффективности консервативной терапии эпикондилита свыше 6 месяцев для исключения глубокого частичного отрыва сухожилия ECRB.'
  },
  {
    code: 'mri_wrist',
    name: 'МРТ лучезапястного сустава с детализацией TFCC',
    modality: 'mri',
    targetJoint: 'wrist',
    priorityLevel: 'secondary',
    clinicalIndications: 'Разрывы триангулярного волокнисто-хрящевого комплекса (TFCC Palmer I/II), разрыв ладьевидно-полулунной связки, синдром сдавления нервов.',
    protocolPhrase: 'МРТ лучезапястного сустава в режимах тонких срезов (до 2 мм) с фокусом на треугольный фиброзно-хрящевой комплекс и межкостные связки.',
    servdictId: null,
    price: null,
    clinicalSignificance: 'Специфический метод при положительном «симптоме клавиши пианино» и болях в локтевом отделе запястья при вращательных движениях.'
  },

  // ========================== УЗИ (УЛЬТРАЗВУКОВАЯ ДИАГНОСТИКА) ==========================
  {
    code: 'us_knee',
    name: 'УЗИ коленного сустава с оценкой заворотов и кисты Бейкера',
    modality: 'ultrasound',
    targetJoint: 'knee',
    priorityLevel: 'primary',
    clinicalIndications: 'Синовит, объем свободной жидкости в супрапателлярном завороте, препателлярный бурсит, киста Бейкера в подколенной ямке, тендинит связки надколенника.',
    protocolPhrase: 'Ультразвуковое исследование коленного сустава, верхнего заворота, боковых связок и подколенной области.',
    servdictId: 1675,
    servdictName: 'УЗИ коленного сустава экспертное',
    price: 1500,
    clinicalSignificance: 'Быстрый, доступный кабинетный скрининг выпота прямо на первичном приеме. Незаменим для навигации при лечебной пункции сустава.'
  },
  {
    code: 'us_shoulder',
    name: 'УЗИ плечевого сустава с динамическими функциональными пробами',
    modality: 'ultrasound',
    targetJoint: 'shoulder',
    priorityLevel: 'primary',
    clinicalIndications: 'Субакромиальный бурсит, динамический импинджмент сухожилия надостной мышцы, теносиновит длинной головки бицепса, кальцификаты.',
    protocolPhrase: 'УЗИ плечевого сустава и ротаторной манжеты с проведением динамических функциональных проб в режиме реального времени.',
    servdictId: 1675,
    servdictName: 'УЗИ плечевого сустава с функциональными пробами',
    price: 1500,
    clinicalSignificance: 'В отличие от МРТ, УЗИ позволяет видеть ущемление сухожилия под акромионом в момент активного движения руки пациента.'
  },
  {
    code: 'us_achilles',
    name: 'УЗИ ахиллова сухожилия и плантарной фасции',
    modality: 'ultrasound',
    targetJoint: 'ankle',
    priorityLevel: 'primary',
    clinicalIndications: 'Ахиллобурсит, микроразрывы и тендинопатия ахиллова сухожилия, плантарный фасциит (измерение толщины апоневроза у пяточной кости > 4.0 мм).',
    protocolPhrase: 'Ультразвуковое исследование ахиллова сухожилия на всем протяжении, ретрокальканеарной сумки и плантарной фасции стопы.',
    servdictId: 1675,
    servdictName: 'УЗИ ахиллова сухожилия и фасции',
    price: 1500,
    clinicalSignificance: 'Критерий плантарного фасциита: утолщение фасции свыше 4 мм (в норме 2.5–3.5 мм) и снижение ее эхогенности у медиального бугра.'
  },
  {
    code: 'us_elbow_epicond',
    name: 'УЗИ сухожилий надмыщелков локтевого сустава (энтезопатия)',
    modality: 'ultrasound',
    targetJoint: 'elbow',
    priorityLevel: 'primary',
    clinicalIndications: 'Латеральный и медиальный эпикондилит, отек общего сухожилия разгибателей, микронадрывы, неоваскуляризация при допплерографии.',
    protocolPhrase: 'УЗИ мест прикрепления сухожилий к латеральному и медиальному надмыщелкам плечевой кости с цветовым допплеровским картированием (ЦДК).',
    servdictId: 1675,
    servdictName: 'УЗИ локтевого сустава и энтезисов',
    price: 1500,
    clinicalSignificance: 'Режим энергетического допплера подтверждает активный неоангиогенез при хронической энтезопатии и исключает бурсит локтевого отростка.'
  },
  {
    code: 'us_hip_trochanter',
    name: 'УЗИ области большого вертела и сухожилий ягодичных мышц',
    modality: 'ultrasound',
    targetJoint: 'hip',
    priorityLevel: 'primary',
    clinicalIndications: 'Вертельный болевой синдром (GTPS), трохантерит, бурсит подвертельной сумки, тендинопатия средней и малой ягодичных мышц.',
    protocolPhrase: 'УЗИ области большого вертела бедренной кости, вертельных сумок и сухожилий ягодичных мышц.',
    servdictId: 1675,
    servdictName: 'УЗИ тазобедренного сустава и вертела',
    price: 1500,
    clinicalSignificance: 'Дифференцирует внутрисуставной коксартроз от внесуставного трохантерита, исключая необоснованные операции.'
  },
  {
    code: 'us_wrist_carpal',
    name: 'УЗИ структур карпального канала и срединного нерва',
    modality: 'ultrasound',
    targetJoint: 'wrist',
    priorityLevel: 'primary',
    clinicalIndications: 'Синдром запястного канала, отек срединного нерва, измерение площади поперечного сечения (Cross-Sectional Area, CSA > 10 мм²).',
    protocolPhrase: 'Ультразвуковое исследование срединного нерва в карпальном канале с морфометрическим измерением площади поперечного сечения (CSA).',
    servdictId: 1675,
    servdictName: 'УЗИ нервов запястного канала',
    price: 1500,
    clinicalSignificance: 'При площади нерва на входе в канал более 10–12 мм² диагноз карпального туннельного синдрома подтверждается с точностью свыше 90%.'
  },

  // ========================== ЭНМГ (ЭЛЕКТРОНЕЙРОМИОГРАФИЯ) ==========================
  {
    code: 'enmg_carpal',
    name: 'Стимуляционная ЭНМГ срединного нерва кисти',
    modality: 'enmg',
    targetJoint: 'wrist',
    priorityLevel: 'primary',
    clinicalIndications: 'Объективное подтверждение синдрома карпального канала, оценка степени компрессии, скорости проведения импульса (СПИ) и аксонального повреждения.',
    protocolPhrase: 'Электронейромиография стимуляционная срединного нерва с оценкой дистальной моторной латентности (ДМЛ) и сенсорной скорости проведения.',
    servdictId: null,
    price: null,
    clinicalSignificance: 'Объективный нейрофизиологический стандарт. Дистальная моторная латентность > 4.2 мс подтверждает компрессионную нейропатию.'
  },
  {
    code: 'enmg_ulnar',
    name: 'Стимуляционная ЭНМГ локтевого нерва (кубитальный канал)',
    modality: 'enmg',
    targetJoint: 'elbow',
    priorityLevel: 'primary',
    clinicalIndications: 'Синдром кубитального канала, блок проведения по локтевому нерву на уровне локтевого сгиба, парестезии IV–V пальцев.',
    protocolPhrase: 'Стимуляционная электронейромиография локтевого нерва с локализацией блока проведения импульса в сегменте локтевого сустава.',
    servdictId: null,
    price: null,
    clinicalSignificance: 'Локализует точку компрессии: в борозде локтевого нерва или в связке Осборна, определяя объем хирургической декомпрессии.'
  },

  // ========================== ПЛАНТОГРАФИЯ И ПОДОМЕТРИЯ ==========================
  {
    code: 'plantography',
    name: 'Компьютерная оптическая плантография и подометрия',
    modality: 'plantography',
    targetJoint: 'ankle',
    priorityLevel: 'primary',
    clinicalIndications: 'Статическая и динамическая деформация стоп, продольное/поперечное плоскостопие, гиперпронация, расчет индивидуальных ортопедических стелек.',
    protocolPhrase: 'Компьютерная сканирующая плантография стоп под статической и динамической нагрузкой с расчетом индекса Чижина и Штритер.',
    servdictId: 99,
    servdictName: 'Компьютерная плантография стоп',
    price: 1200,
    clinicalSignificance: 'Основа для цифрового моделирования и фрезерования индивидуальных ортопедических стелек (ортезов стоп) по системе ФормТотикс.'
  },

  // ========================== КТ И ЛАБОРАТОРНЫЕ ИССЛЕДОВАНИЯ ==========================
  {
    code: 'ct_joint_3d',
    name: 'Компьютерная томография (КТ) сустава с 3D-реконструкцией',
    modality: 'ct',
    targetJoint: 'general',
    priorityLevel: 'secondary',
    clinicalIndications: 'Сложные внутрисуставные переломы, предоперационное планирование эндопротезирования, оценка дефектов костной ткани и деформаций.',
    protocolPhrase: 'Мультиспиральная компьютерная томография (КТ) сустава с шагом среза 0.5 мм и трехмерным 3D-моделированием архитектоники кости.',
    servdictId: null,
    price: null,
    clinicalSignificance: 'Наивысшая пространственная детализация кортикального слоя и костных балок при планировании реконструктивных остеотомий.'
  },
  {
    code: 'lab_rheumo_panel',
    name: 'Расширенная ревматологическая панель крови (маркеры воспаления)',
    modality: 'lab',
    targetJoint: 'general',
    priorityLevel: 'primary',
    clinicalIndications: 'Дифференциальная диагностика артроза с ревматоидным артритом, подагрой, реактивными артритами и спондилоартропатиями.',
    protocolPhrase: 'Лабораторный комплекс: С-реактивный белок (СРБ ультрачувствительный), Ревматоидный фактор (РФ), АЦЦП, Мочевая кислота, СОЭ, HLA-B27.',
    servdictId: 1600,
    servdictName: 'Лабораторный ревматологический скрининг',
    price: 2400,
    clinicalSignificance: 'Обязательно при утренней скованности свыше 30 минут, симметричном полиартрите или подагрических атаках.'
  },
  {
    code: 'lab_synovial',
    name: 'Микроскопическое и биохимическое исследование синовиальной жидкости',
    modality: 'lab',
    targetJoint: 'general',
    priorityLevel: 'primary',
    clinicalIndications: 'Острый выпот неясного генеза, подозрение на микрокристаллический артрит (подагра, пирофосфатная артропатия), инфекционный артрит.',
    protocolPhrase: 'Анализ синовиальной жидкости: подсчет цитоза и лейкоцитарной формулы, поляризационная микроскопия на кристаллы уратов/пирофосфатов, посев на микрофлору.',
    servdictId: 1600,
    servdictName: 'Исследование пунктата сустава',
    price: 2100,
    clinicalSignificance: 'Единственный прямой метод доказательства кристаллической подагры (игольчатые отрицательно двулучепреломляющие кристаллы) или септического процесса.'
  }
];

const MODALITY_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  all: { label: 'Все методы (26)', color: '#0F3C64', bg: '#E2E8F0' },
  xray: { label: 'Рентгенография (8)', color: '#0369A1', bg: '#E0F2FE' },
  mri: { label: 'МРТ (6)', color: '#6D28D9', bg: '#EDE9FE' },
  ultrasound: { label: 'УЗИ (6)', color: '#047857', bg: '#D1FAE5' },
  enmg: { label: 'ЭНМГ (2)', color: '#B45309', bg: '#FEF3C7' },
  plantography: { label: 'Плантография (1)', color: '#4338CA', bg: '#E0E7FF' },
  ct: { label: 'КТ (1)', color: '#C2410C', bg: '#FFEDD5' },
  lab: { label: 'Лаборатория (2)', color: '#BE123C', bg: '#FFE4E6' }
};

export const DiagnosticMethodsGuideRegistry: React.FC = () => {
  const [selectedModality, setSelectedModality] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedCodes, setExpandedCodes] = useState<Record<string, boolean>>({});

  const filteredMethods = useMemo(() => {
    return DIAGNOSTIC_METHODS_REGISTRY.filter((m) => {
      const matchMod = selectedModality === 'all' || m.modality === selectedModality;
      if (!matchMod) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        m.name.toLowerCase().includes(q) ||
        m.code.toLowerCase().includes(q) ||
        m.clinicalIndications.toLowerCase().includes(q) ||
        m.protocolPhrase.toLowerCase().includes(q) ||
        m.targetJoint.toLowerCase().includes(q) ||
        (m.servdictName && m.servdictName.toLowerCase().includes(q))
      );
    });
  }, [selectedModality, searchQuery]);

  const handleToggleExpand = (code: string) => {
    setExpandedCodes((prev) => ({ ...prev, [code]: !prev[code] }));
  };

  const handleExpandAll = () => {
    const map: Record<string, boolean> = {};
    filteredMethods.forEach((m) => {
      map[m.code] = true;
    });
    setExpandedCodes(map);
  };

  const handleCollapseAll = () => {
    setExpandedCodes({});
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      {/* Header Banner */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          bgcolor: '#0F3C64',
          color: '#FFFFFF',
          borderRadius: 2.5,
          border: '1px solid #1E293B',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2
        }}
      >
        <Box sx={{ maxWidth: 820 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <DescriptionIcon sx={{ color: '#38BDF8', fontSize: 24 }} />
            <Typography variant="overline" sx={{ color: '#BAE6FD', fontWeight: 800, letterSpacing: 1.2 }}>
              СТАНДАРТЫ ИНСТРУМЕНТАЛЬНОГО И АППАРАТНОГО ОБСЛЕДОВАНИЯ
            </Typography>
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#FFFFFF' }}>
            Каталог методов диагностики и инструментальных исследований
          </Typography>
          <Typography variant="body2" sx={{ color: '#E0F2FE', mt: 0.5, lineHeight: 1.5 }}>
            Клинические показания, эталонные формулировки протоколов для рентгенографии, МРТ, УЗИ с функциональными пробами, стимуляционной ЭНМГ, оптической подометрии и лабораторных панелей со сквозной привязкой к номенклатуре услуг клиники (servdict) и кассе.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            size="small"
            variant="outlined"
            onClick={handleExpandAll}
            startIcon={<UnfoldMoreIcon />}
            sx={{
              color: '#FFFFFF',
              borderColor: 'rgba(255,255,255,0.4)',
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.8rem',
              '&:hover': { borderColor: '#FFFFFF', bgcolor: 'rgba(255,255,255,0.08)' }
            }}
          >
            Развернуть все
          </Button>
          <Button
            size="small"
            variant="outlined"
            onClick={handleCollapseAll}
            startIcon={<UnfoldLessIcon />}
            sx={{
              color: '#CBD5E1',
              borderColor: 'rgba(255,255,255,0.2)',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.8rem',
              '&:hover': { borderColor: '#CBD5E1', bgcolor: 'rgba(255,255,255,0.05)' }
            }}
          >
            Свернуть
          </Button>
        </Box>
      </Paper>

      {/* Filter and Search Bar */}
      <Paper elevation={0} sx={{ p: 2, border: '1px solid #CBD5E1', borderRadius: 2, bgcolor: '#FFFFFF' }}>
        <Grid container spacing={2} sx={{ alignItems: 'center' }}>
          <Grid size={{ xs: 12, md: 5 }}>
            <TextField
              size="small"
              fullWidth
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по названию метода, МРТ, УЗИ, рентген, коду..."
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: '#64748B' }} />
                    </InputAdornment>
                  )
                }
              }}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 7 }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
              {Object.entries(MODALITY_LABELS).map(([key, data]) => {
                const isSelected = selectedModality === key;
                return (
                  <Chip
                    key={key}
                    label={data.label}
                    onClick={() => setSelectedModality(key)}
                    variant={isSelected ? 'filled' : 'outlined'}
                    sx={{
                      fontWeight: 700,
                      fontSize: '0.78rem',
                      bgcolor: isSelected ? data.color : 'transparent',
                      color: isSelected ? '#FFFFFF' : '#334155',
                      borderColor: data.color,
                      '&:hover': {
                        bgcolor: isSelected ? data.color : 'rgba(15, 60, 100, 0.06)'
                      }
                    }}
                  />
                );
              })}
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Count Info */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 0.5 }}>
        <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B' }}>
          Отображено методов: <strong>{filteredMethods.length}</strong> из {DIAGNOSTIC_METHODS_REGISTRY.length}
        </Typography>
        <Typography variant="caption" sx={{ color: '#0284C7', fontWeight: 600 }}>
          Все методы интегрированы в АРМ врача (DiagnosticRecommendationsCard) с 1-клик добавлением в чек
        </Typography>
      </Box>

      {/* Method Accordions */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {filteredMethods.map((method, index) => {
          const isExpanded = Boolean(expandedCodes[method.code]);
          const modCfg = MODALITY_LABELS[method.modality] || { label: method.modality, color: '#0F3C64', bg: '#F1F5F9' };

          return (
            <Accordion
              key={method.code}
              expanded={isExpanded}
              onChange={() => handleToggleExpand(method.code)}
              elevation={0}
              sx={{
                border: '1px solid #CBD5E1',
                borderRadius: '8px !important',
                '&:before': { display: 'none' },
                overflow: 'hidden',
                transition: 'border-color 0.2s',
                '&:hover': { borderColor: '#94A3B8' }
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  bgcolor: isExpanded ? '#F1F5F9' : '#FFFFFF',
                  px: 2,
                  py: 1,
                  borderBottom: isExpanded ? '1px solid #E2E8F0' : 'none'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', pr: 2, flexWrap: 'wrap', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Chip
                      label={`#${index + 1}`}
                      size="small"
                      sx={{ bgcolor: '#E2E8F0', color: '#0F3C64', fontWeight: 800, height: 22, fontSize: '0.72rem' }}
                    />
                    <Box>
                      <Typography sx={{ fontWeight: 800, color: '#0F3C64', fontSize: '0.96rem', lineHeight: 1.2 }}>
                        {method.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748B', fontFamily: 'monospace' }}>
                        код: {method.code} • сустав: {method.targetJoint}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Chip
                      label={modCfg.label.split(' ')[0]}
                      size="small"
                      sx={{ bgcolor: modCfg.bg, color: modCfg.color, fontWeight: 800, fontSize: '0.72rem' }}
                    />
                    <Chip
                      label={method.priorityLevel === 'primary' ? 'Первичное (Золотой стандарт)' : 'Вторичное (Уточняющее)'}
                      size="small"
                      sx={{
                        bgcolor: method.priorityLevel === 'primary' ? '#DCFCE7' : '#F1F5F9',
                        color: method.priorityLevel === 'primary' ? '#166534' : '#475569',
                        fontWeight: 700,
                        fontSize: '0.72rem'
                      }}
                    />
                    {method.price ? (
                      <Chip
                        icon={<PointOfSaleIcon sx={{ fontSize: '13px !important' }} />}
                        label={`${method.price.toLocaleString('ru-RU')} ₽`}
                        size="small"
                        sx={{ bgcolor: '#FEF3C7', color: '#92400E', fontWeight: 800, fontSize: '0.72rem' }}
                      />
                    ) : (
                      <Chip
                        label="Внешнее / Направление"
                        size="small"
                        sx={{ bgcolor: '#F1F5F9', color: '#64748B', fontSize: '0.7rem' }}
                      />
                    )}
                  </Box>
                </Box>
              </AccordionSummary>

              <AccordionDetails sx={{ p: 2.5, bgcolor: '#FAFAFA' }}>
                <Grid container spacing={2}>
                  {/* Indications */}
                  <Grid size={{ xs: 12 }}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 1.5,
                        bgcolor: '#FFFFFF',
                        border: '1px solid #BAE6FD',
                        borderLeft: '4px solid #0284C7',
                        borderRadius: 1.5
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <LocalHospitalIcon sx={{ color: '#0284C7', fontSize: 18 }} />
                        <Typography variant="caption" sx={{ fontWeight: 800, color: '#0369A1', textTransform: 'uppercase' }}>
                          Клинические показания к назначению
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ color: '#1E293B', pl: 3.2, fontSize: '0.88rem', lineHeight: 1.5 }}>
                        {method.clinicalIndications}
                      </Typography>
                    </Paper>
                  </Grid>

                  {/* Standard Protocol Phrasing */}
                  <Grid size={{ xs: 12, md: 7 }}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 1.5,
                        bgcolor: '#F0FDF4',
                        border: '1px solid #BBF7D0',
                        borderLeft: '4px solid #16A34A',
                        borderRadius: 1.5,
                        height: '100%'
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <CheckCircleIcon sx={{ color: '#16A34A', fontSize: 18 }} />
                        <Typography variant="caption" sx={{ fontWeight: 800, color: '#15803D', textTransform: 'uppercase' }}>
                          Эталонная формулировка направления для протокола осмотра
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ color: '#14532D', fontWeight: 600, pl: 3.2, fontSize: '0.86rem', lineHeight: 1.5 }}>
                        «{method.protocolPhrase}»
                      </Typography>
                    </Paper>
                  </Grid>

                  {/* Checkout & Servdict Integration */}
                  <Grid size={{ xs: 12, md: 5 }}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 1.5,
                        bgcolor: '#FFFBEB',
                        border: '1px solid #FDE68A',
                        borderLeft: '4px solid #D97706',
                        borderRadius: 1.5,
                        height: '100%'
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <PointOfSaleIcon sx={{ color: '#D97706', fontSize: 18 }} />
                        <Typography variant="caption" sx={{ fontWeight: 800, color: '#92400E', textTransform: 'uppercase' }}>
                          Связь с прайсом клиники (servdict)
                        </Typography>
                      </Box>
                      <Box sx={{ pl: 3.2 }}>
                        {method.servdictId ? (
                          <>
                            <Typography variant="body2" sx={{ color: '#78350F', fontWeight: 700, fontSize: '0.85rem' }}>
                              Услуга #{method.servdictId}: {method.servdictName}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#B45309', display: 'block', mt: 0.3 }}>
                              Стоимость в кассе: <strong>{method.price?.toLocaleString('ru-RU')} ₽</strong> • Автодобавление в счет
                            </Typography>
                          </>
                        ) : (
                          <Typography variant="body2" sx={{ color: '#92400E', fontSize: '0.85rem' }}>
                            Внешнее исследование (партнерский диагностический центр / направление по ОМС)
                          </Typography>
                        )}
                      </Box>
                    </Paper>
                  </Grid>

                  {/* Clinical Significance */}
                  <Grid size={{ xs: 12 }}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 1.5,
                        bgcolor: '#EEF2FF',
                        border: '1px solid #C7D2FE',
                        borderRadius: 1.5,
                        display: 'flex',
                        gap: 1.5
                      }}
                    >
                      <BiotechIcon sx={{ color: '#4F46E5', fontSize: 20, mt: 0.2 }} />
                      <Box>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: '#3730A3', textTransform: 'uppercase' }}>
                          Клиническая значимость и экспертные нюансы:
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#312E81', mt: 0.2, fontSize: '0.85rem', lineHeight: 1.5 }}>
                          {method.clinicalSignificance}
                        </Typography>
                      </Box>
                    </Paper>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          );
        })}
      </Box>
    </Box>
  );
};

export default DiagnosticMethodsGuideRegistry;
