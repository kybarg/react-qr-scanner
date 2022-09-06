import React from "react";

import Reader from "../..";

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
const story = {
  title: "Reader",
  component: Reader,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes

  args: {
    constraints: { audio: false, video: true },
    resolution: 640,
    qrArea: [320, 320],
  },

  argTypes: {
    constraints: {
      type: { name: "object", required: false },
      description: "MediaTrackConstraints",
      table: {
        type: { summary: "object" },
        defaultValue: { summary: "{ audio: false, video: true }" },
      },
      control: "object",
    },

    resolution: {
      type: { name: "number", required: false },
      description: "Resolution of procesed images, impacts performance.",
      table: {
        type: { summary: "number" },
        defaultValue: { summary: 640 },
      },
      control: { type: "number", min: 320, max: 1280, step: 10 },
    },

    qrArea: {
      type: { name: "array", required: false },
      description: "Width and height for the qr scanning area",
      table: {
        type: { summary: "array" },
        defaultValue: { summary: [] },
      },
      control: { type: "array" },
    },

    onScan: {
      action: "Scan",
      description: "Fired after each processed snapshot.",
      table: {
        type: { summary: "function" },
        defaultValue: { summary: "(result) => {}" },
      },
    },
    onLoad: {
      action: "Loaded",
      description:
        "Fired after camera is loaded and started processing stream.",
      table: {
        type: { summary: "function" },
        defaultValue: { summary: "() => {}" },
      },
    },
    onError: {
      action: "Error",
      description: "Fired if any error occures.",
      table: {
        type: { summary: "function" },
        defaultValue: { summary: "(error) => {}" },
      },
    },
  },
};

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
const Template = (args) => <Reader {...args} />;

export const Default = Template.bind({});
Default.args = {};

export default story
