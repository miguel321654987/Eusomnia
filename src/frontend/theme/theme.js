// Theme definition for the UI demo
import { createGlobalStyle } from "styled-components";

export const theme = {
  colors: {
    primary: "#00bcd4", // cyan accent
    background: "#121212", // dark background
    surface: "#1e1e1e",
    textPrimary: "#ffffff",
    textSecondary: "#bbbbbb",
  },
  fonts: {
    main: "'Montserrat', sans-serif",
    code: "'Roboto Mono', monospace",
  },
  spacing: (factor) => `${8 * factor}px`, // 8px grid
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
