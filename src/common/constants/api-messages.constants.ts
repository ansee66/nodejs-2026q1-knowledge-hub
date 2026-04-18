export const API_MESSAGES = {
  USER: {
    NOT_FOUND: 'User not found',
    INVALID_ID: 'Invalid user id',
    WRONG_PASSWORD: 'Old password is incorrect',
    DELETED: 'User successfully deleted',
  },

  ARTICLE: {
    NOT_FOUND: 'Article not found',
    INVALID_ID: 'Invalid article id',
    DELETED: 'Article successfully deleted',
  },

  CATEGORY: {
    NOT_FOUND: 'Category not found',
    DELETED: 'Category successfully deleted',
  },

  COMMENT: {
    NOT_FOUND: 'Comment not found',
    ARTICLE_ID_REQUIRED: 'Article id is required',
    DELETED: 'Comment successfully deleted',
  },

  COMMON: {
    INVALID_UUID: 'Invalid UUID',
    BAD_REQUEST: 'Bad request',
  },

  AUTH: {
    SUCCESS_SIGNUP: 'You have successfully registered',
    INVALID_LOGIN: 'Login is not registered',
    BUSY_LOGIN: 'Login is already taken',
    INVALID_PASSWORD: 'Password is incorrect',
    REFRESH_TOKEN_IS_REQUIRED: 'Refresh token is required',
    INVALID_REFRESH_TOKEN: 'Invalid refresh token',
    AUTH_HEADER_IS_REQUIRED: 'Authorization header is required',
    INVALID_AUTH_SCHEME: 'Invalid auth scheme',
    INVALID_TOKEN: 'Invalid token',
    AUTH_IS_REQUIRED: 'Authorization is required',
  },

  ROLES: {
    VIEWER_LIMITATIONS: 'Your role is viewer, you can only read',
    FORBIDDEN: 'You do not have enough permissions for this request',
    EDITOR_LIMITATIONS: 'You can manage only your materials',
    CATEGORY_LIMITATIONS: 'You can not manage categories',
  },
} as const;
