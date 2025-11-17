import type { Meta, StoryObj } from '@storybook/react-vite';
import { WorkflowEditor } from '../WorkflowEditor';

const meta = {
  title: 'Components/WorkflowEditor',
  component: WorkflowEditor,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    onChange: { action: 'workflow-changed' },
  },
} satisfies Meta<typeof WorkflowEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: {
    initialWorkflow: {
      nodes: [],
      edges: [],
    },
  },
};

export const WithNodes: Story = {
  args: {
    initialWorkflow: {
      nodes: [
        {
          id: '1',
          type: 'default',
          position: { x: 100, y: 100 },
          data: { label: 'Start Node' },
        },
        {
          id: '2',
          type: 'default',
          position: { x: 300, y: 200 },
          data: { label: 'Process Node' },
        },
        {
          id: '3',
          type: 'default',
          position: { x: 500, y: 100 },
          data: { label: 'End Node' },
        },
      ],
      edges: [
        {
          id: 'e1-2',
          source: '1',
          target: '2',
        },
        {
          id: 'e2-3',
          source: '2',
          target: '3',
        },
      ],
    },
  },
};

export const ComplexWorkflow: Story = {
  args: {
    initialWorkflow: {
      nodes: [
        {
          id: '1',
          type: 'default',
          position: { x: 100, y: 100 },
          data: { label: 'Start' },
        },
        {
          id: '2',
          type: 'default',
          position: { x: 250, y: 50 },
          data: { label: 'Task A' },
        },
        {
          id: '3',
          type: 'default',
          position: { x: 250, y: 150 },
          data: { label: 'Task B' },
        },
        {
          id: '4',
          type: 'default',
          position: { x: 400, y: 100 },
          data: { label: 'Join' },
        },
        {
          id: '5',
          type: 'default',
          position: { x: 550, y: 100 },
          data: { label: 'Complete' },
        },
      ],
      edges: [
        { id: 'e1-2', source: '1', target: '2' },
        { id: 'e1-3', source: '1', target: '3' },
        { id: 'e2-4', source: '2', target: '4' },
        { id: 'e3-4', source: '3', target: '4' },
        { id: 'e4-5', source: '4', target: '5' },
      ],
    },
  },
};
