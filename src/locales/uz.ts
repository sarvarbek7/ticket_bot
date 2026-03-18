export const uz = {
  // General
  choose_language: "Choose language / Выберите язык / Tilni tanlang:",
  welcome: "Aviasales botiga xush kelibsiz!",
  not_logged_in: "Siz tizimga kirmagansiz. Kirish uchun /login dan foydalaning.",
  unauthorized: "Bu buyruqni ishlatish uchun ruxsatingiz yo'q.",
  cancelled: "Amal bekor qilindi.",
  invalid_input: "Noto'g'ri kiritish. Qaytadan urinib ko'ring.",
  no_items: "Elementlar topilmadi.",

  // Auth
  already_logged_in: "Siz allaqachon {login} sifatida kirgansiz.",
  login_prompt_login: "Loginni kiriting:",
  login_prompt_password: "Parolni kiriting:",
  login_success: "Kirish muvaffaqiyatli! Xush kelibsiz, {login} ({type}).",
  login_failed: "Noto'g'ri login yoki parol.",
  account_inactive: "Sizning hisobingiz faolsizlantirilgan. Admin bilan bog'laning.",
  logout_success: "Siz tizimdan muvaffaqiyatli chiqdingiz.",
  not_logged_in_logout: "Siz tizimga kirmagansiz.",

  // Branches
  add_branch_prompt_name: "Filial nomini kiriting:",
  add_branch_prompt_location: "Filial joylashuvini yuboring (Telegramning 'Joylashuv yuborish' funksiyasidan foydalaning):",
  add_branch_prompt_login: "Bu filial uchun login kiriting:",
  add_branch_prompt_password: "Bu filial uchun parol kiriting:",
  add_branch_login_exists: "'{login}' logini allaqachon band. Iltimos, boshqasini tanlang.",
  add_branch_success: "'{name}' filiali muvaffaqiyatli yaratildi (login: {login}).",

  update_branch_select: "Yangilash uchun filialni tanlang:",
  update_branch_no_branches: "Filiallar topilmadi.",
  update_branch_prompt_name: "Yangi filial nomini kiriting (joriy: {name}):",
  update_branch_prompt_location: "Yangi joylashuvni yuboring yoki joriy joylashuvni saqlash uchun 'skip' deb yozing:",
  update_branch_prompt_login: "Yangi loginni kiriting (joriy: {login}):",
  update_branch_prompt_password: "Yangi parolni kiriting:",
  update_branch_success: "'{name}' filiali muvaffaqiyatli yangilandi.",

  delete_branch_select: "Faolsizlantirish uchun filialni tanlang:",
  delete_branch_no_branches: "Faol filiallar topilmadi.",
  delete_branch_success: "'{name}' filiali faolsizlantirildi.",

  list_branches_empty: "Filiallar ro'yxatda yo'q.",
  list_branches_header: "Filiallar:\n",
  branch_row: "{status} {name} | login: {login} | 📍 {lat}, {lon}",
  branch_active: "🟢",
  branch_inactive: "🔴 [faolsiz]",

  // Managers
  add_manager_prompt_name: "Menejer ismini kiriting:",
  add_manager_select_branch: "Menejer uchun filialni tanlang:",
  add_manager_no_branches: "Mavjud filiallar yo'q. Avval filial qo'shing.",
  add_manager_success: "'{name}' menejeri '{branch}' filialiga qo'shildi.",

  update_manager_select: "Yangilash uchun menejerni tanlang:",
  update_manager_no_managers: "Menejerlar topilmadi.",
  update_manager_prompt_name: "Yangi ismni kiriting (joriy: {name}):",
  update_manager_select_branch: "Yangi filialni tanlang:",
  update_manager_success: "'{name}' menejeri muvaffaqiyatli yangilandi.",

  delete_manager_select: "Faolsizlantirish uchun menejerni tanlang:",
  delete_manager_success: "'{name}' menejeri faolsizlantirildi.",

  list_managers_empty: "Menejerlar ro'yxatda yo'q.",
  list_managers_header: "Menejerlar:\n",
  manager_row: "{status} {name} | Filial: {branch}",
  manager_active: "🟢",
  manager_inactive: "🔴 [faolsiz]",

  // Clients
  add_client_phone: "Mijoz telefon raqamini kiriting:",
  add_client_name: "Mijoz ismini kiriting:",
  add_client_direction: "Yo'nalishni kiriting (masalan: TAS-NAV):",
  add_client_select_manager: "Menejerni tanlang:",
  add_client_select_status: "Mijoz holatini tanlang:",
  add_client_no_managers: "Bu filialda faol menejerlar yo'q. Avval menejer qo'shing.",
  add_client_success:
    "N: #{id}\n" +
    "Ism: {name}\nTelefon: {phone}\nYo'nalish: {direction}\nMenejer: {manager}\nHolat: {status}",

  list_clients_empty: "Mijozlar topilmadi.",
  list_clients_header: "Mijozlar:\n",
  list_clients_select_branch: "Filialni tanlang:",
  list_clients_btn_all: "🌐 Barcha filiallar",
  client_row: "#{id} | {name} | {phone} | {direction} | {status} | {manager}",

  get_client_info_prompt: "Mijoz ID sini kiriting:",
  client_not_found: "#{id}-mijoz topilmadi.",
  client_info:
    "Mijoz #{id}\n" +
    "Ism: {name}\n" +
    "Telefon: {phone}\n" +
    "Yo'nalish: {direction}\n" +
    "Holat: {status}\n" +
    "Filial: {branch}\n" +
    "Menejer: {manager}",

  change_client_status_select: "Holat o'zgartirish uchun mijozni tanlang:",
  change_client_status_no_clients: "'in_progress' holatidagi mijozlar yo'q.",
  change_client_status_current:
    "Mijoz #{id} — joriy holat: {status}\n\nYangi holatni tanlang:",
  change_client_status_invalid: "Noto'g'ri holat. Ruxsat etilgan qiymatlar: sale, cancelled.",
  change_client_status_not_in_progress:
    "Holatni o'zgartirib bo'lmaydi. Mijoz 'in_progress' holatida bo'lishi kerak.",
  change_client_status_success: "Mijoz #{id} holati '{status}' ga o'zgartirildi.",
  change_client_status_wrong_branch: "#{id}-mijoz sizning filialingizga tegishli emas.",

  // Admins
  add_admin_prompt_login: "Yangi admin uchun login kiriting:",
  add_admin_prompt_password: "Yangi admin uchun parol kiriting:",
  add_admin_login_exists: "'{login}' logini allaqachon band. Iltimos, boshqasini tanlang.",
  add_admin_success: "'{login}' admin muvaffaqiyatli yaratildi.",

  update_admin_select: "Yangilash uchun adminni tanlang:",
  update_admin_no_admins: "Adminlar topilmadi.",
  update_admin_prompt_login: "Yangi loginni kiriting (joriy: {login}):",
  update_admin_prompt_password: "Yangi parolni kiriting:",
  update_admin_success: "'{login}' admin muvaffaqiyatli yangilandi.",

  delete_admin_select: "Faolsizlantirish uchun adminni tanlang:",
  delete_admin_no_admins: "Faolsizlantirish uchun boshqa faol adminlar yo'q.",
  delete_admin_success: "'{login}' admin faolsizlantirildi.",

  list_admins_empty: "Adminlar ro'yxatda yo'q.",
  list_admins_header: "Adminlar:\n",
  admin_row: "{status} {login}",
  admin_active: "🟢",
  admin_inactive: "🔴 [faolsiz]",

  // Statistics
  stats_select_start: "Boshlanish sanasini tanlang:",
  stats_select_end: "Tugash sanasini tanlang:",
  stats_select_branch: "Filialni tanlang:",
  stats_btn_all: "🌐 Barcha filiallar",
  stats_overall_header: "📊 Statistika",
  stats_result_label: "Natija:",
  stats_total: "Jami mijozlar: {total}",
  stats_in_progress_row: "🟡 Jarayonda: {count}",
  stats_sale_row: "🟢 Sotilgan: {count}",
  stats_cancelled_row: "🔴 Bekor qilingan: {count}",
  stats_managers_header: "👨‍💼 Menejerlar bo'yicha",
  stats_manager_row: "{branch} / {manager}:",
  stats_manager_sale: "  Sotilgan: {count}",
  stats_manager_in_progress: "  Jarayonda: {count}",
  stats_manager_cancelled: "  Bekor: {count}",
  stats_empty: "Mijozlar topilmadi.",

  // Import
  import_select_start: "Eksport uchun boshlanish sanasini tanlang:",
  import_select_end: "Eksport uchun tugash sanasini tanlang:",
  import_select_branch: "Eksport uchun filialni tanlang:",
  import_btn_all: "🌐 Barcha filiallar",
  import_empty: "Mijozlar topilmadi.",
  import_sending: "Excel fayli yaratilmoqda…",

  // Status labels (display)
  status_in_progress: "🟡 Jarayonda",
  status_sale: "🟢 Sotildi",
  status_cancelled: "🔴 Bekor qilindi",

  // Status buttons
  btn_in_progress: "🟡 Jarayonda",
  btn_sale: "✅ Sotildi",
  btn_cancelled: "❌ Bekor qilindi",

  // Menu keyboard buttons
  btn_menu_add_admin: "👤 Admin qo'shish",
  btn_menu_update_admin: "✏️ Adminni yangilash",
  btn_menu_delete_admin: "🗑 Adminni o'chirish",
  btn_menu_list_admins: "👥 Adminlar ro'yxati",
  btn_menu_add_branch: "🏢 Filial qo'shish",
  btn_menu_update_branch: "✏️ Filialni yangilash",
  btn_menu_delete_branch: "🗑 Filialni o'chirish",
  btn_menu_list_branches: "📋 Filiallar ro'yxati",
  btn_menu_add_manager: "➕ Menejer qo'shish",
  btn_menu_update_manager: "✏️ Menejerni yangilash",
  btn_menu_delete_manager: "➖ Menejerni o'chirish",
  btn_menu_list_managers: "👥 Menejerlar",
  btn_menu_add_client: "🎫 Mijoz qo'shish",
  btn_menu_list_clients: "📋 Mijozlar ro'yxati",
  btn_menu_get_client_info: "🔍 Mijoz ma'lumoti",
  btn_menu_change_client_status: "🔄 Holat o'zgartirish",
  btn_menu_statistics: "📊 Statistika",
  btn_menu_import: "📥 Excelga eksport",
  btn_menu_cancel: "🚫 Bekor qilish",
  btn_menu_logout: "🚪 Chiqish",
  btn_menu_start: "▶️ Boshlash",
  btn_menu_login: "🔑 Kirish",
  btn_menu_change_language: "🌐 Tilni o'zgartirish",
};
