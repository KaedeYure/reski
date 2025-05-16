# Reski

<div align="center">
  <h2>[ R:e:s:k:i ]</h2>
  <h3>A revolutionary component notation bridging code and content creation</h3>
</div>

<p align="center">
  <a href="#installation">Installation</a> •
  <a href="#why-reski">Why Reski?</a> •
  <a href="#usage">Usage</a> •
  <a href="#integration">Integration</a> •
  <a href="#examples">Examples</a> •
  <a href="#syntax">Syntax</a> •
  <a href="#api">API</a> •
  <a href="#license">License</a>
</p>

## Installation

```bash
npm install reski
```

## Why Reski?

Reski reimagines component-based UI development with a compact, intuitive syntax that both developers and content creators can master. It brings the structured power of programming to markup while remaining human-readable:

- **🚀 Minimal & Intuitive** - A clean, concise syntax that's easier to read and write than JSX or HTML
- **🔄 Database-Friendly** - Store entire UI components and layouts directly in databases as strings
- **🧩 Content Creator Empowerment** - Enable non-developers to build interactive components without coding knowledge
- **📦 Framework Independence** - Works seamlessly with React, Vue, vanilla JS, or any modern framework
- **🔌 Dynamic Data Integration** - Built-in expressions, transformations, and filtering capabilities
- **🎯 Reusable Templates** - Define component patterns once, use them anywhere in your codebase
- **🔁 Powerful Iteration** - Elegant syntax for rendering collections with advanced mapping

Reski isn't just another template language—it's a bridge between developers and content creators, enabling true collaboration on interactive UIs without sacrificing power or flexibility.

> Please note that Reski is developed by a single individual, therefore it can include bugs and unexpected errors that were not tested. Please report in GitHub Issues if you come across any issue.

> Reski gets regular updates on dev-side and is updated publicly once in a while.

## Usage

```javascript
import Reski from 'reski';

// Parse a Reski string into a component object
const component = Reski.parse('[Button:primary:["Click me"]]');

// Convert a component object back to Reski string
const reskiString = Reski.reskify(component);

// Evaluate dynamic expressions in a string
const engraved = Reski.engrave('Hello, [(user.name)]!', { user: { name: 'World' } });
// Result: 'Hello, World!'
```

## Integration

### React Integration

Reski provides a React context provider for easy integration with React applications:

```jsx
import { ReskiProvider, useReski } from 'reski/adapters/react';

// Wrap your app with the provider
function App() {
  return (
    <ReskiProvider>
      <YourComponents />
    </ReskiProvider>
  );
}

// Use Reski in your components
function YourComponent() {
  const { Render, parse, reskify } = useReski();
  
  return (
    <div>
      {/* Render a Reski string */}
      <Render 
        string="[Card::[Header::['Title']].[Body::['Content']]]" 
        data={{ /* your data */ }}
        parseOptions={{ /* options */ }}
      />
    </div>
  );
}
```

The React adapter automatically:
- Loads components from your project's `components` directory
- Handles styling with Twind (Tailwind in JS)
- Provides convenient parsing and rendering utilities

## Examples

### Basic Component

```javascript
// Reski Notation
const buttonString = '[Button:primary.large:["Click me"]]';

// Parsed Result
const button = Reski.parse(buttonString);
/* 
{
  name: "Button",
  classes: ["primary", "large"],
  children: [{ name: "text", content: "Click me" }]
}
*/
```

### Nested Components

```javascript
// Reski Notation
const cardString = '[Card::[Header::["Title"]].[Body::["Content"]].[Footer::[Button:primary:["OK"]]]]';

// Parsed Result
const card = Reski.parse(cardString);
/*
{
  name: "Card",
  children: [
    {
      name: "Header",
      children: [{ name: "text", content: "Title" }]
    },
    {
      name: "Body",
      children: [{ name: "text", content: "Content" }]
    },
    {
      name: "Footer",
      children: [
        {
          name: "Button",
          classes: ["primary"],
          children: [{ name: "text", content: "OK" }]
        }
      ]
    }
  ]
}
*/
```

