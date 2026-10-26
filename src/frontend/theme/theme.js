import { createGlobalStyle } from "styled-components";

export const theme = {
  colors: {
    primary: "#2f6f60",
    background: "#f4f7f5",
    surface: "#ffffff",
    textPrimary: "#20312d",
    textSecondary: "#60716b",
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
