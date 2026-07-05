import type { Preview } from "@storybook/react";
import "../src/app.css";

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: "nocturne",
      values: [
        { name: "nocturne", value: "#0B0D10" },
        { name: "surface", value: "#12141A" },
        { name: "card", value: "#181B22" },
        { name: "white", value: "#FFFFFF" },
      ],
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
