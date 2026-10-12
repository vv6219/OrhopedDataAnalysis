import React from 'react';
import { API_BASE_URL } from './apiConfig';
import DashboardIcon from '@mui/icons-material/Dashboard';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import EventIcon from '@mui/icons-material/Event';
import AssessmentIcon from '@mui/icons-material/Assessment';
import PeopleIcon from '@mui/icons-material/People';
import BadgeIcon from '@mui/icons-material/Badge';
import InventoryIcon from '@mui/icons-material/Inventory';
import SettingsIcon from '@mui/icons-material/Settings';
import AutoAwesomeMotionIcon from '@mui/icons-material/AutoAwesomeMotion';
import FolderSpecialIcon from '@mui/icons-material/FolderSpecial';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import SyncAltIcon from '@mui/icons-material/SyncAlt';
import StorageIcon from '@mui/icons-material/Storage';
import CodeIcon from '@mui/icons-material/Code';
import BarChartIcon from '@mui/icons-material/BarChart';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import PlayCircleFilledWhiteIcon from '@mui/icons-material/PlayCircleFilledWhite';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import QueryStatsIcon from '@mui/icons-material/QueryStats';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import TuneIcon from '@mui/icons-material/Tune';
import DnsIcon from '@mui/icons-material/Dns';
import ScienceIcon from '@mui/icons-material/Science';
import UsbIcon from '@mui/icons-material/Usb';

export interface NavItem {
  text: string;
  path: string;
  icon: React.ReactElement;
  tooltip: string;
  isExternal?: boolean;
  defaultOpen?: boolean;
  children?: NavItem[];
}

export interface NavGroup {
  id: string;
  title: string;
  icon: React.ReactElement;
  defaultOpen: boolean;
  tooltip?: string;
  items: NavItem[];
}

