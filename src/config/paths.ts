export const paths = {
  home: "/",
  login: "/login",
  register: "/register",
  snippets: "/snippets",
  snippet: (snippetId: string) => `/snippets/${snippetId}`,
  share: (code: string) => `/s/${code}`,
} as const;
