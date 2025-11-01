# Workflow Components

This document defines the core components that can be used to build workflows in the w6w editor.

## Component Categories

All workflow components fall into one of these categories:

1. [Triggers](#1-triggers) - Entry points that initiate workflow execution
2. [Actions](#2-actions) - Components that perform operations
3. [Flow Controls](#3-flow-controls) - Logic and routing components
4. [Data Operations](#4-data-operations) - Data manipulation and transformation
5. [Error Handling](#5-error-handling) - Error management and recovery
6. [Subflows/Modules](#6-subflowsmodules) - Workflow composition and reusability
7. [Termination Points](#7-termination-points) - Exit conditions and outcomes

---

## 1. Triggers

**Purpose**: Entry points that initiate workflow execution.

Every workflow must have exactly one trigger that defines when and how the workflow begins.

### Trigger Types

#### Manual Trigger
- User-initiated execution
- Typically via UI button or API call
- Can accept input parameters

#### Scheduled Trigger
- Time-based execution (cron-style)
- Examples: daily at 9am, every hour, first Monday of month
- Useful for batch processing and maintenance tasks

#### Webhook Trigger
- HTTP endpoint that receives external requests
- Payload becomes workflow input
- Common for integrations with external systems

#### Event Trigger
- Responds to system or application events
- Examples:
  - File uploaded
  - Database record changed
  - Message received in queue
  - Custom application events

---

## 2. Actions

**Purpose**: Components that perform actual work and operations.

Actions are the workhorses of workflows - they interact with systems, process data, and produce outputs.

### Action Types

#### API Calls
- HTTP requests (GET, POST, PUT, DELETE, etc.)
- REST, GraphQL, SOAP endpoints
- Authentication and header management
- Response handling

#### Data Transformations
- Convert data formats (JSON, XML, CSV)
- Apply business logic
- Calculate derived values
- Aggregate data

#### Database Operations
- Query databases (SELECT)
- Insert/update/delete records
- Transaction management
- Multiple database support

#### File Operations
- Read/write files
- Upload/download
- File format conversions
- Archive and compression

#### Notifications
- Send emails
- SMS messages
- Push notifications
- Slack/Teams/Discord messages
- Custom notification channels

---

## 3. Flow Controls

**Purpose**: Logic and routing components that control workflow execution paths.

Flow controls determine the order and conditions under which actions are executed.

### Control Types

#### Conditional Branches (If/Else)
- Evaluate boolean conditions
- Execute different paths based on conditions
- Support for multiple conditions (AND/OR logic)

#### Switch/Case
- Multi-way branching
- Route based on value matching
- Default/fallback path support

#### Loops
- **For Each**: Iterate over collections
- **While**: Continue while condition is true
- **Repeat**: Execute N times
- Break and continue support

#### Parallel Execution
- Run multiple actions simultaneously
- Wait for all or first to complete
- Merge results from parallel branches

#### Wait/Delay
- Pause execution for specified duration
- Wait until specific time
- Wait for external condition

---

## 4. Data Operations

**Purpose**: Manage and transform data flowing through the workflow.

Data operations are critical for preparing inputs, transforming outputs, and maintaining workflow state.

### Operation Types

#### Variable Assignment
- Store values for later use
- Scope management (workflow-level, step-level)
- Type support (string, number, boolean, object, array)

#### Data Mapping/Transformation
- Map input fields to output fields
- JSONPath and object path expressions
- Template expressions
- Custom transformation functions

#### Input Validation
- Schema validation
- Required field checking
- Type checking
- Custom validation rules

#### Output Formatting
- Format response data
- Filter sensitive information
- Structure data for next step or final output

---

## 5. Error Handling

**Purpose**: Manage errors and failures gracefully.

Production workflows must handle errors predictably and allow for recovery.

### Error Handling Types

#### Try/Catch Blocks
- Wrap actions that may fail
- Define error handling behavior
- Access error details (message, code, stack)

#### Retry Logic
- Automatic retry on failure
- Configurable retry count and delay
- Exponential backoff support
- Conditional retry (based on error type)

#### Fallback Actions
- Alternative actions when primary fails
- Default values
- Graceful degradation

#### Error Notifications
- Alert on failures
- Log errors
- Send to monitoring systems
- Custom error handlers

---

## 6. Subflows/Modules

**Purpose**: Enable workflow composition and reusability.

Break complex workflows into manageable, reusable pieces.

### Composition Types

#### Call Another Workflow
- Execute a separate workflow as a step
- Pass parameters
- Receive return values
- Independent execution context

#### Reusable Workflow Components
- Define once, use many times
- Parameterized components
- Version management

#### Nested Workflows
- Workflows within workflows
- Hierarchical organization
- Scope isolation

---

## 7. Termination Points

**Purpose**: Define how and when workflows complete.

Every workflow execution path must end at a termination point.

### Termination Types

#### Success Terminator
- Workflow completed successfully
- Return success status and output data
- Trigger success hooks/notifications

#### Error Terminator
- Workflow failed
- Return error status and details
- Trigger error hooks/notifications

#### Return Value
- Exit with specific return value
- Can indicate partial success
- Custom status codes

---

## Component Relationships

```
┌─────────┐
│ Trigger │ (1 per workflow)
└────┬────┘
     │
     ▼
┌─────────────────┐
│  Flow Control   │◄─┐
│  or Action      │  │
└────┬────────────┘  │
     │               │
     ├─►[Action]─────┤
     ├─►[Data Op]────┤
     ├─►[Error Handler]
     ├─►[Subflow]────┤
     │               │
     ▼               │
┌─────────────────┐  │
│ Flow Control    │──┘
└────┬────────────┘
     │
     ▼
┌──────────────┐
│ Terminator   │
└──────────────┘
```

## Next Steps

See [Roadmap Considerations](./roadmap-considerations.md) for future enhancements and advanced component types under consideration.
