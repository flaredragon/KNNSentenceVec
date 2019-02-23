import React, { Component } from 'react'

class List extends Component {
  componentDidUpdate() {
    this.props.inputElement.current.focus()
  }
  render() {
    return (
      <div className="ListMain">
        <div className="header">
          <form onSubmit={this.props.addItem}>
            <input
              placeholder="Sentence"
              ref={this.props.inputElement}
              value={this.props.currentItem.text}
              onChange={this.props.handleInput}
              type="text"
              required
            />
            <button type="submit"> Add Sentence </button>
          </form>
        </div>
      </div>
    )
  }
}

export default List
