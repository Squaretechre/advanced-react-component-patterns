import React, { Component } from 'react';
import PropTypes from 'prop-types'
import hoistNonReactStatics from 'hoist-non-react-statics';
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
// ref prop gives you a reference to instance of component being rendered
function withToggle(Component) {
  function Wrapper({ innerRef, ...props }, context) {
    const toggleContext = context[TOGGLE_CONTEXT]
    return <Component ref={innerRef} {...props} toggle={toggleContext} />
  }
  Wrapper.contextTypes = {
    [TOGGLE_CONTEXT]: PropTypes.object.isRequired,
  }
  // monkey patch display name on wrapped component
  // allow for more descriptive errors and component names in dev tools
  Wrapper.displayName = `withToggle(${Component.displayName || Component.name})`

  // expose wrapped component to facilitate testing
  // don't burden consumers of the HOC by having to export an unwrapped version
  // also easier to work with in dev environments like storybook
  Wrapper.WrappedComponent = Component

  // use hoistNonReactStatics to apply all static properties off wrapped component
  // to the HOC so that they're available to used like the component being wrapped
  return hoistNonReactStatics(Wrapper, Component)
}


// arrow function component names will be inferred in dev tools
class MyToggle extends React.Component {
  static ToggleMessage = withToggle(
    ({ toggle: { on } }) =>
      on
        ? <p>'Warning: The button is toggled on'</p>
        : null,
  )
  focus = () => this.button.focus()
  render() {
    const { toggle: { on, toggle } } = this.props
    return (
      <button
        onClick={toggle}
        ref={button => (this.button = button)}
      >
        {on ? 'on' : 'off'}
      </button>
    )
  }
}

const MyToggleWrapper = withToggle(MyToggle)

// render props pattern
// accept a function that returns jsx, call this in components render method
// and inject components state into it
// render prop vs HOC / compound component solution:
//  - HOC involves wrapping each component that requires access to context data
//    this presents all sorts of problems and requires use of factory method
//    - setting the display name
//    - passing refs
//    - context naming collisions
//    - more difficult to type HOC with typescript / flow
//    - HOC = static component composition
//    - render props = happens in reacts normal composition model during render phase, meaning //      you can take advantage of reacts lifecycle, usual flow of props / state

// prop collections pattern - allows you to take common use cases, collect the props that are applicable to those and allow users to use those props and apply them to the elements that are relevant, i.e. automatically adding accessiblity attributes to rendered components
class RenderPropsToggle extends Component {
  static On = withToggle(ToggleOn)
  static Off = withToggle(ToggleOff)
  static Button = withToggle(ToggleButton)
  static defaultProps = {
    defaultOn: false,
    onToggle: () => { },
    onReset: () => { },
  }

  initialState = { on: this.props.defaultOn }
  state = this.initialState
  toggle = () => this.setState(({ on }) => ({ on: !on }), () => {
    this.props.onToggle(this.state.on)
  })
  reset = () => {
    this.setState(this.initialState, () => {
      this.props.onReset(this.state.on)
    })
  }

  // prop getters patter - make it easier for common use cases to apply the correct props based // off of state, used with render props pattern
  // use it to compose functions together without exposing the internal implementation details
  // of a component to it's consumer
  // pass in func that returns jsx -> invoke it with state from component -> use prop getter func
  // to compose any behavior with props provided by consumer
  getTogglerProps = ({ onClick, ...props } = {}) => {
    return {
      'aria-expanded': this.state.on,
      onClick: compose(onClick, this.toggle),
      ...props,
    }
  }
  render() {
    return this.props.render({
      on: this.state.on,
      toggle: this.toggle,
      reset: this.reset,
      getTogglerProps: this.getTogglerProps,
    })
  }
}

function renderSwitch({ on, toggle }) {
  return (
    <Switch on={on} onClick={toggle} />
  )
}

const compose = (...funcs) => (...args) =>
  funcs.forEach(fn => fn && fn(...args))

// the Toggle component is a compound component
// compound components have one component at the top level with children, who all share some
// implicit state
// in this case, the "on" state

// for structural flexibility it's not enough to use React.Children.map as it only deals
// with the direct descendents, children one level deep.
// exposing props to all children requires setting up a context for the Toggle components part
// of the tree

// HOC ref problem, ref properties not being able to be forwarded to component being wrapped
// solution, apply a different prop and then pass this down in the HOC factory

// goal with HOC, make their usage as unobservable as possible
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
        <Toggle onToggle={on => on ? this.myToggle.focus() : null}
        >
          <Toggle.On>The button is on</Toggle.On>
          <Toggle.Off>The button is off</Toggle.Off>
          <Toggle.Button />
          <hr />
          <MyToggleWrapper innerRef={myToggle => this.myToggle = myToggle} />
          <MyEventComponent
            event="onClick"
            on={e => alert(e.type)}
          />
          <MyToggle.ToggleMessage />
        </Toggle>
        <RenderPropsToggle
          defaultOn={true}
          onToggle={on => console.log('toggle', on)}
          onReset={on => console.log('reset', on)}
          render={({ on, toggle, reset, getTogglerProps }) => (
            <div>
              <Switch on={on} {...getTogglerProps()} />
              <hr />
              <button {...getTogglerProps({
                onClick: () => alert('hi')
              })}>
                {on ? 'on' : 'off'}
              </button>
              <hr />
              <button onClick={() => reset()}>Reset</button>
            </div>
          )}
        />
      </div>
    );
  }
}
// can override a components name in dev tools using displayName
App.displayName = 'MyApp'

export default App;
