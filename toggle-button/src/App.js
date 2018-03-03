import React, { Component } from 'react';
import PropTypes from 'prop-types'
import logo from './logo.svg';
import './App.css';

function Switch({ on, className = '', ...props }) {
  return (
    <div className="toggle">
      <input
        className="toggle-input"
        type="checkbox"
      />
      <button
        className={`${className} toggle-btn ${on
          ? 'toggle-btn-on'
          : 'toggle-btn-off'}`}
        aria-expanded={on}
        {...props}
      />
    </div>
  )
}

// apply this context to everything under the toggle component
const TOGGLE_CONTEXT = '__toggle__'

// anonymous functions will show as undefined in dev tools when wrapped in a HOC
// there are babel plugins to generate names for these
// use HOC to wrap fields of a class instead for names to show in dev tools
const ToggleOn = ({ children, toggle: { on } }) => {
  return on ? children : null
}

const ToggleOff = ({ children, toggle: { on } }) => {
  return on ? null : children
}

const ToggleButton = ({ toggle: { on, toggle }, ...props }, context) => {
  return (
    <Switch
      on={on}
      onClick={toggle}
      {...props}
    />
  )
}

const MyEventComponent = withToggle(
  function MyEventComponent({ toggle, on, event }) {
    const props = { [event]: on }
    return toggle.on ? (
      <button {...props}>The {event} event</button>
    ) : null
  }
)

// React.Children.map is a special mapping function for mapping over React children elements
// map over each of the children and create a clone with the parent components state passed in

// to create a context you define childContextTypes, then you have a key that goes on the
// context, this will share a namespace with all the other components that are using context in
// the tree. give the key a unique name to avoid clashes. also define the correct prop types
// for the context data.
// then define getChildContext() with the data you want in context, assigned to the key
// all components dependent on this context will then need to add the key and it's type to
// their context types
// N.B. the context api is experimental
class Toggle extends Component {
  static On = withToggle(ToggleOn)
  static Off = withToggle(ToggleOff)
  static Button = withToggle(ToggleButton)
  static defaultProps = { onToggle: () => { } }
  static childContextTypes = {
    [TOGGLE_CONTEXT]: PropTypes.object.isRequired,
  }

  state = { on: false }
  toggle = () => this.setState(({ on }) => ({ on: !on }), () => {
    this.props.onToggle(this.state.on)
  })
  getChildContext() {
    return {
      [TOGGLE_CONTEXT]: {
        on: this.state.on,
        toggle: this.toggle,
      }
    }
  }
  render() {
    return <div>{this.props.children}</div>
  }
}

// higher order component
// takes a component and returns a new component with some enhanced behaviors that
// renders the component that it's given
// to avoid namespace clashes, namespace props passed to component HOC is rendering
function withToggle(Component) {
  function Wrapper(props, context) {
    const toggleContext = context[TOGGLE_CONTEXT]
    return <Component {...props} toggle={toggleContext} />
  }
  Wrapper.contextTypes = {
    [TOGGLE_CONTEXT]: PropTypes.object.isRequired,
  }
  // monkey patch display name on wrapped component
  // allow for more descriptive errors and component names in dev tools
  Wrapper.displayName = `withToggle(${Component.displayName || Component.name})`
  return Wrapper
}


// arrow function component names will be inferred in dev tools
const MyToggle = ({ toggle: { on, toggle } }) => (
  <button onClick={toggle}>
    {on ? 'on' : 'off'}
  </button>
)
MyToggle.displayName = 'MyToggle'

const MyToggleWrapper = withToggle(MyToggle)

// the Toggle component is a compound component
// compound components have one component at the top level with children, who all share some
// implicit state
// in this case, the "on" state

// for structural flexibility it's not enough to use React.Children.map as it only deals
// with the direct descendents, children one level deep.
// exposing props to all children requires setting up a context for the Toggle components part
// of the tree
class App extends Component {
  render() {
    return (
      <div className="App" style={{
        marginTop: 40,
        display: 'flex',
        justifyContent: 'center',
        flexDirection: 'column',
        textAlign: 'center',
      }}>
        <Toggle onToggle={on => console.log('toggle', on)}
        >
          <Toggle.On>The button is on</Toggle.On>
          <Toggle.Off>The button is off</Toggle.Off>
          <Toggle.Button />
          <hr />
          <MyToggleWrapper />
          <MyEventComponent
            event="onClick"
            on={e => alert(e.type)}
          />
        </Toggle>
      </div>
    );
  }
}
// can override a components name in dev tools using displayName
App.displayName = 'MyApp'

export default App;
