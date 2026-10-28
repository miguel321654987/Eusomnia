import { createGlobalStyle } from "styled-components";

export const theme = {
  colors: {
    primary: "#357b9d",
    background: "#e8f1f7",
    surface: "#ffffff",
    textPrimary: "#203441",
    textSecondary: "#5e7180",
  },
  fonts: {
    main: '"Segoe UI", system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
    code: "ui-monospace, SFMono-Regular, Consolas, monospace",
  },
  spacing: (factor) => `${8 * factor}px`,
};

export const GlobalStyles = createGlobalStyle`
  body {
    margin: 0;
    font-family: ${theme.fonts.main};
    background-color: ${theme.colors.background};
    color: ${theme.colors.textPrimary};
  }
  a {
    color: ${theme.colors.primary};
    text-decoration: none;
  }
`;
