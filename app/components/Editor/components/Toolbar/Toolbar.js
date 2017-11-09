// @flow
import React, { Component } from 'react';
import Portal from 'react-portal';
import styled from 'styled-components';
import _ from 'lodash';
import type { State } from '../../types';
import FormattingToolbar from './components/FormattingToolbar';
import LinkToolbar from './components/LinkToolbar';

export default class Toolbar extends Component {
  props: {
    state: State,
    onChange: Function,
  };

  menu: HTMLElement;
  state: {
    active: boolean,
    focused: boolean,
    link: React$Element<any>,
    top: string,
    left: string,
  };

  state = {
    active: false,
    focused: false,
    link: null,
    top: '',
    left: '',
  };

  componentDidMount = () => {
    this.update();
  };

  componentDidUpdate = () => {
    this.update();
  };

  handleFocus = () => {
    this.setState({ focused: true });
  };

  handleBlur = () => {
    this.setState({ focused: false });
  };

  get linkInSelection(): any {
    const { state } = this.props;

    try {
      const selectedLinks = state.startBlock
        .getInlinesAtRange(state.selection)
        .filter(node => node.type === 'link');
      if (selectedLinks.size) {
        return selectedLinks.first();
      }
    } catch (err) {
      //
    }
  }

  update = () => {
    const { state } = this.props;
    const link = this.linkInSelection;

    if (state.isBlurred || (state.isCollapsed && !link)) {
      if (this.state.active && !this.state.focused) {
        this.setState({ active: false, link: null, top: '', left: '' });
      }
      return;
    }

    // don't display toolbar for document title
    const firstNode = state.document.nodes.first();
    if (firstNode === state.startBlock) return;

    // don't display toolbar for code blocks
    if (state.startBlock.type === 'code') return;

    const data = {
      ...this.state,
      active: true,
      link,
      focused: !!link,
    };

    if (!_.isEqual(data, this.state)) {
      const padding = 16;
      const selection = window.getSelection();
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      if (rect.top === 0 && rect.left === 0) {
        this.setState(data);
        return;
      }

      const left =
        rect.left + window.scrollX - this.menu.offsetWidth / 2 + rect.width / 2;
      data.top = `${Math.round(rect.top + window.scrollY - this.menu.offsetHeight)}px`;
      data.left = `${Math.round(Math.max(padding, left))}px`;
      this.setState(data);
    }
  };

  setRef = (ref: HTMLElement) => {
    this.menu = ref;
  };

  render() {
    const link = this.state.link;

    const style = {
      top: this.state.top,
      left: this.state.left,
    };

    return (
      <Portal isOpened>
        <Menu active={this.state.active} innerRef={this.setRef} style={style}>
          {link &&
            <LinkToolbar
              {...this.props}
              link={link}
              onBlur={this.handleBlur}
            />}
          {!link &&
            <FormattingToolbar
              onCreateLink={this.handleFocus}
              {...this.props}
            />}
        </Menu>
      </Portal>
    );
  }
}

const Menu = styled.div`
  padding: 8px 16px;
  position: absolute;
  z-index: 2;
  top: -10000px;
  left: -10000px;
  opacity: 0;
  background-color: #2F3336;
  border-radius: 4px;
  transform: scale(.95);
  transition: opacity 150ms cubic-bezier(0.175, 0.885, 0.32, 1.275), transform 150ms cubic-bezier(0.175, 0.885, 0.32, 1.275);
  line-height: 0;
  height: 40px;
  min-width: 260px;

  ${({ active }) => active && `
    transform: translateY(-6px) scale(1);
    opacity: 1;
  `}
`;
