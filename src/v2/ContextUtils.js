/**
 * @author:lpf
 * @flow
 *
 * */

import React from 'react';

export const CurrentSizeContext = React.createContext({ currentSize: { width: 0, height: 0 }, scale: 1 });
export default function connect(WrappedComponent: any) {
  return class extends React.PureComponent<Object> {
    render() {
      return (
        <CurrentSizeContext.Consumer>
          {size => (<WrappedComponent {...this.props} {...size} />)}
        </CurrentSizeContext.Consumer>
      );
    }
  };
}