### With Properties and Dynamic Content

```javascript
// Reski Notation
const formString = '[Form::[Input:required::{"type":"text","placeholder":"Enter your name"}].[Button::["Submit"]]:{"onSubmit":"handleSubmit()"}]';

// Parse with data
const form = Reski.parse(formString);
/*
{
  name: "Form",
  children: [
    {
      name: "Input",
      classes: ["required"],
      props: { type: "text", placeholder: "Enter your name" }
    },
    {
      name: "Button",
      children: [{ name: "text", content: "Submit" }]
    }
  ],
  props: { onSubmit: "handleSubmit()" }
}
*/
```

### Dynamic Content

```javascript
// Template with dynamic expressions
const template = '[User::["Hello, "].[(user.name)].["!"]]';

// Data to inject
const data = {
  user: {
    name: "Sarah"
  }
};

// Parse the template with data
const component = Reski.parse(template, data);
// Component will contain processed dynamic expressions
```

### Templates and Parameters

```javascript
// Define a template
const templateString = '=[Card<title,content>: Card<"string","string">: [Title::[(title)]].[Content::[(content)]]]';

// Create an instance using the template
const instanceString = '[Card<"Welcome","This is a demo">]';

// Parse both
const parsed = Reski.parse(templateString + instanceString);
// The result will use the template with the given parameters
```

### Mapping with Array Data

```javascript
// Using map to iterate over an array
const listString = '[List::[Item[items]]]';

// Parse with data
const list = Reski.parse(listString, {
  items: [
    { name: "First item" },
    { name: "Second item" },
    { name: "Third item" }
  ]
});
```

## Syntax

### Basic Format

```
[Name:Classes:Children:Props]
```

Where:
- `Name`: Component identifier (required)
- `Classes`: CSS classes (dot-separated)
- `Children`: Nested components or text (dot-separated)
- `Props`: Component properties (JSON)

Each section is separated by colons and is position-sensitive.

### Text Content

```
["Static text"]       // Static text
[(expression)]        // Dynamic text expression (evaluated during parsing)
[@(expression)]       // Dynamic text expression (evaluated during rendering)
```

### Parameters

```
[Button<"primary","Click me">]   // Parameters as strings
[Card<title,content>]            // Parameters as variables
```

### Mapping with Arrays

```
[Component[arrayReference]]      // Map over array
```

### Data Blocks

```
=<key: value>                    // Define data
```

### Template Blocks

```
=[TemplateName<param1,param2>: definition]   // Define template
```

## API

### `Reski.parse(string, initialData?, options?)`

Parses a Reski string into a component object.

- `string`: Reski notation string
- `initialData` (optional): Initial data object for variable substitution
- `options` (optional): Configuration options
  - `restrictOverwrite`: Array of data keys that shouldn't be overwritten (default: `["user", "auth", "token"]`)
  - `debug`: Enable debug logging (default: `false`)
  - `convertTemplatesToDivs`: Convert template components to divs with data-template attribute (default: `true`)
  - `keepParams`: Keep params in the output (default: `false`)

Returns:
```javascript
{
  data: Object,      // Parsed data blocks
  templates: Object, // Parsed template definitions
  layout: Object     // The component structure
}
```

### `Reski.reskify(component, options?)`

Converts a component object back to a Reski string.

- `component`: Component object
- `options` (optional): Configuration options
  - `debug`: Enable debug logging (default: `false`)
  - `restrictOverwrite`: Array of data keys that shouldn't be included (default: `["user", "auth", "token"]`)

### `Reski.engrave(expression, data?)`

Evaluates a JavaScript expression within a given data context.

- `expression`: JavaScript expression as string
- `data`: Data object for evaluation context

### React Integration

#### `ReskiProvider`

React context provider for Reski.

```jsx
<ReskiProvider>
  {children}
</ReskiProvider>
```

#### `useReski()`

React hook to access Reski functionality.

Returns:
```javascript
{
  Render: Component,  // Component to render Reski strings
  parse: Function,    // Parse function
  reskify: Function   // Reskify function
}
```

## License

MIT
