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
  },

  CATEGORY: {
    NOT_FOUND: 'Category not found',
    DELETED: 'Category successfully deleted',
  },

  COMMENT: {
    NOT_FOUND: 'Comment not found',
  },

  COMMON: {
    INVALID_UUID: 'Invalid UUID',
    BAD_REQUEST: 'Bad request',
  },
} as const;
