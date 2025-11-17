import type { Meta, StoryObj } from '@storybook/react-vite';
import { Canvas } from '../Canvas';
import { BackgroundVariant } from '@xyflow/react';

const meta = {
  title: 'Components/Canvas',
  component: Canvas,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Canvas>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Empty canvas (drag to move nodes, space+drag to pan)
 */
export const Empty: Story = {
  args: {
    initialNodes: [],
    initialEdges: [],
    height: '600px',
    backgroundVariant: BackgroundVariant.Dots,
  },
};

/**
 * Simple workflow (drag to move nodes, space+drag to pan)
 */
export const WithNodes: Story = {
  args: {
    initialNodes: [
      {
        id: '1',
        type: 'default',
        position: { x: 100, y: 100 },
        data: { label: 'Start' },
      },
      {
        id: '2',
        type: 'default',
        position: { x: 300, y: 100 },
        data: { label: 'Process' },
      },
      {
        id: '3',
        type: 'default',
        position: { x: 500, y: 100 },
        data: { label: 'End' },
      },
    ],
    initialEdges: [
      { id: 'e1-2', source: '1', target: '2' },
      { id: 'e2-3', source: '2', target: '3' },
    ],
    height: '600px',
    backgroundVariant: BackgroundVariant.Dots,
  },
};

/**
 * Complex workflow (drag to move nodes, space+drag to pan)
 */
export const ComplexWorkflow: Story = {
  args: {
    initialNodes: [
      {
        id: '1',
        type: 'input',
        position: { x: 100, y: 150 },
        data: { label: 'Start' },
      },
      {
        id: '2',
        type: 'default',
        position: { x: 300, y: 100 },
        data: { label: 'Task A' },
      },
      {
        id: '3',
        type: 'default',
        position: { x: 300, y: 200 },
        data: { label: 'Task B' },
      },
      {
        id: '4',
        type: 'default',
        position: { x: 500, y: 150 },
        data: { label: 'Merge' },
      },
      {
        id: '5',
        type: 'output',
        position: { x: 700, y: 150 },
        data: { label: 'Complete' },
      },
    ],
    initialEdges: [
      { id: 'e1-2', source: '1', target: '2', animated: true },
      { id: 'e1-3', source: '1', target: '3', animated: true },
      { id: 'e2-4', source: '2', target: '4' },
      { id: 'e3-4', source: '3', target: '4' },
      { id: 'e4-5', source: '4', target: '5' },
    ],
    height: '600px',
    backgroundVariant: BackgroundVariant.Dots,
  },
};

/**
 * Canvas with lines background (drag to move nodes, space+drag to pan)
 */
export const WithLines: Story = {
  args: {
    initialNodes: [
      {
        id: '1',
        type: 'default',
        position: { x: 200, y: 200 },
        data: { label: 'Node 1' },
      },
      {
        id: '2',
        type: 'default',
        position: { x: 400, y: 200 },
        data: { label: 'Node 2' },
      },
    ],
    initialEdges: [
      { id: 'e1-2', source: '1', target: '2' },
    ],
    height: '600px',
    backgroundVariant: BackgroundVariant.Lines,
  },
};
