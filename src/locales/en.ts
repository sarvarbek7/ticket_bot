export const en = {
  // General
  choose_language: "Choose language / Выберите язык / Tilni tanlang:",
  welcome: "Welcome to Aviasales Ticket Bot!",
  not_logged_in: "You are not logged in.",
  unauthorized: "You do not have permission to use this command.",
  cancelled: "Operation cancelled.",
  invalid_input: "Invalid input. Please try again.",
  no_items: "No items found.",

  // Auth
  already_logged_in: "You are already logged in as {login}.",
  login_prompt_login: "Enter your login:",
  login_prompt_password: "Enter your password:",
  login_success: "Login successful! Welcome, {login} ({type}).",
  login_failed: "Invalid login or password.",
  account_inactive: "Your account has been deactivated. Please contact the admin.",
  logout_success: "You have been logged out successfully.",

  // Branches
  add_branch_prompt_name: "Enter branch name:",
  add_branch_prompt_location: "Send the branch location (use Telegram's 'Send Location' feature):",
  add_branch_prompt_login: "Enter login for this branch:",
  add_branch_prompt_password: "Enter password for this branch:",
  add_branch_login_exists: "Login '{login}' is already taken. Please choose another.",
  add_branch_success: "Branch '{name}' created successfully (login: {login}).",

  update_branch_select: "Select a branch to update:",
  update_branch_no_branches: "No branches found.",
  update_branch_prompt_name: "Enter new branch name (current: {name}):",
  update_branch_prompt_location: "Send new location or type 'skip' to keep current:",
  update_branch_prompt_login: "Enter new login (current: {login}):",
  update_branch_prompt_password: "Enter new password (or type 'skip' to keep current):",
  update_branch_success: "Branch '{name}' updated successfully.",

  delete_branch_select: "Select a branch to deactivate:",
  delete_branch_no_branches: "No active branches found.",
  delete_branch_success: "Branch '{name}' has been deactivated.",

  list_branches_empty: "No branches registered.",
  list_branches_header: "Branches:\n",
  branch_row: "{status} {name} | login: {login} | 📍 {lat}, {lon}",
  branch_active: "🟢",
  branch_inactive: "🔴 [inactive]",

  // Managers
  add_manager_prompt_name: "Enter manager name:",
  add_manager_select_branch: "Select a branch for this manager:",
  add_manager_no_branches: "No branches available. Please add a branch first.",
  add_manager_success: "Manager '{name}' added to branch '{branch}'.",

  update_manager_select: "Select a manager to update:",
  update_manager_no_managers: "No managers found.",
  update_manager_prompt_name: "Enter new name (current: {name}):",
  update_manager_select_branch: "Select new branch:",
  update_manager_success: "Manager '{name}' updated successfully.",

  delete_manager_select: "Select a manager to deactivate:",
  delete_manager_success: "Manager '{name}' has been deactivated.",

  list_managers_empty: "No managers registered.",
  list_managers_header: "Managers:\n",
  manager_row: "{status} {name} | Branch: {branch}",
  manager_active: "🟢",
  manager_inactive: "🔴 [inactive]",

  // Clients
  add_client_phone: "Enter client phone number:",
  add_client_name: "Enter client name:",
  add_client_direction: "Enter direction (e.g. TAS-NAV):",
  add_client_select_manager: "Select a manager:",
  add_client_select_status: "Select client status:",
  add_client_no_managers: "No active managers in this branch. Please add a manager first.",
  add_client_alert_success: "✅ Client added successfully!",
  add_client_success:
    "Id: #{id}\n" +
    "Name: {name}\nPhone: {phone}\nDirection: {direction}\nManager: {manager}\nStatus: {status}",

  list_clients_empty: "No clients found.",
  list_clients_header: "Clients:\n",
  list_clients_select_branch: "Select a branch:",
  list_clients_btn_all: "🌐 All branches",
  list_clients_select_manager: "Select a manager:",
  list_clients_btn_all_managers: "👥 All managers",
  list_clients_select_status: "Select a status:",
  list_clients_btn_all_statuses: "🌐 All statuses",
  client_row: "#{id} | {name} | {phone} | {direction} | {status} | {manager}",

  get_client_info_prompt: "Enter client ID:",
  client_not_found: "Client #{id} not found.",
  client_info:
    "Client #{id}\n" +
    "Name: {name}\n" +
    "Phone: {phone}\n" +
    "Direction: {direction}\n" +
    "Status: {status}\n" +
    "Branch: {branch}\n" +
    "Manager: {manager}",

  change_client_status_select: "Select a client to change status:",
  change_client_status_no_clients: "No clients found in this branch.",
  change_client_status_current:
    "Client #{id} — current status: {status}\n\nSelect new status:",
  change_client_status_invalid: "Invalid status. Allowed values: sale, cancelled.",
  change_client_status_not_in_progress:
    "Cannot change status. Client must be in 'in_progress' state.",
  change_client_status_success: "Client #{id} status updated to '{status}'.",
  change_client_status_wrong_branch: "Client #{id} does not belong to your branch.",

  // Admins
  add_admin_prompt_login: "Enter login for the new admin:",
  add_admin_prompt_password: "Enter password for the new admin:",
  add_admin_login_exists: "Login '{login}' is already taken. Please choose another.",
  add_admin_success: "Admin '{login}' created successfully.",

  toggle_active_prompt: "Change status? Current: {status}",
  toggle_active_activate: "✅ Activate",
  toggle_active_deactivate: "🚫 Deactivate",
  toggle_active_skip: "⏭ Skip",
  update_admin_select: "Select an admin to update:",
  update_admin_no_admins: "No admins found.",
  update_admin_prompt_login: "Enter new login (current: {login}):",
  update_admin_prompt_password: "Enter new password (or type 'skip' to keep current):",
  update_admin_success: "Admin '{login}' updated successfully.",

  delete_admin_select: "Select an admin to deactivate:",
  delete_admin_no_admins: "No other active admins to deactivate.",
  delete_admin_success: "Admin '{login}' has been deactivated.",

  list_admins_empty: "No admins registered.",
  list_admins_header: "Admins:\n",
  admin_row: "{status} {login}",
  admin_active: "🟢",
  admin_inactive: "🔴 [inactive]",

  // Statistics
  stats_select_start: "Select start date:",
  stats_select_end: "Select end date:",
  stats_select_branch: "Select a branch:",
  stats_btn_all: "🌐 All branches",
  stats_overall_header: "📊 Statistics",
  stats_result_label: "Result:",
  stats_total: "Total clients: {total}",
  stats_in_progress_row: "🟡 In progress: {count}",
  stats_sale_row: "🟢 Sold: {count}",
  stats_cancelled_row: "🔴 Cancelled: {count}",
  stats_managers_header: "👨‍💼 By manager",
  stats_manager_row: "{branch} / {manager}:",
  stats_manager_sale: "  Sold: {count}",
  stats_manager_in_progress: "  In progress: {count}",
  stats_manager_cancelled: "  Cancelled: {count}",
  stats_empty: "No clients found.",

  // Import
  import_select_start: "Select start date for export:",
  import_select_end: "Select end date for export:",
  import_select_branch: "Select a branch for export:",
  import_btn_all: "🌐 All branches",
  import_empty: "No clients found.",
  import_sending: "Generating Excel file…",

  // Status labels (display)
  status_in_progress: "🟡 In Progress",
  status_sale: "🟢 Sold",
  status_cancelled: "🔴 Cancelled",

  btn_back: "⬅️ Back",

  // Status buttons
  btn_in_progress: "🟡 In Progress",
  btn_sale: "✅ Sale",
  btn_cancelled: "❌ Cancelled",

  // Menu keyboard buttons
  btn_menu_add_admin: "👤 Add Admin",
  btn_menu_update_admin: "✏️ Update Admin",
  btn_menu_delete_admin: "🗑 Delete Admin",
  btn_menu_list_admins: "👥 List Admins",
  btn_menu_add_branch: "🏢 Add Branch",
  btn_menu_update_branch: "✏️ Update Branch",
  btn_menu_delete_branch: "🗑 Delete Branch",
  btn_menu_list_branches: "📋 List Branches",
  btn_menu_add_manager: "➕ Add Manager",
  btn_menu_update_manager: "✏️ Update Manager",
  btn_menu_delete_manager: "➖ Delete Manager",
  btn_menu_list_managers: "👥 List Managers",
  btn_menu_add_client: "🎫 Add Client",
  btn_menu_list_clients: "📋 List Clients",
  btn_menu_get_client_info: "🔍 Client Info",
  btn_menu_change_client_status: "🔄 Change Status",
  btn_menu_statistics: "📊 Statistics",
  btn_menu_import: "📥 Export Excel",
  btn_menu_admin_management: "👤 Admin Management",
  btn_menu_branch_management: "🏢 Branch Management",
  btn_menu_manager_management: "👥 Manager Management",
  btn_menu_back: "⬅️ Back",
  btn_menu_cancel: "🚫 Cancel",
  btn_menu_logout: "🚪 Logout",
  btn_menu_start: "▶️ Start",
  btn_menu_login: "🔑 Login",
  btn_menu_change_language: "🌐 Change Language",
};
