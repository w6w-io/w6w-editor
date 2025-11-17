import type { Meta, StoryObj } from '@storybook/react-vite';
import { Node } from '../Node';

const meta = {
  title: 'Elements/Node',
  component: Node,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Node>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default node with basic styling
 */
export const Default: Story = {
  args: {
    width: 200,
    height: 100,
    backgroundColor: '#ffffff',
    borderColor: '#0066cc',
    borderWidth: 2,
    borderRadius: 8,
    title: 'Process Node',
    description: 'Handles data processing',
  },
};

/**
 * Node with connectors visible
 */
export const WithConnectors: Story = {
  args: {
    width: 200,
    height: 100,
    backgroundColor: '#ffffff',
    borderColor: '#0066cc',
    borderWidth: 2,
    borderRadius: 8,
    title: 'Connected Node',
    description: 'Shows connection handles',
    showConnectors: true,
  },
};

/**
 * Selected node state
 */
export const Selected: Story = {
  args: {
    width: 200,
    height: 100,
    backgroundColor: '#ffffff',
    borderColor: '#0066cc',
    borderWidth: 2,
    borderRadius: 8,
    title: 'Selected Node',
    selected: true,
    showConnectors: true,
  },
};

/**
 * Different node states in a workflow
 */
export const WorkflowExample: Story = {
  render: () => {
    const startWidth = 160;
    const processWidth = 200;
    const completeWidth = 160;
    const gap = 80;

    const startRightConnector = startWidth + 5;
    const processLeftConnector = startWidth + gap - 5;
    const arrowLength = processLeftConnector - startRightConnector;

    const processRightConnector = startWidth + gap + processWidth + 5;
    const completeLeftConnector = startWidth + gap + processWidth + gap - 5;
    const arrowLength2 = completeLeftConnector - processRightConnector;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '60px', padding: '40px' }}>
        <div style={{ position: 'relative', display: 'flex', gap: `${gap}px`, alignItems: 'center' }}>
          <Node
            width={startWidth}
            height={80}
            backgroundColor="#d1fae5"
            borderColor="#059669"
            title="Start"
            showConnectors={true}
            connectorSides={{ top: false, right: true, bottom: false, left: false }}
          />

          <svg
            style={{
              position: 'absolute',
              left: `${startRightConnector}px`,
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none'
            }}
            width={arrowLength}
            height="2"
          >
            <line x1="0" y1="1" x2={arrowLength} y2="1" stroke="#666" strokeWidth="2" markerEnd="url(#arrowhead)" />
            <defs>
              <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                <polygon points="0 0, 10 3, 0 6" fill="#666" />
              </marker>
            </defs>
          </svg>

          <Node
            width={processWidth}
            height={100}
            backgroundColor="#dbeafe"
            borderColor="#1e40af"
            title="Process"
            description="Transform data"
            showConnectors={true}
          />

          <svg
            style={{
              position: 'absolute',
              left: `${processRightConnector}px`,
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none'
            }}
            width={arrowLength2}
            height="2"
          >
            <line x1="0" y1="1" x2={arrowLength2} y2="1" stroke="#666" strokeWidth="2" markerEnd="url(#arrowhead2)" />
            <defs>
              <marker id="arrowhead2" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                <polygon points="0 0, 10 3, 0 6" fill="#666" />
              </marker>
            </defs>
          </svg>

          <Node
            width={completeWidth}
            height={80}
            backgroundColor="#fef3c7"
            borderColor="#d97706"
            title="Complete"
            showConnectors={true}
            connectorSides={{ top: false, right: false, bottom: false, left: true }}
          />
        </div>
      </div>
    );
  },
};
