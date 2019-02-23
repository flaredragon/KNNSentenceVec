import React, { Component } from 'react'

class Item extends Component {
  createSentences = item => {
    return (
      <li key={item.key}>
        <div className="sentence">{item.text}</div>
        <button className="delete-btn" onClick={() => this.props.deleteItem(item.key)}>X</button>
      </li>
    )
  }
  render() {
    const entries = this.props.entries
    const listItems = entries.map(this.createSentences)

    return <ul className="theList">{listItems}</ul>
  }
}

export default Item