export const navigationGroups: NavGroup[] = [
  {
    id: 'operations_and_wizards',
    title: 'Сервисы',
    icon: <AutoAwesomeMotionIcon sx={{ fontSize: 20 }} />,
    defaultOpen: true,
    tooltip: 'Операционные процессы: оформление визитов, расписание врачей, кассовые смены, выплаты зарплат и отчетность',
    items: [
      {
        text: 'Оформление визита (Wizard)',
        path: '/checkout',
        icon: <LocalHospitalIcon sx={{ fontSize: 20 }} />,
        tooltip: 'Пошаговый мастер оформления визита: выбор пациента и доктора, добавление медицинских услуг, расчет себестоимости и скидок, печать фискального чека ККТ'
      },
      {
        text: 'Расписание и прием',
        path: '/scheduling',
        icon: <EventIcon sx={{ fontSize: 20 }} />,
        tooltip: 'Календарь приемов и расписание врачей: планирование слотов по кабинетам, отслеживание визитов, регистрация явки и перенос записей'
      },
      {
        text: 'Выплаты сотрудникам',
        path: '/staff-payouts',
        icon: <AccountBalanceWalletIcon sx={{ fontSize: 20 }} />,
        tooltip: 'Расчет и ведомости выплат: автоматический расчет заработной платы врачей и ассистентов на основе выполненных услуг, ставок и нормативов'
      },
      {
        text: 'Журнал и Аналитика смен',
        path: '/admin/fiscal-shifts',
        icon: <PointOfSaleIcon sx={{ fontSize: 20, color: '#0F3C64' }} />,
        tooltip: 'Кассовые смены ККТ АТОЛ 91Ф: открытие и закрытие смен с Z-отчетом, автоматическая мнемоническая нумерация, сверка кассы и X-отчеты'
      },
      {
        text: 'Журнал аудита ККТ',
        path: '/fiscal-audit',
        icon: <ReceiptLongIcon sx={{ fontSize: 20 }} />,
        tooltip: 'Журнал аудита фискальных операций 54-ФЗ: поминутный журнал взаимодействия с ККТ через Serilog, фискальные признаки (ФД/ФП) и статусы чеков'
      },
      {
        text: 'Отчетность и документы',
        path: '/reports',
        icon: <AssessmentIcon sx={{ fontSize: 20 }} />,
        tooltip: 'Генератор документов и отчетов: формирование сводных справок, протоколов лечения, реестров услуг и экспорт документов в PDF и Excel'
      },
      {
        text: 'Инструкция пользователя',
        path: '/user-guide',
        icon: <MenuBookIcon sx={{ fontSize: 20, color: '#0F3C64' }} />,
        tooltip: 'Интерактивное руководство пользователя: описание функционала МИС, справочников, архитектуры данных и пошаговых регламентов расчетов'
      }
    ]
  },
  {
    id: 'base_entities',
    title: 'Базовые данные',
    icon: <FolderSpecialIcon sx={{ fontSize: 20 }} />,
    defaultOpen: true,
    tooltip: 'Нормативно-справочная информация (НСИ): картотека пациентов, врачи, каталог услуг, склад медикаментов и параметры',
    items: [
      {
        text: 'Пациенты (ЭМК картотека)',
        path: '/patients',
        icon: <PeopleIcon sx={{ fontSize: 20 }} />,
        tooltip: 'Электронная медицинская карта (ЭМК): реестр пациентов клиники, паспортные данные, контакты, история визитов и прикрепленные файлы'
      },
      {
        text: 'Сотрудники и врачи',
        path: '/staff',
        icon: <BadgeIcon sx={{ fontSize: 20 }} />,
        tooltip: 'Кадровый реестр персонала: врачи, ассистенты, специализации, процентные ставки оплат и индивидуальные параметры доступа'
      },
      {
        text: 'Каталог сервисов',
        path: '/operations',
        icon: <LocalHospitalIcon sx={{ fontSize: 20 }} />,
        tooltip: 'Справочник медицинских услуг: прейскурант клиники, технологические карты BOM, расходные материалы, себестоимость и длительность'
      },
      {
        text: 'Склад материалов и медикаментов',
        path: '/inventory',
        icon: <InventoryIcon sx={{ fontSize: 20 }} />,
        tooltip: 'Учет складских остатков: мониторинг остатков медикаментов, лимиты запасов и автоматическое списание по технологическим картам визитов'
      },
      {
        text: 'Параметры клиники',
        path: '/parameters',
        icon: <SettingsIcon sx={{ fontSize: 20 }} />,
        tooltip: 'Системные настройки клиники: реквизиты организации, коэффициенты наценок, нормы времени и глобальные системные коэффициенты'
      },
      {
        text: 'Параметры ККТ АТОЛ 91Ф',
        path: '/admin/fiscal-settings',
        icon: <TuneIcon sx={{ fontSize: 20 }} />,
        tooltip: 'Конфигурация фискального регистратора: управление профилями подключения, COM-портом, скоростью обмена и параметрами в базе SQLite'
      }
    ]
  },
  {
    id: 'bi',
    title: 'Аналитика',
    icon: <BarChartIcon sx={{ fontSize: 20 }} />,
    defaultOpen: true,
    tooltip: 'Управленческая и финансовая аналитика: BI дашборды, маржинальный анализ услуг, доходы и расходы клиники',
    items: [
      {
        text: 'BI Дашборд',
        path: '/',
        icon: <DashboardIcon sx={{ fontSize: 20 }} />,
        tooltip: 'Главный экран аналитики: оперативные KPI клиники, динамика выручки, загрузка кабинетов и агрегированные финансовые метрики'
      },
      {
        text: 'Анализ сервисов',
        path: '/analytics/operations',
        icon: <AssessmentIcon sx={{ fontSize: 20 }} />,
        tooltip: 'Финансовый анализ услуг: маржинальность, себестоимость технологических карт, объемы оказания и доходность медицинских направлений'
      },
      {
        text: 'BI Сервисы и Выплаты',
        path: '/analytics/services-bi',
        icon: <QueryStatsIcon sx={{ fontSize: 20 }} />,
        tooltip: 'Многомерный BI-анализ: корреляция выручки от оказанных услуг и расходов на выплаты врачам, маржинальная прибыль клиники'
      }
    ]
  },
  {
    id: 'administrator',
    title: 'Администратор',
    icon: <AdminPanelSettingsIcon sx={{ fontSize: 20 }} />,
    defaultOpen: true,
    tooltip: 'Системное администрирование: здоровье служб сервера, синхронизация с Firebird, SQLite Studio и профили ККТ',
    items: [
      {
        text: 'Службы бэкенда (Health)',
        path: '/admin/server-health',
        icon: <DnsIcon sx={{ fontSize: 20, color: '#0284C7' }} />,
        tooltip: 'Мониторинг и диагностика серверов: проверка доступности Express API, базы SQLite, демона ККТ, сервера Firebird и REST-документации'
      },
      {
        text: 'FireBird Sync',
        path: '/admin/firebird-sync',
        icon: <SyncAltIcon sx={{ fontSize: 20 }} />,
        tooltip: 'Мастер синхронизации баз данных: перенос и сопоставление пациентов и услуг из внешней базы Firebird (MEDICAL.FDB) в локальную SQLite'
      },
      {
        text: 'SQLite Studio (БД)',
        path: '/sqlite-studio',
        icon: <StorageIcon sx={{ fontSize: 20 }} />,
        tooltip: 'Интегрированный менеджер SQLite: просмотр таблиц, схемы данных, индексов и интерактивная SQL-консоль для выполнения запросов'
      },
      {
        text: 'OpenAPI (Swagger)',
        path: `${API_BASE_URL}/api-docs`,
        icon: <CodeIcon sx={{ fontSize: 20 }} />,
        tooltip: 'Интерактивная REST API документация: онлайн-тестирование эндпоинтов бэкенда и схемы JSON в интерфейсе Swagger UI (в новой вкладке)',
        isExternal: true
      }
    ]
  },
  {
    id: 'tests',
    title: 'ТЕСТЫ',
    icon: <ScienceIcon sx={{ fontSize: 20, color: '#D97706' }} />,
    defaultOpen: false,
    tooltip: 'Изолированный тестовый контур: сквозные тесты бэкенда, демо-данные [TEST_DAEMON] и сценарии верификации ККТ',
    items: [
      {
        text: 'Тест служб сервера',
        path: '/admin/server-health?action=run-tests',
        icon: <PlayCircleFilledWhiteIcon sx={{ fontSize: 20, color: '#0284C7' }} />,
        tooltip: 'Запустить сквозной тест серверов: автоматическая проверка готовности служб Express, SQLite, Fiscal Daemon и Firebird'
      },
      {
        text: 'Демо-данные [TEST_DAEMON]',
        path: '/admin/daemon-data',
        icon: <SmartToyIcon sx={{ fontSize: 20 }} />,
        tooltip: 'Панель управления демо-данными: создание, просмотр, очистка и тестирование изолированного контура [TEST_DAEMON]'
      },
      {
        text: 'Заполнить демо-данные',
        path: '/admin/daemon-data?action=seed',
        icon: <AddCircleIcon sx={{ fontSize: 20, color: '#16A34A' }} />,
        tooltip: 'Заполнить тестовые данные: пакетная генерация 3 периодов визитов, записей PRP-терапии и сторнированных операций'
      },
      {
        text: 'Удалить демо-данные',
        path: '/admin/daemon-data?action=purge',
        icon: <DeleteForeverIcon sx={{ fontSize: 20, color: '#DC2626' }} />,
        tooltip: 'Очистить тестовые данные: безопасное удаление всех записей с маркером [TEST_DAEMON] без затрагивания реальной истории'
      },
      {
        text: 'Мастер тестов ККТ [TEST_DAEMON]',
        path: '/admin/fiscal-test-wizard',
        icon: <PointOfSaleIcon sx={{ fontSize: 20 }} />,
        tooltip: 'Мастер тестирования фискализации: интерактивная симуляция пробития чеков, возвратов и верификация протокола ККТ'
      },
      {
        text: 'Тест связи с ККТ «АТОЛ 91Ф»',
        path: '/admin/fiscal-test-wizard?action=test-connection',
        icon: <UsbIcon sx={{ fontSize: 20, color: '#D97706' }} />,
        tooltip: 'Проверка связи с ККТ «АТОЛ 91Ф»: пинг COM-порта, опрос статуса смены, номера ФН и готовности печатающего механизма'
      },
      {
        text: 'Заполнить тестовые чеки',
        path: '/admin/fiscal-test-wizard?action=seed',
        icon: <AddCircleIcon sx={{ fontSize: 20, color: '#16A34A' }} />,
        tooltip: 'Сгенерировать тестовые чеки: добавление пакета чеков с различными способами оплат для тестирования очереди фискализации'
      },
      {
        text: 'Удалить тестовые чеки',
        path: '/admin/fiscal-test-wizard?action=purge',
        icon: <DeleteForeverIcon sx={{ fontSize: 20, color: '#DC2626' }} />,
        tooltip: 'Удалить тестовые чеки: мгновенная очистка всех сгенерированных фискальных чеков с системным маркером [TEST_DAEMON]'
      },
      {
        text: 'Запуск тестов ККТ (7 сценариев)',
        path: '/admin/fiscal-test-wizard?action=run-test',
        icon: <PlayCircleFilledWhiteIcon sx={{ fontSize: 20, color: '#2563EB' }} />,
        tooltip: 'Запуск 7 сценариев верификации ККТ: пинг оборудования, открытие смены, приход, возврат, безналичный расчет, X-отчет и закрытие смены с Z-отчетом'
      }
    ]
  }
];

