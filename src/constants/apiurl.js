export const API_CONSTANTS = {
    LOGIN: "users/sign_in",
    REGISTER: "users",
    LOGOUT: "users/sign_out",
    FORGOT_PASSWORD: "users/password",
    RESET_PASSWORD: "users/password",

    // Registration OTP
    SEND_REGISTRATION_OTP: "api/v1/user_dashboard/send_registration_otp",
    VERIFY_REGISTRATION_OTP: "api/v1/user_dashboard/verify_registration_otp",
    RESEND_REGISTRATION_OTP: "api/v1/user_dashboard/resend_registration_otp",

    // Admin use
    COMMON_CATEGORIES_URL: "api/v1/categories",
    COMMON_SUB_CATEGORIES_URL: "api/v1/sub_categories",
    COMMON_PRODUCTS_URL: "api/v1/products",
    COMMON_INVENTORY_URL: "api/v1/inventories",
    COMMON_ORDER_URL: "api/v1/orders",
    COMMON_REPORT_URL: "api/v1/reports",
    COMMON_CUSTOMERS_URL: "api/v1/users",
    COMMON_ADRESESS_URL: "api/v1/addresses",
    COMMON_ADMIN_DASHBOARD_URL: "api/v1/dashboard",
    COMMON_BLOGS_URL: "api/v1/blogs",
    COMMON_PRODUCT_REVIEW_URL: "api/v1/product_reviews",
    COMMON_SUBSCIBER_URL: "api/v1/subscribers",
    COMMON_CUSTOMER_ENQUIRY_URL: "api/v1/contact_details",
    COMMON_NOTIFICATIONS_URL: "api/v1/notifications",
    COMMON_HOME_SECTIONS_URL: "api/v1/home_sections",
    COMMON_MASTERS_URL: "api/v1/masters",
    COMMON_SETTINGS_URL: "api/v1/settings",
    COMMON_WAREHOUSES_URL: "api/v1/warehouses",

    // General use
    BLOGS_URL: "api/v1/user_dashboard/latest_blogs",
    SNACK_RANGE_URL: "api/v1/user_dashboard/snacks_category",
    SPECIALITY_CATEGORY_URL: "api/v1/user_dashboard/speciality_category",
    GIFTING_CATEGORY_URL: "api/v1/user_dashboard/gifting_category",
    ALL_CATEGORY_URL: "api/v1/user_dashboard/all_categories",
    ALL_PRODUCTS_URL: "api/v1/user_dashboard/all_active_products",
    ALL_PRODUCT_URL: "api/v1/products/active_product",
    MENU_LIST_URL: "api/v1/user_dashboard/nav_menu_list",
    GET_PRODUCT_BY_SUBCATEGORY_ID_URL: "api/v1/user_dashboard/get_products_by_subcategory",
    ALL_SUB_CATEGORY_URL: "api/v1/user_dashboard/all_sub_categories",
    PRODUCT_REVIEW_URL: "api/v1/user_dashboard/add_user_review",
    PRODUCT_REVIEW_BY_ID_URL: "api/v1/user_dashboard/get_product_review_by_id",
    SUBSCRIBE_USER_BY_MAIL_URL: "api/v1/user_dashboard/subscribe_user_by_email",
    SEND_PHONE_OTP_URL: "api/v1/user_dashboard/send_user_otp",
    VERIFY_PHONE_OTP_URL: "api/v1/user_dashboard/verify_user_otp",
    SEND_LOGIN_OTP_URL: "api/v1/user_dashboard/send_login_otp",
    VERIFY_LOGIN_OTP_URL: "api/v1/user_dashboard/verify_login_otp",
    CHANGE_PASSWORD_URL: "api/v1/users/change_password",
    GOOGLE_AUTH: "api/v1/auth/google",
    PAYMENT_INTENT_CREATE: "api/v1/payment_transactions/create_payment_intent",
    PAYMENT_VERIFY: "api/v1/payment_transactions/verify_payment",
    ADD_CONTACT_DETAILS: "api/v1/user_dashboard/add_contact_details",
    GET_ALL_SUBCATEGORY_BY_CATEGORY_NAME_URL: "api/v1/user_dashboard/get_subcategories_by_category_name",
    GET_PRODUCT_BY_CATEGORY_NAME_URL: "api/v1/user_dashboard/get_products_by_category_name",
    GET_PRODUCT_BY_SUB_CATEGORY_NAME_URL: "api/v1/user_dashboard/get_products_by_subcategory_name",
    SEARCH_PRODUCTS_URL: "api/v1/user_dashboard/search_products",
    HOME_SECTIONS_URL: "api/v1/user_dashboard/home_sections",
    HOMEPAGE_DATA_URL: "api/v1/user_dashboard/homepage_data",
    CATEGORY_PAGE_DATA_URL: "api/v1/user_dashboard/category_page_data",

    // Cart API endpoints
    CART_URL: "api/v1/cart",
    CART_UPDATE_QUANTITY_URL: "api/v1/cart/update_quantity",
    CART_CLEAR_URL: "api/v1/cart/clear",
    CART_SUMMARY_URL: "api/v1/cart/summary",
    CART_APPLICABLE_DISCOUNTS_URL: "api/v1/cart/applicable_discounts",

    // Coupons API endpoints
    COUPONS_URL: "api/v1/coupons",

    // Home Sections API endpoints (Admin)
    HOME_SECTIONS: "api/v1/home_sections",

    // Discounts API endpoints (Admin)
    DISCOUNTS: "api/v1/discounts",

    // Masters API endpoints
    MASTERS: {
        LIST: "api/v1/masters",
        CREATE: "api/v1/masters",
        SHOW: "api/v1/masters/:id",
        UPDATE: "api/v1/masters/:id",
        DELETE: "api/v1/masters/:id",
        FILTER: "api/v1/masters/filter",
        TYPES: "api/v1/masters/types",
        BY_TYPE: "api/v1/masters/by_type/:master_type",
        REORDER: "api/v1/masters/reorder"
    },

    // Settings API endpoints
    SETTINGS: {
        LIST: "api/v1/settings",
        SHOW: "api/v1/settings/:id",
        UPDATE: "api/v1/settings/:id",
        THEME_COLORS: "api/v1/settings/theme_colors"
    }
}