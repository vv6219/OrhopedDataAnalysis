/**
 * menuIntegrityValidator.js
 * Обязательная серверная валидация целостности конфигурации меню и прав доступа (menuPermissionsConfig.json)
 */

const SUPPORTED_ICONS = new Set([
  'Dashboard', 'LocalHospital', 'Event', 'Assessment', 'People', 'Badge',
  'Inventory', 'Settings', 'AutoAwesomeMotion', 'FolderSpecial', 'AdminPanelSettings',
  'SyncAlt', 'Storage', 'Code', 'BarChart', 'AccountBalanceWallet', 'SmartToy',
  'AddCircle', 'DeleteForever', 'PlayCircleFilledWhite', 'MenuBook', 'QueryStats',
  'PointOfSale', 'ReceiptLong', 'Tune', 'Dns', 'Science', 'Usb', 'CreditCard',
  'MedicalServices', 'Description', 'Assignment', 'CalendarMonth', 'SettingsApplications',
  'Security', 'Group', 'Lock', 'ViewList', 'TableChart', 'FilterList'
]);

// Критические экраны и элементы, обязательные для стабильности МИС
const CRITICAL_PATHS = {
  '/': 'Главный BI Дашборд',
  '/admin/users': 'Управление пользователями',
  '/admin/menu-permissions': 'Редактор меню и прав доступа'
};

const CRITICAL_SCREEN_ELEMENTS = {
  top_status_bar: ['kkt_shift_clickable', 'atol_chip_clickable', 'alfa_pos_clickable']
};

/**
 * Валидирует целостность объекта конфигурации menuPermissionsConfig
 * @param {object} config - Объект конфигурации для сохранения
 * @returns {{ isValid: boolean, errors: string[], warnings: string[] }}
 */
