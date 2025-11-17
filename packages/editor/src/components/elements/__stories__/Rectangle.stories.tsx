import type { Meta, StoryObj } from '@storybook/react-vite';
import { Rectangle } from '../Rectangle';

const meta = {
  title: 'Elements/Rectangle',
  component: Rectangle,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Rectangle>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default rectangle with basic styling
 */
export const Default: Story = {
  args: {
    width: 200,
    height: 100,
    fill: '#ffffff',
    stroke: '#0066cc',
    strokeWidth: 2,
    borderRadius: 8,
    label: 'Rectangle',
  },
};

/**
 * Selected state
 */
export const Selected: Story = {
  args: {
    width: 200,
    height: 100,
    fill: '#ffffff',
    stroke: '#0066cc',
    strokeWidth: 2,
    borderRadius: 8,
    label: 'Selected',
    selected: true,
  },
};
