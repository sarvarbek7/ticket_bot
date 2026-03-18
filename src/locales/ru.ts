export const ru = {
  // General
  choose_language: "Choose language / Выберите язык / Tilni tanlang:",
  welcome: "Добро пожаловать в бот Aviasales!",
  not_logged_in: "Вы не вошли в систему.",
  unauthorized: "У вас нет прав для использования этой команды.",
  cancelled: "Операция отменена.",
  invalid_input: "Некорректный ввод. Попробуйте ещё раз.",
  no_items: "Элементы не найдены.",

  // Auth
  already_logged_in: "Вы уже вошли как {login}.",
  login_prompt_login: "Введите логин:",
  login_prompt_password: "Введите пароль:",
  login_success: "Вход выполнен! Добро пожаловать, {login} ({type}).",
  login_failed: "Неверный логин или пароль.",
  account_inactive: "Ваш аккаунт деактивирован. Обратитесь к администратору.",
  logout_success: "Вы успешно вышли из системы.",

  // Branches
  add_branch_prompt_name: "Введите название филиала:",
  add_branch_prompt_location: "Отправьте местоположение филиала (используйте функцию 'Отправить местоположение' в Telegram):",
  add_branch_prompt_login: "Введите логин для этого филиала:",
  add_branch_prompt_password: "Введите пароль для этого филиала:",
  add_branch_login_exists: "Логин '{login}' уже занят. Пожалуйста, выберите другой.",
  add_branch_success: "Филиал '{name}' успешно создан (логин: {login}).",

  update_branch_select: "Выберите филиал для обновления:",
  update_branch_no_branches: "Филиалы не найдены.",
  update_branch_prompt_name: "Введите новое название филиала (текущее: {name}):",
  update_branch_prompt_location: "Отправьте новое местоположение или напишите 'skip' для сохранения текущего:",
  update_branch_prompt_login: "Введите новый логин (текущий: {login}):",
  update_branch_prompt_password: "Введите новый пароль (или напишите 'skip' чтобы оставить текущий):",
  update_branch_success: "Филиал '{name}' успешно обновлён.",

  delete_branch_select: "Выберите филиал для деактивации:",
  delete_branch_no_branches: "Активные филиалы не найдены.",
  delete_branch_success: "Филиал '{name}' деактивирован.",

  list_branches_empty: "Филиалы не зарегистрированы.",
  list_branches_header: "Филиалы:\n",
  branch_row: "{status} {name} | логин: {login} | 📍 {lat}, {lon}",
  branch_active: "🟢",
  branch_inactive: "🔴 [неактивен]",

  // Managers
  add_manager_prompt_name: "Введите имя менеджера:",
  add_manager_select_branch: "Выберите филиал для менеджера:",
  add_manager_no_branches: "Нет доступных филиалов. Сначала добавьте филиал.",
  add_manager_success: "Менеджер '{name}' добавлен в филиал '{branch}'.",

  update_manager_select: "Выберите менеджера для обновления:",
  update_manager_no_managers: "Менеджеры не найдены.",
  update_manager_prompt_name: "Введите новое имя (текущее: {name}):",
  update_manager_select_branch: "Выберите новый филиал:",
  update_manager_success: "Менеджер '{name}' успешно обновлён.",

  delete_manager_select: "Выберите менеджера для деактивации:",
  delete_manager_success: "Менеджер '{name}' деактивирован.",

  list_managers_empty: "Менеджеры не зарегистрированы.",
  list_managers_header: "Менеджеры:\n",
  manager_row: "{status} {name} | Филиал: {branch}",
  manager_active: "🟢",
  manager_inactive: "🔴 [неактивен]",

  // Clients
  add_client_phone: "Введите номер телефона клиента:",
  add_client_name: "Введите имя клиента:",
  add_client_direction: "Введите направление (например: TAS-NAV):",
  add_client_select_manager: "Выберите менеджера:",
  add_client_select_status: "Выберите статус клиента:",
  add_client_no_managers: "Нет активных менеджеров в этом филиале. Сначала добавьте менеджера.",
  add_client_alert_success: "✅ Клиент успешно добавлен!",
  add_client_success:
    "N: #{id}\n" +
    "Имя: {name}\nТелефон: {phone}\nНаправление: {direction}\nМенеджер: {manager}\nСтатус: {status}",

  list_clients_empty: "Клиенты не найдены.",
  list_clients_header: "Клиенты:\n",
  list_clients_select_branch: "Выберите филиал:",
  list_clients_btn_all: "🌐 Все филиалы",
  list_clients_select_manager: "Выберите менеджера:",
  list_clients_btn_all_managers: "👥 Все менеджеры",
  list_clients_select_status: "Выберите статус:",
  list_clients_btn_all_statuses: "🌐 Все статусы",
  client_row: "#{id} | {name} | {phone} | {direction} | {status} | {manager}",

  get_client_info_prompt: "Введите ID клиента:",
  client_not_found: "Клиент #{id} не найден.",
  client_info:
    "Клиент #{id}\n" +
    "Имя: {name}\n" +
    "Телефон: {phone}\n" +
    "Направление: {direction}\n" +
    "Статус: {status}\n" +
    "Филиал: {branch}\n" +
    "Менеджер: {manager}",

  change_client_status_select: "Выберите клиента для изменения статуса:",
  change_client_status_no_clients: "В этом филиале нет клиентов.",
  change_client_status_current:
    "Клиент #{id} — текущий статус: {status}\n\nВыберите новый статус:",
  change_client_status_invalid: "Некорректный статус. Допустимые значения: sale, cancelled.",
  change_client_status_not_in_progress:
    "Невозможно изменить статус. Клиент должен быть в статусе 'in_progress'.",
  change_client_status_success: "Статус клиента #{id} изменён на '{status}'.",
  change_client_status_wrong_branch: "Клиент #{id} не принадлежит вашему филиалу.",

  // Admins
  add_admin_prompt_login: "Введите логин для нового администратора:",
  add_admin_prompt_password: "Введите пароль для нового администратора:",
  add_admin_login_exists: "Логин '{login}' уже занят. Пожалуйста, выберите другой.",
  add_admin_success: "Администратор '{login}' успешно создан.",

  toggle_active_prompt: "Изменить статус? Текущий: {status}",
  toggle_active_activate: "✅ Активировать",
  toggle_active_deactivate: "🚫 Деактивировать",
  toggle_active_skip: "⏭ Пропустить",
  update_admin_select: "Выберите администратора для обновления:",
  update_admin_no_admins: "Администраторы не найдены.",
  update_admin_prompt_login: "Введите новый логин (текущий: {login}):",
  update_admin_prompt_password: "Введите новый пароль (или напишите 'skip' чтобы оставить текущий):",
  update_admin_success: "Администратор '{login}' успешно обновлён.",

  delete_admin_select: "Выберите администратора для деактивации:",
  delete_admin_no_admins: "Нет других активных администраторов для деактивации.",
  delete_admin_success: "Администратор '{login}' деактивирован.",

  list_admins_empty: "Администраторы не зарегистрированы.",
  list_admins_header: "Администраторы:\n",
  admin_row: "{status} {login}",
  admin_active: "🟢",
  admin_inactive: "🔴 [неактивен]",

  // Statistics
  stats_select_start: "Выберите начальную дату:",
  stats_select_end: "Выберите конечную дату:",
  stats_select_branch: "Выберите филиал:",
  stats_btn_all: "🌐 Все филиалы",
  stats_overall_header: "📊 Статистика",
  stats_result_label: "Результат:",
  stats_total: "Всего клиентов: {total}",
  stats_in_progress_row: "🟡 В процессе: {count}",
  stats_sale_row: "🟢 Продано: {count}",
  stats_cancelled_row: "🔴 Отменено: {count}",
  stats_managers_header: "👨‍💼 По менеджерам",
  stats_manager_row: "{branch} / {manager}:",
  stats_manager_sale: "  Продано: {count}",
  stats_manager_in_progress: "  В процессе: {count}",
  stats_manager_cancelled: "  Отменено: {count}",
  stats_empty: "Клиенты не найдены.",

  // Import
  import_select_start: "Выберите начальную дату для экспорта:",
  import_select_end: "Выберите конечную дату для экспорта:",
  import_select_branch: "Выберите филиал для экспорта:",
  import_btn_all: "🌐 Все филиалы",
  import_select_manager: "Выберите менеджера для экспорта:",
  import_btn_all_managers: "👥 Все менеджеры",
  import_select_date_mode: "Выберите диапазон экспорта:",
  import_btn_all_data: "📋 Все данные",
  import_btn_by_date: "📅 Фильтр по дате",
  btn_menu_import_clients: "📥 Экспорт в Excel",
  import_empty: "Клиенты не найдены.",
  import_sending: "Генерация Excel-файла…",

  // Status labels (display)
  status_in_progress: "🟡 В процессе",
  status_sale: "🟢 Продано",
  status_cancelled: "🔴 Отменено",

  btn_back: "⬅️ Назад",

  // Status buttons
  btn_in_progress: "🟡 В процессе",
  btn_sale: "✅ Продан",
  btn_cancelled: "❌ Отменён",

  // Menu keyboard buttons
  btn_menu_add_admin: "👤 Добавить админа",
  btn_menu_update_admin: "✏️ Обновить админа",
  btn_menu_delete_admin: "🗑 Удалить админа",
  btn_menu_list_admins: "👥 Список админов",
  btn_menu_add_branch: "🏢 Добавить филиал",
  btn_menu_update_branch: "✏️ Обновить филиал",
  btn_menu_delete_branch: "🗑 Удалить филиал",
  btn_menu_list_branches: "📋 Список филиалов",
  btn_menu_add_manager: "➕ Добавить менеджера",
  btn_menu_update_manager: "✏️ Обновить менеджера",
  btn_menu_delete_manager: "➖ Удалить менеджера",
  btn_menu_list_managers: "👥 Менеджеры",
  btn_menu_add_client: "🎫 Добавить клиента",
  btn_menu_list_clients: "📋 Список клиентов",
  btn_menu_get_client_info: "🔍 Инфо о клиенте",
  btn_menu_change_client_status: "🔄 Изменить статус",
  btn_menu_statistics: "📊 Статистика",
  btn_menu_import: "📥 Экспорт в Excel",
  btn_menu_admin_management: "👤 Управление админами",
  btn_menu_branch_management: "🏢 Управление филиалами",
  btn_menu_manager_management: "👥 Управление менеджерами",
  btn_menu_back: "⬅️ Назад",
  btn_menu_cancel: "🚫 Отмена",
  btn_menu_logout: "🚪 Выйти",
  btn_menu_start: "▶️ Старт",
  btn_menu_login: "🔑 Войти",
  btn_menu_change_language: "🌐 Сменить язык",
};