function validateMenuIntegrity(config) {
  const errors = [];
  const warnings = [];

  // 1. Проверка корневой структуры
  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    return {
      isValid: false,
      errors: ['Конфигурация должна быть валидным JSON-объектом на верхнем уровне'],
      warnings: []
    };
  }

  if (!config.version || typeof config.version !== 'string') {
    errors.push('Поле "version" обязательно и должно быть строкой (например, "2.0.0")');
  }

  // 2. Валидация справочника ролей rolesAndPermissions
  if (!Array.isArray(config.rolesAndPermissions) || config.rolesAndPermissions.length === 0) {
    errors.push('Справочник "rolesAndPermissions" должен содержать непустой массив ролей');
  }

  const roleCodes = new Set();
  if (Array.isArray(config.rolesAndPermissions)) {
    config.rolesAndPermissions.forEach((role, idx) => {
      if (!role.code || typeof role.code !== 'string') {
        errors.push(`Роль #${idx + 1}: отсутствует обязательный строковый код "code"`);
      } else {
        const cleanCode = role.code.trim();
        if (roleCodes.has(cleanCode)) {
          errors.push(`Дублирование кода роли в rolesAndPermissions: "${cleanCode}"`);
        }
        roleCodes.add(cleanCode);
      }
      if (!role.name || typeof role.name !== 'string') {
        errors.push(`Роль #${idx + 1} (${role.code || 'без кода'}): отсутствует обязательное наименование "name"`);
      }
    });
  }

  // Защита от потери роли sysadmin
  if (!roleCodes.has('sysadmin')) {
    errors.push('Критическая ошибка безопасности: системная роль "sysadmin" не может быть удалена из rolesAndPermissions');
  }

  // 3. Валидация групп меню (menuGroups)
  if (!Array.isArray(config.menuGroups) || config.menuGroups.length === 0) {
    errors.push('Конфигурация должна содержать хотя бы одну группу меню в "menuGroups"');
  }

  const groupIds = new Set();
  const itemIds = new Set();
  const itemPaths = new Map(); // path -> item title

  if (Array.isArray(config.menuGroups)) {
    config.menuGroups.forEach((group, gIdx) => {
      const gPrefix = `Группа #${gIdx + 1} (${group.title || group.id || 'без названия'})`;

      if (!group.id || typeof group.id !== 'string') {
        errors.push(`${gPrefix}: отсутствует обязательный идентификатор "id"`);
      } else {
        if (groupIds.has(group.id)) {
          errors.push(`Дублирование идентификатора группы меню: "${group.id}"`);
        }
        groupIds.add(group.id);
      }

      if (!group.title || typeof group.title !== 'string') {
        errors.push(`${gPrefix}: отсутствует обязательный заголовок "title"`);
      }

      // Проверка иконки группы
      if (group.icon && !SUPPORTED_ICONS.has(group.icon)) {
        warnings.push(`${gPrefix}: иконка "${group.icon}" не найдена в каталоге MUI, будет использована иконка по умолчанию`);
      }

      // Проверка прав группы
      if (group.permissions) {
        if (!Array.isArray(group.permissions)) {
          errors.push(`${gPrefix}: поле "permissions" должно быть массивом строк`);
        } else {
          group.permissions.forEach((perm) => {
            if (perm !== '*' && !roleCodes.has(perm)) {
              errors.push(`${gPrefix}: неизвестная роль "${perm}" в permissions группы (отсутствует в rolesAndPermissions)`);
            }
          });
        }
      }

      // Проверка пунктов меню внутри группы
      if (!Array.isArray(group.items)) {
        errors.push(`${gPrefix}: поле "items" должно быть массивом пунктов меню`);
      } else if (group.items.length === 0) {
        warnings.push(`${gPrefix}: группа не содержит ни одного пункта меню`);
      } else {
        group.items.forEach((item, iIdx) => {
          const iPrefix = `${gPrefix} -> Пункт #${iIdx + 1} (${item.text || item.id || 'без названия'})`;

          if (!item.id || typeof item.id !== 'string') {
            errors.push(`${iPrefix}: отсутствует обязательный идентификатор "id"`);
          } else {
            if (itemIds.has(item.id)) {
              errors.push(`Дублирование идентификатора пункта меню: "${item.id}"`);
            }
            itemIds.add(item.id);
          }

          if (!item.text || typeof item.text !== 'string') {
            errors.push(`${iPrefix}: отсутствует отображаемый текст "text"`);
          }

          if (!item.path || typeof item.path !== 'string') {
            errors.push(`${iPrefix}: отсутствует маршрут "path"`);
          } else {
            const cleanPath = item.path.trim();
            if (!item.isExternal && !cleanPath.startsWith('/')) {
              errors.push(`${iPrefix}: внутренний маршрут "${cleanPath}" должен начинаться со слеша "/"`);
            }
            if (item.isExternal && !cleanPath.startsWith('http://') && !cleanPath.startsWith('https://') && !cleanPath.startsWith('/')) {
              errors.push(`${iPrefix}: внешняя ссылка "${cleanPath}" должна начинаться с "http://" или "https://"`);
            }

            // Проверка дублирования путей внутренних маршрутов без query
            const basePath = cleanPath.split('?')[0];
            if (!item.isExternal) {
              if (itemPaths.has(basePath)) {
                errors.push(`Дублирование маршрута "${basePath}": используется в пунктах "${itemPaths.get(basePath)}" и "${item.text}"`);
              } else {
                itemPaths.set(basePath, item.text);
              }
            }
          }

          // Проверка иконки пункта
          if (item.icon && !SUPPORTED_ICONS.has(item.icon)) {
            warnings.push(`${iPrefix}: иконка "${item.icon}" не найдена в каталоге MUI`);
          }

          // Проверка прав пункта
          if (!Array.isArray(item.permissions) || item.permissions.length === 0) {
            errors.push(`${iPrefix}: массив прав "permissions" обязателен и не может быть пустым (используйте ["*"] для общего доступа)`);
          } else {
            item.permissions.forEach((perm) => {
              if (perm !== '*' && !roleCodes.has(perm)) {
                errors.push(`${iPrefix}: неизвестная роль "${perm}" в permissions (отсутствует в rolesAndPermissions)`);
              }
            });
          }

          // Защита от блокировки критических путей
          if (item.path === '/admin/users' || item.path === '/admin/menu-permissions') {
            if (!item.permissions.includes('sysadmin') && !item.permissions.includes('*')) {
              errors.push(`Критическая ошибка безопасности: системный раздел "${item.text}" (${item.path}) обязан содержать разрешение для роли "sysadmin"`);
            }
          }
        });
      }
    });
  }

  // 4. Проверка доступности главного экрана (Home Dashboard)
  const homeItem = Array.isArray(config.menuGroups)
    ? config.menuGroups.flatMap(g => g.items || []).find(i => i.path === '/')
    : null;

  if (!homeItem) {
    warnings.push('В меню не найден базовый маршрут "/" (BI Дашборд)');
  } else if (!homeItem.permissions.includes('*') && !roleCodes.has('default')) {
    warnings.push('Главный экран "/" не имеет разрешения ["*"], что может ограничить вход базовым пользователям');
  }

  // 5. Валидация экранных элементов (screenElements)
  if (!config.screenElements || typeof config.screenElements !== 'object' || Array.isArray(config.screenElements)) {
    errors.push('Блок "screenElements" обязателен и должен быть объектом');
  } else {
    // Проверка критических элементов
    for (const [screenKey, requiredKeys] of Object.entries(CRITICAL_SCREEN_ELEMENTS)) {
      const screenObj = config.screenElements[screenKey];
      if (!screenObj || typeof screenObj !== 'object') {
        errors.push(`В screenElements отсутствует обязательный экран "${screenKey}"`);
      } else {
        requiredKeys.forEach((reqKey) => {
          if (!screenObj[reqKey]) {
            warnings.push(`В screenElements.${screenKey} отсутствует рекомендуемый ключ "${reqKey}"`);
          }
        });
      }
    }

    // Проверка ссылочной целостности ролей в screenElements
    for (const [screenKey, elements] of Object.entries(config.screenElements)) {
      if (typeof elements === 'object' && elements !== null) {
        for (const [elementKey, perms] of Object.entries(elements)) {
          if (!Array.isArray(perms)) {
            errors.push(`screenElements.${screenKey}.${elementKey}: значение прав должно быть массивом строк`);
          } else {
            perms.forEach((perm) => {
              if (perm !== '*' && !roleCodes.has(perm)) {
                errors.push(`screenElements.${screenKey}.${elementKey}: неизвестная роль "${perm}" (отсутствует в rolesAndPermissions)`);
              }
            });
          }
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    summary: {
      totalRoles: roleCodes.size,
      totalGroups: groupIds.size,
      totalItems: itemIds.size,
      totalScreenElements: Object.keys(config.screenElements || {}).reduce(
        (acc, k) => acc + Object.keys(config.screenElements[k] || {}).length,
        0
      )
    }
  };
}

module.exports = {
  validateMenuIntegrity,
  SUPPORTED_ICONS,
  CRITICAL_PATHS,
  CRITICAL_SCREEN_ELEMENTS
};
