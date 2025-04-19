# Reski

<div align="center">
  <img src="https://via.placeholder.com/200x200?text=Reski" alt="Reski Logo" width="200" height="200" />
  <h3>A compact notation for UI components that brings the power of JSON to markup</h3>
</div>

<p align="center">
  <a href="#installation">Installation</a> •
  <a href="#why-reski">Why Reski?</a> •
  <a href="#usage">Usage</a> •
  <a href="#examples">Examples</a> •
  <a href="#api">API</a> •
  <a href="#license">License</a>
</p>

## Installation

```bash
npm install reski
```

## Why Reski?

Reski combines the best of component notation and data structures in a clean, compact syntax:

- **🚀 Minimal & Compact** - Less verbose than JSX or HTML
- **🔄 Two-way Conversion** - Parse strings to objects and back
- **🧩 Component-oriented** - Perfect for modern UI development
- **📦 Framework Agnostic** - Use with React, Vue, or vanilla JS
- **🔌 Dynamic Data Binding** - Easy integration with your data
- **🎯 Template Support** - Define once, use anywhere

## Usage

```javascript
import Reski from 'reski';

// Parse a Reski string into a component object
const component = Reski.parse('[Button:primary:["Click me"]]');

// Convert a component object back to Reski string
const reskiString = Reski.reskify(component);

// Evaluate dynamic expressions in a string
const engraved = Reski.engrave('Hello, [(user.name)]!', { user: { name: 'World' } });
// Result: 'Hello, ["World"]!'
```

## Examples

### Basic Component

```javascript
// Reski Notation
const buttonString = '[Button:primary large:["Click me"]]';

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

### With Properties and Dynamic Data

```javascript
// Reski Notation
const formString = '[Form::[Input:required::{"type":"text","placeholder":"Enter your name"}].[Button::["Submit"]]:{"onSubmit":"handleSubmit()"}::{"user":{"name":"John"}}]';

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
  props: { onSubmit: "handleSubmit()" },
  data: { user: { name: "John" } }
}
*/
```

### Dynamic Content with Engrave

```javascript
// Template with dynamic expressions
const template = '[User::["Hello, "].[(user.name)].["!"]]';

// Data to inject
const data = {
  user: {
    name: "Sarah"
  }
};

// Parse the string and evaluate expressions
const processedString = Reski.engrave(template, data);
// Result: '[User::["Hello, "].["Sarah"].["!"]]'

// Now parse the processed string
const component = Reski.parse(processedString);
```

### Templates and Reuse

```javascript
// Define a template
const templateString = '[Container::[Card<"title","content">]::Card<"string","string">]';

// Create instances with parameters
const instanceString = '[Container::[Card<"Welcome","This is a demo">].[Card<"Getting Started","Click here">]]';

// Parse both
const template = Reski.parse(templateString);
const instance = Reski.parse(instanceString);
```

## Syntax

### Basic Format

```
[Name:Classes:Children:Props:Template:Data]
```

Where:
- `Name`: Component identifier (required)
- `Classes`: CSS classes (dot-separated)
- `Children`: Nested components or text (dot-separated)
- `Props`: Component properties (JSON)
- `Template`: Template definition
- `Data`: Dynamic data (JSON)

And remember that it is order sensitive, where colons mark the order! Easy pattern to get used to!

### Text Content

```
["Static text"]     // Static text
[(user.name)]       // Dynamic text (evaluated with engrave)
```

### Parameters

```
[Button<"primary","Click me">]   // Raw parameters
[Card<{"title":"Welcome"}>]      // Object parameter
[List<[1,2,3]>]                  // Array parameter
```

## API

### `Reski.parse(string, data?, options?)`

Parses a Reski string into a component object.

- `string`: Reski notation string
- `data` (optional): Data object for variable substitution
- `options` (optional): Configuration options
  - `restrictOverwrite`: Array of data keys that shouldn't be overwritten
  - `debug`: Enable debug logging

### `Reski.reskify(component, options?)`

Converts a component object back to a Reski string.

- `component`: Component object
- `options` (optional): Configuration options
  - `debug`: Enable debug logging

### `Reski.engrave(string, data?)`

Processes dynamic expressions in a string.

- `string`: String with dynamic expressions `[(expression)]`
- `data`: Data object for evaluation

## License

MIT