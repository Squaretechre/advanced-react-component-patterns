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

function ToggleOn({children}, context) {
  const {on} = context[TOGGLE_CONTEXT]
  return on ? children : null
}

// establish that each of the Toggle child components depends on TOGGLE_CONTEXT
ToggleOn.contextTypes = {
  [TOGGLE_CONTEXT]: PropTypes.object.isRequired,
}

function ToggleOff({children}, context) {
  const {on} = context[TOGGLE_CONTEXT]
  return on ? null : children
}
ToggleOff.contextTypes = {
  [TOGGLE_CONTEXT]: PropTypes.object.isRequired,
}

function ToggleButton(props, context) {
  const {on, toggle} = context[TOGGLE_CONTEXT]
  return <Switch on={on} onClick={toggle} {...props} />
}
ToggleButton.contextTypes = {
  [TOGGLE_CONTEXT]: PropTypes.object.isRequired,
}

// React.Children.map is a special mapping function for mapping over React children elements
// map over each of the children and create a clone with the parent components state passed in

// to create a context you define childContextTypes, then you have a key that goes on the
// context, this will share a namespace with all the other components that are using context in
// the tree. give the key a unique name to avoid clashes. also define the correct prop types
// for the context data.
// then define getChildContext() with the data you want in context, assigned to the key
// all components dependent on this context will then need to add the key and it's type to
// their context types
class Toggle extends Component {
  static On = ToggleOn
  static Off = ToggleOff
  static Button = ToggleButton
  static defaultProps = {onToggle: () => {}}
  static childContextTypes = {
    [TOGGLE_CONTEXT]: PropTypes.object.isRequired,
  }

  state = {on: false}
  toggle = () => this.setState(({on}) =>  ({on: !on}), () => {
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
          <div>
            <Toggle.Button />
          </div>
          <Toggle.Off>The button is off</Toggle.Off>
        </Toggle>
      </div>
    );
  }
}

export default App;
