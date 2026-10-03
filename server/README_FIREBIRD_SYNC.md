# Синхронизация базы пациентов с Firebird (MEDICAL.FDB)

Данный модуль обеспечивает полную синхронизацию структуры и данных пациентов из СУБД Firebird (`MEDICAL.FDB`) в локальную базу данных SQLite (`orthopedic_data_center.sqlite`).

---

## 🚀 Как запустить синхронизацию

### Вариант 1: Через npm
```bash
cd server
npm run sync:patients
```

### Вариант 2: Напрямую через Python
```bash
python server/sync_patients_firebird.py
```

### Вариант 3: С указанием произвольного пути к файлу БД и учетных данных
```bash
python server/sync_patients_firebird.py "C:\Users\vladimir\source\DB\Export\MEDICAL.FDB" SYSDBA masterkey
```

---

## 📊 Какие таблицы и данные синхронизируются

1. **`patients` (61 298 записей)**:
   * **Идентификация и ФИО:** `id`, `surname`, `name`, `patron`, `full_name`, `brief_name`
   * **Медицинская карта:** `mednum` (номер ЭМК), `rdate` (дата регистрации)
   * **Демография:** `bdate` (дата рождения), `age` (возраст), `sex` (1 - М, 2 - Ж), `sex_display` ('М'/'Ж'), `weight`, `height`
   * **Контакты:** `phone`, `phones`, `sphone` (форматированный), `email`
   * **Паспортные данные:** `pseries`, `pnumber`, `pdate`, `pauthor`, `parent` (законный представитель)
   * **Адресные реквизиты:** `address`, `subject`, `region`, `city`, `area`, `street`, `house`, `flat`
   * **Страхование ДМС:** `dms_flag` (0/1), `dms_policy` (номер полиса), `dms_insurer` (страховая компания)
   * **Маркетинг и каналы привлечения:** `ch_id`, `channel_name` (из таблицы `CHANNELS`)
   * **Агрегированная история:** `last_visit_date` (дата последнего приема), `total_visits` (всего визитов), `total_spent` (общая сумма по договорам)
   * **Обратная совместимость:** `firstName`, `lastName`, `contact`, `lastVisit`, `first_name`, `last_name`, `contact_phone`, `date_of_birth`

2. **`channels` (22 записи)**:
   * Справочник рекламных каналов привлечения пациентов (`ID`, `NAME`, `MODUSER`, `MODDATE`).

3. **`insurers` (19 записей)**:
   * Справочник страховых компаний ДМС (`ID`, `NAME`, `BRIEFLY`, `MODUSER`, `MODDATE`).

4. **`dms_cards` (97 записей)**:
   * Полисы и карты ДМС пациентов (`ID`, `PATIENT_ID`, `POLICY`, `INSURER_NAME`, `LIMIT_AMOUNT`, `REST_AMOUNT`, `BARCODE`).

5. **`patient_visits` (37 538 записей)**:
   * Полная история визитов и приемов в клинике (`ID`, `PATIENT_ID`, `DOCN`, `VISIT_DATE`, `VISIT_TIME_S`, `REMARK`).

---

## 🛠 Вспомогательные скрипты анализа
* `server/inspect_fb.py` — проверка структуры таблиц Firebird в реальном времени.
* `server/inspect_more.py` — детальная инспекция протоколов, услуг и страховых карт.
* `server/test_patient_import.py` — скоростной тест выборки и агрегации данных.