export interface RouteMeta {
  title: string;
  groupTitle: string;
  groupId: string;
  parentPath: string;
}

export const routeMetaMap: Record<string, RouteMeta> = {
  '/': {
    title: 'BI Дашборд',
    groupTitle: 'Аналитика',
    groupId: 'bi',
    parentPath: '/'
  },
  '/analytics/operations': {
    title: 'Анализ сервисов',
    groupTitle: 'Аналитика',
    groupId: 'bi',
    parentPath: '/'
  },
  '/analytics/services-bi': {
    title: 'BI Сервисы и Выплаты',
    groupTitle: 'Аналитика',
    groupId: 'bi',
    parentPath: '/'
  },
  '/checkout': {
    title: 'Оформление визита (Wizard)',
    groupTitle: 'Сервисы',
    groupId: 'operations_and_wizards',
    parentPath: '/'
  },
  '/scheduling': {
    title: 'Расписание и прием',
    groupTitle: 'Сервисы',
    groupId: 'operations_and_wizards',
    parentPath: '/'
  },
  '/reports': {
    title: 'Отчетность и документы',
    groupTitle: 'Сервисы',
    groupId: 'operations_and_wizards',
    parentPath: '/'
  },
  '/staff-payouts': {
    title: 'Выплаты сотрудникам',
    groupTitle: 'Сервисы',
    groupId: 'operations_and_wizards',
    parentPath: '/'
  },
  '/user-guide': {
    title: 'Инструкция пользователя МИС',
    groupTitle: 'Сервисы',
    groupId: 'operations_and_wizards',
    parentPath: '/'
  },
  '/patients': {
    title: 'Пациенты (ЭМК картотека)',
    groupTitle: 'Базовые данные',
    groupId: 'base_entities',
    parentPath: '/'
  },
  '/staff': {
    title: 'Сотрудники и врачи',
    groupTitle: 'Базовые данные',
    groupId: 'base_entities',
    parentPath: '/'
  },
  '/operations': {
    title: 'Каталог сервисов',
    groupTitle: 'Базовые данные',
    groupId: 'base_entities',
    parentPath: '/'
  },
  '/inventory': {
    title: 'Склад материалов и медикаментов',
    groupTitle: 'Базовые данные',
    groupId: 'base_entities',
    parentPath: '/'
  },
  '/parameters': {
    title: 'Параметры клиники',
    groupTitle: 'Базовые данные',
    groupId: 'base_entities',
    parentPath: '/'
  },
  '/admin/fiscal-settings': {
    title: 'Параметры ККТ АТОЛ 91Ф',
    groupTitle: 'Базовые данные',
    groupId: 'base_entities',
    parentPath: '/'
  },
  '/fiscal-settings': {
    title: 'Параметры ККТ АТОЛ 91Ф',
    groupTitle: 'Базовые данные',
    groupId: 'base_entities',
    parentPath: '/'
  },
  '/admin/server-health': {
    title: 'Статус и мониторинг сервисов бэкенда',
    groupTitle: 'Администратор',
    groupId: 'administrator',
    parentPath: '/'
  },
  '/admin/firebird-sync': {
    title: 'FireBird Sync (Мастер синхронизации)',
    groupTitle: 'Администратор',
    groupId: 'administrator',
    parentPath: '/'
  },
  '/sqlite-studio': {
    title: 'SQLite Studio (БД)',
    groupTitle: 'Администратор',
    groupId: 'administrator',
    parentPath: '/'
  },
  '/db-studio': {
    title: 'SQLite Studio (БД)',
    groupTitle: 'Администратор',
    groupId: 'administrator',
    parentPath: '/'
  },
  '/admin/daemon-data': {
    title: 'Управление демо-данными [TEST_DAEMON]',
    groupTitle: 'ТЕСТЫ',
    groupId: 'tests',
    parentPath: '/'
  },
  '/fiscal-audit': {
    title: 'Журнал аудита ККТ',
    groupTitle: 'Сервисы',
    groupId: 'operations_and_wizards',
    parentPath: '/'
  },
  '/admin/fiscal-test-wizard': {
    title: 'Мастер тестов ККТ [TEST_DAEMON]',
    groupTitle: 'ТЕСТЫ',
    groupId: 'tests',
    parentPath: '/'
  },
  '/admin/tests': {
    title: 'Тесты и демо-данные [TEST_DAEMON]',
    groupTitle: 'ТЕСТЫ',
    groupId: 'tests',
    parentPath: '/'
  },
  '/admin/fiscal-shifts': {
    title: 'Журнал и Аналитика смен',
    groupTitle: 'Сервисы',
    groupId: 'operations_and_wizards',
    parentPath: '/'
  },
  '/fiscal-shifts': {
    title: 'Журнал и Аналитика смен',
    groupTitle: 'Сервисы',
    groupId: 'operations_and_wizards',
    parentPath: '/'
  }
};
